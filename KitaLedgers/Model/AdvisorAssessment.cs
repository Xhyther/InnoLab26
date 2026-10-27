using KitaLedgers.Models;

namespace KitaLedgers.Model;



public class AdvisorAssessment
{
    public long Id { get; set; }
    public long BusinessId { get; set; }

    // Optional: identifies the snapshot used for the assessment.
    public long? SnapshotId { get; set; }

    public DateTime StartedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAtUtc { get; set; }

    public AdvisorAssessmentStatus Status { get; set; }
        = AdvisorAssessmentStatus.Pending;

    public string RulesVersion { get; set; } = "1.0";

    public Business Business { get; set; } = null!;

    public ICollection<AdvisorFinding> Findings { get; set; }
        = new List<AdvisorFinding>();
    
    public FinancialSnapshot? Snapshot { get; set; }
}

    


