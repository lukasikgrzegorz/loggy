// server.js
import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json());

let browser;

// helper sleep
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ensureBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
      ],
    });
  }
  return browser;
}

// GET /fetch?url=https://example.com
app.get("/fetch", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing 'url' parameter" });
  }

  let page;
  try {
    await ensureBrowser();

    page = await browser.newPage();

    // realistyczny User-Agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
    );

    await page.setViewport({ width: 1280, height: 800 });

    // załaduj stronę
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // czekaj na React root (jeśli jest) lub body
    await page.waitForSelector("#root, body", { timeout: 60000 });

    // dodatkowe krótkie opóźnienie, żeby JS się zakończył
    await sleep(1500);

    // pobierz finalny DOM
    const html = await page.evaluate(() => document.documentElement.outerHTML);

    await page.close();

    res.json({ url, html });
  } catch (err) {
    if (page && !page.isClosed()) {
      try { await page.close(); } catch(e) {}
    }
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch page", details: err.message });
  }
});

// Graceful shutdown
async function shutdown() {
  try {
    console.log("Shutting down...");
    if (browser) {
      await browser.close();
    }
    process.exit(0);
  } catch (e) {
    process.exit(1);
  }
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});