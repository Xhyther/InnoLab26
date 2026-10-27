namespace KitaLedgers.Model;

public class TransactionEvidence
{
    public long TransactionId { get; set; }
    public long EvidenceId { get; set; }

    public BusinessTransaction Transaction { get; set; } = null!;
    public Evidence Evidence { get; set; } = null!;
}