namespace ColdStartProbe.Dtos;

public record PhaseTiming(string Name, double AtMs);

public record EfWorkDetail(
    string Provider,
    int EntityTypeCount,
    int IndexCount,
    double ModelBuildMs,
    double QueryCompileMs,
    double QueryExecuteMs,
    string SqlPreview);

public record ProbeResponse(
    bool IsColdStart,
    bool EfWarmedAtStartup,
    double ProcessUptimeMsAtRequestStart,
    double ProcessUptimeMsAtRequestEnd,
    double RequestHandlingMs,
    IReadOnlyList<PhaseTiming> Phases,
    EfWorkDetail Ef,
    IReadOnlyList<RosterRow> Roster);

public record RosterRow(
    Guid RegistrationId,
    string DisplayName,
    string State,
    decimal Position,
    DateTime JoinedAt);
