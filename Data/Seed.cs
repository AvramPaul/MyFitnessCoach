namespace FitTogether.Data;

/// <summary>
/// Date demo coerente, generate relativ la momentul pornirii:
/// mesele de azi apar doar dacă ora lor a trecut, totalurile se calculează din ingrediente,
/// iar inelele/săptămânile se calculează din mese. Nimic nu e „pus de mână”.
/// </summary>
public static class Seed
{
    record Tpl(string Key, string Name, string Photo, string Type, (string Food, int G)[] Items);
    public record ExT(string Name, string Unit, int Sets, int Reps, double Kg, int Min = 0);
    public record WTpl(string Title, string Photo, ExT[] Ex);

    static readonly Tpl[] Templates =
    [
        new("ovaz", "Ovăz cu banană și zmeură", "ovaz-banana", "mic-dejun",
            [("Fulgi de ovăz", 70), ("Lapte 1,5%", 200), ("Banană", 80), ("Zmeură", 40), ("Semințe de chia", 10)]),
        new("iaurt-granola", "Iaurt grecesc cu granola și fructe de pădure", "iaurt-granola", "mic-dejun",
            [("Iaurt grecesc 2%", 250), ("Granola", 40), ("Fructe de pădure (mix)", 80)]),
        new("toast-avocado", "Toast cu avocado și ouă poșate", "toast-avocado-ou", "mic-dejun",
            [("Pâine integrală", 70), ("Avocado", 60), ("Ou întreg", 110), ("Rucola", 20)]),
        new("omleta", "Omletă cu avocado și salată", "oua-avocado-salata", "mic-dejun",
            [("Ou întreg", 165), ("Avocado", 50), ("Salată verde", 60), ("Roșii cherry", 60), ("Măsline", 20)]),
        new("toast-pb", "Toast cu unt de arahide și banană", "toast-unt-arahide", "gustare",
            [("Pâine integrală", 70), ("Unt de arahide", 20), ("Banană", 80)]),
        new("pui-orez", "Pui cu orez și broccoli", "pui-orez-broccoli", "pranz",
            [("Piept de pui (gătit)", 170), ("Orez basmati fiert", 200), ("Broccoli", 100), ("Dovlecel", 80), ("Ulei de măsline", 5)]),
        new("teriyaki", "Pui teriyaki cu salată de varză", "pui-teriyaki", "pranz",
            [("Pulpă de pui fără piele (gătită)", 180), ("Sos teriyaki", 25), ("Varză albă", 100), ("Morcov", 50), ("Spanac", 30)]),
        new("quinoa", "Bol cu quinoa și pui", "bol-quinoa-pui", "pranz",
            [("Quinoa fiartă", 150), ("Piept de pui (gătit)", 130), ("Dovleac copt", 80), ("Roșii cherry", 50), ("Ulei de măsline", 10)]),
        new("caesar", "Salată Caesar cu pui", "salata-caesar", "pranz",
            [("Piept de pui (gătit)", 150), ("Salată romană", 120), ("Crutoane", 25), ("Parmezan", 15), ("Sos Caesar", 25), ("Ou întreg", 55)]),
        new("poke", "Poke bowl cu creveți", "poke-creveti", "pranz",
            [("Orez basmati fiert", 150), ("Creveți (gătiți)", 120), ("Edamame", 40), ("Morcov", 30), ("Spanac", 20), ("Arahide", 10)]),
        new("paste", "Paste integrale bolognese", "paste-bolognese", "cina",
            [("Paste integrale fierte", 220), ("Carne tocată de vită 5%", 120), ("Sos de roșii", 120), ("Parmezan", 10)]),
        new("pui-cartof", "Pui cu cartof dulce", "pui-cartof-dulce", "cina",
            [("Piept de pui (gătit)", 180), ("Cartof dulce copt", 200), ("Ulei de măsline", 5)]),
        new("somon", "Somon cu sparanghel", "somon-sparanghel", "cina",
            [("Somon atlantic", 150), ("Sparanghel", 200), ("Ulei de măsline", 10)]),
        new("somon-quinoa", "Somon cu fasole verde și quinoa", "somon-fasole-quinoa", "cina",
            [("Somon atlantic", 160), ("Fasole verde", 120), ("Quinoa fiartă", 100)]),
        new("vita", "Vită la grătar cu legume", "vita-legume", "cina",
            [("Friptură de vită (mușchi)", 180), ("Legume la grătar", 200), ("Cartofi fierți", 150)]),
        new("shake", "Shake proteic", "shake-proteic", "gustare",
            [("Proteină whey", 30), ("Lapte 1,5%", 250), ("Banană", 60)]),
        new("iaurt-miere", "Iaurt cu granola și miere", "iaurt-miere", "gustare",
            [("Iaurt grecesc 2%", 200), ("Granola", 30), ("Căpșuni", 50), ("Miere", 10)]),
        new("migdale", "Migdale", "migdale", "gustare", [("Migdale", 35)]),
        new("croissant", "Croissant și cappuccino", "croissant-cappuccino", "gustare",
            [("Croissant cu ciocolată", 90), ("Cappuccino", 250)]),
    ];

