# MyFitnessCoach: de la demo la aplicație reală

> Document de lucru, actualizat după fiecare pas terminat.
> O sesiune nouă începe de aici: citește **Stare curentă**, apoi continuă cu prima sarcină nebifată din etapa curentă.

## Stare curentă

- **Etapa curentă:** 0, pregătire. Partea de cod e gata; așteaptă ca utilizatorul să verifice Azure for Students și să instaleze Docker Desktop, apoi urmează etapa 1.
- **Ce funcționează azi:** demo complet, cu cele două telefoane pe `localhost:5000`. Datele stau în memorie și se regenerează la pornire. Nu există conturi.
- **Ultima actualizare:** 22.11.2026

## Decizii luate

| Subiect | Decizie |
|---|---|
| Nume | **MyFitnessCoach** |
| Scop | Aplicație reală, fără termen-limită. Calitatea e mai importantă decât viteza. |
| Primii utilizatori | 1–2 antrenori, cu 4–5 clienți fiecare |
| Distribuție | App Store și Google Play |
| Cod | Repository **privat** pe contul GitHub al utilizatorului. Se lucrează doar acolo. |
| Infrastructură | Azure for Students (singurul cont disponibil) |
| Fără Mac | Varianta pentru iPhone se construiește în cloud (Codemagic sau GitHub Actions macOS) |
| Autentificare | Email + parolă, Google, Apple, prin Firebase Authentication |
| Cine plătește | Antrenorul |
| Ștergerea unui client | Se șterg definitiv datele, pozele **și contul clientului**. Dacă revine, își face cont nou. |
| Rețete și șabloane | Antrenorul își creează propriile rețete și șabloane de antrenament |
| Mentenanță | O singură persoană, cod scris integral cu AI. Codul trebuie să fie simplu, documentat și testat, iar orice problemă trebuie să se poată diagnostica din loguri. |
| Interfața | Cea din demo e aprobată. Nu se adaugă funcționalități noi față de demo, doar ce e necesar ca să meargă pe bune. |

## Decizii tehnice (confirmate pe 21.11.2026)

| # | Subiect | Decizie | De ce |
|---|---|---|---|
| 1 | Aplicația de telefon | **Capacitor**: aceeași aplicație web, împachetată ca aplicație nativă | Păstrăm 100% din interfața aprobată |
| 2 | Login | **Firebase Authentication** | Email + parolă, Google, Apple, resetarea parolei și verificarea emailului sunt gata făcute și testate. Mai puțin cod de securitate scris de noi înseamnă mai puține lucruri care se pot strica. |
| 3 | Notificări push | **Firebase Cloud Messaging** (Android + iOS) | Gratuit, în același proiect Firebase |
| 4 | Bază de date | **PostgreSQL** (Azure Database for PostgreSQL Flexible Server) + Entity Framework Core | Standard, ieftin, foarte bine suportat în .NET |
| 5 | Server | **Azure App Service** (Linux) | Suportă WebSockets (sincronizarea live), rămâne pornit pentru reamintirile programate, deploy simplu |
| 6 | Poze | **Azure Blob Storage**, container privat | Ieftin; pozele nu sunt publice |
| 7 | Plăți | Abonament plătit de antrenor **pe un site web** (Stripe). Aplicația nu vinde nimic în interior. | Evită comisionul și regulile de plată din magazine. Regulile se reverifică la etapa 9. |
| 8 | Codul interfeței | Rămâne JavaScript simplu, fără framework și fără build | E codul aprobat, iar Capacitor îl folosește direct |

## Costuri estimate

De verificat în portalul Azure. Prețurile se schimbă.

- **Apple Developer Program:** 99 $/an, obligatoriu pentru App Store.
- **Google Play Console:** 25 $, o singură dată.
- **Azure:** App Service B1, PostgreSQL B1ms și Storage costă aproximativ 25–35 $/lună la preț de listă. Azure for Students oferă 100 $ credit pe an și servicii gratuite 12 luni (posibil inclusiv PostgreSQL B1ms), deci primele luni pot fi aproape gratuite.
- **Firebase** (login + notificări): gratuit la volumul nostru.
- **Traducere** (DeepL sau Azure Translator): planul gratuit ajunge la început.
- **Build iOS în cloud:** Codemagic are plan gratuit cu minute limitate.
- **Domeniu** (opțional): aproximativ 10 €/an.

## Arhitectura țintă

