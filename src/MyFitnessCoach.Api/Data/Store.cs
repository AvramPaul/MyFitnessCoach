using System.Globalization;
using System.Text.Json;

namespace MyFitnessCoach.Api.Data;

/// <summary>Notificare tip banner afișată pe telefonul destinatarului.</summary>
public record Banner(string To, string ClientId, string Title, string Body, string? Image, string? Avatar, string? Link);

/// <summary>Eveniment trimis live (SignalR) către ambele aplicații după orice modificare.</summary>
public record Change(string Kind, string ClientId, Banner? Banner = null, object? Data = null);

/// <summary>
/// „Baza de date” a demo-ului: totul stă în memorie și se regenerează la pornire (sau la reset).
/// Citirile se serializează în interiorul lock-ului, ca să nu se suprapună cu modificările live.
/// </summary>
public sealed class Store
{
    readonly object _gate = new();
    static readonly CultureInfo Ro = CultureInfo.GetCultureInfo("ro-RO");
    static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public Coach Coach { get; set; } = new();
    public List<Client> Clients { get; set; } = [];
    public List<Meal> Meals { get; set; } = [];
    public List<WeightEntry> Weights { get; set; } = [];
    public List<Workout> Workouts { get; set; } = [];
    public List<Recipe> Recipes { get; set; } = [];
    public List<MealPlan> Plans { get; set; } = [];
    public List<Message> Messages { get; set; } = [];
    public Dictionary<string, List<StrengthSeries>> Strength { get; set; } = [];
    public List<int> ClientHistory { get; set; } = [];
    readonly Dictionary<string, (byte[] Data, string Type)> _photos = [];

    public Store() => Reset();

    public void Reset()
    {
        lock (_gate)
        {
            _photos.Clear();
            Seed.Fill(this, DateTime.Now);
        }
    }

    // ———————————————————— helpers ————————————————————

    static DateOnly Today => DateOnly.FromDateTime(DateTime.Now);
    static DateOnly DateOf(DateTime t) => DateOnly.FromDateTime(t);
    static int Iso(DateOnly d) => d.DayOfWeek == DayOfWeek.Sunday ? 7 : (int)d.DayOfWeek;
    static DateOnly WeekStart(DateOnly d) => d.AddDays(-(Iso(d) - 1));
    static string N0(double v) => v.ToString("N0", Ro);
    static string N1(double v) => v.ToString("0.0", Ro);

    /// <summary>Sub 95% = galben, 95–105% = verde, peste 105% = roșu.</summary>
    public static string Status(int kcal, int target)
    {
        if (target <= 0) return "under";
        double r = (double)kcal / target;
        return r < 0.95 ? "under" : r <= 1.05 ? "ok" : "over";
    }

    static string Article(string type) => type switch
    {
        "mic-dejun" => "micul dejun",
        "pranz" => "prânzul",
        "cina" => "cina",
        "gustare" => "o gustare",
        _ => "o masă extra",
    };

    static string TypeName(string type) => type switch
    {
        "mic-dejun" => "mic dejun",
        "pranz" => "prânz",
        "cina" => "cină",
        "gustare" => "gustare",
        _ => "masă extra",
    };

    static string When(DateOnly d)
    {
        var t = Today;
        if (d == t) return "azi";
        if (d == t.AddDays(1)) return "mâine";
        return Ro.DateTimeFormat.GetDayName(d.DayOfWeek);
    }

    Client? FindClient(string id) => Clients.FirstOrDefault(c => c.Id == id);

    public record Day(DateOnly Date, int Kcal, int P, int C, int F, int Target, string? Status, int Meals);

    Day DayOf(Client c, DateOnly d)
    {
        var ms = Meals.Where(m => m.ClientId == c.Id && DateOf(m.At) == d).ToList();
        int kcal = ms.Sum(m => m.Kcal);
        return new Day(d, kcal, ms.Sum(m => m.P), ms.Sum(m => m.C), ms.Sum(m => m.F), c.Targets.Kcal,
            ms.Count == 0 ? null : Status(kcal, c.Targets.Kcal), ms.Count);
    }

