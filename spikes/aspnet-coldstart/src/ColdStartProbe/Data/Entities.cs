namespace ColdStartProbe.Data;

// A deliberately non-trivial model. EF Core's model-building cost scales with
// entity/relationship/index count, so a 1-entity model would badly understate
// the cold-start hit. This mirrors the shape of the real Listhold schema.

public enum EventStatus { Draft, Published, Closed, Cancelled }
public enum RegistrationState { Confirmed, Waitlisted, Offered, Declined, Withdrawn, Removed }
public enum QuestionKind { YesNo, Acknowledgement, ShortText, Choice }
public enum AnswerVisibility { Public, Organizers }
public enum RosterVisibility { Public, Attendees, Organizers }

public class Profile
{
    public Guid Id { get; set; }
    public string DisplayName { get; set; } = "";
    public string? AvatarUrl { get; set; }
    public string TimeZone { get; set; } = "UTC";
    public DateTime? ProfileCompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public List<Registration> Registrations { get; set; } = new();
    public List<Event> OwnedEvents { get; set; } = new();
}

public class Event
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string Location { get; set; } = "";
    public string TimeZone { get; set; } = "UTC";
    public DateTime StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
    public int Capacity { get; set; }
    public int ConfirmedCount { get; set; }
    public EventStatus Status { get; set; }
    public RosterVisibility RosterVisibility { get; set; }
    public bool WaitlistEnabled { get; set; }
    public DateTime? SignupOpensAt { get; set; }
    public DateTime? SignupClosesAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    public Guid OwnerId { get; set; }
    public Profile Owner { get; set; } = null!;

    public List<Registration> Registrations { get; set; } = new();
    public List<EventQuestion> Questions { get; set; } = new();
    public List<EventAdmin> Admins { get; set; } = new();
    public List<EventActivity> Activity { get; set; } = new();
}

public class EventAdmin
{
    public Guid EventId { get; set; }
    public Event Event { get; set; } = null!;
    public Guid UserId { get; set; }
    public Profile User { get; set; } = null!;
    public DateTime AddedAt { get; set; }
}

public class EventQuestion
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public Event Event { get; set; } = null!;
    public int Position { get; set; }
    public QuestionKind Kind { get; set; }
    public string Label { get; set; } = "";
    public string? HelpText { get; set; }
    public bool Required { get; set; }
    public AnswerVisibility Visibility { get; set; }
    public string? OptionsJson { get; set; }

    public List<RegistrationAnswer> Answers { get; set; } = new();
}

public class Registration
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public Event Event { get; set; } = null!;
    public Guid UserId { get; set; }
    public Profile User { get; set; } = null!;
    public RegistrationState State { get; set; }
    public decimal Position { get; set; }
    public DateTime JoinedAt { get; set; }
    public DateTime StateChangedAt { get; set; }
    public Guid? RemovedBy { get; set; }
    public string? RemovalReason { get; set; }

    public List<RegistrationAnswer> Answers { get; set; } = new();
}

public class RegistrationAnswer
{
    public Guid Id { get; set; }
    public Guid RegistrationId { get; set; }
    public Registration Registration { get; set; } = null!;
    public Guid QuestionId { get; set; }
    public EventQuestion Question { get; set; } = null!;
    public string ValueJson { get; set; } = "{}";
    public DateTime CreatedAt { get; set; }
}

public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Profile User { get; set; } = null!;
    public Guid? EventId { get; set; }
    public string Kind { get; set; } = "";
    public string DedupeKey { get; set; } = "";
    public string PayloadJson { get; set; } = "{}";
    public DateTime CreatedAt { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? FailedAt { get; set; }
    public int Attempts { get; set; }
}

public class EventActivity
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public Event Event { get; set; } = null!;
    public Guid? ActorId { get; set; }
    public string Action { get; set; } = "";
    public Guid? TargetRegistrationId { get; set; }
    public string MetadataJson { get; set; } = "{}";
    public DateTime CreatedAt { get; set; }
}
