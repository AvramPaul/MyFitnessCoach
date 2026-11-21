using System.Text.Json;
using MyFitnessCoach.Api.Data;

namespace MyFitnessCoach.Api.Tests;

/// <summary>Datele de demo trebuie să fie coerente: totalurile vin din ingrediente, nimic nu e „în viitor”.</summary>
public class DemoDataTests
{
    private readonly Store _store = new();

    [Fact]
    public void EveryMeal_HasAPhotoAndIngredients()
    {
        Assert.All(_store.Meals, m =>
        {
            Assert.False(string.IsNullOrWhiteSpace(m.Photo));
            Assert.NotEmpty(m.Items);
        });
    }

    [Fact]
    public void NoMeal_IsInTheFuture()
    {
        var now = DateTime.Now.AddMinutes(1);

        Assert.All(_store.Meals, m => Assert.True(m.At <= now, $"{m.Id} e în viitor: {m.At}"));
    }

    [Fact]
    public void Andrei_HasNoDinnerToday_SoItCanBeLoggedInTheDemo()
    {
        var today = DateOnly.FromDateTime(DateTime.Now);

        Assert.DoesNotContain(_store.Meals,
            m => m.ClientId == "andrei" && m.Type == "cina" && DateOnly.FromDateTime(m.At) == today);
    }

    [Fact]
    public void ClientView_ShowsWeeklyTargetAsDailyTimesSeven()
    {
        using var doc = JsonDocument.Parse(_store.ClientJson("andrei")!);
        var root = doc.RootElement;

        var daily = root.GetProperty("me").GetProperty("targets").GetProperty("kcal").GetInt32();
        var weekly = root.GetProperty("week").GetProperty("target").GetInt32();

        Assert.Equal(daily * 7, weekly);
        Assert.Equal(7, root.GetProperty("week").GetProperty("days").GetArrayLength());
    }

    [Fact]
    public void ClientView_TodayTotalMatchesTodaysMeals()
    {
        var today = DateOnly.FromDateTime(DateTime.Now);
        var expected = _store.Meals
            .Where(m => m.ClientId == "andrei" && DateOnly.FromDateTime(m.At) == today)
            .Sum(m => m.Kcal);

        using var doc = JsonDocument.Parse(_store.ClientJson("andrei")!);

        Assert.Equal(expected, doc.RootElement.GetProperty("today").GetProperty("kcal").GetInt32());
    }

    [Fact]
    public void UnknownClient_ReturnsNothing()
    {
        Assert.Null(_store.ClientJson("nu-exista"));
    }

    [Fact]
    public void AddMeal_WithoutPhoto_IsRejected()
    {
        var (change, error) = _store.AddMeal("andrei", "cina", null, [(1, 100)], null);

        Assert.Null(change);
        Assert.Equal("Poza mesei este obligatorie.", error);
    }
}
