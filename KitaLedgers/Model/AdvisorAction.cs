namespace KitaLedgers.Model;

public class AdvisorAction
{
    public long Id { get; set; }
    public long FindingId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    public AdvisorActionStatus Status { get; set; }
        = AdvisorActionStatus.Pending;

    public DateOnly? DueDate { get; set; }
    public DateTime? CompletedAtUtc { get; set; }

    public AdvisorFinding Finding { get; set; } = null!;
}