```
Telefon (iOS / Android)
  └─ aplicația Capacitor = codul din wwwroot
       ├─ login ─────────────► Firebase Authentication
       ├─ notificări ◄──────── Firebase Cloud Messaging
       └─ HTTPS + SignalR ───► API .NET 10 (Azure App Service)
                                 ├─ PostgreSQL (date)
                                 ├─ Blob Storage (poze)
                                 ├─ job programat (reamintiri dimineața și la 17:00)
                                 ├─ traducere (DeepL / Azure Translator)
                                 └─ Application Insights (loguri, erori)

Site web mic: politică de confidențialitate, termeni, abonamentul antrenorului (Stripe)
```

## Etape

Fiecare etapă se termină cu ceva care funcționează și poate fi verificat.

### Etapa 0: Pregătire

Scop: un punct de plecare curat, de la care se poate reveni oricând.

- [x] `.gitignore` pentru .NET; cele 56 de fișiere generate din `bin/` și `obj/` nu mai sunt urmărite de git.
- [x] Commit cu starea actuală (demo-ul aerisit, fix-ul de cache, planul) și tag `demo-hackathon`, ca să se poată reveni oricând la demo.
- [x] Repository privat [`AvramPaul/MyFitnessCoach`](https://github.com/AvramPaul/MyFitnessCoach) (remote `origin`); codul urcat cu tot istoricul și tag-ul `demo-hackathon`. Vechiul repository (`sadenis55/fit-together`) nu mai e folosit (remote-ul local redenumit `vechi`).
- [x] Reorganizare: `src/MyFitnessCoach.Api` (serverul, namespace `MyFitnessCoach.Api`), `tests/MyFitnessCoach.Api.Tests` (19 teste pentru regulile de bază), `docs/` (specificația și mockup-urile), plus `MyFitnessCoach.sln` și `.gitattributes`.
- [x] `docs/RUNBOOK.md`: cum pornești proiectul, unde vezi erorile, cum repari problemele frecvente. Se completează la fiecare etapă.
- **Ce faci tu:** creezi repository-ul privat pe GitHub; activezi Azure for Students și verifici ce servicii gratuite include; instalezi Docker Desktop (pentru baza de date locală).
- **Gata când:** codul e în repository-ul tău, iar demo-ul rulează exact ca acum din noua structură.

### Etapa 1: Baza de date reală

- [ ] PostgreSQL local, pornit cu o comandă (Docker), și Entity Framework Core (Npgsql).
- [ ] Tabele pornind de la modelele actuale: utilizatori, antrenori, clienți, alimente, mese și ingrediente, cântăriri, programul de cântăriri, antrenamente cu exerciții și seturi, șabloane de antrenament, rețete cu ingrediente, mese propuse, mesaje.
- [ ] Migrații EF: istoricul schimbărilor de structură, aplicate automat la deploy.
- [ ] `Data/Store.cs` e înlocuit cu servicii pe domenii (mese, greutate, antrenamente, plan, chat). Endpoint-urile rămân la fel, deci interfața nu se schimbă.
- [ ] Ora României peste tot. Serverul de pe Azure rulează în UTC, iar „azi” trebuie calculat în `Europe/Bucharest`.
- [ ] Graficele de forță se calculează din seturile logate, nu mai sunt generate.
- [ ] Datele de demo există doar în modul Development (pentru prezentări și teste), niciodată în producție.
- [ ] Teste automate pentru regulile importante: starea zilei (sub 95% / 95–105% / peste 105%), săptămâna (ținta × 7, ±5%), calcul macro din gramaj, ștergerea unui client.
- **Gata când:** datele rămân după repornire, testele trec, iar interfața arată identic.

### Etapa 2: Conturi, roluri, invitații, securitate

- [ ] Proiect Firebase. Login cu email + parolă, Google și Apple, întâi în browser.
- [ ] API-ul acceptă doar cereri cu token valid. Fiecare endpoint verifică cine face cererea: clientul vede doar datele lui, antrenorul doar clienții lui. Adăugăm teste care încearcă să acceseze date străine.
- [ ] SignalR pe grupuri. Acum orice eveniment ajunge la toată lumea; trebuie să ajungă doar la antrenorul și clientul implicați.
- [ ] Cod de invitație unic pentru fiecare antrenor, regenerabil. Clientul îl introduce la înscriere.
- [ ] Ecrane noi, în același stil: bun venit, autentificare, creare cont, cod de invitație, profil (nume, poză, limbă, delogare, ștergere cont).
- [ ] „Dezactivează accesul” devine „Șterge clientul”. Șterge definitiv datele, pozele și contul clientului, după o confirmare clară. Butonul „Reactivează” dispare.
- [ ] Ștergerea propriului cont din aplicație (obligatorie în App Store și Google Play).
- [ ] Consimțământ explicit pentru datele de sănătate (GDPR) la înscriere, cu link la politica de confidențialitate.
- [ ] Pagina cu cele două telefoane rămâne doar în modul de dezvoltare.
- **Ce faci tu:** creezi proiectul Firebase (te ghidez pas cu pas).
- **Gata când:** doi antrenori și clienții lor folosesc aplicația în paralel și nimeni nu vede datele altcuiva.

### Etapa 3: Rețete și șabloane proprii

- [ ] Fiecare antrenor are propria bibliotecă de rețete și șabloane. Un antrenor nou primește un set de pornire (rețetele și șabloanele din demo), pe care le poate modifica.
- [ ] Ecran „Rețetă nouă / editare”: nume, poză, ingrediente din baza de alimente cu gramaj; macro-urile se calculează automat.
- [ ] Ecran „Șablon nou / editare”: nume, exerciții, unitate (kg / body weight / minute), serii, repetări, greutate.
- [ ] Ștergerea unei rețete sau a unui șablon nu strică planurile deja trimise clienților.
- **Gata când:** un antrenor nou își creează o rețetă și un șablon și le trimite unui client.

### Etapa 4: Poze în cloud

- [ ] Azure Blob Storage, container privat. Local folosim emulatorul Azurite.
- [ ] Upload prin API (poza e deja micșorată pe telefon); afișare prin link temporar.
- [ ] Pozele se șterg odată cu masa sau clientul. Adăugăm poza de profil și poza rețetei.
- **Gata când:** pozele nu mai stau în memoria serverului și nu sunt accesibile fără cont.

### Etapa 5: Serverul pe Azure

- [ ] Resurse: App Service (Linux, .NET 10), PostgreSQL Flexible Server, Storage Account, Application Insights.
- [ ] Secretele (chei, parole) stau doar în setările Azure, niciodată în git.
- [ ] Deploy automat cu GitHub Actions: la fiecare push pe `main` rulează testele, apoi aplicația se publică.
- [ ] Backup automat al bazei de date și o restaurare de probă.
- [ ] Domeniu propriu cu HTTPS (opțional, dar arată profesionist).
- **Ce faci tu:** te loghezi în Azure și aprobi resursele create (și costurile lor).
- **Gata când:** aplicația merge din browserul telefonului, de oriunde, pe HTTPS.

### Etapa 6: Aplicația nativă (Capacitor)

- [ ] Capacitor peste codul din `wwwroot`. Adresa serverului e configurabilă (local / producție).
- [ ] Pluginuri: cameră și galerie, login nativ Google și Apple, notificări push, bara de stare, splash screen.
- [ ] Iconiță și splash screen în stilul aplicației; identificator `ro.myfitnesscoach.app`.
- [ ] Android: build din Android Studio pe Windows, testat pe un telefon real.
- [ ] iOS: build în cloud (Codemagic sau GitHub Actions macOS), testat prin TestFlight.
- **Ce faci tu:** cont Apple Developer (99 $/an), cont Google Play Console (25 $), Android Studio instalat.
- **Gata când:** aplicația rulează nativ pe un Android și pe un iPhone de test.

### Etapa 7: Notificări push și reamintiri

- [ ] Token de notificare pentru fiecare telefon; serverul trimite prin Firebase.
- [ ] Exact tabelul din specificație. Antrenorul: masă postată, cântărire, cântărire ratată. Clientul: dimineața în ziua cântăririi, la 17:00 dacă nu s-a cântărit, mesaj sau comentariu nou.
- [ ] Job programat în server, pe ora României.
- [ ] Atingerea notificării deschide ecranul potrivit.
- **Gata când:** notificările vin cu telefonul blocat, pe ambele platforme.

### Etapa 8: Alimente, traducere, limba engleză

- [ ] Baza mare de alimente: import din Open Food Facts (produse din România) și o listă de alimente generice verificate.
- [ ] Alimentele adăugate de utilizatori sunt disponibile imediat celui care le-a adăugat și sunt marcate „neverificat”.
- [ ] Traducere automată RO↔EN a mesajelor și comentariilor. Păstrăm originalul (butonul „vezi originalul” există deja).
- [ ] Interfața în română și engleză: textele se mută în fișiere de traduceri.
- **Gata când:** un client care vorbește engleză folosește toată aplicația în engleză.

### Etapa 9: Abonamentul antrenorului

- [ ] Planuri, preț și limita de clienți per plan (de decis).
- [ ] Plata se face pe un site web, cu Stripe. Aplicația doar verifică dacă abonamentul e activ și nu are butoane de cumpărare (regulă App Store / Google Play, de reverificat atunci).
- [ ] Ce se întâmplă când abonamentul expiră (de decis).
- **Ce faci tu:** o formă juridică pentru încasări și facturi (PFA sau SRL, de discutat cu un contabil) și un cont Stripe.

### Etapa 10: Publicarea în magazine

- [ ] Politică de confidențialitate și termeni pe un site public, plus o adresă de email de suport.
- [ ] Apple: formularul App Privacy, cont demo pentru recenzenți, capturi de ecran, descriere în română și engleză.
- [ ] Google: formularul Data safety și testarea închisă. Conturile noi de developer trebuie să testeze cu un număr minim de testeri timp de 14 zile înainte de lansare; verificăm regula exactă atunci.
- [ ] Lansare cu primii 1–2 antrenori.
- **Gata când:** aplicația se descarcă din App Store și Google Play.

### Etapa 11: După lansare

- [ ] `docs/RUNBOOK.md` complet: unde vezi erorile, cum revii la versiunea anterioară, cum restaurezi baza de date.
- [ ] Alerte pe email când serverul dă erori sau cade.
- [ ] Actualizări lunare ale pachetelor și ale .NET.

## Reguli de lucru (pentru Claude, în fiecare sesiune)

1. Citește întâi acest fișier. Lucrează doar la etapa curentă, în ordinea sarcinilor.
2. După fiecare sarcină terminată: bifeaz-o aici, actualizează **Stare curentă** și adaugă o linie în **Jurnal**.
3. Fiecare etapă se face pe un branch propriu (de exemplu `etapa-1-baza-de-date`), cu commit-uri mici și mesaje clare, apoi se unește în `main` după verificare. Codul se urcă doar în repository-ul privat al utilizatorului. Deploy sau orice cost, doar cu acordul utilizatorului.
4. Interfața e aprobată. Nu adăuga texte care repetă ce arată deja un grafic, o culoare sau alt ecran. Ecranele noi urmează același stil.
5. Build-ul și testele trebuie să treacă înainte de orice commit. Ecranele schimbate se verifică vizual (capturi).
6. Secretele nu intră niciodată în git.
7. Cod simplu, cu comentarii acolo unde nu e evident ce face. Utilizatorul întreține singur proiectul cu ajutorul AI, deci fiecare bucată trebuie să poată fi înțeleasă și reparată izolat.
8. Explicațiile pentru utilizator: în română, simplu, fără jargon inutil.

## Întrebări deschise

1. Ai un iPhone pe care să testezi prin TestFlight? (necesar la etapa 6)
2. Vrei un domeniu propriu (de exemplu `myfitnesscoach.ro`)? Opțional, la etapa 5.
3. Pentru etapa 9: preț, limita de clienți, ce se întâmplă când abonamentul expiră, forma juridică.

## Jurnal

- **21.11.2026:** Demo finalizat și aerisit, fix pentru cache-ul browserului. Creat acest plan.
- **21.11.2026:** Răspunsuri primite: fără Mac (iOS în cloud), repository privat nou pe contul utilizatorului, Firebase confirmat, rețete și șabloane proprii (etapa 3 nouă), ștergerea clientului include contul. Adăugat `.gitignore`; `bin/` și `obj/` scoase din git. Commit + tag `demo-hackathon`.
- **22.11.2026:** Proiect reorganizat (`src/`, `tests/`, `docs/`), soluție, 19 teste care trec, RUNBOOK. Demo-ul verificat: rulează identic din noua structură. Rămas din etapa 0: repository-ul privat (îl creează utilizatorul), Azure for Students, Docker Desktop.
- **22.11.2026:** Codul urcat în repository-ul privat `AvramPaul/MyFitnessCoach` (branch `main` + tag `demo-hackathon`).
