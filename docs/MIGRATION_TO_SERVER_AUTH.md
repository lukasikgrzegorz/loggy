# Migracja autentykacji na stronę serwera

## 🎯 Cel migracji

Przeniesienie logiki autentykacji z frontendu (client-side) na backend (server-side) w celu zwiększenia bezpieczeństwa.

## ✅ Co zostało zmienione

### 1. **Backend (`server.js`)**

#### Dodano:
- `express-session` - zarządzanie sesjami użytkowników
- `SESSION_SECRET` - klucz szyfrujący sesje (w `.env`)
- Middleware `requireAuth` - zabezpieczenie wszystkich endpointów API
- Nowe endpointy autentykacji:
  - `POST /api/auth/login` - logowanie użytkownika
  - `POST /api/auth/logout` - wylogowanie użytkownika
  - `GET /api/auth/session` - sprawdzenie aktywnej sesji

#### Zabezpieczono:
Wszystkie endpointy API wymagają teraz zalogowania:
- `GET /api/links`
- `POST /api/links/update`
- `PATCH /api/links/:url/check`
- `PATCH /api/links/:url/comment`
- `DELETE /api/links/:url`
- `GET /api/runs`
- `GET /api/history`

### 2. **Frontend (`public/index.html`)**

#### Usunięto:
- ❌ Import biblioteki `@supabase/supabase-js`
- ❌ Import pliku `config.js`
- ❌ Inicjalizację klienta Supabase
- ❌ Bezpośrednie wywołania `supabase.auth.*`
- ❌ Listener `onAuthStateChange`

#### Zastąpiono:
Wszystkie operacje autentykacji odwołują się teraz do API serwera:
- `checkAuth()` → `fetch('/api/auth/session')`
- `handleLogin()` → `fetch('/api/auth/login')`
- `handleLogout()` → `fetch('/api/auth/logout')`

### 3. **Pliki usunięte**
- ❌ `public/config.js` - niepotrzebny (klucze są tylko w `.env` na serwerze)

### 4. **Zmienne środowiskowe**

Dodano w `.env`:
```env
SESSION_SECRET=your-secret-key-min-32-characters
```

## 🔒 Korzyści bezpieczeństwa

### Przed migracją:
- ⚠️ Klucze Supabase eksponowane w przeglądarce (`config.js`)
- ⚠️ Logika autentykacji w JavaScript klienta
- ⚠️ Możliwość podejrzenia kluczy API w devtools
- ⚠️ Token sesji zarządzany przez Supabase client

### Po migracji:
- ✅ Klucze Supabase **tylko** w `.env` na serwerze
- ✅ Cała logika autentykacji po stronie serwera
- ✅ Sesje zarządzane przez `express-session`
- ✅ HTTP-only cookies - JavaScript nie ma dostępu
- ✅ Możliwość ustawienia `secure: true` w HTTPS (produkcja)
- ✅ Centralne zarządzanie autoryzacją przez middleware

## 📝 Instrukcja aktualizacji

### Dla istniejących instalacji:

1. **Zaktualizuj zależności:**
   ```bash
   npm install express-session
   ```

2. **Dodaj SESSION_SECRET do `.env`:**
   ```bash
   # Wygeneruj klucz:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Dodaj do .env:
   echo "SESSION_SECRET=<wygenerowany-klucz>" >> .env
   ```

3. **Usuń niepotrzebny plik:**
   ```bash
   rm public/config.js
   ```

4. **Zrestartuj serwer:**
   ```bash
   npm start
   ```

5. **Wyloguj się i zaloguj ponownie** w przeglądarce

### Dla nowych instalacji:

Postępuj według instrukcji w `docs/AUTH_SETUP.md`.

## 🔄 API Changes

### Nowe endpointy:

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/auth/login` | POST | Logowanie użytkownika |
| `/api/auth/logout` | POST | Wylogowanie użytkownika |
| `/api/auth/session` | GET | Sprawdzenie aktywnej sesji |

### Przykłady użycia:

#### Login:
```javascript
const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const data = await res.json();
// { user: { id, email } }
```

#### Logout:
```javascript
await fetch('/api/auth/logout', { method: 'POST' });
```

#### Check session:
```javascript
const res = await fetch('/api/auth/session');
const data = await res.json();
// { user: { id, email } } lub { user: null }
```

## ⚙️ Konfiguracja sesji

Domyślna konfiguracja w `server.js`:

```javascript
session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,                                // No JS access
    maxAge: 24 * 60 * 60 * 1000                   // 24 hours
  }
})
```

### Dostosowanie:

Zmień czas wygaśnięcia sesji (domyślnie 24h):
```javascript
maxAge: 7 * 24 * 60 * 60 * 1000  // 7 dni
```

## 🐛 Rozwiązywanie problemów

### Błąd "Unauthorized" po aktualizacji
**Rozwiązanie:** Wyloguj się i zaloguj ponownie. Stare sesje z Supabase nie są kompatybilne.

### Sesja wygasa zbyt szybko
**Rozwiązanie:** Zwiększ `maxAge` w konfiguracji sesji w `server.js`.

### Błąd przy logowaniu
**Rozwiązanie:** 
1. Sprawdź czy `SESSION_SECRET` jest ustawiony w `.env`
2. Sprawdź logi serwera
3. Upewnij się, że Supabase credentials są poprawne

## 📊 Porównanie

| Aspekt | Przed | Po |
|--------|-------|-----|
| Klucze API | Frontend + Backend | **Tylko Backend** |
| Zarządzanie sesją | Supabase client | **express-session** |
| Cookies | Standard | **HTTP-only** |
| Frontend dependencies | Supabase JS | **Żadne** |
| Bezpieczeństwo | Średnie | **Wysokie** |

## 📚 Dodatkowe materiały

- `docs/AUTH_SETUP.md` - Pełna instrukcja konfiguracji
- `.env.example` - Przykładowa konfiguracja środowiska
- `server.js` - Implementacja autentykacji server-side
