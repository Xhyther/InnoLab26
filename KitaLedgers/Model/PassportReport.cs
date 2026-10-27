namespace KitaLedgers.Model;

public class PassportReport
{
    public long Id { get; set; }
    public long SnapshotId { get; set; }

    public PassportReportFormat Format { get; set; }
    public string? StorageKey { get; set; }

    public DateTime GeneratedAtUtc { get; set; } = DateTime.UtcNow;
    public PassportReportStatus Status { get; set; } = PassportReportStatus.Pending;

    public FinancialSnapshot Snapshot { get; set; } = null!;
}