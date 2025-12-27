// testGoogleSheets.js
// Skrypt testowy do sprawdzenia integracji z Google Sheets
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import GoogleSheetWorker from './googleSheetWorker.js';

dotenv.config();

async function test() {
  console.log('🧪 Testing Google Sheets Worker...\n');

  // Sprawdź konfigurację
  console.log('📋 Configuration:');
  console.log('  SHEET_UPDATE:', process.env.SHEET_UPDATE);
  console.log('  SHEET_URL:', process.env.SHEET_URL);
  console.log('  SHEET_RANGE:', process.env.SHEET_RANGE || 'A:B (default)');
  console.log('  GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '(not set)');
  console.log('  GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '(set)' : '(not set)');
  console.log('  SHEET_SYNC_INTERVAL:', process.env.SHEET_SYNC_INTERVAL || '300000 (default)');
  console.log('');

  // Inicjalizuj Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  // Utwórz worker
  const worker = new GoogleSheetWorker(supabase);

  // Inicjalizuj
  console.log('🔧 Initializing worker...');
  const initialized = await worker.initialize();

  if (!initialized) {
    console.error('❌ Worker initialization failed. Check configuration and logs above.');
    process.exit(1);
  }

  console.log('');

  // Pobierz obecne linki (przed synchronizacją)
  console.log('📊 Current links in database (before sync):');
  const { data: linksBefore, error: errorBefore } = await supabase
    .from('log_current_links')
    .select('url');

  if (errorBefore) {
    console.error('❌ Error fetching links:', errorBefore);
  } else {
    console.log(`  Total: ${linksBefore.length}`);
    if (linksBefore.length > 0) {
      console.log('  First 5:', linksBefore.slice(0, 5).map(l => l.url));
    }
  }
  console.log('');

  // Uruchom synchronizację
  console.log('🚀 Running sync...');
  const result = await worker.run();

  console.log('');
  console.log('📈 Sync result:');
  console.log('  Success:', result.success);
  console.log('  Added:', result.added || 0);
  console.log('  Skipped:', result.skipped || 0);
  if (result.message) {
    console.log('  Message:', result.message);
  }
  console.log('');

  // Pobierz linki po synchronizacji
  console.log('📊 Current links in database (after sync):');
  const { data: linksAfter, error: errorAfter } = await supabase
    .from('log_current_links')
    .select('url');

  if (errorAfter) {
    console.error('❌ Error fetching links:', errorAfter);
  } else {
    console.log(`  Total: ${linksAfter.length}`);
    console.log(`  Change: ${linksAfter.length > linksBefore.length ? '+' : ''}${linksAfter.length - linksBefore.length}`);
    
    if (result.added > 0) {
      console.log('');
      console.log('  Newly added URLs:');
      const newUrls = linksAfter
        .filter(after => !linksBefore.find(before => before.url === after.url))
        .slice(0, 10);
      newUrls.forEach(link => console.log('    -', link.url));
      if (result.added > 10) {
        console.log(`    ... and ${result.added - 10} more`);
      }
    }
  }

  console.log('');
  console.log('✅ Test completed!');
  process.exit(0);
}

test().catch(error => {
  console.error('');
  console.error('💥 Test failed with error:');
  console.error(error);
  process.exit(1);
});
