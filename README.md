# MyFitnessCoach

Aplicația unui antrenor personal și a clienților lui: mese cu poză, calorii și macro, greutate, antrenamente, chat. Momentan e un demo funcțional cu date în memorie; drumul spre aplicația reală (App Store + Google Play) e în [PLAN.md](PLAN.md).

## Pornire

```bash
dotnet run --project src/MyFitnessCoach.Api
```

Deschide **http://localhost:5000**: apar cele două telefoane, clientul (Andrei) în stânga și antrenorul (Alex) în dreapta.

- Doar clientul: `/client.html` · doar antrenorul: `/trainer.html`.
- Butonul **Repornește demo-ul** (dreapta sus) readuce datele la starea inițială, pe ambele telefoane.
- Teste: `dotnet test`. Probleme frecvente și soluții: [docs/RUNBOOK.md](docs/RUNBOOK.md).

## Scenariu de prezentare (~2 minute)

1. **Client → Mese → Cină → Folosește** propunerea lui Alex, alege o poză, **Salvează**. Pe telefonul antrenorului apare notificarea cu poza, iar masa intră primul card în **Calorii**.
2. **Antrenor →** atinge masa și scrie un comentariu. Clientul primește notificarea, iar comentariul apare în chat lângă poza mesei.
3. **Client → Greutate → Cântărește-te.** Cântărirea apare la antrenor.
4. **Antrenor → Clienți → Andrei → Ținte → Editează**, schimbă caloriile. Inelul clientului se actualizează imediat.
5. **Client → Antrenament**, bifează seturi. Antrenorul vede progresul în **Plan** (fără notificare, conform specificației).
6. **Antrenor → Andrei → Dezactivează accesul.** Clientul vede ecranul de acces suspendat; **Reactivează** îl readuce.

## Structura

- `src/MyFitnessCoach.Api/`: serverul .NET 10 (minimal API + SignalR) și interfața din `wwwroot/` (JavaScript fără build). Fonturile, iconițele și SignalR sunt incluse local, deci demo-ul merge și fără internet. Pozele sunt de pe Pexels (licență gratuită).
- `tests/MyFitnessCoach.Api.Tests/`: teste automate.
- `docs/`: [specificația funcțională](docs/MyFitnessCoach.md), mockup-urile inițiale și [ghidul de depanare](docs/RUNBOOK.md).
