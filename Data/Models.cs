namespace FitTogether.Data;

/// <summary>Aliment din baza de date. Valorile sunt per 100 g (sau 100 ml).</summary>
public record Food(int Id, string Name, string Unit, double Kcal, double P, double C, double F);

public record Targets(int Kcal, int P, int C, int F)
{
    public int WeeklyKcal => Kcal * 7;
}

public class Coach
{
    public string Id { get; init; } = "";
    public string Name { get; init; } = "";
    public string FirstName { get; init; } = "";
    public string Photo { get; init; } = "";
    public string InviteCode { get; init; } = "";
}

public class Client
{
    public string Id { get; init; } = "";
    public string Name { get; init; } = "";
    public string FirstName { get; init; } = "";
    public string Photo { get; init; } = "";
    public string Goal { get; init; } = "";
    public DateOnly Since { get; init; }
    public string Lang { get; init; } = "ro";
    public Targets Targets { get; set; } = new(2000, 150, 200, 65);
    public double StartKg { get; init; }
    public double GoalKg { get; init; }
    /// <summary>Zile de cântărire, ISO: 1 = luni … 7 = duminică. Se repetă săptămânal.</summary>
    public List<int> WeighInDays { get; set; } = new();
    public bool DietOnly { get; init; }
    public bool Active { get; set; } = true;
}

public class MealItem
{
    public int FoodId { get; init; }
    public string Name { get; init; } = "";
    public string Unit { get; init; } = "g";
    public int Grams { get; init; }
    public double Kcal { get; init; }
    public double P { get; init; }
    public double C { get; init; }
    public double F { get; init; }

    public static MealItem From(Food f, int grams) => new()
    {
        FoodId = f.Id,
        Name = f.Name,
        Unit = f.Unit,
        Grams = grams,
        Kcal = Math.Round(f.Kcal * grams / 100.0, 1),
        P = Math.Round(f.P * grams / 100.0, 1),
        C = Math.Round(f.C * grams / 100.0, 1),
        F = Math.Round(f.F * grams / 100.0, 1),
    };
}

public class Meal
{
    public string Id { get; init; } = "";
    public string ClientId { get; init; } = "";
    /// <summary>mic-dejun | pranz | cina | gustare | extra</summary>
    public string Type { get; init; } = "";
    public string? Title { get; init; }
    public DateTime At { get; init; }
    public string Photo { get; init; } = "";
    public List<MealItem> Items { get; init; } = new();

    public int Kcal => (int)Math.Round(Items.Sum(i => i.Kcal));
    public int P => (int)Math.Round(Items.Sum(i => i.P));
    public int C => (int)Math.Round(Items.Sum(i => i.C));
    public int F => (int)Math.Round(Items.Sum(i => i.F));
}

public class WeightEntry
{
    public string ClientId { get; init; } = "";
    public DateTime At { get; init; }
    public double Kg { get; init; }
}

public class WorkoutSet
{
    public int Reps { get; set; }
    public double Kg { get; set; }
    public int Min { get; set; }
    public bool Done { get; set; }
}

public class Exercise
{
    public string Name { get; init; } = "";
    /// <summary>kg | bw (body weight) | min</summary>
    public string Unit { get; init; } = "kg";
    public int PlanSets { get; init; }
    public int PlanReps { get; init; }
    public double PlanKg { get; init; }
    public int PlanMin { get; init; }
    public List<WorkoutSet> Sets { get; init; } = new();
}

public class Workout
{
    public string Id { get; init; } = "";
    public string ClientId { get; init; } = "";
    public DateOnly Date { get; init; }
    public string Template { get; init; } = "";
    public string Title { get; init; } = "";
    public string Photo { get; init; } = "";
    public string? Note { get; init; }
    public List<Exercise> Exercises { get; init; } = new();

    public bool Completed => Exercises.Count > 0 && Exercises.All(e => e.Sets.All(s => s.Done));
    public bool Started => Exercises.Any(e => e.Sets.Any(s => s.Done));
}

public class Recipe
{
    public string Id { get; init; } = "";
    public string Name { get; init; } = "";
    public string Photo { get; init; } = "";
    public string Type { get; init; } = "";
    public List<MealItem> Items { get; init; } = new();

    public int Kcal => (int)Math.Round(Items.Sum(i => i.Kcal));
    public int P => (int)Math.Round(Items.Sum(i => i.P));
    public int C => (int)Math.Round(Items.Sum(i => i.C));
    public int F => (int)Math.Round(Items.Sum(i => i.F));
}

/// <summary>Masă propusă de antrenor pentru un client, într-o zi, la un tip de masă.</summary>
public class MealPlan
{
    public string ClientId { get; init; } = "";
    public DateOnly Date { get; init; }
    public string Type { get; init; } = "";
    public string RecipeId { get; set; } = "";
}

public class Message
{
    public string Id { get; init; } = "";
    public string ClientId { get; init; } = "";
    /// <summary>coach | client</summary>
    public string From { get; init; } = "";
    public string Text { get; init; } = "";
    /// <summary>Traducerea automată pentru cealaltă parte (dacă limbile diferă).</summary>
    public string? Translated { get; init; }
    public string? Lang { get; init; }
    public DateTime At { get; init; }
    /// <summary>Comentariu la o masă: apare în chat alături de poza mesei.</summary>
    public string? MealId { get; init; }
    public bool Read { get; set; }
}

public record StrengthPoint(DateOnly Week, double Kg, int Sets);

public record StrengthSeries(string Exercise, List<StrengthPoint> Points);
