using KitaLedgers.Models;

namespace KitaLedgers.Model;

public class FinancialSnapshot
{
    public long Id { get; set; }
    public long BusinessId { get; set; }

    public DateOnly PeriodStart { get; set; }
    public DateOnly PeriodEnd { get; set; }

    public DateTime GeneratedAtUtc { get; set; } = DateTime.UtcNow;

    public int SchemaVersion { get; set; } = 1;

    // Serialized snapshot of metrics, totals, and other report data.
    public string MetricsJson { get; set; } = "{}";

    public Business Business { get; set; } = null!;

    public ICollection<PassportReport> Reports { get; set; }
        = new List<PassportReport>();
    
    public ICollection<AdvisorAssessment> AdvisorAssessments { get; set; }
        = new List<AdvisorAssessment>();
}