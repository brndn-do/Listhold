using Microsoft.EntityFrameworkCore;

namespace ColdStartProbe.Data;

public class ProbeDbContext : DbContext
{
    public ProbeDbContext(DbContextOptions<ProbeDbContext> options) : base(options) { }

    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<EventAdmin> EventAdmins => Set<EventAdmin>();
    public DbSet<EventQuestion> EventQuestions => Set<EventQuestion>();
    public DbSet<Registration> Registrations => Set<Registration>();
    public DbSet<RegistrationAnswer> RegistrationAnswers => Set<RegistrationAnswer>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<EventActivity> EventActivity => Set<EventActivity>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // Enough configuration to make model building representative: conversions,
        // composite keys, filtered + composite indexes, relationships with varying
        // delete behaviour, precision. This is the work that costs cold-start time.

        b.Entity<Profile>(e =>
        {
            e.Property(x => x.DisplayName).HasMaxLength(100).IsRequired();
            e.Property(x => x.AvatarUrl).HasMaxLength(500);
            e.Property(x => x.TimeZone).HasMaxLength(64).IsRequired();
        });

        b.Entity<Event>(e =>
        {
            e.Property(x => x.Slug).HasMaxLength(36).IsRequired();
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Name).HasMaxLength(50).IsRequired();
            e.Property(x => x.Description).HasMaxLength(2000);
            e.Property(x => x.Location).HasMaxLength(200).IsRequired();
            e.Property(x => x.TimeZone).HasMaxLength(64).IsRequired();
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);
            e.Property(x => x.RosterVisibility).HasConversion<string>().HasMaxLength(16);
            e.HasIndex(x => new { x.Status, x.StartsAt });
            e.HasIndex(x => x.OwnerId);
            e.HasOne(x => x.Owner)
             .WithMany(p => p.OwnedEvents)
             .HasForeignKey(x => x.OwnerId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasQueryFilter(x => x.DeletedAt == null);
        });

        b.Entity<EventAdmin>(e =>
        {
            e.HasKey(x => new { x.EventId, x.UserId });
            e.HasOne(x => x.Event).WithMany(ev => ev.Admins)
             .HasForeignKey(x => x.EventId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User).WithMany()
             .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<EventQuestion>(e =>
        {
            e.Property(x => x.Label).HasMaxLength(300).IsRequired();
            e.Property(x => x.HelpText).HasMaxLength(500);
            e.Property(x => x.Kind).HasConversion<string>().HasMaxLength(16);
            e.Property(x => x.Visibility).HasConversion<string>().HasMaxLength(16);
            e.HasIndex(x => new { x.EventId, x.Position }).IsUnique();
            e.HasOne(x => x.Event).WithMany(ev => ev.Questions)
             .HasForeignKey(x => x.EventId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Registration>(e =>
        {
            e.Property(x => x.State).HasConversion<string>().HasMaxLength(16);
            e.Property(x => x.Position).HasPrecision(20, 10);
            e.Property(x => x.RemovalReason).HasMaxLength(500);
            e.HasIndex(x => new { x.EventId, x.UserId }).IsUnique();
            e.HasIndex(x => new { x.EventId, x.Position }).IsUnique();
            e.HasIndex(x => new { x.EventId, x.State });
            e.HasOne(x => x.Event).WithMany(ev => ev.Registrations)
             .HasForeignKey(x => x.EventId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User).WithMany(p => p.Registrations)
             .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<RegistrationAnswer>(e =>
        {
            e.HasIndex(x => new { x.RegistrationId, x.QuestionId }).IsUnique();
            e.HasOne(x => x.Registration).WithMany(r => r.Answers)
             .HasForeignKey(x => x.RegistrationId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Question).WithMany(q => q.Answers)
             .HasForeignKey(x => x.QuestionId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Notification>(e =>
        {
            e.Property(x => x.Kind).HasMaxLength(64).IsRequired();
            e.Property(x => x.DedupeKey).HasMaxLength(200).IsRequired();
            e.HasIndex(x => x.DedupeKey).IsUnique();
            e.HasIndex(x => new { x.UserId, x.CreatedAt });
            e.HasOne(x => x.User).WithMany()
             .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<EventActivity>(e =>
        {
            e.Property(x => x.Action).HasMaxLength(64).IsRequired();
            e.HasIndex(x => new { x.EventId, x.CreatedAt });
            e.HasOne(x => x.Event).WithMany(ev => ev.Activity)
             .HasForeignKey(x => x.EventId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
