using MyFitnessCoach.Api.Data;

namespace MyFitnessCoach.Api.Tests;

/// <summary>Regulile de bază din specificație (secțiunea 5). Trebuie să rămână adevărate orice s-ar schimba în cod.</summary>
public class RulesTests
{
    // Sub 95% din țintă = galben (sub), 95–105% = verde (ok), peste 105% = roșu (over).
    [Theory]
    [InlineData(0, 2000, "under")]
    [InlineData(1899, 2000, "under")]
    [InlineData(1900, 2000, "ok")]
    [InlineData(2000, 2000, "ok")]
    [InlineData(2100, 2000, "ok")]
    [InlineData(2101, 2000, "over")]
    public void DayStatus_FollowsTheFivePercentRule(int kcal, int target, string expected)
    {
        Assert.Equal(expected, Store.Status(kcal, target));
    }

    [Fact]
    public void DayStatus_WithoutTarget_IsUnder()
    {
        Assert.Equal("under", Store.Status(500, 0));
    }

    [Fact]
    public void WeeklyTarget_IsDailyTargetTimesSeven()
    {
        Assert.Equal(18_200, new Targets(2600, 180, 300, 75).WeeklyKcal);
    }

    [Fact]
    public void MealItem_ComputesCaloriesAndMacrosFromGrams()
    {
        // 200 g piept de pui: 165 kcal, 31 g P, 3,6 g G la 100 g
        var chicken = new Food(1, "Piept de pui (gătit)", "g", 165, 31, 0, 3.6);

        var item = MealItem.From(chicken, 200);

        Assert.Equal(330, item.Kcal);
        Assert.Equal(62, item.P);
        Assert.Equal(0, item.C);
        Assert.Equal(7.2, item.F);
    }

    [Fact]
    public void Meal_TotalIsTheSumOfItsIngredients()
    {
        var meal = new Meal
        {
            Items =
            [
                MealItem.From(Foods.Get("Somon atlantic"), 150),
                MealItem.From(Foods.Get("Sparanghel"), 200),
                MealItem.From(Foods.Get("Ulei de măsline"), 10),
            ],
        };

        // Exemplul din specificație: 312 + 40 + 88 = 440 kcal
        Assert.Equal(440, meal.Kcal);
    }

    [Fact]
    public void FoodSearch_IgnoresDiacritics()
    {
        var names = Foods.Search("branza").Select(f => f.Name).ToList();

        Assert.Contains("Brânză de vaci", names);
        Assert.Contains("Brânză feta", names);
    }

    [Fact]
    public void FoodSearch_PutsPrefixMatchesFirst()
    {
        var first = Foods.Search("ou").First();

        Assert.StartsWith("Ou", first.Name);
    }
}
