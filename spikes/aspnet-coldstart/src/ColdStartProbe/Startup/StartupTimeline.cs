using System.Diagnostics;

namespace ColdStartProbe.Startup;

/// <summary>
/// Records wall-clock marks relative to OS process start, so a single request
/// can report where cold-start time actually went.
/// </summary>
public static class StartupTimeline
{
    private static readonly object Gate = new();
    private static readonly List<Mark> MarkList = new();

    /// <summary>UTC instant the OS created this process (includes CLR init, before Main).</summary>
    public static DateTime ProcessStartUtc { get; } = ResolveProcessStart();

    public static bool FirstRequestSeen { get; private set; }

    public readonly record struct Mark(string Name, double AtMs);

    private static DateTime ResolveProcessStart()
    {
        try
        {
            // On Linux this reads /proc/<pid>/stat and so includes runtime startup
            // that happened before any of our code ran.
            return Process.GetCurrentProcess().StartTime.ToUniversalTime();
        }
        catch
        {
            return DateTime.UtcNow;
        }
    }

    public static double ElapsedMs =>
        (DateTime.UtcNow - ProcessStartUtc).TotalMilliseconds;

    public static void Mark_(string name)
    {
        lock (Gate)
        {
            MarkList.Add(new Mark(name, Math.Round(ElapsedMs, 2)));
        }
    }

    /// <summary>Returns true exactly once, for the first request to arrive.</summary>
    public static bool ClaimFirstRequest()
    {
        lock (Gate)
        {
            if (FirstRequestSeen) return false;
            FirstRequestSeen = true;
            return true;
        }
    }

    public static IReadOnlyList<Mark> Snapshot()
    {
        lock (Gate)
        {
            return MarkList.ToArray();
        }
    }
}
