// googleSheetWorker.js
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Worker do pobierania URL-i z Google Sheets
 * Sprawdza dane z dzisiaj i 2 dni wstecz, filtruje po kolumnach: url, data
 */

class GoogleSheetWorker {
  constructor(supabase) {
    this.supabase = supabase;
    this.sheetUrl = process.env.SHEET_URL;
    this.enabled = process.env.SHEET_UPDATE === 'true';
    this.auth = null;
    this.sheets = null;
  }

  /**
   * Inicjalizacja klienta Google Sheets API
   */
  async initialize() {
    if (!this.enabled) {
      console.log('📊 Google Sheets worker is disabled (SHEET_UPDATE=false)');
      return false;
    }

    if (!this.sheetUrl) {
      console.error('❌ SHEET_URL not configured');
      return false;
    }

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.error('❌ Google Sheets credentials not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY');
      return false;
    }

    try {
      // Przygotuj klucz prywatny (zamień \\n na rzeczywiste nowe linie)
      const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

      // Uwierzytelnianie z Service Account
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      console.log('✅ Google Sheets worker initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets worker:', error.message);
      return false;
    }
  }

  /**
   * Wyciągnij ID arkusza z URL
   */
  extractSpreadsheetId(url) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  /**
   * Sprawdź czy data jest w zakresie (dzisiaj i 2 dni wstecz)
   */
  isDateInRange(dateString) {
    try {
      // Parsuj datę w różnych formatach
      let date;
      
      // Format: DD.MM.YYYY lub DD/MM/YYYY lub YYYY-MM-DD
      if (dateString.includes('.')) {
        const [day, month, year] = dateString.split('.').map(s => s.trim());
        date = new Date(year, month - 1, day);
      } else if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts[0].length === 4) {
          // YYYY/MM/DD
          date = new Date(dateString);
        } else {
          // DD/MM/YYYY
          const [day, month, year] = parts.map(s => s.trim());
          date = new Date(year, month - 1, day);
        }
      } else if (dateString.includes('-')) {
        date = new Date(dateString);
      } else {
        return false;
      }

      if (isNaN(date.getTime())) {
        return false;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      date.setHours(0, 0, 0, 0);
      
      return date >= twoDaysAgo && date < tomorrow;
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return false;
    }
  }

  /**
   * Normalizuj URL - dodaj /offers jeśli nie zawiera
   * Sprawdź czy URL jest z domeny clicktrans.pl
   */
  normalizeUrl(url) {
    if (!url || typeof url !== 'string') {
      return null;
    }

    const trimmedUrl = url.trim();
    
    // Sprawdź czy to prawidłowy URL
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return null;
    }

    // Sprawdź czy URL jest z clicktrans.pl
    if (!trimmedUrl.includes('clicktrans.pl')) {
      return null;
    }

    // Jeśli URL nie zawiera słowa "offers", dodaj /offers na końcu
    if (!trimmedUrl.includes('offers')) {
      return trimmedUrl.replace(/\/$/, '') + '/offers';
    }

    return trimmedUrl;
  }

  /**
   * Pobierz dane z arkusza Google Sheets
   */
  async fetchSheetData() {
    if (!this.sheets) {
      console.error('❌ Google Sheets client not initialized');
      return [];
    }

    try {
      const spreadsheetId = this.extractSpreadsheetId(this.sheetUrl);
      if (!spreadsheetId) {
        console.error('❌ Invalid SHEET_URL format');
        return [];
      }

      console.log('📊 Fetching data from Google Sheets...');

      // Pobierz dane z pierwszego arkusza (zakres A:B oznacza kolumny A i B - url i data)
      // Możesz dostosować zakres jeśli kolumny są w innym miejscu
      const range = process.env.SHEET_RANGE || 'A:B'; // Można skonfigurować w .env
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rows = response.data.values;
      
      if (!rows || rows.length === 0) {
        console.log('📊 No data found in sheet');
        return [];
      }

      console.log(`📊 Found ${rows.length} rows in sheet`);

      // Przetwórz dane (zakładamy pierwsza kolumna = url, druga = data)
      const urls = [];
      let skippedInvalidDates = 0;
      let skippedOutOfRange = 0;
      let skippedInvalidUrls = 0;
      
      // Pomiń nagłówek (pierwsza linia)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        if (!row || row.length < 2) {
          continue;
        }

        const urlStr = row[0];
        const dateStr = row[1];

        // Sprawdź czy data jest w zakresie
        if (!dateStr) {
          skippedInvalidDates++;
          continue;
        }

        if (!this.isDateInRange(dateStr)) {
          skippedOutOfRange++;
          continue;
        }

        // Normalizuj URL
        const normalizedUrl = this.normalizeUrl(urlStr);
        
        if (!normalizedUrl) {
          skippedInvalidUrls++;
          continue;
        }

        urls.push(normalizedUrl);
      }

      console.log(`📊 Processed sheet data:
        - Total rows: ${rows.length - 1}
        - Valid URLs in date range: ${urls.length}
        - Skipped (invalid dates): ${skippedInvalidDates}
        - Skipped (out of range): ${skippedOutOfRange}
        - Skipped (invalid URLs): ${skippedInvalidUrls}`);

      return urls;
    } catch (error) {
      console.error('❌ Error fetching sheet data:', error.message);
      if (error.code === 403) {
        console.error('❌ Permission denied. Make sure the service account has access to the sheet.');
        console.error('   Share the sheet with:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
      }
      return [];
    }
  }

  /**
   * Dodaj URL-e z arkusza do bazy danych
   * Zachowuje aktualne reguły: pomija duplikaty
   */
  async addUrlsToDatabase(urls) {
    if (!urls || urls.length === 0) {
      console.log('📊 No URLs to add from sheet');
      return { added: 0, skipped: 0 };
    }

    try {
      // Pobierz obecne linki z bazy
      const { data: currentLinks, error: fetchError } = await this.supabase
        .from('log_current_links')
        .select('url');

      if (fetchError) {
        console.error('❌ Error fetching current links:', fetchError);
        return { added: 0, skipped: urls.length };
      }

      const currentUrls = new Set(currentLinks.map(l => l.url));
      
      // Filtruj tylko nowe URL-e (pomijamy duplikaty)
      const newUrls = urls.filter(url => !currentUrls.has(url));
      
      if (newUrls.length === 0) {
        console.log('📊 All URLs from sheet already exist in database (skipped: ' + urls.length + ')');
        return { added: 0, skipped: urls.length };
      }

      // Dodaj nowe URL-e pojedynczo, aby uniknąć błędów duplikatów
      let addedCount = 0;
      let failedCount = 0;
      
      for (const url of newUrls) {
        const { error: insertError } = await this.supabase
          .from('log_current_links')
          .insert({ url });

        if (insertError) {
          // Jeśli błąd to duplikat (23505), ignoruj go
          if (insertError.code === '23505') {
            console.log(`⚠️  URL already exists (race condition): ${url}`);
          } else {
            console.error('❌ Error inserting URL:', url, insertError);
            failedCount++;
          }
        } else {
          addedCount++;
        }
      }

      console.log(`✅ Added ${addedCount} new URLs from sheet (skipped ${urls.length - addedCount} duplicates, failed: ${failedCount})`);
      
      return {
        added: addedCount,
        skipped: urls.length - addedCount
      };
    } catch (error) {
      console.error('❌ Error in addUrlsToDatabase:', error.message);
      return { added: 0, skipped: urls.length };
    }
  }

  /**
   * Usuń linki z clicktrans.pl które nie występują w arkuszu lub są starsze niż 2 dni
   */
  async removeOldOrMissingLinks(sheetUrls) {
    try {
      console.log('🗑️  Checking for links to remove...');
      
      // Pobierz wszystkie linki z bazy (tylko clicktrans.pl)
      const { data: currentLinks, error: fetchError } = await this.supabase
        .from('log_current_links')
        .select('url, created')
        .like('url', '%clicktrans.pl%');

      if (fetchError) {
        console.error('❌ Error fetching current links:', fetchError);
        return { removed: 0 };
      }

      if (!currentLinks || currentLinks.length === 0) {
        console.log('🗑️  No clicktrans.pl links in database to check');
        return { removed: 0 };
      }

      const sheetUrlSet = new Set(sheetUrls);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setHours(0, 0, 0, 0);

      // Znajdź linki do usunięcia
      const linksToRemove = currentLinks.filter(link => {
        const notInSheet = !sheetUrlSet.has(link.url);
        const createdDate = new Date(link.created);
        const olderThanTwoDays = createdDate < twoDaysAgo;
        
        return notInSheet || olderThanTwoDays;
      });

      if (linksToRemove.length === 0) {
        console.log('🗑️  No links to remove');
        return { removed: 0 };
      }

      // Usuń linki pojedynczo (url jest kluczem głównym)
      let removedCount = 0;
      let failedCount = 0;
      
      for (const link of linksToRemove) {
        const { error: deleteError } = await this.supabase
          .from('log_current_links')
          .delete()
          .eq('url', link.url);

        if (deleteError) {
          console.error('❌ Error removing link:', link.url, deleteError);
          failedCount++;
        } else {
          removedCount++;
        }
      }

      if (failedCount > 0) {
        console.log(`⚠️  Failed to remove ${failedCount} links`);
      }

      // Pokaż które linki zostały usunięte i dlaczego
      const notInSheet = linksToRemove.filter(link => !sheetUrlSet.has(link.url));
      const olderThanTwoDays = linksToRemove.filter(link => {
        const createdDate = new Date(link.created);
        return createdDate < twoDaysAgo;
      });

      console.log(`🗑️  Removed ${removedCount} links (failed: ${failedCount}):`);
      console.log(`    - Not in sheet: ${notInSheet.length}`);
      console.log(`    - Older than 2 days: ${olderThanTwoDays.length}`);

      return { removed: removedCount };
    } catch (error) {
      console.error('❌ Error in removeOldOrMissingLinks:', error.message);
      return { removed: 0 };
    }
  }

  /**
   * Główna metoda workera - uruchom synchronizację
   */
  async run() {
    if (!this.enabled) {
      return { success: false, message: 'Worker disabled' };
    }

    console.log('📊 Starting Google Sheets worker...');

    try {
      const urls = await this.fetchSheetData();
      const addResult = await this.addUrlsToDatabase(urls);
      const removeResult = await this.removeOldOrMissingLinks(urls);
      
      console.log('✅ Google Sheets worker completed');
      
      return {
        success: true,
        ...addResult,
        ...removeResult
      };
    } catch (error) {
      console.error('❌ Google Sheets worker failed:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

export default GoogleSheetWorker;
