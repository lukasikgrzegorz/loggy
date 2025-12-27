# Instrukcja konfiguracji autentykacji Supabase

## Krok 1: Utwórz projekt w Supabase

1. Przejdź do https://supabase.com
2. Zaloguj się lub utwórz konto
3. Kliknij "New Project"
4. Wypełnij dane projektu:
   - Name: loggy
   - Database Password: [wybierz bezpieczne hasło]
   - Region: [wybierz najbliższy region]

## Krok 2: Pobierz klucze API

1. W panelu projektu przejdź do **Settings** → **API**
2. Skopiuj:
   - **Project URL** (np. `https://xxxxx.supabase.co`)
   - **anon public** key

## Krok 3: Skonfiguruj zmienne środowiskowe

1. Skopiuj plik `.env.example` do `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edytuj plik `.env` i wklej swoje klucze:
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=twój-anon-key
   SESSION_SECRET=wygeneruj-losowy-sekret-min-32-znaki
   ```

3. **Opcjonalnie**: Wygeneruj bezpieczny SESSION_SECRET:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

**⚠️ WAŻNE**: Wszystkie klucze są teraz **tylko po stronie serwera** w pliku `.env`.
Frontend nie ma dostępu do kluczy Supabase - wszystko odbywa się przez API serwera.

## Krok 4: Utwórz użytkownika

W panelu Supabase:

1. Przejdź do **Authentication** → **Users**
2. Kliknij **Add user** → **Create new user**
3. Wypełnij:
   - Email: twój@email.com
   - Password: [wybierz bezpieczne hasło]
   - Auto Confirm User: **ON** ✓
4. Kliknij **Create user**

## Krok 5: Testowanie

1. Uruchom serwer:
   ```bash
   npm start
   ```

2. Otwórz http://localhost:3000

3. Zaloguj się używając emaila i hasła utworzonego w kroku 4

## Dodawanie kolejnych użytkowników

Powtórz Krok 4, aby dodać więcej użytkowników.

## Zabezpieczenia

### ✅ Zaimplementowane
- **Sesje po stronie serwera** - klucze Supabase nigdy nie trafiają do przeglądarki
- **HTTP-only cookies** - JavaScript nie ma dostępu do sesji
- **Middleware autentykacji** - wszystkie endpointy API są chronione
- **.env nie jest w repozytorium** - klucze pozostają prywatne

### 🔒 Rekomendacje
- Użyj **HTTPS** w produkcji (ustaw `NODE_ENV=production`)
- Regularnie zmieniaj hasła użytkowników
- Użyj **Row Level Security (RLS)** w Supabase dla dodatkowej ochrony bazy danych
- Zmieniaj `SESSION_SECRET` po każdym naruszeniu bezpieczeństwa

## Rozwiązywanie problemów

### "Unauthorized" przy wywołaniach API
- Sprawdź czy jesteś zalogowany
- Wyloguj się i zaloguj ponownie
- Sprawdź czy sesja wygasła (domyślnie 24h)

### "Invalid login credentials"
- Sprawdź czy email i hasło są poprawne
- Upewnij się, że użytkownik ma status "Confirmed" w panelu Supabase

### "Failed to fetch"
- Sprawdź czy serwer działa na http://localhost:3000
- Sprawdź czy `.env` zawiera poprawne klucze
- Sprawdź logi serwera w terminalu

### Nie widać ekranu logowania
- Sprawdź konsolę przeglądarki (F12)
- Sprawdź czy serwer odpowiada na http://localhost:3000

