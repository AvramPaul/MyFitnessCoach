using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options => 
    options.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddSignalR();

var app = builder.Build();

app.UseCors();
app.UseDefaultFiles();
app.UseStaticFiles();

// Bază de date alimente (per 100g)
var foodDatabase = new List<FoodItemDto>
{
    new("Piept de pui la grătar", 165, 31.0, 0.0, 3.6),
    new("Orez basmati fiert", 130, 2.7, 28.0, 0.3),
    new("Ou întreg (fiert)", 155, 13.0, 1.1, 11.0),
    new("Somon la cuptor", 208, 20.0, 0.0, 13.0),
    new("Cartofi copți", 93, 2.5, 21.0, 0.1),
    new("Ovăz integral", 389, 16.9, 66.3, 6.9),
    new("Iaurt grecesc 2%", 73, 10.0, 3.8, 2.0),
    new("Broccoli la abur", 34, 2.8, 7.0, 0.4),
    new("Ulei de măsline", 884, 0.0, 0.0, 100.0),
    new("Banană", 89, 1.1, 23.0, 0.3),
    new("Pâine integrală", 250, 9.0, 48.0, 2.5),
    new("Unt de arahide", 588, 25.0, 20.0, 50.0)
};

// Date inițiale pentru timeline-ul antrenorului
var meals = new List<MealDto>
{
    new(
        Id: Guid.NewGuid().ToString(),
        ClientName: "Andrei Popescu",
        ClientAvatar: "https://i.pravatar.cc/100?img=12",
        MealType: "Prânz",
        PhotoUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80",
        Time: "12:30",
        TotalKcal: 706,
        ConsumedKcal: 1640,
        TargetKcal: 2400,
        Protein: 118,
        Carbs: 160,
        Fat: 58,
        Items: new()
        {
            new("Piept de pui la grătar", 200, 330),
            new("Orez basmati fiert", 250, 325),
            new("Broccoli la abur", 150, 51)
        }
    ),
    new(
        Id: Guid.NewGuid().ToString(),
        ClientName: "Denis Stoica",
        ClientAvatar: "https://i.pravatar.cc/100?img=33",
        MealType: "Gustare",
        PhotoUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&q=80",
        Time: "10:52",
        TotalKcal: 222,
        ConsumedKcal: 1980,
        TargetKcal: 2000,
        Protein: 150,
        Carbs: 190,
        Fat: 66,
        Items: new()
        {
            new("Iaurt grecesc 2%", 200, 146),
            new("Banană", 80, 76)
        }
    ),
    new(
        Id: Guid.NewGuid().ToString(),
        ClientName: "Paul Munteanu",
        ClientAvatar: "https://i.pravatar.cc/100?img=60",
        MealType: "Mic dejun",
        PhotoUrl: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=500&q=80",
        Time: "08:45",
        TotalKcal: 520,
        ConsumedKcal: 520,
        TargetKcal: 2800,
        Protein: 38,
        Carbs: 52,
        Fat: 17,
        Items: new()
        {
            new("Ovăz integral", 80, 311),
            new("Unt de arahide", 15, 88),
            new("Banană", 130, 116)
        }
    )
};

// API Endpoints
app.MapGet("/api/foods", () => Results.Ok(foodDatabase));

app.MapGet("/api/meals", () => Results.Ok(meals));

app.MapPost("/api/meals", async (MealDto newMeal, IHubContext<MealHub> hub) =>
{
    // Adaugă cea mai recentă masă în capul listei
    meals.Insert(0, newMeal);
    
    // Notifică instant toți antrenorii conectați
    await hub.Clients.All.SendAsync("MealAdded", newMeal);
    
    return Results.Created($"/api/meals/{newMeal.Id}", newMeal);
});

app.MapHub<MealHub>("/hubs/meals");

Console.WriteLine("==================================================");
Console.WriteLine(" MyFitnessCoach .NET 10 API pornit cu succes!");
Console.WriteLine(" Accesează demo-ul la: http://localhost:5000");
Console.WriteLine(" Trainer: http://localhost:5000/trainer.html");
Console.WriteLine(" Client:  http://localhost:5000/client.html");
Console.WriteLine("==================================================");

app.Run("http://0.0.0.0:5000");

public class MealHub : Hub { }

public record FoodItemDto(string Name, int Kcal, double Protein, double Carbs, double Fat);

public record MealDto(
    string Id,
    string ClientName,
    string ClientAvatar,
    string MealType,
    string PhotoUrl,
    string Time,
    int TotalKcal,
    int ConsumedKcal,
    int TargetKcal,
    int Protein,
    int Carbs,
    int Fat,
    List<MealItemDto> Items
);

public record MealItemDto(string Name, int Grams, int Kcal);