    object WeekOf(Client c)
    {
        var today = Today;
        var start = WeekStart(today);
        var days = Enumerable.Range(0, 7).Select(i => start.AddDays(i))
            .Select(d => (date: d, day: d <= today ? DayOf(c, d) : null)).ToList();
        var complete = days.Where(x => x.day != null && x.date < today && x.day.Meals > 0).Select(x => x.day!).ToList();
        return new
        {
            days = days.Select(x => new
            {
                x.date,
                isToday = x.date == today,
                isFuture = x.date > today,
                kcal = x.day?.Kcal ?? 0,
                status = x.day?.Status,
            }).ToList(),
            total = days.Sum(x => x.day?.Kcal ?? 0),
            target = c.Targets.WeeklyKcal,
            // Ritmul săptămânii: media zilelor încheiate față de ținta zilnică (±5% = verde).
            pace = complete.Count == 0 ? null : Status((int)complete.Average(x => x.Kcal), c.Targets.Kcal),
            completeDays = complete.Count,
        };
    }

    object WeighInOf(Client c)
    {
        var today = Today;
        bool scheduledToday = c.WeighInDays.Contains(Iso(today));
        bool doneToday = Weights.Any(w => w.ClientId == c.Id && DateOf(w.At) == today);
        DateOnly? next = null;
        for (int i = scheduledToday && !doneToday ? 0 : 1; i <= 7; i++)
        {
            var d = today.AddDays(i);
            if (c.WeighInDays.Contains(Iso(d))) { next = d; break; }
        }
        return new
        {
            days = c.WeighInDays.OrderBy(x => x).ToList(),
            scheduledToday,
            doneToday,
            // Cântărirea e valabilă toată ziua; la 17:00 clientul primește doar o reamintire.
            reminderSent = scheduledToday && !doneToday && DateTime.Now.Hour >= 17,
            next,
        };
    }

    object ClientInfo(Client c)
    {
        var last = Weights.Where(w => w.ClientId == c.Id).OrderBy(w => w.At).LastOrDefault();
        return new
        {
            c.Id, c.Name, c.FirstName, c.Photo, c.Goal, c.Since, c.Lang, c.StartKg, c.GoalKg, c.DietOnly, c.Active,
            targets = new { c.Targets.Kcal, c.Targets.P, c.Targets.C, c.Targets.F, weekly = c.Targets.WeeklyKcal },
            currentKg = last?.Kg ?? c.StartKg,
        };
    }

    object? MealBrief(string? mealId)
    {
        var m = mealId == null ? null : Meals.FirstOrDefault(x => x.Id == mealId);
        return m == null ? null : new { m.Id, m.Type, m.Title, m.Photo, m.Kcal, m.At };
    }

    object MessageDto(Message m) => new
    {
        m.Id, m.From, m.Text, m.Translated, m.Lang, m.At, m.Read, meal = MealBrief(m.MealId),
    };

    // ———————————————————— citiri ————————————————————

    public string? ClientJson(string id)
    {
        lock (_gate)
        {
            var c = FindClient(id);
            if (c == null) return null;
            var today = Today;
            var ws = WeekStart(today);
            return JsonSerializer.Serialize(new
            {
                now = DateTime.Now,
                me = ClientInfo(c),
                coach = new { Coach.Id, Coach.Name, Coach.FirstName, Coach.Photo },
                today = DayOf(c, today),
                week = WeekOf(c),
                meals = Meals.Where(m => m.ClientId == id && DateOf(m.At) >= today.AddDays(-6))
                    .OrderByDescending(m => m.At).ToList(),
                plans = Plans.Where(p => p.ClientId == id && p.Date >= ws && p.Date < ws.AddDays(7))
                    .Select(p => new { p.Date, p.Type, recipe = Recipes.First(r => r.Id == p.RecipeId) }).ToList(),
                workouts = Workouts.Where(w => w.ClientId == id).OrderBy(w => w.Date).ToList(),
                weights = Weights.Where(w => w.ClientId == id).OrderBy(w => w.At).Select(w => new { w.At, w.Kg }).ToList(),
                weighIn = WeighInOf(c),
                strength = Strength.GetValueOrDefault(id) ?? [],
                messages = Messages.Where(m => m.ClientId == id).OrderBy(m => m.At).Select(MessageDto).ToList(),
            }, Json);
        }
    }

