# 🔍 Loggy - Monitor Konkurencji na Giełdzie

Aplikacja do automatycznego śledzenia aktywności konkurencji na giełdzie poprzez monitorowanie określonych stron internetowych.

## 📋 Funkcjonalność

- **🔐 Autentykacja użytkowników** - system logowania z Supabase Auth (server-side)
- **📊 Google Sheets Integration** - automatyczne pobieranie URL-i z arkusza Google (opcjonalne)
- **Zarządzanie listą linków** - dodawanie, usuwanie i aktualizacja URL-i do monitorowania
- **Automatyczne sprawdzanie** - wykorzystanie Puppeteer do pobierania pełnej treści stron (po załadowaniu JavaScript)
- **Detekcja konkurencji** - wyszukiwanie ID konkurencji w źródle strony
- **Detekcja zakończonych ofert** - automatyczne oznaczanie ofert z tekstem "Ogłoszenie nieaktualne"
- **Historia sprawdzeń** - pełna dokumentacja wszystkich runów i ich wyników
- **Obsługa błędów** - zapisywanie błędów do bazy danych
- **Interfejs webowy** - prosty frontend do zarządzania i przeglądania wyników
- **Ochrona danych** - sesje po stronie serwera, klucze API chronione w .env

## 🏗️ Architektura

- **Backend**: Node.js + Express + Puppeteer + express-session
- **Baza danych**: Supabase (PostgreSQL)
- **Frontend**: Vanilla JavaScript + HTML/CSS (bez zewnętrznych bibliotek)
- **Autentykacja**: Server-side z sesjami HTTP-only cookies

## 📦 Instalacja

1. **Sklonuj repozytorium**
```bash
git clone <repo-url>
cd loggy
```

2. **Zainstaluj zależności**
```bash
npm install
```

3. **Skonfiguruj zmienne środowiskowe**

Skopiuj `.env.example` do `.env` i uzupełnij danymi:
```bash
cp .env.example .env
```

Edytuj plik `.env`:
```env
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_ANON_KEY=twoj-klucz-anon
SESSION_SECRET=wygeneruj-losowy-sekret-min-32-znaki
ENEMY=12345,67890,11111
PORT=3000
```

**💡 Generowanie SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. **Utwórz tabele w Supabase**

Uruchom skrypt SQL z pliku `docs/db.sql` w swojej bazie Supabase.

5. **Skonfiguruj autentykację**

Szczegółowe instrukcje konfiguracji autentykacji znajdziesz w `docs/AUTH_SETUP.md`:
- Utwórz użytkownika w Supabase
- Zaktualizuj klucze API w `public/index.html`

**⚠️ WAŻNE**: Przed uruchomieniem musisz skonfigurować Supabase Auth!

## 🚀 Uruchomienie

```bash
npm start
```

Aplikacja będzie dostępna pod adresem: `http://localhost:3000`

## 📚 API Endpoints

### Autentykacja
- `POST /api/auth/login` - Zaloguj użytkownika (body: `{email, password}`)
- `POST /api/auth/logout` - Wyloguj użytkownika
- `GET /api/auth/session` - Sprawdź aktywną sesję

### Linki (wymagają autentykacji)
- `GET /api/links` - Pobierz wszystkie linki
- `POST /api/links/update` - Aktualizuj listę linków (body: `{urls: [...]}`)
- `PATCH /api/links/:url/check` - Oznacz link jako obsłużony (body: `{checked: true/false}`)
- `PATCH /api/links/:url/comment` - Dodaj/edytuj komentarz (body: `{comment: "..."}`)
- `DELETE /api/links/:url` - Usuń link

### Runy (wymagają autentykacji)
- `GET /api/runs` - Pobierz historię runów
- `GET /api/history` - Pobierz historię sprawdzeń

### Fetch
- `GET /fetch?url=<URL>` - Pobierz HTML strony przez Puppeteer

## 🖥️ Interfejs Użytkownika

### Aktualna Lista
- Przegląd wszystkich monitorowanych linków
- Statusy: ✓ OK, ⚠️ Konkurencja, ⚠️ Błąd
- Możliwość oznaczania linków jako obsłużone
- Statystyki: wszystkie linki, konkurencja, do sprawdzenia
- Przycisk uruchomienia nowego sprawdzania

### Aktualizacja Listy
- Pole textarea do wklejania listy URL-i (jeden na linię)
- Automatyczna synchronizacja:
  - Dodawanie nowych linków
  - Usuwanie brakujących
  - Pomijanie istniejących

## 🔄 Jak działa sprawdzanie?

