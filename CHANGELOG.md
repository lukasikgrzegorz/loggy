# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2024-12-27

### 🔒 BREAKING CHANGES - Migracja autentykacji na server-side

#### Added
- **Server-side authentication** - pełna autentykacja przez backend
- `express-session` - profesjonalne zarządzanie sesjami
- `SESSION_SECRET` w zmiennych środowiskowych
- Nowe API endpoints:
  - `POST /api/auth/login` - logowanie
  - `POST /api/auth/logout` - wylogowanie
  - `GET /api/auth/session` - sprawdzenie sesji
- Middleware `requireAuth` zabezpieczający wszystkie endpointy API
- HTTP-only cookies dla sesji (zwiększone bezpieczeństwo)
- Dokumentacja migracji: `docs/MIGRATION_TO_SERVER_AUTH.md`

#### Changed
- Frontend nie używa już biblioteki `@supabase/supabase-js`
- Klucze Supabase są teraz **tylko** w `.env` na serwerze
- Wszystkie endpointy API wymagają teraz autentykacji
- Sesje zarządzane przez express-session zamiast Supabase client
- Zaktualizowano `docs/AUTH_SETUP.md` z nowymi instrukcjami
- Zaktualizowano `.env.example` o `SESSION_SECRET`

#### Removed
- `public/config.js` - niepotrzebny (klucze tylko na serwerze)
- Bezpośrednie wywołania Supabase z frontendu
- Import `@supabase/supabase-js` w `index.html`

#### Security
- ✅ Klucze API nigdy nie trafiają do przeglądarki
- ✅ HTTP-only cookies chronią sesje przed XSS
- ✅ Centralne zarządzanie autoryzacją
- ✅ Możliwość wymuszenia HTTPS w produkcji

#### Migration Guide
Dla użytkowników aktualizujących z wersji 1.x:
1. `npm install express-session`
2. Dodaj `SESSION_SECRET` do `.env`
3. Usuń `public/config.js`
4. Zrestartuj serwer
5. Zaloguj się ponownie

Szczegóły: `docs/MIGRATION_TO_SERVER_AUTH.md`

---

## [1.0.0] - 2024-12-XX

### Added
- Podstawowa funkcjonalność monitoringu konkurencji
- Autentykacja użytkowników przez Supabase (client-side)
- Automatyczne ciągłe sprawdzanie linków
- Detekcja zakończonych ofert ("Ogłoszenie nieaktualne")
- System komentarzy do linków
- Możliwość oznaczania linków jako obsłużone
- Pool przeglądarek Puppeteer dla wydajności
- Interfejs webowy z widokami: Lista, Aktualizacja
- Statystyki: wszystkie, konkurencja, sprawdzane, zakończone
- Usuwanie linków z potwierdzeniem (bez potwierdzenia dla zakończonych)
- Automatyczne dodawanie `/offers` do linków
- Obsługa Raspberry Pi (systemowy Chromium)
- Konfiguracja przez zmienne środowiskowe
- Dokumentacja: README, QUICKSTART, API, TESTING

### Features
- Puppeteer z headless Chrome
- Express.js backend
- Supabase PostgreSQL database
- Vanilla JavaScript frontend (zero dependencies)
- Responsive design