    public string CoachJson()
    {
        lock (_gate)
        {
            var now = DateTime.Now;
            var today = Today;
            var ws = WeekStart(today);
            var todayDays = Clients.ToDictionary(c => c.Id, c => DayOf(c, today));

            var clients = Clients.Select(c =>
            {
                var series = Weights.Where(w => w.ClientId == c.Id).OrderBy(w => w.At).ToList();
                var last = series.LastOrDefault();
                var prev = series.Count > 1 ? series[^2] : null;
                var tw = Workouts.FirstOrDefault(w => w.ClientId == c.Id && w.Date == today);
                return new
                {
                    info = ClientInfo(c),
                    today = todayDays[c.Id],
                    weight = last == null ? null : new
                    {
                        last.Kg, last.At,
                        delta = prev == null ? (double?)null : Math.Round(last.Kg - prev.Kg, 1),
                        fromStart = Math.Round(last.Kg - c.StartKg, 1),
                    },
                    weights = series.Select(w => new { w.At, w.Kg }).ToList(),
                    weighIn = WeighInOf(c),
                    workoutToday = tw == null ? null : new { tw.Id, tw.Title, tw.Completed, tw.Started },
                    unread = Messages.Count(m => m.ClientId == c.Id && m.From == "client" && !m.Read),
                };
            }).ToList();

            var activity = new List<(DateTime At, object Item)>();
            foreach (var m in Meals.Where(m => DateOf(m.At) == today))
            {
                var d = todayDays[m.ClientId];
                activity.Add((m.At, new
                {
                    kind = "meal", at = m.At, clientId = m.ClientId, mealId = m.Id, type = m.Type,
                    kcal = m.Kcal, photo = m.Photo, dayKcal = d.Kcal, target = d.Target, status = d.Status,
                }));
            }
            foreach (var w in Weights.Where(w => DateOf(w.At) == today))
            {
                var prev = Weights.Where(x => x.ClientId == w.ClientId && x.At < w.At).OrderBy(x => x.At).LastOrDefault();
                activity.Add((w.At, new
                {
                    kind = "weight", at = w.At, clientId = w.ClientId, kg = w.Kg,
                    delta = prev == null ? (double?)null : Math.Round(w.Kg - prev.Kg, 1),
                }));
            }

            return JsonSerializer.Serialize(new
            {
                now,
                coach = Coach,
                stats = new
                {
                    active = Clients.Count(c => c.Active),
                    mealsToday = Meals.Count(m => DateOf(m.At) == today),
                    onTarget = todayDays.Values.Count(d => d.Status == "ok"),
                    history = ClientHistory,
                },
                clients,
                activity = activity.OrderByDescending(x => x.At).Select(x => x.Item).ToList(),
                days = Enumerable.Range(0, 7).Select(i => today.AddDays(i - 6)).Select(d => new
                {
                    date = d,
                    dots = Clients.Where(c => c.Active).Select(c => new { clientId = c.Id, status = DayOf(c, d).Status }).ToList(),
                }).ToList(),
                meals = Meals.Where(m => DateOf(m.At) >= today.AddDays(-6)).OrderByDescending(m => m.At)
                    .Select(m => new { meal = m, day = DayOf(FindClient(m.ClientId)!, DateOf(m.At)) }).ToList(),
                workouts = Workouts.Where(w => w.Date >= ws.AddDays(-7) && w.Date < ws.AddDays(14)).OrderBy(w => w.Date).ToList(),
                plans = Plans.Select(p => new { p.ClientId, p.Date, p.Type, p.RecipeId }).ToList(),
                recipes = Recipes,
                templates = Seed.WorkoutTemplates.Select(kv => new
                {
                    id = kv.Key, kv.Value.Title, kv.Value.Photo,
                    exercises = kv.Value.Ex.Select(e => e.Name).ToList(),
                }).ToList(),
                threads = Clients.Select(c => new
                {
                    clientId = c.Id,
                    messages = Messages.Where(m => m.ClientId == c.Id).OrderBy(m => m.At).Select(MessageDto).ToList(),
                }).ToList(),
            }, Json);
        }
    }

