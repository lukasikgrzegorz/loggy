# 🧪 Testowanie Aplikacji Loggy

## Przygotowanie środowiska testowego

### 1. Przykładowe ID konkurencji

Do testów możesz użyć następujących ID (dodaj je do `.env`):
```env
ENEMY=test123,demo456,sample789
```

### 2. Przykładowe URL-e do monitorowania

Bezpieczne strony do testów:
```
https://example.com
https://httpbin.org/html
https://jsonplaceholder.typicode.com
https://github.com
https://www.wikipedia.org
```

### 3. Tworzenie strony testowej

Możesz utworzyć prostą stronę HTML zawierającą ID konkurencji:

**test-page.html:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
</head>
<body>
  <h1>Test Competitor Detection</h1>
  <!-- ID konkurencji: test123 -->
  <div data-competitor-id="test123">
    Hidden competitor marker
  </div>
</body>
</html>
```

Zapisz ten plik i otwórz w przeglądarce, następnie skopiuj URL z paska adresu (np. `file:///home/user/test-page.html`).

## Scenariusze testowe

### Test 1: Dodanie linków

1. Otwórz `http://localhost:3000`
2. Przejdź do zakładki "Aktualizacja Listy"
3. Wklej przykładowe URL-e
4. Kliknij "AKTUALIZUJ"
5. **Oczekiwany rezultat:** Komunikat o dodaniu linków

### Test 2: Uruchomienie sprawdzania

1. Wróć do zakładki "Aktualna Lista"
2. Kliknij "▶️ Uruchom Sprawdzanie"
3. Odczekaj ~30 sekund
4. Kliknij "🔄 Odśwież"
5. **Oczekiwany rezultat:** Aktualizacja statusów linków

### Test 3: Detekcja konkurencji

1. Utwórz plik `test-page.html` z ID konkurencji
2. Otwórz go w przeglądarce (skopiuj URL)
3. Dodaj ten URL do listy
4. Uruchom sprawdzanie
5. **Oczekiwany rezultat:** Status "⚠️ Konkurencja"

### Test 4: Oznaczanie jako obsłużone

1. Przy dowolnym linku zaznacz checkbox "Obsłużone"
2. Odśwież stronę
3. **Oczekiwany rezultat:** Checkbox pozostaje zaznaczony

### Test 5: Usuwanie linków

1. Przejdź do "Aktualizacja Listy"
2. Usuń jeden lub więcej linków z textarea
3. Kliknij "AKTUALIZUJ"
4. Wróć do "Aktualna Lista"
5. **Oczekiwany rezultat:** Usunięte linki nie są widoczne

## Testowanie API przez cURL

### Test połączenia z bazą danych
```bash
curl http://localhost:3000/api/links
```

**Oczekiwany rezultat:** JSON z listą linków lub pusta tablica `[]`

### Test dodawania linków
```bash
curl -X POST http://localhost:3000/api/links/update \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example.com",
      "https://httpbin.org/html"
    ]
  }'
```

**Oczekiwany rezultat:**
```json
{
  "added": 2,
  "removed": 0,
  "total": 2
}
```

### Test uruchomienia runa
```bash
curl -X POST http://localhost:3000/api/run
```

**Oczekiwany rezultat:**
```json
{
  "runId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Run started in background"
}
```

### Test endpointu fetch
```bash
curl "http://localhost:3000/fetch?url=https://example.com"
```

**Oczekiwany rezultat:** JSON z polem `html` zawierającym kod HTML strony

## Sprawdzanie logów

### Logi serwera
```bash
# Uruchom z logowaniem
npm start

# Sprawdź czy widzisz:
# - "Server running on http://localhost:3000"
# - "Run <ID>: Checking X links"
# - "Run <ID>: Completed"
```

### Logi w konsoli przeglądarki
1. Otwórz DevTools (F12)
2. Zakładka "Console"
3. Sprawdź czy nie ma błędów JavaScript

### Logi w Supabase
1. Otwórz Supabase Dashboard
2. Przejdź do "Table Editor"
3. Sprawdź tabele:
   - `log_current_links` - lista aktywnych linków
   - `log_runs` - historia runów
   - `log_links_history` - szczegóły sprawdzeń

## Najczęstsze problemy

### Problem: "Cannot connect to Supabase"
**Rozwiązanie:**
- Sprawdź `.env` - czy URL i klucz są poprawne
- Zweryfikuj połączenie internetowe
- Sprawdź czy tabele istnieją w bazie

### Problem: "Timeout podczas sprawdzania"
**Rozwiązanie:**
- Zwiększ timeout w `server.js` (domyślnie 60s)
- Sprawdź czy strona docelowa nie jest zablokowana
- Zweryfikuj połączenie internetowe

### Problem: "Nie wykrywa konkurencji"
**Rozwiązanie:**
- Sprawdź czy ID w `.env` jest poprawne
- ID musi występować w HTML (sprawdź "View Source")
- Wielkie/małe litery mają znaczenie

### Problem: "Puppeteer nie uruchamia się"
**Rozwiązanie (Linux):**
```bash
sudo apt-get install -y \
  chromium-browser \
  libx11-xcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxi6 \
  libxtst6 \
  libnss3 \
  libcups2 \
  libxss1 \
  libxrandr2 \
  libasound2 \
  libpangocairo-1.0-0 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libgtk-3-0
```

## Czyszczenie danych testowych

### Usuń wszystkie linki (SQL w Supabase)
```sql
DELETE FROM log_current_links;
DELETE FROM log_links_history;
DELETE FROM log_runs;
```

### Resetuj tylko statusy
```sql
UPDATE log_current_links 
SET enemy = false, 
    error = null, 
    checked = false;
```

## Performance Testing

### Test obciążeniowy (100 linków)
```bash
# Wygeneruj listę 100 URL-i
for i in {1..100}; do
  echo "https://example.com/page$i"
done

# Dodaj je przez API
# Uruchom run i zmierz czas
```

**Oczekiwany czas:** ~100-200 sekund (z opóźnieniem 1s między requestami)

## Monitoring

### Sprawdź ile runów jest aktywnych
```bash
curl http://localhost:3000/api/runs | jq '.[] | select(.closed_at == null)'
```

### Sprawdź statystyki
```bash
curl http://localhost:3000/api/links | jq '
  "Total: \(length), 
   Enemy: \([.[] | select(.enemy == true)] | length), 
   Errors: \([.[] | select(.error != null)] | length)"
'
```

## Checklist końcowy

- [ ] Aplikacja uruchamia się bez błędów
- [ ] Można dodawać i usuwać linki
- [ ] Run sprawdzający działa poprawnie
- [ ] Detekcja konkurencji działa
- [ ] Checkbox "Obsłużone" zapisuje się
- [ ] Brak błędów w konsoli przeglądarki
- [ ] Brak błędów w logach serwera
- [ ] Dane poprawnie zapisują się w Supabase

---

**Powodzenia w testowaniu! 🚀**
