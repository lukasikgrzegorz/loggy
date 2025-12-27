# Google Sheets - Szybki Start

## 🚀 5 kroków do uruchomienia

### 1. Przygotuj arkusz Google Sheets

Utwórz arkusz z kolumnami:

| A (URL) | B (Data) |
|---------|----------|
| https://example.com/auction1 | 27.12.2024 |
| https://example.com/auction2 | 26.12.2024 |
| https://example.com/auction3 | 25.12.2024 |

**Format daty:** DD.MM.YYYY, DD/MM/YYYY lub YYYY-MM-DD

### 2. Utwórz Service Account (2 min)
### 2. Utwórz Service Account (2 min)
1. Idź do https://console.cloud.google.com/
2. Wybierz projekt lub utwórz nowy
3. IAM & Admin → Service Accounts → Create Service Account
4. Nazwa: `loggy-sheets` → Create
5. Pomiń uprawnienia → Done
6. Znajdź service account → ⋮ (menu) → Manage keys
7. Add Key → Create new key → JSON → Create
8. Zapisz pobrany plik JSON

### 3. Włącz Google Sheets API (1 min)
### 3. Włącz Google Sheets API (1 min)
1. APIs & Services → Library
2. Szukaj: "Google Sheets API"
3. Enable

### 4. Udostępnij arkusz (1 min)
1. Otwórz swój Google Sheet
2. Share (Udostępnij)
3. Dodaj email z JSON (`client_email`)
   - Przykład: `loggy-sheets@project.iam.gserviceaccount.com`
4. Uprawnienia: Viewer → Share

### 5. Skonfiguruj .env (1 min)
```bash
# Włącz workera
SHEET_UPDATE=true

# URL arkusza (skopiuj z paska adresu)
SHEET_URL=https://docs.google.com/spreadsheets/d/TWOJ_ID_ARKUSZA/edit

# Z pliku JSON:
GOOGLE_SERVICE_ACCOUNT_EMAIL=twoj-email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTWOJ_KLUCZ\n-----END PRIVATE KEY-----\n"
```

**Uwaga o kluczu:** Skopiuj wartość `private_key` z JSON, upewnij się że `\n` to `\\n`

### 5. Format arkusza

| Data (A)   | URL (B)                        |
|------------|--------------------------------|
| 27.12.2024 | https://example.com/page1      |
| 26.12.2024 | https://example.com/page2      |
| 25.12.2024 | https://example.com/page3      |

### 6. Testuj!
```bash
npm run test:sheets
```

Jeśli widzisz `✅ Test completed!` - działa! 🎉

## Rozwiązywanie problemów

### Error 403: Permission denied
→ Sprawdź czy udostępniłeś arkusz z właściwym emailem Service Account

### Invalid SHEET_URL format
→ URL musi być: `https://docs.google.com/spreadsheets/d/ID/edit`

### GOOGLE_PRIVATE_KEY not configured
→ Sprawdź czy klucz jest w cudzysłowach i ma `\\n` zamiast `\n`

### Worker nie dodaje URL-i
→ Sprawdź daty w arkuszu (tylko dzisiaj + 2 dni wstecz)

## Więcej informacji
Szczegółowa dokumentacja: `docs/GOOGLE_SHEETS_SETUP.md`
