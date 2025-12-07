# 🔍 Loggy - Monitor Konkurencji na Giełdzie

Aplikacja do automatycznego śledzenia aktywności konkurencji na giełdzie poprzez monitorowanie określonych stron internetowych.

## 📋 Funkcjonalność

- **Zarządzanie listą linków** - dodawanie, usuwanie i aktualizacja URL-i do monitorowania
- **Automatyczne sprawdzanie** - wykorzystanie Puppeteer do pobierania pełnej treści stron (po załadowaniu JavaScript)
- **Detekcja konkurencji** - wyszukiwanie ID konkurencji w źródle strony
- **Historia sprawdzeń** - pełna dokumentacja wszystkich runów i ich wyników
- **Obsługa błędów** - zapisywanie błędów do bazy danych
- **Interfejs webowy** - prosty frontend do zarządzania i przeglądania wyników

## 🏗️ Architektura

- **Backend**: Node.js + Express + Puppeteer
- **Baza danych**: Supabase (PostgreSQL)
- **Frontend**: Vanilla JavaScript + HTML/CSS

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
ENEMY=12345,67890,11111
PORT=3000
```

4. **Utwórz tabele w Supabase**

Uruchom skrypt SQL z pliku `docs/db.sql` w swojej bazie Supabase.

## 🚀 Uruchomienie

```bash
npm start
```

Aplikacja będzie dostępna pod adresem: `http://localhost:3000`

## 📚 API Endpoints

### Linki
- `GET /api/links` - Pobierz wszystkie linki
- `POST /api/links/update` - Aktualizuj listę linków
- `PATCH /api/links/:url/check` - Oznacz link jako obsłużony

### Runy
- `POST /api/run` - Uruchom nowy run sprawdzający
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
- `ENEMY` - Lista ID konkurencji oddzielona przecinkami
- `PORT` - Port serwera (domyślnie 3000)

## 📝 TODO / Rozszerzenia

- [ ] Automatyczne cykliczne uruchamianie runów (cron)
- [ ] Powiadomienia email/webhook przy wykryciu konkurencji
- [ ] Dashboard z wykresami i statystykami
- [ ] Eksport danych do CSV/Excel
- [ ] Filtrowanie i wyszukiwanie w historii
- [ ] Paginacja dla dużych list
- [ ] Autentykacja użytkowników

## 📄 Licencja

MIT

## 👨‍💻 Autor

GitHub: lukasikgrzegorz
