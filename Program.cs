using FitTogether.Data;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);
// Implicit pe portul 5000 (și în rețeaua locală, ca să poți deschide clientul de pe un telefon real).
// Se poate suprascrie cu --urls sau ASPNETCORE_URLS.
if (string.IsNullOrEmpty(builder.Configuration["urls"]))
    builder.WebHost.UseUrls("http://0.0.0.0:5000");
builder.Services.AddSingleton<Store>();
builder.Services.AddSignalR();

var app = builder.Build();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapHub<LiveHub>("/hub");

var api = app.MapGroup("/api");

// Trimite modificarea live către ambele telefoane și răspunde cererii.
static async Task<IResult> Publish(IHubContext<LiveHub> hub, (Change? Change, string? Error) r)
{
    if (r.Change == null) return Results.BadRequest(new { error = r.Error });
    await hub.Clients.All.SendAsync("changed", r.Change);
    return Results.Ok(r.Change);
}

// ——— Citiri ———
api.MapGet("/client/{id}", (string id, Store s) =>
    s.ClientJson(id) is { } json ? Results.Text(json, "application/json") : Results.NotFound());

api.MapGet("/coach", (Store s) => Results.Text(s.CoachJson(), "application/json"));

api.MapGet("/foods", (string? q) => Foods.Search(q));

api.MapGet("/photos/{id}", (string id, Store s) =>
    s.Photo(id) is { } p ? Results.Bytes(p.Data, p.Type) : Results.NotFound());

// ——— Client ———
api.MapPost("/client/{id}/meals", (string id, NewMeal body, Store s, IHubContext<LiveHub> hub) =>
    Publish(hub, s.AddMeal(id, body.Type, body.Photo, body.Items.Select(i => (i.FoodId, i.Grams)).ToList(), body.Title)));

api.MapPost("/client/{id}/weight", (string id, NewWeight body, Store s, IHubContext<LiveHub> hub) =>
    Publish(hub, s.AddWeight(id, body.Kg)));

api.MapPost("/workouts/{id}/sets", (string id, SetUpdate body, Store s, IHubContext<LiveHub> hub) =>
    Publish(hub, s.UpdateSet(id, body.Ex, body.Set, body.Reps, body.Kg, body.Min, body.Done)));

api.MapPost("/workouts/{id}/sets/add", (string id, ExRef body, Store s, IHubContext<LiveHub> hub) =>
    Publish(hub, s.AddSet(id, body.Ex)));

api.MapPost("/workouts/{id}/sets/remove", (string id, ExRef body, Store s, IHubContext<LiveHub> hub) =>
    Publish(hub, s.RemoveSet(id, body.Ex)));

// ——— Chat (ambele părți) ———
api.MapPost("/messages", (NewMessage body, Store s, IHubContext<LiveHub> hub) =>
    Publish(hub, s.AddMessage(body.ClientId, body.From, body.Text, body.MealId)));

api.MapPost("/messages/read", (ReadReceipt body, Store s) =>
{
    s.MarkRead(body.ClientId, body.Reader);
    return Results.Ok();
});

// ——— Antrenor ———
api.MapPost("/coach/clients/{id}/targets", (string id, TargetsBody b, Store s, IHubContext<LiveHub> hub) =>
    Publish(hub, s.SetTargets(id, b.Kcal, b.P, b.C, b.F)));

api.MapPost("/coach/clients/{id}/weighin", (string id, WeighInBody b, Store s, IHubContext<LiveHub> hub) =>
    Publish(hub, s.SetWeighInDays(id, b.Days)));

api.MapPost("/coach/clients/{id}/access", (string id, AccessBody b, Store s, IHubContext<LiveHub> hub) =>
    Publish(hub, s.SetAccess(id, b.Active)));

api.MapPost("/coach/workouts", (AssignBody b, Store s, IHubContext<LiveHub> hub) =>
    Publish(hub, s.AssignWorkout(b.ClientId, b.Date, b.Template)));

api.MapPost("/coach/workouts/{id}/remove", (string id, Store s, IHubContext<LiveHub> hub) =>
    Publish(hub, s.RemoveWorkout(id)));

api.MapPost("/coach/plans", (PlanBody b, Store s, IHubContext<LiveHub> hub) =>
    Publish(hub, s.SetPlan(b.ClientId, b.Date, b.Type, b.RecipeId)));

// ——— Demo ———
api.MapPost("/demo/reset", async (Store s, IHubContext<LiveHub> hub) =>
{
    s.Reset();
    await hub.Clients.All.SendAsync("changed", new Change("reset", ""));
    return Results.Ok();
});

Console.WriteLine();
Console.WriteLine("  MyFitnessCoach — demo pornit");
Console.WriteLine("  Ambele telefoane:  http://localhost:5000");
Console.WriteLine("  Doar clientul:     http://localhost:5000/client.html");
Console.WriteLine("  Doar antrenorul:   http://localhost:5000/trainer.html");
Console.WriteLine();

app.Run();

public class LiveHub : Hub { }

public record NewMealItem(int FoodId, int Grams);
public record NewMeal(string Type, string? Photo, List<NewMealItem> Items, string? Title);
public record NewWeight(double Kg);
public record SetUpdate(int Ex, int Set, int? Reps, double? Kg, int? Min, bool? Done);
public record ExRef(int Ex);
public record NewMessage(string ClientId, string From, string? Text, string? MealId);
public record ReadReceipt(string ClientId, string Reader);
public record TargetsBody(int Kcal, int P, int C, int F);
public record WeighInBody(List<int> Days);
public record AccessBody(bool Active);
public record AssignBody(string ClientId, DateOnly Date, string Template);
public record PlanBody(string ClientId, DateOnly Date, string Type, string? RecipeId);
