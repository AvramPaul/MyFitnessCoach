namespace MyFitnessCoach.Api.Data;

/// <summary>Baza de alimente. Valori per 100 g / 100 ml (aproximări după tabele nutriționale uzuale).</summary>
public static class Foods
{
    public static readonly List<Food> All = Build(new (string Name, string Unit, double Kcal, double P, double C, double F)[]
    {
        // Proteine
        ("Piept de pui (gătit)", "g", 165, 31, 0, 3.6),
        ("Pulpă de pui fără piele (gătită)", "g", 209, 26, 0, 10.9),
        ("Piept de curcan (gătit)", "g", 147, 30, 0, 2),
        ("Carne tocată de vită 5%", "g", 137, 21, 0, 5),
        ("Friptură de vită (mușchi)", "g", 190, 29, 0, 8),
        ("Somon atlantic", "g", 208, 20, 0, 13),
        ("Ton în apă (conservă)", "g", 116, 26, 0, 1),
        ("Creveți (gătiți)", "g", 99, 24, 0.2, 0.3),
        ("Ou întreg", "g", 143, 12.6, 0.7, 9.5),
        ("Albuș de ou", "g", 52, 10.9, 0.7, 0.2),
        ("Brânză de vaci", "g", 98, 11, 3.4, 4.3),
        ("Telemea de vacă", "g", 250, 16, 1.5, 20),
        ("Iaurt grecesc 2%", "g", 73, 10, 3.6, 2),
        ("Skyr natural", "g", 63, 11, 4, 0.2),
        ("Lapte 1,5%", "ml", 47, 3.4, 4.9, 1.5),
        ("Proteină whey", "g", 380, 78, 8, 5),
        ("Tofu", "g", 76, 8, 1.9, 4.8),
        ("Parmezan", "g", 431, 38, 4.1, 29),
        ("Mozzarella", "g", 280, 28, 3.1, 17),
        ("Brânză feta", "g", 264, 14, 4, 21),

        // Carbohidrați
        ("Orez basmati fiert", "g", 130, 2.7, 28, 0.3),
        ("Orez brun fiert", "g", 123, 2.7, 25.6, 1),
        ("Quinoa fiartă", "g", 120, 4.4, 21.3, 1.9),
        ("Paste integrale fierte", "g", 124, 5.3, 25, 1.4),
        ("Paste fierte", "g", 158, 5.8, 31, 0.9),
        ("Fulgi de ovăz", "g", 389, 16.9, 66.3, 6.9),
        ("Granola", "g", 471, 10, 64, 20),
        ("Pâine integrală", "g", 247, 13, 41, 3.4),
        ("Pâine albă", "g", 265, 9, 49, 3.2),
        ("Cartofi fierți", "g", 87, 1.9, 20, 0.1),
        ("Cartof dulce copt", "g", 90, 2, 20.7, 0.2),
        ("Mămăligă", "g", 85, 1.9, 18, 0.4),
        ("Lipie integrală", "g", 300, 9, 50, 7),
        ("Crutoane", "g", 407, 12, 74, 6.6),
        ("Năut fiert", "g", 164, 8.9, 27.4, 2.6),
        ("Linte fiartă", "g", 116, 9, 20, 0.4),

        // Fructe
        ("Banană", "g", 89, 1.1, 22.8, 0.3),
        ("Măr", "g", 52, 0.3, 13.8, 0.2),
        ("Afine", "g", 57, 0.7, 14.5, 0.3),
        ("Zmeură", "g", 52, 1.2, 11.9, 0.7),
        ("Căpșuni", "g", 32, 0.7, 7.7, 0.3),
        ("Fructe de pădure (mix)", "g", 50, 0.9, 11.5, 0.3),
        ("Portocală", "g", 47, 0.9, 11.8, 0.1),
        ("Kiwi", "g", 61, 1.1, 14.7, 0.5),
        ("Struguri", "g", 69, 0.7, 18, 0.2),

        // Legume
        ("Broccoli", "g", 34, 2.8, 6.6, 0.4),
        ("Sparanghel", "g", 20, 2.2, 3.9, 0.1),
        ("Spanac", "g", 23, 2.9, 3.6, 0.4),
        ("Salată verde", "g", 15, 1.4, 2.9, 0.2),
        ("Salată romană", "g", 17, 1.2, 3.3, 0.3),
        ("Rucola", "g", 25, 2.6, 3.7, 0.7),
        ("Roșii", "g", 18, 0.9, 3.9, 0.2),
        ("Roșii cherry", "g", 18, 0.9, 3.9, 0.2),
        ("Castravete", "g", 15, 0.7, 3.6, 0.1),
        ("Dovlecel", "g", 17, 1.2, 3.1, 0.3),
        ("Ardei gras", "g", 31, 1, 6, 0.3),
        ("Morcov", "g", 41, 0.9, 9.6, 0.2),
        ("Varză albă", "g", 25, 1.3, 5.8, 0.1),
        ("Fasole verde", "g", 31, 1.8, 7, 0.2),
        ("Ciuperci", "g", 22, 3.1, 3.3, 0.3),
        ("Dovleac copt", "g", 45, 1, 11.7, 0.1),
        ("Edamame", "g", 121, 11.9, 8.9, 5.2),
        ("Legume la grătar", "g", 50, 1.5, 7, 2),
        ("Ceapă", "g", 40, 1.1, 9.3, 0.1),
        ("Măsline", "g", 115, 0.8, 6, 10.7),

        // Grăsimi
        ("Ulei de măsline", "ml", 884, 0, 0, 100),
        ("Avocado", "g", 160, 2, 8.5, 14.7),
        ("Unt de arahide", "g", 588, 25, 20, 50),
        ("Migdale", "g", 579, 21, 21.6, 49.9),
        ("Nuci", "g", 654, 15, 13.7, 65),
        ("Arahide", "g", 567, 25.8, 16.1, 49.2),
        ("Semințe de chia", "g", 486, 16.5, 42, 30.7),
        ("Unt", "g", 717, 0.9, 0.1, 81),
        ("Smântână 12%", "g", 133, 2.9, 4, 12),

        // Altele
        ("Miere", "g", 304, 0.3, 82.4, 0),
        ("Sos de roșii", "g", 32, 1.4, 5.8, 0.2),
        ("Sos teriyaki", "g", 89, 5.9, 15.6, 0),
        ("Sos Caesar", "g", 450, 2, 4, 47),
        ("Hummus", "g", 166, 7.9, 14.3, 9.6),
        ("Ciocolată neagră 85%", "g", 590, 11, 20, 46),
        ("Croissant cu ciocolată", "g", 414, 7, 46, 22),
        ("Cappuccino", "ml", 40, 2.2, 3.3, 2),
        ("Cafea neagră", "ml", 2, 0.3, 0, 0),
        ("Suc de portocale", "ml", 45, 0.7, 10.4, 0.2),
        ("Ciorbă de perișoare", "ml", 48, 3.2, 3.5, 2.4),
        ("Ciorbă de legume", "ml", 30, 1, 5, 0.8),
        ("Sarmale", "g", 160, 8, 9, 10),
        ("Pizza margherita", "g", 266, 11, 33, 10),
        ("Bere", "ml", 43, 0.5, 3.6, 0),
        ("Vin roșu", "ml", 85, 0.1, 2.6, 0),
    });