1. Użytkownik uruchamia run (POST /api/run)
2. System tworzy nowy rekord w tabeli `log_runs`
3. Pobiera wszystkie linki z `enemy=false`
4. Dla każdego linku:
   - Otwiera stronę w Puppeteer
   - Czeka na pełne załadowanie (networkidle2)
   - Pobiera HTML
   - Sprawdza czy występują ID z listy ENEMY
   - Zapisuje wynik do `log_links_history`
   - Aktualizuje `log_current_links`
5. Zamyka run (ustawia `closed_at`)

## 🗄️ Struktura Bazy Danych

### `log_current_links`
- `url` (PK) - URL do monitorowania
- `enemy` - czy znaleziono konkurencję
- `error` - treść błędu (jeśli wystąpił)
- `checked` - czy użytkownik obsłużył ten link
- `created`, `modified` - timestamps

### `log_runs`
- `id` (PK) - UUID runa
- `created_at` - start runa
- `closed_at` - koniec runa

### `log_links_history`
- `id` (PK) - UUID rekordu
- `run_id` (FK) - powiązanie z runem
- `url` - sprawdzany URL
- `enemy` - wynik sprawdzenia
- `error` - błąd (jeśli wystąpił)
- `created_at` - timestamp

## 🛠️ Konfiguracja

### Zmienne środowiskowe
- `SUPABASE_URL` - URL projektu Supabase
- `SUPABASE_ANON_KEY` - Klucz anon z Supabase
- `SESSION_SECRET` - Klucz szyfrujący sesje (min. 32 znaki)
- `ENEMY` - Lista ID konkurencji oddzielona przecinkami
- `PORT` - Port serwera (domyślnie 3000)

### Google Sheets Integration (opcjonalne)

Loggy może automatycznie pobierać URL-e z arkusza Google Sheets! 

**Funkcjonalność:**
- ✅ Automatyczne pobieranie URL-i z arkusza (kolumny: url, data)
- ✅ Filtrowanie rekordów z dzisiaj i 2 dni wstecz
- ✅ Automatyczne dodawanie `/offers` do URL-i
- ✅ Pomijanie duplikatów
- ✅ Synchronizacja przed każdym sprawdzeniem (domyślnie co 5 min)
- ✅ **Automatyczna blokada ręcznej edycji** - interfejs aktualizacji jest ukryty gdy aktywny tryb Google Sheets

**⚠️ Uwaga:** Gdy `SHEET_UPDATE=true`, zakładka "Aktualizacja Listy" jest zablokowana. Wszystkie URL-e zarządzane są przez arkusz.

**Dodatkowe zmienne środowiskowe:**
- `SHEET_UPDATE` - włącz/wyłącz integrację (true/false)
- `SHEET_URL` - URL do arkusza Google Sheets
- `SHEET_RANGE` - zakres kolumn (domyślnie A:B)
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` - email Service Account
- `GOOGLE_PRIVATE_KEY` - klucz prywatny Service Account
- `SHEET_SYNC_INTERVAL` - interwał synchronizacji w ms (domyślnie 300000 = 5 min)

📖 **Szczegółowa instrukcja konfiguracji:** `docs/GOOGLE_SHEETS_SETUP.md`

## 🔒 Bezpieczeństwo

### Architektura autentykacji (server-side)

- ✅ **Klucze API tylko na serwerze** - żadne klucze Supabase nie trafiają do przeglądarki
- ✅ **HTTP-only cookies** - sesje chronione przed dostępem JavaScript
- ✅ **Middleware autentykacji** - wszystkie endpointy API wymagają zalogowania
- ✅ **Express-session** - profesjonalne zarządzanie sesjami
- ✅ **Centralizacja** - jedna implementacja auth zamiast duplikacji frontend/backend

### Migracja z client-side auth

Jeśli aktualizujesz z poprzedniej wersji z autentykacją po stronie frontendu, 
zobacz szczegółową instrukcję migracji: **`docs/MIGRATION_TO_SERVER_AUTH.md`**

## 📝 TODO / Rozszerzenia

- [x] ~~Autentykacja użytkowników~~ ✅ (server-side sessions)
- [x] ~~Automatyczne cykliczne uruchamianie runów~~ ✅ (continuous loop)
- [ ] Powiadomienia email/webhook przy wykryciu konkurencji
- [ ] Dashboard z wykresami i statystykami
- [ ] Eksport danych do CSV/Excel
- [ ] Filtrowanie i wyszukiwanie w historii
- [ ] Paginacja dla dużych list

## 📄 Licencja

MIT

## 👨‍💻 Autor

GitHub: lukasikgrzegorz
