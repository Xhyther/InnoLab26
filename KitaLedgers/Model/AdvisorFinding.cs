namespace KitaLedgers.Model;

public class AdvisorFinding
{
    public long Id { get; set; }
    public long AssessmentId { get; set; }

    public string Code { get; set; } = string.Empty;
    public FindingSeverity Severity { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    // Optional numeric value relevant to this finding.
    public decimal? MetricValue { get; set; }

    public AdvisorAssessment Assessment { get; set; } = null!;

    public ICollection<AdvisorAction> Actions { get; set; }
        = new List<AdvisorAction>();
}