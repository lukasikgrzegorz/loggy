# 🚀 Szybki Start - Loggy

## Krok 1: Konfiguracja Supabase

1. Utwórz konto na [Supabase](https://supabase.com)
2. Stwórz nowy projekt
3. Przejdź do **SQL Editor** i wykonaj skrypt z pliku `docs/db.sql`
4. Skopiuj dane dostępowe:
   - Project URL (Settings → API → Project URL)
   - Anon key (Settings → API → Project API keys → anon public)

## Krok 2: Konfiguracja aplikacji

1. Skopiuj plik środowiskowy:
```bash
cp .env.example .env
```

2. Edytuj plik `.env`:
```env
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ENEMY=12345,67890,11111
PORT=3000
```

**Ważne:** W zmiennej `ENEMY` podaj ID konkurencji oddzielone przecinkami (bez spacji).

## Krok 3: Uruchomienie

```bash
npm start
```

Otwórz przeglądarkę: **http://localhost:3000**

## Pierwsze użycie

1. **Dodaj linki do monitorowania:**
   - Kliknij zakładkę "Aktualizacja Listy"
   - Wklej listę URL-i (jeden na linię)
   - Kliknij "AKTUALIZUJ"

2. **Uruchom sprawdzanie:**
   - Wróć do zakładki "Aktualna Lista"
   - Kliknij "▶️ Uruchom Sprawdzanie"
   - Proces działa w tle - odśwież stronę po chwili

3. **Sprawdź wyniki:**
   - Status "⚠️ Konkurencja" = znaleziono ID konkurencji
   - Status "✓ OK" = nie znaleziono konkurencji
   - Status "⚠️ Błąd" = wystąpił problem z pobieraniem strony

4. **Obsługuj wyniki:**
   - Zaznacz checkbox "Obsłużone" przy linkach, które już sprawdziłeś
   - Linki z konkurencją są automatycznie pomijane w kolejnych runach

## Testowanie

Możesz przetestować działanie na przykładowych stronach:
```
https://example.com
https://github.com
https://nodejs.org
```

## Rozwiązywanie problemów

### Błąd połączenia z Supabase
- Sprawdź czy URL i klucz są poprawne w pliku `.env`
- Zweryfikuj czy tabele zostały utworzone w bazie danych

### Puppeteer nie działa
- Upewnij się, że masz zainstalowane wymagane biblioteki systemowe
- Na Linuxie: `sudo apt-get install -y chromium-browser`

### Timeout podczas pobierania strony
- Niektóre strony mogą długo się ładować
- Timeout ustawiony jest na 60 sekund
- Sprawdź połączenie internetowe

## Następne kroki

- Przeczytaj pełną dokumentację w `README.md`
- Zapoznaj się z PRD w `docs/prd.md`
- Sprawdź strukturę bazy w `docs/db.sql`

## Wsparcie

W razie problemów otwórz Issue na GitHubie.
