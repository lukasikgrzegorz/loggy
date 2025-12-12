// server.js
import express from "express";
import puppeteer from "puppeteer";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import os from "os";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

let browserPool = [];
const CONNECTION_POOL_SIZE = parseInt(process.env.CONNECTION_POOL_SIZE) || 1;
const PAGE_TIMEOUT = parseInt(process.env.PAGE_TIMEOUT) || 60000;
const IDLE_SLEEP_TIMEOUT = parseInt(process.env.IDLE_SLEEP_TIMEOUT) || 600000;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Lista ID konkurencji
const ENEMY_IDS = process.env.ENEMY ? process.env.ENEMY.split(",") : [];

// helper sleep
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function initializeBrowserPool() {
  console.log(`🚀 Initializing browser pool with ${CONNECTION_POOL_SIZE} instances...`);
  
  // Na Raspberry Pi użyj systemowego Chromium
  const isRaspberryPi = os.arch() === 'arm' || os.arch() === 'arm64';
  const launchConfig = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ],
  };
  
  if (isRaspberryPi) {
    launchConfig.executablePath = '/usr/bin/chromium-browser';
  }
  
  for (let i = 0; i < CONNECTION_POOL_SIZE; i++) {
    try {
      const browser = await puppeteer.launch(launchConfig);
      browserPool.push({ browser, inUse: false });
      console.log(`✅ Browser ${i + 1}/${CONNECTION_POOL_SIZE} initialized`);
    } catch (err) {
      console.error(`❌ Failed to initialize browser ${i + 1}:`, err);
    }
  }
  
  console.log(`🎉 Browser pool initialized with ${browserPool.length} instances`);
}

async function getBrowserFromPool() {
  // Znajdź pierwszy dostępny browser
  const availableBrowser = browserPool.find(item => !item.inUse);
  
  if (availableBrowser) {
    availableBrowser.inUse = true;
    return availableBrowser;
  }
  
  // Jeśli wszystkie są zajęte, czekaj
  await sleep(100);
  return getBrowserFromPool();
}

function releaseBrowserToPool(browserItem) {
  browserItem.inUse = false;
}

// GET /fetch?url=https://example.com
app.get("/fetch", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing 'url' parameter" });
  }

  let page;
  let browserItem;
  try {
    browserItem = await getBrowserFromPool();
    page = await browserItem.browser.newPage();

    // realistyczny User-Agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
    );

    await page.setViewport({ width: 1280, height: 800 });

    // załaduj stronę
    await page.goto(url, { waitUntil: "networkidle2", timeout: PAGE_TIMEOUT });

    // czekaj na React root (jeśli jest) lub body
    await page.waitForSelector("#root, body", { timeout: PAGE_TIMEOUT });

    // dodatkowe krótkie opóźnienie, żeby JS się zakończył
    await sleep(1500);

    // pobierz finalny DOM
    const html = await page.evaluate(() => document.documentElement.outerHTML);

    await page.close();
    releaseBrowserToPool(browserItem);

    res.json({ url, html });
  } catch (err) {
    if (page && !page.isClosed()) {
      try { await page.close(); } catch(e) {}
    }
    if (browserItem) {
      releaseBrowserToPool(browserItem);
    }
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch page", details: err.message });
  }
});

// ============== API ENDPOINTS ==============

