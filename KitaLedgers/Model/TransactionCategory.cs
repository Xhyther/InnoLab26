using KitaLedgers.Models;

namespace KitaLedgers.Model;

public class TransactionCategory
{
    public long Id { get; set; }
    public long BusinessId { get; set; }

    public string Name { get; set; } = string.Empty;
    public TransactionType Type { get; set; }
    public bool IsLoanProceeds { get; set; }

    public bool IsSystemDefault { get; set; }
    public bool IsArchived { get; set; }

    public Business Business { get; set; } = null!;

    public ICollection<BusinessTransaction> Transactions { get; set; }
        = new List<BusinessTransaction>();
}