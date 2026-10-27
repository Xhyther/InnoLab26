using KitaLedgers.Data;
using KitaLedgers.Model;

namespace KitaLedgers.Models;

public class Business
{
    public long Id { get; set; }

    // Matches the default string key used by IdentityUser.
    public string OwnerUserId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string? OwnerNickname { get; set; }
    public decimal OpeningBalance { get; set; }
    public string? BusinessType { get; set; }
    public string CurrencyCode { get; set; } = "PHP";

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public bool IsArchived { get; set; }

    public ApplicationUser Owner { get; set; } = null!;

    public ICollection<TransactionCategory> Categories { get; set; }
        = new List<TransactionCategory>();

    public ICollection<BusinessTransaction> Transactions { get; set; }
        = new List<BusinessTransaction>();

    public ICollection<Product> Products { get; set; }
        = new List<Product>();

    public ICollection<Evidence> EvidenceFiles { get; set; }
        = new List<Evidence>();

    public ICollection<FinancialSnapshot> FinancialSnapshots { get; set; }
        = new List<FinancialSnapshot>();

    public ICollection<AdvisorAssessment> AdvisorAssessments { get; set; }
        = new List<AdvisorAssessment>();
}