    public (byte[] Data, string Type)? Photo(string id)
    {
        lock (_gate) return _photos.TryGetValue(id, out var p) ? p : null;
    }

    // ———————————————————— modificări ————————————————————

    /// <summary>Poza e obligatorie: fie o poză din galeria demo (/img/...), fie una încărcată (data URL).</summary>
    public (Change? Change, string? Error) AddMeal(string clientId, string type, string? photo, List<(int FoodId, int Grams)> items, string? title)
    {
        lock (_gate)
        {
            var c = FindClient(clientId);
            if (c == null) return (null, "Client inexistent.");
            if (!c.Active) return (null, "Accesul este suspendat.");
            if (string.IsNullOrWhiteSpace(photo)) return (null, "Poza mesei este obligatorie.");

            var mealItems = items.Where(i => i.Grams > 0)
                .Select(i => (food: Foods.Get(i.FoodId), i.Grams))
                .Where(x => x.food != null)
                .Select(x => MealItem.From(x.food!, x.Grams)).ToList();
            if (mealItems.Count == 0) return (null, "Adaugă cel puțin un aliment.");

            if (photo.StartsWith("data:image/"))
            {
                var comma = photo.IndexOf(',');
                var mime = photo[5..photo.IndexOf(';')];
                var id = Guid.NewGuid().ToString("N")[..12];
                _photos[id] = (Convert.FromBase64String(photo[(comma + 1)..]), mime);
                photo = $"/api/photos/{id}";
            }
            else if (!photo.StartsWith("/img/meals/")) return (null, "Poză invalidă.");

            var meal = new Meal
            {
                Id = "m" + Guid.NewGuid().ToString("N")[..8], ClientId = clientId,
                Type = type is "mic-dejun" or "pranz" or "cina" or "gustare" ? type : "extra",
                Title = string.IsNullOrWhiteSpace(title) ? null : title.Trim(),
                At = DateTime.Now, Photo = photo, Items = mealItems,
            };
            Meals.Add(meal);
            var d = DayOf(c, Today);
            var body = $"A postat {Article(meal.Type)} · {N0(meal.Kcal)} kcal. Azi: {N0(d.Kcal)} / {N0(d.Target)} kcal";
            return (new Change("meal", clientId, new Banner("coach", clientId, c.Name, body, meal.Photo, c.Photo, $"meal:{meal.Id}"),
                new { mealId = meal.Id }), null);
        }
    }

    public (Change? Change, string? Error) AddWeight(string clientId, double kg)
    {
        lock (_gate)
        {
            var c = FindClient(clientId);
            if (c == null) return (null, "Client inexistent.");
            if (kg < 30 || kg > 250) return (null, "Greutate invalidă.");
            kg = Math.Round(kg, 1);
            var prev = Weights.Where(w => w.ClientId == clientId).OrderBy(w => w.At).LastOrDefault();
            Weights.Add(new WeightEntry { ClientId = clientId, At = DateTime.Now, Kg = kg });
            var delta = prev == null ? "" : $" ({(kg - prev.Kg <= 0 ? "▼" : "▲")} {N1(Math.Abs(kg - prev.Kg))})";
            return (new Change("weight", clientId, new Banner("coach", clientId, c.Name, $"S-a cântărit: {N1(kg)} kg{delta}", null, c.Photo, $"client:{clientId}")), null);
        }
    }