    /// <summary>Rețetele din biblioteca antrenorului (14).</summary>
    static readonly string[] Library =
        ["ovaz", "iaurt-granola", "toast-avocado", "omleta", "pui-orez", "quinoa", "caesar", "poke",
         "paste", "pui-cartof", "somon", "somon-quinoa", "shake", "iaurt-miere"];

    public static readonly Dictionary<string, WTpl> WorkoutTemplates = new()
    {
        ["push"] = new("Push", "/img/gym/push.jpg",
        [
            new("Împins la piept cu bara", "kg", 4, 8, 80), new("Împins înclinat cu gantere", "kg", 3, 10, 26),
            new("Presă militară", "kg", 3, 8, 45), new("Fluturări laterale", "kg", 3, 15, 10),
            new("Flotări la paralele", "bw", 3, 10, 0), new("Bandă – mers în pantă", "min", 1, 0, 0, 12),
        ]),
        ["pull"] = new("Pull", "/img/gym/pull.jpg",
        [
            new("Tracțiuni", "bw", 4, 6, 0), new("Ramat cu bara", "kg", 4, 8, 70),
            new("Helcometru vertical", "kg", 3, 10, 60), new("Face pull", "kg", 3, 15, 20),
            new("Flexii cu bara", "kg", 3, 10, 30),
        ]),
        ["legs"] = new("Legs", "/img/gym/legs.jpg",
        [
            new("Genuflexiuni", "kg", 4, 8, 100), new("Îndreptări românești", "kg", 3, 10, 80),
            new("Fandări bulgărești", "kg", 3, 10, 20), new("Extensii la aparat", "kg", 3, 12, 45),
            new("Ridicări pe vârfuri", "kg", 4, 15, 60), new("Bicicletă", "min", 1, 0, 0, 15),
        ]),
        ["fesieri"] = new("Fesieri", "/img/gym/fesieri.jpg",
        [
            new("Hip thrust", "kg", 4, 10, 70), new("Îndreptări românești", "kg", 3, 10, 40),
            new("Abducții la aparat", "kg", 3, 15, 35), new("Kickback la helcometru", "kg", 3, 12, 15),
            new("Stepper", "min", 1, 0, 0, 15),
        ]),
        ["upper"] = new("Upper", "/img/gym/upper.jpg",
        [
            new("Împins cu gantere", "kg", 3, 10, 14), new("Helcometru vertical", "kg", 3, 12, 35),
            new("Presă umeri cu gantere", "kg", 3, 10, 8), new("Ramat cu ganteră", "kg", 3, 10, 12),
            new("Plank", "min", 3, 0, 0, 1),
        ]),
    };

    static int Iso(DateOnly d) => d.DayOfWeek == DayOfWeek.Sunday ? 7 : (int)d.DayOfWeek;

