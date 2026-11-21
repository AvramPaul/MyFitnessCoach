# MyFitnessCoach: instrucțiuni pentru Claude

- Proiectul trece de la demo la aplicație reală (App Store + Google Play). **Planul, deciziile și starea curentă sunt în [PLAN.md](PLAN.md).** Citește-l la începutul fiecărei sesiuni, lucrează doar la etapa curentă și actualizează-l după fiecare pas (bifă, „Stare curentă”, „Jurnal”).
- Utilizatorul întreține singur proiectul, scris integral cu AI. Comunicarea e în română: explicații simple, întrebări înainte de decizii mari sau costuri.
- Specificația funcțională: [docs/MyFitnessCoach.md](docs/MyFitnessCoach.md). Interfața din demo e aprobată: fără texte care repetă ce arată deja un grafic, o culoare sau alt ecran.
- Problemele frecvente și soluțiile lor: [docs/RUNBOOK.md](docs/RUNBOOK.md). Adaugă acolo orice problemă nouă rezolvată.

## Cum rulează acum

- `dotnet run --project src/MyFitnessCoach.Api`, apoi http://localhost:5000 (cele două telefoane). Alt port: `--urls http://localhost:5055`. Teste: `dotnet test`.
- Server: .NET 10 minimal API + SignalR (`src/MyFitnessCoach.Api/Program.cs`). Datele stau în memorie (`Data/Store.cs`) și sunt generate la pornire (`Data/Seed.cs`). Baza de alimente e în `Data/Foods.cs`.
- Interfață fără build, în `src/MyFitnessCoach.Api/wwwroot/`: `js/core.js` (utilitare, grafice, notificări), `js/client.js`, `js/coach.js`; stiluri în `css/`. Fonturile, iconițele și SignalR sunt incluse local în `lib/`.
- Fișierele statice se servesc cu `Cache-Control: no-cache`. La o modificare majoră de JS/CSS, crește și `?v=` din `client.html`, `trainer.html` și `index.html`.