    public (Change? Change, string? Error) UpdateSet(string workoutId, int ex, int set, int? reps, double? kg, int? min, bool? done)
    {
        lock (_gate)
        {
            var w = Workouts.FirstOrDefault(x => x.Id == workoutId);
            if (w == null || ex < 0 || ex >= w.Exercises.Count) return (null, "Antrenament inexistent.");
            var sets = w.Exercises[ex].Sets;
            if (set < 0 || set >= sets.Count) return (null, "Set inexistent.");
            var s = sets[set];
            if (reps is >= 0 and <= 200) s.Reps = reps.Value;
            if (kg is >= 0 and <= 500) s.Kg = kg.Value;
            if (min is >= 0 and <= 300) s.Min = min.Value;
            if (done != null) s.Done = done.Value;
            // Fără notificări de antrenamente pentru antrenor (cerință), doar actualizare live.
            return (new Change("workout", w.ClientId), null);
        }
    }

    public (Change? Change, string? Error) AddSet(string workoutId, int ex)
    {
        lock (_gate)
        {
            var w = Workouts.FirstOrDefault(x => x.Id == workoutId);
            if (w == null || ex < 0 || ex >= w.Exercises.Count) return (null, "Antrenament inexistent.");
            var sets = w.Exercises[ex].Sets;
            var last = sets.LastOrDefault();
            sets.Add(new WorkoutSet { Reps = last?.Reps ?? w.Exercises[ex].PlanReps, Kg = last?.Kg ?? w.Exercises[ex].PlanKg, Min = last?.Min ?? w.Exercises[ex].PlanMin });
            return (new Change("workout", w.ClientId), null);
        }
    }

    public (Change? Change, string? Error) RemoveSet(string workoutId, int ex)
    {
        lock (_gate)
        {
            var w = Workouts.FirstOrDefault(x => x.Id == workoutId);
            if (w == null || ex < 0 || ex >= w.Exercises.Count) return (null, "Antrenament inexistent.");
            var sets = w.Exercises[ex].Sets;
            if (sets.Count <= 1) return (null, "Exercițiul trebuie să aibă cel puțin un set.");
            sets.RemoveAt(sets.Count - 1);
            return (new Change("workout", w.ClientId), null);
        }
    }

    public (Change? Change, string? Error) AddMessage(string clientId, string from, string? text, string? mealId)
    {
        lock (_gate)
        {
            var c = FindClient(clientId);
            if (c == null) return (null, "Client inexistent.");
            text = text?.Trim();
            if (string.IsNullOrEmpty(text)) return (null, "Mesaj gol.");
            if (text.Length > 1000) text = text[..1000];
            from = from == "coach" ? "coach" : "client";
            var meal = mealId == null ? null : Meals.FirstOrDefault(m => m.Id == mealId && m.ClientId == clientId);
            var msg = new Message
            {
                Id = "x" + Guid.NewGuid().ToString("N")[..8], ClientId = clientId, From = from, Text = text,
                At = DateTime.Now, MealId = meal?.Id,
            };
            Messages.Add(msg);
            var banner = from == "coach"
                ? new Banner("client", clientId, Coach.Name, meal == null ? text : $"La {Article(meal.Type)}: {text}", meal?.Photo, Coach.Photo, "chat")
                : new Banner("coach", clientId, c.Name, text, null, c.Photo, $"chat:{clientId}");
            return (new Change("message", clientId, banner), null);
        }
    }

    public void MarkRead(string clientId, string reader)
    {
        lock (_gate)
        {
            var from = reader == "coach" ? "client" : "coach";
            foreach (var m in Messages.Where(m => m.ClientId == clientId && m.From == from)) m.Read = true;
        }
    }

