# Google Sheets Worker - Dokumentacja

## Opis

Worker automatycznie pobiera dane z Google Sheets i dodaje URL-e do systemu Loggy. Worker działa cyklicznie, synchronizując dane przed każdym sprawdzeniem linków.

## Funkcjonalność

- ✅ Pobiera dane z Google Sheets (kolumny: url, data)
- ✅ Filtruje rekordy z dzisiaj i 2 dni wstecz
- ✅ Automatycznie dodaje `/offers` do URL-i, które go nie zawierają
- ✅ Pomija duplikaty (nie dodaje URL-i już istniejących w bazie)
- ✅ Działa cyklicznie (domyślnie co 5 minut)
- ✅ Można włączyć/wyłączyć przez zmienną środowiskową
- ✅ **Blokuje ręczną edycję** - gdy `SHEET_UPDATE=true`, zakładka "Aktualizacja Listy" jest ukryta i zablokowana

## Konfiguracja

### 1. Utwórz Service Account w Google Cloud

1. Przejdź do [Google Cloud Console](https://console.cloud.google.com/)
2. Wybierz swój projekt lub utwórz nowy
3. Przejdź do **IAM & Admin** → **Service Accounts**
4. Kliknij **Create Service Account**
5. Podaj nazwę (np. `loggy-sheets-reader`) i kliknij **Create**
6. Pomiń uprawnienia projektowe (kliknij **Continue**)
7. Kliknij **Done**

### 2. Wygeneruj klucz prywatny

1. Znajdź utworzone Service Account na liście
2. Kliknij menu (3 kropki) → **Manage keys**
3. Kliknij **Add Key** → **Create new key**
4. Wybierz format **JSON** i kliknij **Create**
5. Plik JSON zostanie pobrany - ZACHOWAJ GO BEZPIECZNIE!

### 3. Włącz Google Sheets API

1. W Google Cloud Console przejdź do **APIs & Services** → **Library**
2. Wyszukaj "Google Sheets API"
3. Kliknij na wynik i kliknij **Enable**

### 4. Udostępnij arkusz Google Sheets

1. Otwórz swój arkusz Google Sheets
2. Kliknij **Share** (Udostępnij)
3. Dodaj email Service Account (znajdziesz go w pliku JSON w polu `client_email`)
   - Przykład: `loggy-sheets-reader@your-project.iam.gserviceaccount.com`
4. Nadaj uprawnienia **Viewer** (Czytelnik)
5. Kliknij **Share**

### 5. Skonfiguruj zmienne środowiskowe

Otwórz plik `.env` i dodaj/zaktualizuj następujące zmienne:

```bash
# Włącz/wyłącz workera
SHEET_UPDATE=true

# URL do arkusza Google Sheets
SHEET_URL=https://docs.google.com/spreadsheets/d/TWOJ_ARKUSZ_ID/edit

# Zakres danych (domyślnie A:B = kolumny A i B)
SHEET_RANGE=A:B

# Email Service Account (z pliku JSON, pole: client_email)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# Klucz prywatny (z pliku JSON, pole: private_key)
# UWAGA: Zamień nowe linie na \\n
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"

# Interwał synchronizacji w milisekundach (domyślnie 300000 = 5 minut)
SHEET_SYNC_INTERVAL=300000
```

**Uwaga o kluczu prywatnym:**
- Otwórz pobrany plik JSON
- Znajdź pole `private_key`
- Skopiuj całą wartość (razem z `-----BEGIN PRIVATE KEY-----` i `-----END PRIVATE KEY-----`)
- Upewnij się, że znaki nowej linii (`\n`) są zapisane jako `\\n`

Przykład prawidłowego formatu:
```
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgk...(długi klucz)...abc123\n-----END PRIVATE KEY-----\n"
```

## Format arkusza Google Sheets

Arkusz musi mieć następującą strukturę:

| URL (kolumna A) | Data (kolumna B) |
|-----------------|------------------|
| https://example.com/page1 | 27.12.2024 |
| https://example.com/page2 | 26.12.2024 |
| https://example.com/page3/offers | 25.12.2024 |
| https://example.com/page4 | 24.12.2024 |

**Uwagi:**
- Pierwsza linia (nagłówek) jest pomijana
- Kolumna A: Pełny URL (https://...)
- Kolumna B: Data w formacie DD.MM.YYYY, DD/MM/YYYY lub YYYY-MM-DD
- Jeśli URL nie zawiera słowa "offers", zostanie automatycznie dodane "/offers" na końcu
- Worker filtruje tylko rekordy z dzisiaj i 2 dni wstecz

## Dostosowanie zakresu kolumn

Jeśli Twoje dane są w innych kolumnach (np. C i D zamiast A i B), zmień zmienną `SHEET_RANGE`:

```bash
# Dla kolumn C i D:
SHEET_RANGE=C:D

# Dla konkretnego zakresu:
SHEET_RANGE=C2:D100
```

## Wyłączenie workera

Aby wyłączyć automatyczną synchronizację z Google Sheets i przywrócić ręczną edycję:

```bash
SHEET_UPDATE=false
```

Po zmianie uruchom ponownie serwer. Zakładka "Aktualizacja Listy" zostanie odblokowana.

## Testowanie

Po uruchomieniu serwera sprawdź logi:

```bash
npm run dev
```

Poprawne logi powinny wyglądać tak:

```
Server running on http://localhost:3000
✅ Google Sheets worker initialized
📊 Running initial Google Sheets sync...
📊 Fetching data from Google Sheets...
📊 Found 50 rows in sheet
📊 Processed sheet data:
  - Total rows: 49
  - Valid URLs in date range: 15
  - Skipped (invalid dates): 0
  - Skipped (out of range): 30
  - Skipped (invalid URLs): 4
✅ Added 15 new URLs from sheet (skipped 0 duplicates)
✅ Google Sheets worker completed
```

## Częste problemy

### Błąd: "Permission denied" (403)

**Przyczyna:** Service Account nie ma dostępu do arkusza.

**Rozwiązanie:**
1. Sprawdź czy udostępniłeś arkusz z właściwym emailem Service Account
2. Email musi być dokładnie taki sam jak w pliku JSON (`client_email`)
3. Arkusz musi mieć uprawnienia co najmniej "Viewer"

### Błąd: "Invalid SHEET_URL format"

**Przyczyna:** Nieprawidłowy URL do arkusza.

**Rozwiązanie:**
- URL powinien być w formacie: `https://docs.google.com/spreadsheets/d/ARKUSZ_ID/edit`
- Skopiuj URL bezpośrednio z paska adresu przeglądarki

### Błąd: "GOOGLE_PRIVATE_KEY not configured"

**Przyczyna:** Brak lub nieprawidłowy klucz prywatny.

**Rozwiązanie:**
1. Sprawdź czy zmienna `GOOGLE_PRIVATE_KEY` jest ustawiona w pliku `.env`
2. Upewnij się, że klucz jest w cudzysłowach
3. Sprawdź czy znaki nowej linii są zapisane jako `\\n` (podwójny backslash)

### Worker nie dodaje URL-i

**Sprawdź:**
1. Czy `SHEET_UPDATE=true`
2. Czy daty w arkuszu są z ostatnich 3 dni (dzisiaj + 2 dni wstecz)
3. Czy URL-e są prawidłowe (zaczynają się od http:// lub https://)
4. Czy URL-e nie istnieją już w bazie (worker pomija duplikaty)

## Monitorowanie

Worker wypisuje szczegółowe logi podczas działania:

```
📊 Running Google Sheets sync before check run...
📊 Fetching data from Google Sheets...
📊 Processed sheet data:
  - Total rows: 49
  - Valid URLs in date range: 15
  - Skipped (invalid dates): 0
  - Skipped (out of range): 30
  - Skipped (invalid URLs): 4
✅ Added 3 new URLs from sheet (skipped 12 duplicates)
✅ Google Sheets worker completed
```

Dzięki tym logom możesz monitorować:
- Ile URL-i zostało znalezionych w arkuszu
- Ile z nich było w zakresie dat
- Ile nowych URL-i zostało dodanych
- Ile URL-i zostało pominiętych jako duplikaty

## Bezpieczeństwo

⚠️ **WAŻNE:**
- **NIE** commituj pliku `.env` do repozytorium Git
- **NIE** udostępniaj klucza prywatnego Service Account
- Trzymaj plik JSON z kluczem w bezpiecznym miejscu
- Możesz w każdej chwili usunąć klucz w Google Cloud Console i wygenerować nowy

## Wsparcie

W razie problemów sprawdź:
1. Logi serwera (`npm run dev`)
2. Uprawnienia do arkusza Google Sheets
3. Poprawność zmiennych środowiskowych w pliku `.env`
4. Czy Google Sheets API jest włączone w projekcie Google Cloud
