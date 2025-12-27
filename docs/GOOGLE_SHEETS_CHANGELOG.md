# Google Sheets Worker - Changelog

## Wersja 1.1.0 - Blokada ręcznej edycji

### ✅ Nowe funkcjonalności

**Automatyczna blokada interfejsu w trybie Google Sheets:**
- Zakładka "Aktualizacja Listy" jest ukryta gdy `SHEET_UPDATE=true`
- Textarea i przycisk aktualizacji są zablokowane
- Wyświetlany komunikat o trybie Google Sheets z linkiem do arkusza
- Endpoint API zabezpiecza przed ręczną aktualizacją (403 Forbidden)
- Nowy endpoint `/api/config` zwracający informacje o trybie

**Zmienione pliki:**
- `server.js` - dodano endpoint `/api/config` i blokadę w `/api/links/update`
- `public/index.html` - ukrywanie zakładki i blokada interfejsu
- Dokumentacja zaktualizowana

---

## Wersja 1.0.0 - Pierwsza wersja

## Co zostało dodane?

### ✅ Nowe pliki

1. **`googleSheetWorker.js`** - Główny moduł workera
   - Pobiera dane z Google Sheets API
   - Filtruje rekordy z ostatnich 3 dni (dzisiaj + 2 dni wstecz)
   - Normalizuje URL-e (dodaje /offers jeśli brak)
   - Pomija duplikaty
   - Obsługuje różne formaty dat (DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD)

2. **`testGoogleSheets.js`** - Skrypt testowy
   - Weryfikuje konfigurację
   - Testuje połączenie z Google Sheets
   - Pokazuje dodane URL-e

3. **`docs/GOOGLE_SHEETS_SETUP.md`** - Pełna dokumentacja
   - Konfiguracja Service Account
   - Włączenie Google Sheets API
   - Udostępnianie arkusza
   - Konfiguracja zmiennych środowiskowych
   - Rozwiązywanie problemów

4. **`docs/GOOGLE_SHEETS_QUICKSTART.md`** - Szybki start
   - Zwięzły przewodnik 5 kroków
   - Minimalna konfiguracja

### ✅ Zmodyfikowane pliki

1. **`server.js`**
   - Import `GoogleSheetWorker`
   - Inicjalizacja workera przy starcie
   - Automatyczna synchronizacja przed każdym run'em
   - Nowa zmienna `SHEET_SYNC_INTERVAL`

2. **`.env.example`**
   - Sekcja "Google Sheets Integration"
   - 6 nowych zmiennych środowiskowych
   - Szczegółowe komentarze

3. **`package.json`**
   - Dodana zależność: `googleapis`
   - Nowy skrypt: `npm run test:sheets`

4. **`README.md`**
   - Sekcja "Google Sheets Integration" w funkcjonalności
   - Opis zmiennych środowiskowych
   - Link do dokumentacji

## Jak to działa?

### Przepływ danych

```
Google Sheets (kolumny: URL, Data)
         ↓
    [Worker pobiera dane]
         ↓
    [Filtruje po dacie: dzisiaj ± 2 dni]
         ↓
    [Normalizuje URL (dodaje /offers)]
         ↓
    [Sprawdza duplikaty w bazie]
         ↓
    [Dodaje nowe URL-e do log_current_links]
         ↓
    [Główny loop sprawdza linki]
```

### Kiedy uruchamia się worker?

1. **Przy starcie serwera** - początkowa synchronizacja
2. **Przed każdym sprawdzeniem** - jeśli minął SHEET_SYNC_INTERVAL (domyślnie 5 min)

### Format arkusza

```
| A (URL)                        | B (Data)    |
|--------------------------------|-------------|
| https://example.com/auction1   | 27.12.2024  |
| https://example.com/auction2   | 26.12.2024  |
```

- **Kolumna A:** URL (automatycznie dodawane /offers jeśli brak)
- **Kolumna B:** Data (DD.MM.YYYY, DD/MM/YYYY lub YYYY-MM-DD)

## Zmienne środowiskowe

```bash
# Włącz/wyłącz workera
SHEET_UPDATE=true|false

# URL arkusza
SHEET_URL=https://docs.google.com/spreadsheets/d/ID/edit

# Zakres kolumn (domyślnie A:B)
SHEET_RANGE=A:B

# Uwierzytelnianie Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Interwał synchronizacji w ms (domyślnie 300000 = 5 min)
SHEET_SYNC_INTERVAL=300000
```

## Bezpieczeństwo

✅ **Service Account** - bezpieczny dostęp bez poświadczeń użytkownika
✅ **Read-only** - worker tylko czyta dane (Viewer permissions)
✅ **Credentials w .env** - klucze nie trafiają do repozytorium
✅ **Prywatne arkusze** - obsługa nieupublicznionych arkuszy

## Testowanie

```bash
# Test połączenia i synchronizacji
npm run test:sheets
```

Poprawny wynik:
```
✅ Google Sheets worker initialized
📊 Fetching data from Google Sheets...
📊 Found 50 rows in sheet
📊 Processed sheet data:
  - Total rows: 49
  - Valid URLs in date range: 15
  - Skipped (invalid dates): 0
  - Skipped (out of range): 30
  - Skipped (invalid URLs): 4
✅ Added 15 new URLs from sheet (skipped 0 duplicates)
✅ Test completed!
```

## Wyłączenie workera

Ustaw w `.env`:
```bash
SHEET_UPDATE=false
```

Worker nie będzie się uruchamiał, a system będzie działał jak poprzednio.

## Co dalej?

Możliwe rozszerzenia:
- [ ] Dwukierunkowa synchronizacja (update statusu w arkuszu)
- [ ] Wsparcie dla wielu arkuszy
- [ ] Konfigurowalne kolumny (nie tylko A i B)
- [ ] Webhook przy dodaniu nowych URL-i
- [ ] Dashboard pokazujący statystyki synchronizacji

---

**Autor:** GitHub Copilot  
**Data:** 27 grudnia 2024  
**Wersja:** 1.0.0