    public (Change? Change, string? Error) SetTargets(string clientId, int kcal, int p, int c, int f)
    {
        lock (_gate)
        {
            var cl = FindClient(clientId);
            if (cl == null) return (null, "Client inexistent.");
            if (kcal is < 800 or > 6000 || p < 0 || c < 0 || f < 0) return (null, "Valori invalide.");
            cl.Targets = new Targets(kcal, p, c, f);
            return (new Change("targets", clientId,
                new Banner("client", clientId, Coach.Name, $"Ți-a actualizat ținta: {N0(kcal)} kcal pe zi (P {p} · C {c} · G {f} g).", null, Coach.Photo, "home")), null);
        }
    }

    public (Change? Change, string? Error) SetWeighInDays(string clientId, List<int> days)
    {
        lock (_gate)
        {
            var c = FindClient(clientId);
            if (c == null) return (null, "Client inexistent.");
            c.WeighInDays = days.Where(d => d is >= 1 and <= 7).Distinct().OrderBy(d => d).ToList();
            var names = c.WeighInDays.Select(d => Ro.DateTimeFormat.GetDayName((DayOfWeek)(d % 7))).ToList();
            var body = names.Count == 0 ? "Nu mai ai cântăriri programate." : $"Cântăriri programate în fiecare {string.Join(" și ", names)}.";
            return (new Change("weighin", clientId, new Banner("client", clientId, Coach.Name, body, null, Coach.Photo, "weight")), null);
        }
    }

    public (Change? Change, string? Error) SetAccess(string clientId, bool active)
    {
        lock (_gate)
        {
            var c = FindClient(clientId);
            if (c == null) return (null, "Client inexistent.");
            c.Active = active;
            return (new Change("access", clientId, active
                ? new Banner("client", clientId, Coach.Name, "Accesul tău la aplicație a fost reactivat.", null, Coach.Photo, "home")
                : null), null);
        }
    }

    public (Change? Change, string? Error) AssignWorkout(string clientId, DateOnly date, string template)
    {
        lock (_gate)
        {
            var c = FindClient(clientId);
            if (c == null) return (null, "Client inexistent.");
            if (!Seed.WorkoutTemplates.ContainsKey(template)) return (null, "Șablon inexistent.");
            Workouts.RemoveAll(w => w.ClientId == clientId && w.Date == date);
            var w = Seed.FromTemplate(clientId, date, template, "w" + Guid.NewGuid().ToString("N")[..8]);
            Workouts.Add(w);
            return (new Change("workout", clientId,
                new Banner("client", clientId, Coach.Name, $"Ți-a programat {w.Title} {When(date)}.", null, Coach.Photo, "workout")), null);
        }
    }

    public (Change? Change, string? Error) RemoveWorkout(string workoutId)
    {
        lock (_gate)
        {
            var w = Workouts.FirstOrDefault(x => x.Id == workoutId);
            if (w == null) return (null, "Antrenament inexistent.");
            Workouts.Remove(w);
            return (new Change("workout", w.ClientId), null);
        }
    }

    public (Change? Change, string? Error) SetPlan(string clientId, DateOnly date, string type, string? recipeId)
    {
        lock (_gate)
        {
            var c = FindClient(clientId);
            if (c == null) return (null, "Client inexistent.");
            Plans.RemoveAll(p => p.ClientId == clientId && p.Date == date && p.Type == type);
            var recipe = recipeId == null ? null : Recipes.FirstOrDefault(r => r.Id == recipeId);
            if (recipe == null) return (new Change("plan", clientId), null);
            Plans.Add(new MealPlan { ClientId = clientId, Date = date, Type = type, RecipeId = recipe.Id });
            return (new Change("plan", clientId,
                new Banner("client", clientId, Coach.Name, $"Îți propune {recipe.Name} la {TypeName(type)}, {When(date)}.", recipe.Photo, Coach.Photo, "plans")), null);
        }
    }
}
