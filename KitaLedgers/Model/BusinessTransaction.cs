using KitaLedgers.Models;

namespace KitaLedgers.Model;

public class BusinessTransaction
{
    public long Id { get; set; }
    public long BusinessId { get; set; }
    public long CategoryId { get; set; }

    public TransactionType Type { get; set; }
    public decimal Amount { get; set; }

    // The date the transaction occurred, not when it was entered.
    public DateOnly TransactionDate { get; set; }

    public string? Description { get; set; }
    
    public string PaymentMethod { get; set; } = "Cash";
    public EvidenceStatus EvidenceStatus { get; set; } = EvidenceStatus.SelfReported;
    
    public TransactionStatus Status { get; set; } = TransactionStatus.Draft;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    public Business Business { get; set; } = null!;
    public TransactionCategory Category { get; set; } = null!;

    public ICollection<TransactionEvidence> TransactionEvidence { get; set; }
        = new List<TransactionEvidence>();

    public ICollection<InventoryMovement> InventoryMovements { get; set; }
        = new List<InventoryMovement>();
}