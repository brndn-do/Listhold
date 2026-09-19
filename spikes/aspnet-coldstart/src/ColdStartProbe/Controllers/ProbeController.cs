using System.Diagnostics;
using ColdStartProbe.Data;
using ColdStartProbe.Dtos;
using ColdStartProbe.Startup;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ColdStartProbe.Controllers;

[ApiController]
[Route("probe")]
public class ProbeController : ControllerBase
{
    private readonly ProbeDbContext _db;
    private readonly IConfiguration _config;

    public ProbeController(ProbeDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    /// <summary>Trivial endpoint: ASP.NET Core pipeline + System.Text.Json only, no EF.</summary>
    [HttpGet("ping")]
    public object Ping()
    {
        var cold = StartupTimeline.ClaimFirstRequest();
        return new
        {
            isColdStart = cold,
            processUptimeMs = Math.Round(StartupTimeline.ElapsedMs, 2),
            phases = StartupTimeline.Snapshot()
                .Select(m => new PhaseTiming(m.Name, m.AtMs)).ToArray(),
        };
    }

    /// <summary>
    /// The realistic first request: forces EF Core model building, query
    /// compilation and JSON serialisation — the JIT-heavy work that dominates
    /// a .NET cold start.
    /// </summary>
    [HttpGet("query")]
    public async Task<ProbeResponse> Query()
    {
        var cold = StartupTimeline.ClaimFirstRequest();
        var startedAt = StartupTimeline.ElapsedMs;
        var sw = Stopwatch.StartNew();

        // 1. Model building. First touch of .Model builds the whole IModel:
        //    conventions, relationships, indexes, value converters. Usually the
        //    single largest EF cost on a cold start.
        var model = _db.Model;
        var entityTypes = model.GetEntityTypes().ToArray();
        var entityCount = entityTypes.Length;
        var indexCount = entityTypes.Sum(t => t.GetIndexes().Count());
        var modelBuildMs = sw.Elapsed.TotalMilliseconds;

        // 2. Query compilation. LINQ -> shaped expression -> SQL. ToQueryString()
        //    runs the entire pipeline WITHOUT opening a connection, so this works
        //    against a Postgres provider pointed at a database that isn't there.
        sw.Restart();
        var query = _db.Registrations
            .AsNoTracking()
            .Where(r => r.Event.Slug == "friday-night-practice"
                        && r.State == RegistrationState.Confirmed)
            .OrderBy(r => r.Position)
            .Take(20)
            .Select(r => new RosterRow(
                r.Id, r.User.DisplayName, r.State.ToString(), r.Position, r.JoinedAt));

        var sql = query.ToQueryString();
        var queryCompileMs = sw.Elapsed.TotalMilliseconds;

        // 3. Optional real execution + materialisation (SQLite in-memory mode).
        sw.Restart();
        var roster = Array.Empty<RosterRow>();
        var provider = _config["DbMode"] ?? "npgsql";
        if (provider.Equals("sqlite", StringComparison.OrdinalIgnoreCase))
        {
            await _db.Database.EnsureCreatedAsync();
            roster = await query.ToArrayAsync();
        }
        var queryExecuteMs = sw.Elapsed.TotalMilliseconds;

        var endedAt = StartupTimeline.ElapsedMs;

        return new ProbeResponse(
            IsColdStart: cold,
            EfWarmedAtStartup: StartupFlags.EfWarmedAtStartup,
            ProcessUptimeMsAtRequestStart: Math.Round(startedAt, 2),
            ProcessUptimeMsAtRequestEnd: Math.Round(endedAt, 2),
            RequestHandlingMs: Math.Round(endedAt - startedAt, 2),
            Phases: StartupTimeline.Snapshot()
                .Select(m => new PhaseTiming(m.Name, m.AtMs)).ToArray(),
            Ef: new EfWorkDetail(
                Provider: provider,
                EntityTypeCount: entityCount,
                IndexCount: indexCount,
                ModelBuildMs: Math.Round(modelBuildMs, 2),
                QueryCompileMs: Math.Round(queryCompileMs, 2),
                QueryExecuteMs: Math.Round(queryExecuteMs, 2),
                SqlPreview: sql.Length > 400 ? sql[..400] + " …" : sql),
            Roster: roster);
    }
}

[ApiController]
public class HealthController : ControllerBase
{
    [HttpGet("/healthz")]
    public object Health() => new { ok = true, uptimeMs = Math.Round(StartupTimeline.ElapsedMs, 2) };
}