    static readonly Dictionary<string, Food> ByName = All.ToDictionary(f => f.Name);

    public static Food Get(string name) =>
        ByName.TryGetValue(name, out var f) ? f : throw new KeyNotFoundException($"Aliment lipsă: {name}");

    public static Food? Get(int id) => All.FirstOrDefault(f => f.Id == id);

    public static IEnumerable<Food> Search(string? q, int take = 12)
    {
        if (string.IsNullOrWhiteSpace(q)) return All.Take(take);
        var needle = Normalize(q);
        return All
            .Select(f => (f, idx: Normalize(f.Name).IndexOf(needle, StringComparison.Ordinal)))
            .Where(x => x.idx >= 0)
            .OrderBy(x => x.idx == 0 ? 0 : 1)
            .ThenBy(x => x.f.Name.Length)
            .Select(x => x.f)
            .Take(take);
    }

    /// <summary>Căutare fără diacritice: „branza” găsește „Brânză”.</summary>
    static string Normalize(string s) => s.ToLowerInvariant()
        .Replace('ă', 'a').Replace('â', 'a').Replace('î', 'i')
        .Replace('ș', 's').Replace('ş', 's').Replace('ț', 't').Replace('ţ', 't');

    static List<Food> Build((string Name, string Unit, double Kcal, double P, double C, double F)[] rows) =>
        rows.Select((r, i) => new Food(i + 1, r.Name, r.Unit, r.Kcal, r.P, r.C, r.F)).ToList();
}