// GET /api/links - Pobierz wszystkie linki
app.get("/api/links", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("log_current_links")
      .select("*")
      .order("created", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error fetching links:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/links/update - Aktualizuj listę linków
app.post("/api/links/update", async (req, res) => {
  try {
    const { urls } = req.body; // array of URLs

    if (!Array.isArray(urls)) {
      return res.status(400).json({ error: "Expected 'urls' array" });
    }

    // Pobierz obecne linki
    const { data: currentLinks, error: fetchError } = await supabase
      .from("log_current_links")
      .select("url");

    if (fetchError) throw fetchError;

    const currentUrls = new Set(currentLinks.map((l) => l.url));
    const newUrls = new Set(urls.filter((u) => u.trim()));

    console.log('🔍 Update links debug:');
    console.log('   Received urls:', urls);
    console.log('   Current URLs:', [...currentUrls]);
    console.log('   New URLs:', [...newUrls]);

    // Dodaj nowe linki
    const toInsert = [...newUrls].filter((url) => !currentUrls.has(url));
    console.log('   To insert:', toInsert);
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("log_current_links")
        .insert(toInsert.map((url) => ({ url })));

      if (insertError) throw insertError;
    }

    // Usuń brakujące linki
    const toDelete = [...currentUrls].filter((url) => !newUrls.has(url));
    console.log('   To delete:', toDelete);
    if (toDelete.length > 0) {
      // Jeśli usuwamy wszystkie linki, użyj prostszego zapytania
      if (newUrls.size === 0) {
        console.log('   Deleting ALL links with simple query');
        const { error: deleteError } = await supabase
          .from("log_current_links")
          .delete()
          .neq("url", ""); // usuwa wszystkie rekordy gdzie url != "" (czyli wszystkie)
        
        if (deleteError) throw deleteError;
      } else {
        // Usuń w mniejszych batch'ach żeby uniknąć "URI too long"
        const BATCH_SIZE = 50;
        for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
          const batch = toDelete.slice(i, i + BATCH_SIZE);
          console.log(`   Deleting batch ${i / BATCH_SIZE + 1}: ${batch.length} URLs`);
          
          const { error: deleteError } = await supabase
            .from("log_current_links")
            .delete()
            .in("url", batch);

          if (deleteError) throw deleteError;
        }
      }
    }

    res.json({
      added: toInsert.length,
      removed: toDelete.length,
      total: newUrls.size,
    });
  } catch (err) {
    console.error("Error updating links:", err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/links/:url/check - Oznacz link jako checked
app.patch("/api/links/:url/check", async (req, res) => {
  try {
    const url = decodeURIComponent(req.params.url);
    const { checked } = req.body;

    const { error } = await supabase
      .from("log_current_links")
      .update({ checked, modified: new Date().toISOString() })
      .eq("url", url);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating link:", err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/links/:url/comment - Aktualizuj komentarz linka
app.patch("/api/links/:url/comment", async (req, res) => {
  try {
    const url = decodeURIComponent(req.params.url);
    const { comment } = req.body;

    const { error } = await supabase
      .from("log_current_links")
      .update({ comment, modified: new Date().toISOString() })
      .eq("url", url);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating comment:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/links/:url - Usuń link
app.delete("/api/links/:url", async (req, res) => {
  try {
    const url = decodeURIComponent(req.params.url);

    const { error } = await supabase
      .from("log_current_links")
      .delete()
      .eq("url", url);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting link:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/run - Uruchom nowy run sprawdzający konkurencję (tylko dla zgodnośći API)
app.post("/api/run", async (req, res) => {
  res.json({ message: "Automatic runs are enabled. Check is running continuously." });
});

// GET /api/runs - Pobierz historię runów
app.get("/api/runs", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("log_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error fetching runs:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history - Pobierz historię sprawdzeń
app.get("/api/history", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("log_links_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============== GŁÓWNA LOGIKA SPRAWDZANIA ==============

let isRunning = false;

async function continuousCheckLoop() {
  console.log("🔄 Starting continuous check loop...");
  
  while (true) {
    try {
      if (isRunning) {
        console.log("⏳ Previous run still in progress, waiting...");
        await sleep(5000);
        continue;
      }

      // Pobierz linki do sprawdzenia (pomijamy te z enemy=true i ended=true)
      const { data: links, error } = await supabase
        .from("log_current_links")
        .select("*")
        .eq("enemy", false)
        .eq("ended", false);

      if (error) {
        console.error("Error fetching links:", error);
        await sleep(10000); // Odczekaj 10s przy błędzie
        continue;
      }

      // Jeśli lista jest pusta lub wszystkie są enemy=true, czekaj określony czas
      if (!links || links.length === 0) {
        console.log(`📋 No links to check. Waiting ${IDLE_SLEEP_TIMEOUT / 60000} minutes...`);
        await sleep(IDLE_SLEEP_TIMEOUT);
        continue;
      }

      // Uruchom sprawdzanie
      const runId = crypto.randomUUID();
      console.log(`🚀 Starting run ${runId} for ${links.length} links`);
      
      await checkAllLinks(runId, links);
      
      console.log(`✅ Run ${runId} completed. Starting next run...`);
      
      // Krótkie opóźnienie przed następnym runem
      await sleep(2000);
      
    } catch (err) {
      console.error("Error in continuous loop:", err);
      await sleep(10000); // Odczekaj 10s przy błędzie
    }
  }
}

async function checkAllLinks(runId, links) {
  isRunning = true;
  
  try {
    // Utwórz nowy run
    const { error: runError } = await supabase
      .from("log_runs")
      .insert({ id: runId });

    if (runError) throw runError;

    console.log(`Run ${runId}: Checking ${links.length} links with ${CONNECTION_POOL_SIZE} concurrent connections`);

    // Podziel linki na chunki odpowiadające wielkości puli
    const chunks = [];
    for (let i = 0; i < links.length; i += CONNECTION_POOL_SIZE) {
      chunks.push(links.slice(i, i + CONNECTION_POOL_SIZE));
    }

    // Przetwarzaj chunki równolegle
    for (const chunk of chunks) {
      const promises = chunk.map(link => checkSingleLink(runId, link));
      await Promise.all(promises);
      
      // Krótkie opóźnienie między chunkami
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await sleep(500);
      }
    }

    // Zamknij run
    await supabase
      .from("log_runs")
      .update({ closed_at: new Date().toISOString() })
      .eq("id", runId);

    console.log(`Run ${runId}: Completed`);
  } catch (err) {
    console.error(`Run ${runId}: Error:`, err);
  } finally {
    isRunning = false;
  }
}

async function checkSingleLink(runId, link) {
  let enemy = false;
  let ended = false;
  let error = null;
  let page;
  let browserItem;

  try {
    browserItem = await getBrowserFromPool();
    page = await browserItem.browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(link.url, { waitUntil: "networkidle2", timeout: PAGE_TIMEOUT });
    await page.waitForSelector("#root, body", { timeout: PAGE_TIMEOUT });
    await sleep(1500);

    const html = await page.evaluate(() => document.documentElement.outerHTML);

    // Sprawdź czy ogłoszenie jest nieaktualne
    if (html.includes("Ogłoszenie nieaktualne")) {
      ended = true;
      console.log(`🔚 Link ${link.url} marked as ended (found "Ogłoszenie nieaktualne")`);
    } else {
      // Sprawdź czy występują ID konkurencji tylko jeśli ogłoszenie jest aktualne
      for (const enemyId of ENEMY_IDS) {
        if (html.includes(enemyId.trim())) {
          enemy = true;
          break;
        }
      }
    }

    await page.close();
    releaseBrowserToPool(browserItem);
  } catch (err) {
    error = err.message;
    console.error(`Error checking ${link.url}:`, err.message);
    if (page && !page.isClosed()) {
      try {
        await page.close();
      } catch (e) {}
    }
    if (browserItem) {
      releaseBrowserToPool(browserItem);
    }
  }

  // Zapisz do historii
  await supabase.from("log_links_history").insert({
    run_id: runId,
    url: link.url,
    enemy,
    error,
  });

  // Aktualizuj current_links
  await supabase
    .from("log_current_links")
    .update({
      enemy,
      ended,
      error,
      modified: new Date().toISOString(),
    })
    .eq("url", link.url);
}

// Graceful shutdown
async function shutdown() {
  try {
    console.log("Shutting down...");
    // Zamknij wszystkie przeglądarki w puli
    for (const browserItem of browserPool) {
      if (browserItem.browser) {
        await browserItem.browser.close();
      }
    }
    process.exit(0);
  } catch (e) {
    process.exit(1);
  }
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Inicjalizuj pulę przeglądarek
  await initializeBrowserPool();
  
  // Uruchom ciągłe sprawdzanie w tle
  continuousCheckLoop().catch(err => {
    console.error("Fatal error in continuous check loop:", err);
  });
});