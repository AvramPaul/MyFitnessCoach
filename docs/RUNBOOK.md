# MyFitnessCoach: ghid de folosire și depanare

Ce faci când vrei să pornești proiectul sau când ceva nu merge. Se completează la fiecare etapă din [PLAN.md](../PLAN.md).

## Pornire locală

Cerințe: .NET 10 SDK.

Din folderul proiectului (cel cu `MyFitnessCoach.sln`):

```bash
dotnet run --project src/MyFitnessCoach.Api
```

Apoi deschide http://localhost:5000.

- **Alt port:** `dotnet run --project src/MyFitnessCoach.Api --urls http://localhost:5055`
- **Teste:** `dotnet test` (trebuie să treacă toate înainte de orice commit)
- **Doar build:** `dotnet build`

## Structura

| Folder | Ce conține |
|---|---|
| `src/MyFitnessCoach.Api/` | Serverul: `Program.cs` (endpoint-uri și SignalR), `Data/` (date și reguli), `wwwroot/` (interfața) |
| `src/MyFitnessCoach.Api/wwwroot/js/` | `core.js` (utilitare, grafice, notificări), `client.js` (aplicația clientului), `coach.js` (aplicația antrenorului) |
| `tests/MyFitnessCoach.Api.Tests/` | Teste automate pentru regulile importante |
| `docs/` | Specificația funcțională, mockup-urile inițiale, acest ghid |

## Probleme frecvente

| Simptom | Cauză | Rezolvare |
|---|---|---|
| La build: `Could not copy ... being used by another process` | Serverul rulează încă și blochează fișierele | Oprește serverul (Ctrl+C în terminalul lui), apoi refă build-ul |
| La pornire: `address already in use` | Portul 5000 e ocupat de altă instanță | Oprește cealaltă instanță sau pornește pe alt port (`--urls`) |
| `dotnet run` dă eroare că nu găsește proiectul | Comanda e dată din folderul principal, unde e doar soluția | Folosește `dotnet run --project src/MyFitnessCoach.Api` |
| Modificările din JS/CSS nu apar în browser | Fișiere vechi în cache-ul browserului | Ctrl+Shift+R. La schimbări mari, crește `?v=` din `client.html`, `trainer.html` și `index.html` |
| Datele revin la starea inițială după repornire | Până la etapa 1, datele stau doar în memorie | Normal deocamdată |
| Pe ecranele „azi” nu apar mese | Mesele de azi apar doar după ce le trece ora (de exemplu după miezul nopții nu e nimic) | Normal în demo |

## Unde vezi erorile

- **Server:** în terminalul în care rulează `dotnet run`.
- **Interfață:** în browser, F12 → tab-ul Console.

## Git

- `main` este versiunea stabilă. Fiecare etapă se lucrează pe un branch propriu (de exemplu `etapa-1-baza-de-date`) și se unește în `main` după verificare.
- Demo-ul de la hackathon e salvat cu tag-ul `demo-hackathon`. Pentru a-l vedea: `git checkout demo-hackathon`, apoi `git checkout main` pentru a reveni.
