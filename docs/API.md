# 📡 API Documentation - Loggy

## Base URL
```
http://localhost:3000
```

## Endpoints

### 1. Zarządzanie Linkami

#### GET /api/links
Pobiera wszystkie linki z bazy danych.

**Response:**
```json
[
  {
    "url": "https://example.com",
    "enemy": false,
    "error": null,
    "checked": false,
    "created": "2024-12-07T10:30:00Z",
    "modified": "2024-12-07T10:30:00Z"
  }
]
```

---

#### POST /api/links/update
Aktualizuje listę linków (dodaje nowe, usuwa brakujące).

**Request Body:**
```json
{
  "urls": [
    "https://example.com",
    "https://example.org",
    "https://example.net"
  ]
}
```

**Response:**
```json
{
  "added": 2,
  "removed": 1,
  "total": 3
}
```

---

#### PATCH /api/links/:url/check
Oznacza link jako obsłużony lub nieobsłużony.

**URL Parameter:**
- `:url` - zakodowany URL linku (używaj `encodeURIComponent()`)

**Request Body:**
```json
{
  "checked": true
}
```

**Response:**
```json
{
  "success": true
}
```

**Przykład użycia (JavaScript):**
```javascript
const url = encodeURIComponent('https://example.com');
await fetch(`/api/links/${url}/check`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ checked: true })
});
```

---

### 2. Runy Sprawdzające

#### POST /api/run
Uruchamia nowy run sprawdzający konkurencję.

**Response:**
```json
{
  "runId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Run started in background"
}
```

**Proces:**
1. Tworzy nowy rekord w `log_runs`
2. Uruchamia sprawdzanie w tle
3. Dla każdego linku z `enemy=false`:
   - Pobiera stronę przez Puppeteer
   - Sprawdza obecność ID konkurencji
   - Zapisuje wynik do `log_links_history`
   - Aktualizuje `log_current_links`
4. Zamyka run po zakończeniu

---

#### GET /api/runs
Pobiera ostatnie 20 runów.

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-12-07T10:00:00Z",
    "closed_at": "2024-12-07T10:15:00Z"
  }
]
```

---

#### GET /api/history
Pobiera ostatnie 100 sprawdzeń z historii.

**Response:**
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "run_id": "550e8400-e29b-41d4-a716-446655440000",
    "url": "https://example.com",
    "enemy": false,
    "error": null,
    "created_at": "2024-12-07T10:05:00Z"
  }
]
```

---

### 3. Fetch (Legacy)

#### GET /fetch?url=:url
Pobiera HTML strony przez Puppeteer (endpoint pomocniczy).

**Query Parameters:**
- `url` - URL strony do pobrania

**Response:**
```json
{
  "url": "https://example.com",
  "html": "<!DOCTYPE html>..."
}
```

**Błąd:**
```json
{
  "error": "Failed to fetch page",
  "details": "Navigation timeout of 60000 ms exceeded"
}
```

---

## Status Codes

- **200 OK** - Sukces
- **400 Bad Request** - Błędne parametry
- **500 Internal Server Error** - Błąd serwera

---

## Przykłady użycia

### JavaScript (Fetch API)

```javascript
// Pobierz wszystkie linki
const links = await fetch('/api/links').then(r => r.json());

// Dodaj nowe linki
await fetch('/api/links/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    urls: ['https://example.com', 'https://example.org']
  })
});

// Uruchom sprawdzanie
const run = await fetch('/api/run', { method: 'POST' }).then(r => r.json());
console.log('Run ID:', run.runId);

// Oznacz link jako obsłużony
const url = encodeURIComponent('https://example.com');
await fetch(`/api/links/${url}/check`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ checked: true })
});
```

### cURL

```bash
# Pobierz wszystkie linki
curl http://localhost:3000/api/links

# Dodaj nowe linki
curl -X POST http://localhost:3000/api/links/update \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://example.com"]}'

# Uruchom sprawdzanie
curl -X POST http://localhost:3000/api/run

# Oznacz link jako obsłużony
curl -X PATCH "http://localhost:3000/api/links/https%3A%2F%2Fexample.com/check" \
  -H "Content-Type: application/json" \
  -d '{"checked":true}'
```

---

## Zmienne środowiskowe

Aplikacja wymaga następujących zmiennych w pliku `.env`:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Konkurencja (ID oddzielone przecinkami)
ENEMY=12345,67890,11111

# Port
PORT=3000
```

---

## Rate Limiting

Aplikacja dodaje opóźnienie 1 sekundy między kolejnymi requestami podczas runa, aby nie przeciążać serwisów docelowych.

---

## Error Handling

Wszystkie błędy są logowane do konsoli i zapisywane w bazie danych:
- Błędy połączenia z Supabase → zwracają status 500
- Błędy Puppeteer → zapisywane w polu `error` w bazie
- Timeouty → 60 sekund na załadowanie strony

---

## Notes

- Linki z `enemy=true` są automatycznie pomijane w kolejnych runach
- Każde sprawdzenie jest rejestrowane w tabeli `log_links_history`
- Frontend automatycznie odświeża dane co kilka sekund podczas aktywnego runa (zalecane)
