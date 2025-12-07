# Loggy - śledzenie aktywności konkurencji na giełdzie

## Funkcjonalność

- W tabeli `log_current_links` użytkownik definiuje adresy do śledzenia
- Tworzymy nowy run w tabeli `log_runs`
- Run polega na przejściu przez wszystkie podane linki i sprawdzeniu za pomocą Puppeteera, czy w pobranym źródle strony występuje ID z listy konkurencji
- Lista konkurencji zdefiniowana jest w zmiennej środowiskowej `ENEMY`, rozdzielone przecinkami
- Jeśli ID występuje, zmieniamy wartość `enemy` na `true`
- W kolejnych runach pomijamy linki z `enemy` na `true`
- Sprawdzanie ma się odbywać nieprzerwanie; treść błędu zapisujemy do tabel z historią oraz z aktywnymi linkami
- Każde zapytanie z runa zapisywane jest w tabeli `log_links_history`

## Architektura

- **Backend**: Node.js + Supabase
- **Frontend**: prosta aplikacja HTML/JS korzystająca z API w Node.js

## Frontend - Widoki

1. **Aktualna lista**
   - Przegląd ze statusami i flagą `checked` do zaznaczenia, jeśli obsłużył link
   - Widoczny status: `Konkurencja: true/false`
   - Widok oparty na danych z `log_current_links`

2. **Aktualizacja listy**
   - Duże pole textarea do wprowadzania linków (jeden pod drugim)
   - Przycisk `AKTUALIZUJ`
   - Logika: sprawdzamy czy nowo dodane linki znajdują się na liście
     - Jeśli tak → pomijamy
     - Jeśli nie → dodajemy nowe
     - Brakujące linki → usuwamy