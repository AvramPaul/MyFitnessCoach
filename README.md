# MyFitnessCoach (fit-together)

Demo de hackathon: aplicația clientului și aplicația antrenorului, ambele pe telefon, sincronizate live.

## Pornire

```bash
cd fit-together
dotnet run
```

Deschide **http://localhost:5000**: apar cele două telefoane, clientul (Andrei) în stânga și antrenorul (Alex) în dreapta.

- Doar clientul: `/client.html` · doar antrenorul: `/trainer.html`. Se pot deschide și de pe un telefon din aceeași rețea Wi-Fi: `http://<IP-laptop>:5000/client.html`.
- Butonul **Repornește demo-ul** (dreapta sus) readuce datele la starea inițială, pe ambele telefoane.
- Alt port: `dotnet run --urls http://localhost:5055`.

## Scenariu de prezentare (~2 minute)

1. **Client → Mese → Cină → Folosește** propunerea lui Alex, alege o poză, **Salvează**. Pe telefonul antrenorului apare notificarea cu poza, iar masa intră primul card în **Calorii**.
2. **Antrenor →** atinge masa și scrie un comentariu. Clientul primește notificarea, iar comentariul apare în chat lângă poza mesei.
3. **Client → Greutate → Cântărește-te.** Cântărirea apare la antrenor.
4. **Antrenor → Clienți → Andrei → Ținte**, schimbă caloriile. Inelul clientului se actualizează imediat.
5. **Client → Antrenament**, bifează seturi. Antrenorul vede progresul în **Plan** (fără notificare, conform specificației).
6. **Antrenor → Andrei → Dezactivează accesul.** Clientul vede ecranul de acces suspendat; **Reactivează** îl readuce.

## Cum e construit

- **Backend:** .NET 10 minimal API + SignalR. Datele stau în memorie și se generează la pornire relativ la ora curentă, ca demo-ul să arate „azi” oricând:
  - `Data/Seed.cs`: clienți, mese, cântăriri, antrenamente, rețete, mesaje. Mesele de azi apar doar dacă le-a trecut ora.
  - `Data/Store.cs`: citiri și modificări. Totalurile meselor se calculează din ingrediente, inelele din mese, săptămâna din zile.
  - `Data/Foods.cs`: baza de alimente (valori per 100 g / 100 ml), cu căutare fără diacritice.
- **Frontend** (fără build): `wwwroot/js/core.js` (utilitare, grafice, notificări), `client.js`, `coach.js`; stiluri în `wwwroot/css/`.
- Fonturile (Archivo), iconițele (Phosphor) și clientul SignalR sunt incluse local în `wwwroot/lib`, deci demo-ul merge și fără internet.
- Pozele sunt de pe Pexels (licență gratuită), în `wwwroot/img`.

Specificația funcțională completă este în [`MyFitnessCoach.md`](MyFitnessCoach.md). Diferență față de ea: interfața antrenorului este acum tot de telefon.