    public static void Fill(Store s, DateTime now)
    {
        var today = DateOnly.FromDateTime(now);
        DateTime At(int dayOffset, int h, int m) => today.AddDays(dayOffset).ToDateTime(new TimeOnly(h, m));

        s.Coach = new Coach
        {
            Id = "alex", Name = "Alex Teodorescu", FirstName = "Alex",
            Photo = "/img/people/alex.jpg", InviteCode = "FIT-7Q2K",
        };

        s.Clients =
        [
            new() { Id = "andrei", Name = "Andrei Popescu", FirstName = "Andrei", Photo = "/img/people/andrei.jpg",
                Goal = "Masă musculară", Since = today.AddDays(-80), Targets = new(2600, 180, 300, 75),
                StartKg = 78.6, GoalKg = 84, WeighInDays = [Iso(today), Iso(today.AddDays(3))] },
            new() { Id = "maria", Name = "Maria Ionescu", FirstName = "Maria", Photo = "/img/people/maria.jpg",
                Goal = "Slăbire", Since = today.AddDays(-120), Targets = new(1700, 130, 160, 60),
                StartKg = 72.4, GoalKg = 64, WeighInDays = [Iso(today)] },
            new() { Id = "denis", Name = "Denis Stoica", FirstName = "Denis", Photo = "/img/people/denis.jpg",
                Goal = "Slăbire", Since = today.AddDays(-150), Targets = new(2100, 170, 190, 72),
                StartKg = 97.8, GoalKg = 86, WeighInDays = [Iso(today), Iso(today.AddDays(4))], DietOnly = true },
            new() { Id = "angelica", Name = "Angelica Radu", FirstName = "Angelica", Photo = "/img/people/angelica.jpg",
                Goal = "Tonifiere", Since = today.AddDays(-95), Targets = new(1800, 125, 195, 58),
                StartKg = 61.8, GoalKg = 58, WeighInDays = [Iso(today.AddDays(1))] },
            new() { Id = "paul", Name = "Paul Munteanu", FirstName = "Paul", Photo = "/img/people/paul.jpg",
                Goal = "Forță", Lang = "en", Since = today.AddDays(-60), Targets = new(2800, 175, 340, 82),
                StartKg = 84.6, GoalKg = 86, WeighInDays = [Iso(today.AddDays(2)), Iso(today.AddDays(5))] },
            new() { Id = "serban", Name = "Șerban Dumitru", FirstName = "Șerban", Photo = "/img/people/serban.jpg",
                Goal = "Recompoziție", Since = today.AddDays(-45), Targets = new(2300, 170, 240, 72),
                StartKg = 88.0, GoalKg = 82, WeighInDays = [Iso(today.AddDays(4))] },
        ];

        // ——— Mese ———
        var tpl = Templates.ToDictionary(t => t.Key);
        // Rotație per client: [mic dejun], [prânz], [gustare], [cină]
        var menus = new Dictionary<string, string[][]>
        {
            ["andrei"] = [["ovaz", "toast-avocado", "ovaz", "toast-pb"], ["pui-orez", "paste", "quinoa", "pui-cartof"], ["shake", "iaurt-miere"], ["somon-quinoa", "vita", "paste", "somon"]],
            ["maria"] = [["iaurt-granola", "omleta"], ["caesar", "quinoa", "poke"], ["migdale", "iaurt-miere"], ["somon", "omleta", "pui-cartof"]],
            ["denis"] = [["omleta", "toast-avocado"], ["pui-orez", "pui-cartof", "caesar"], ["shake"], ["vita", "somon-quinoa"]],
            ["angelica"] = [["iaurt-granola", "toast-pb"], ["poke", "caesar", "quinoa"], ["migdale", "iaurt-miere"], ["somon", "paste"]],
            ["paul"] = [["ovaz", "toast-pb"], ["paste", "pui-orez", "teriyaki"], ["shake", "toast-pb"], ["vita", "pui-cartof", "somon-quinoa"]],
            ["serban"] = [["toast-avocado", "omleta"], ["teriyaki", "pui-orez", "poke"], ["iaurt-miere", "shake"], ["somon", "vita"]],
        };
        // Cât de aproape de țintă a fost fiecare zi trecută (zilele -6 … -1).
        var adherence = new Dictionary<string, double[]>
        {
            ["andrei"] = [1.04, 0.98, 1.09, 0.91, 1.01, 0.97],
            ["maria"] = [0.97, 1.02, 0.93, 1.00, 1.06, 0.98],
            ["denis"] = [0.99, 0.96, 1.01, 0.97, 1.03, 0.92],
            ["angelica"] = [1.12, 0.96, 0.90, 1.08, 1.00, 0.95],
            ["paul"] = [0.93, 0.88, 1.00, 0.96, 1.02, 0.97],
            ["serban"] = [1.00, 1.04, 0.97, 0.89, 1.00, 1.01],
        };
        // Ore obișnuite: mic dejun, prânz, gustare, cină
        var clock = new Dictionary<string, (int H, int M)[]>
        {
            ["andrei"] = [(8, 5), (12, 40), (16, 15), (19, 40)],
            ["maria"] = [(7, 45), (13, 10), (16, 40), (19, 10)],
            ["denis"] = [(8, 30), (13, 30), (17, 0), (20, 0)],
            ["angelica"] = [(9, 0), (12, 20), (15, 50), (19, 30)],
            ["paul"] = [(7, 30), (12, 0), (16, 0), (20, 15)],
            ["serban"] = [(8, 15), (13, 0), (17, 20), (19, 50)],
        };
        string[] types = ["mic-dejun", "pranz", "gustare", "cina"];
        var rnd = new Random(7);
        s.Meals = [];
        int mealNo = 0;

        foreach (var c in s.Clients)
        {
            for (int off = -6; off <= 0; off++)
            {
                var picks = new Tpl[4];
                for (int k = 0; k < 4; k++)
                {
                    var list = menus[c.Id][k];
                    picks[k] = tpl[list[(off + 70 + k) % list.Length]];
                }
                if (off == 0 && c.Id == "angelica") picks[2] = tpl["croissant"];
                if (off == 0 && c.Id == "andrei") { picks[0] = tpl["ovaz"]; picks[1] = tpl["pui-orez"]; picks[2] = tpl["shake"]; }

                double factor = off < 0 ? adherence[c.Id][off + 6] : 1.0;
                double baseKcal = picks.Sum(KcalOf);
                double scale = factor * c.Targets.Kcal / baseKcal;

                for (int k = 0; k < 4; k++)
                {
                    var (h, m) = clock[c.Id][k];
                    var at = At(off, h, m).AddMinutes(rnd.Next(-14, 15));
                    if (off == 0)
                    {
                        if (at > now) continue;
                        if (c.Id == "andrei" && types[k] == "cina") continue; // cina se loghează live în demo
                    }
                    s.Meals.Add(new Meal
                    {
                        Id = $"m{++mealNo}",
                        ClientId = c.Id,
                        Type = types[k],
                        Title = picks[k].Name,
                        At = at,
                        Photo = $"/img/meals/{picks[k].Photo}.jpg",
                        Items = picks[k].Items.Select(i => MealItem.From(Foods.Get(i.Food), Round(i.G * scale))).ToList(),
                    });
                }
            }
        }

        // ——— Cântăriri ———
        var currentKg = new Dictionary<string, double>
        {
            ["andrei"] = 81.4, ["maria"] = 68.1, ["denis"] = 91.2, ["angelica"] = 59.9, ["paul"] = 85.4, ["serban"] = 85.3,
        };
        s.Weights = [];
        foreach (var c in s.Clients)
        {
            var dates = new List<DateOnly>();
            for (var d = c.Since; d <= today; d = d.AddDays(1))
                if (c.WeighInDays.Contains(Iso(d))) dates.Add(d);
            // Andrei și Maria au cântărire programată azi, dar nu s-au cântărit încă.
            if (c.Id is "andrei" or "maria") dates.Remove(today);
            if (c.Id == "denis" && now < At(0, 7, 40)) dates.Remove(today);
            if (dates.Count == 0) continue;

            double start = c.StartKg, end = currentKg[c.Id];
            for (int i = 0; i < dates.Count; i++)
            {
                double t = dates.Count == 1 ? 1 : (double)i / (dates.Count - 1);
                double trend = start + (end - start) * (end < start ? Math.Pow(t, 0.8) : t);
                double noise = i == 0 || i == dates.Count - 1 ? 0 : Math.Sin(i * 2.7 + c.Id.Length) * 0.3;
                double kg = Math.Round(trend + noise, 1);
                if (c.Id == "denis" && i == dates.Count - 2) kg = 91.8;
                var time = dates[i] == today ? new TimeOnly(7, 40) : new TimeOnly(7, 10 + (i * 7) % 40);
                s.Weights.Add(new WeightEntry { ClientId = c.Id, At = dates[i].ToDateTime(time), Kg = kg });
            }
        }

        // ——— Antrenamente ———
        var schedule = new Dictionary<string, Dictionary<int, string>>
        {
            ["andrei"] = new() { [-6] = "pull", [-5] = "legs", [-3] = "push", [-2] = "pull", [-1] = "legs", [0] = "push", [2] = "pull", [3] = "legs", [5] = "push", [6] = "pull" },
            ["paul"] = new() { [-5] = "push", [-4] = "pull", [-3] = "legs", [-1] = "push", [0] = "pull", [1] = "legs", [3] = "push", [4] = "pull", [5] = "legs" },
            ["maria"] = new() { [-6] = "upper", [-4] = "fesieri", [-2] = "upper", [0] = "fesieri", [2] = "upper", [4] = "fesieri", [6] = "upper" },
            ["angelica"] = new() { [-5] = "fesieri", [-3] = "upper", [-1] = "fesieri", [1] = "upper", [3] = "fesieri", [5] = "upper" },
            ["serban"] = new() { [-5] = "legs", [-3] = "upper", [-2] = "legs", [0] = "upper", [1] = "legs", [3] = "upper", [5] = "legs" },
        };
        var strengthScale = StrengthScale;
        s.Workouts = [];
        int wNo = 0;
        foreach (var (clientId, days) in schedule)
        {
            foreach (var (off, key) in days)
            {
                bool done = off < 0 || (off == 0 && clientId == "paul" && now.Hour >= 8);
                if (clientId == "maria" && off == -4) done = false; // un antrenament ratat
                s.Workouts.Add(Build(clientId, today.AddDays(off), key, strengthScale[clientId], done, $"w{++wNo}",
                    clientId == "andrei" && off == 0 ? "Încălzire: 2 serii ușoare la împins înainte de seriile de lucru." : null));
            }
        }

        // ——— Grafice de forță (ultimele 12 săptămâni) ———
        var weekStart = today.AddDays(-(Iso(today) - 1));
        s.Strength = new()
        {
            ["andrei"] = [Series("Împins la piept cu bara", 67.5, 80), Series("Genuflexiuni", 85, 100), Series("Ramat cu bara", 57.5, 70)],
            ["paul"] = [Series("Împins la piept cu bara", 85, 100), Series("Genuflexiuni", 110, 130), Series("Ramat cu bara", 70, 82.5)],
            ["maria"] = [Series("Hip thrust", 40, 70), Series("Îndreptări românești", 25, 40)],
            ["angelica"] = [Series("Hip thrust", 55, 77.5), Series("Îndreptări românești", 30, 45)],
            ["serban"] = [Series("Genuflexiuni", 80, 92.5), Series("Împins cu gantere", 12, 16)],
            ["denis"] = [],
        };
        StrengthSeries Series(string ex, double from, double to)
        {
            var pts = new List<StrengthPoint>();
            int sets = 3; double prev = 0;
            for (int w = -11; w <= 0; w++)
            {
                double t = (w + 11) / 11.0;
                double kg = RoundTo(from + (to - from) * Math.Pow(t, 0.9), to < 30 ? 1 : 2.5);
                sets = kg > prev ? 2 + (w & 1) : Math.Min(4, sets + 1);
                prev = kg;
                pts.Add(new StrengthPoint(weekStart.AddDays(7 * w), kg, sets));
            }
            return new StrengthSeries(ex, pts);
        }

        // ——— Rețete și mese propuse ———
        s.Recipes = Library.Select(k => tpl[k]).Select(t => new Recipe
        {
            Id = t.Key, Name = t.Name, Photo = $"/img/meals/{t.Photo}.jpg", Type = t.Type,
            Items = t.Items.Select(i => MealItem.From(Foods.Get(i.Food), i.G)).ToList(),
        }).ToList();

        var planRotation = new Dictionary<string, string[]>
        {
            ["mic-dejun"] = ["ovaz", "iaurt-granola", "toast-avocado", "omleta"],
            ["pranz"] = ["pui-orez", "quinoa", "caesar", "poke", "paste"],
            ["cina"] = ["somon", "somon-quinoa", "pui-cartof", "paste"],
            ["gustare"] = ["iaurt-miere", "shake"],
        };
        s.Plans = [];
        for (int i = 0; i < 7; i++)
        {
            var date = weekStart.AddDays(i);
            for (int ci = 0; ci < s.Clients.Count; ci++)
            {
                var c = s.Clients[ci];
                foreach (var (type, rot) in planRotation)
                {
                    bool include = (i * 3 + ci * 5 + type.Length) % 4 != 0;
                    if (!include) continue;
                    s.Plans.Add(new MealPlan { ClientId = c.Id, Date = date, Type = type, RecipeId = rot[(i + ci + type.Length) % rot.Length] });
                }
            }
        }
        // Planul lui Andrei pentru azi e fix (folosit în demo).
        s.Plans.RemoveAll(p => p.ClientId == "andrei" && p.Date == today);
        s.Plans.AddRange(
        [
            new() { ClientId = "andrei", Date = today, Type = "mic-dejun", RecipeId = "ovaz" },
            new() { ClientId = "andrei", Date = today, Type = "pranz", RecipeId = "pui-orez" },
            new() { ClientId = "andrei", Date = today, Type = "gustare", RecipeId = "iaurt-miere" },
            new() { ClientId = "andrei", Date = today, Type = "cina", RecipeId = "somon" },
        ]);

        // ——— Mesaje ———
        s.Messages = [];
        int msgNo = 0;
        void Msg(string clientId, string from, DateTime at, string text, string? mealId = null, bool read = true,
                 string? translated = null, string? lang = null) =>
            s.Messages.Add(new Message
            {
                Id = $"x{++msgNo}", ClientId = clientId, From = from, At = at, Text = text,
                MealId = mealId, Read = read, Translated = translated, Lang = lang,
            });

        string? MealOf(string clientId, int off, string type) => s.Meals
            .FirstOrDefault(m => m.ClientId == clientId && DateOnly.FromDateTime(m.At) == today.AddDays(off) && m.Type == type)?.Id;

        Msg("andrei", "coach", At(-2, 20, 2), "Arată foarte bine. Data viitoare pune și o mână de legume lângă, pentru fibre.", MealOf("andrei", -2, "cina"));
        Msg("andrei", "client", At(-2, 20, 9), "Ok, mersi! Mâine am ședință la 7, ajung la sală pe la 8.");
        Msg("andrei", "coach", At(-1, 9, 12), "Perfect. Azi ai Legs. La genuflexiuni încearcă ultimele două serii cu 2,5 kg în plus.");
        Msg("andrei", "client", At(-1, 18, 41), "Gata, am bifat tot. La ultima serie am reușit doar 6 repetări.");
        Msg("andrei", "coach", At(-1, 18, 47), "E normal. Rămânem la aceeași greutate până faci 4×8 curat.");
        Msg("andrei", "coach", At(-1, 21, 10), "Mâine: Push și cântărire dimineața, înainte de micul dejun.", read: false);

        Msg("maria", "coach", At(-1, 19, 30), "Super săptămână până acum. Ține-o tot așa!");
        if (now >= At(0, 13, 25))
            Msg("maria", "client", At(0, 13, 25), "Azi am mâncat în oraș la prânz, am estimat gramajele cât am putut.", read: false);
        else
            Msg("maria", "client", At(-1, 20, 5), "Mersi! Mâine am o zi aglomerată, dar îmi iau mâncarea la pachet.", read: false);

        Msg("denis", "client", At(-1, 20, 15), "Mâine dimineață mă cântăresc. Sper să fi coborât sub 92.");
        Msg("denis", "coach", At(-1, 20, 21), "Sigur ai coborât, ai fost foarte consecvent săptămâna asta.");

        var croissant = MealOf("angelica", 0, "gustare");
        if (croissant != null)
            Msg("angelica", "coach", At(0, 16, 12), "Croissantul e ok din când în când. Diseară ceva slab: pește sau pui cu legume, fără garnitură.", croissant);
        else
            Msg("angelica", "coach", At(-1, 12, 50), "Prânzul arată excelent, exact porția potrivită.", MealOf("angelica", -1, "pranz"));
        Msg("angelica", "client", At(-1, 21, 0), "Mulțumesc! Mâine merg la sală dimineață.");

        Msg("paul", "client", At(-1, 18, 30), "Hit 100 kg on bench for 3 reps today!", read: true,
            translated: "Azi am ridicat 100 kg la împins la piept, 3 repetări!", lang: "en");
        Msg("paul", "coach", At(-1, 18, 52), "Bravo! Săptămâna viitoare încercăm 3×3 la 100 kg.",
            translated: "Well done! Next week we'll try 3×3 at 100 kg.", lang: "ro");

        Msg("serban", "client", At(-1, 12, 5), "Pot muta antrenamentul de joi pe vineri? Am o deplasare.", read: false);

        // ——— Evoluția numărului de clienți (30 de zile) ———
        s.ClientHistory = Enumerable.Range(0, 30).Select(i => i < 9 ? 4 : i < 21 ? 5 : 6).ToList();
    }

