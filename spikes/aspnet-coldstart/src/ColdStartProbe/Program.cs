using System.Text.Json;
using System.Text.Json.Serialization;
using ColdStartProbe.Data;
using ColdStartProbe.Startup;
using Microsoft.EntityFrameworkCore;

StartupTimeline.Mark_("main-entered");

var builder = WebApplication.CreateBuilder(args);

// Cloud Run injects PORT; bind it explicitly rather than relying on defaults.
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Keep logging cheap so it doesn't distort the measurement.
builder.Logging.ClearProviders();
builder.Logging.AddSimpleConsole(o => o.SingleLine = true);
builder.Logging.SetMinimumLevel(LogLevel.Warning);

builder.Services
    .AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        o.JsonSerializerOptions.WriteIndented = false;
    });

// DB_MODE=npgsql (default) -> real Npgsql provider, connection string points at a
//   database that does not exist. Never opened: the probe only builds the model and
//   compiles queries, which needs no connection. This is what production would use.
// DB_MODE=sqlite -> executes for real against a local file, to also measure
//   materialisation. Still no remote database.
var dbMode = Environment.GetEnvironmentVariable("DB_MODE")?.ToLowerInvariant() ?? "npgsql";
builder.Configuration["DbMode"] = dbMode;

builder.Services.AddDbContext<ProbeDbContext>(opt =>
{
    if (dbMode == "sqlite")
    {
        opt.UseSqlite("Data Source=/tmp/probe.db");
    }
    else
    {
        // Intentionally unreachable. Nothing in this app opens a connection.
        opt.UseNpgsql("Host=127.0.0.1;Port=1;Database=nowhere;Username=probe;Password=probe;Timeout=1;Command Timeout=1");
    }
    opt.EnableServiceProviderCaching();
});

StartupTimeline.Mark_("services-configured");

var app = builder.Build();
StartupTimeline.Mark_("host-built");

app.MapControllers();

app.Lifetime.ApplicationStarted.Register(() => StartupTimeline.Mark_("listening"));

// WARM_EF=1 pays the EF model-building cost during startup instead of on the first
// request. On Cloud Run this matters: startup CPU boost gives you more CPU during
// container start than during request handling, so moving work here can cut the
// user-visible first-request latency.
if (Environment.GetEnvironmentVariable("WARM_EF") == "1")
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ProbeDbContext>();
    _ = db.Model;                                   // build the model
    _ = db.Registrations.Where(r => r.State == RegistrationState.Confirmed)
          .OrderBy(r => r.Position).Take(1).ToQueryString();   // compile a query
    StartupFlags.EfWarmedAtStartup = true;
    StartupTimeline.Mark_("ef-warmed");
}

StartupTimeline.Mark_("about-to-run");
app.Run();
