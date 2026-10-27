using KitaLedgers.Model;

namespace KitaLedgers.Models;

public class Product
{
    public long Id { get; set; }
    public long BusinessId { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? SKU { get; set; }
    public string UnitOfMeasure { get; set; } = "piece";

    public decimal ReorderLevel { get; set; }
    public bool IsArchived { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Business Business { get; set; } = null!;

    public ICollection<InventoryMovement> InventoryMovements { get; set; }
        = new List<InventoryMovement>();
}