    static Workout Build(string clientId, DateOnly date, string key, double scale, bool done, string id, string? note)
    {
        var t = WorkoutTemplates[key];
        return new Workout
        {
            Id = id, ClientId = clientId, Date = date, Template = key, Title = t.Title, Photo = t.Photo, Note = note,
            Exercises = t.Ex.Select((e, ei) =>
            {
                double kg = e.Unit == "kg" ? RoundTo(e.Kg * scale, e.Kg < 30 ? 1 : 2.5) : 0;
                return new Exercise
                {
                    Name = e.Name, Unit = e.Unit, PlanSets = e.Sets, PlanReps = e.Reps, PlanKg = kg, PlanMin = e.Min,
                    Sets = Enumerable.Range(0, e.Sets).Select(si => new WorkoutSet
                    {
                        Reps = done && si == e.Sets - 1 && ei == 0 ? Math.Max(1, e.Reps - 2) : e.Reps,
                        Kg = kg, Min = e.Min, Done = done,
                    }).ToList(),
                };
            }).ToList(),
        };
    }

    static readonly Dictionary<string, double> StrengthScale =
        new() { ["andrei"] = 1.0, ["paul"] = 1.2, ["maria"] = 1.0, ["angelica"] = 1.1, ["serban"] = 0.95 };

    public static Workout FromTemplate(string clientId, DateOnly date, string key, string id) =>
        Build(clientId, date, key, StrengthScale.GetValueOrDefault(clientId, 1.0), false, id, null);

    static double KcalOf(Tpl t) => t.Items.Sum(i => Foods.Get(i.Food).Kcal * i.G / 100.0);

    /// <summary>Gramaje „omenești”: multipli de 5 (minim 5).</summary>
    static int Round(double g) => Math.Max(5, (int)(Math.Round(g / 5.0) * 5));

    static double RoundTo(double v, double step) => Math.Round(v / step) * step;
}
