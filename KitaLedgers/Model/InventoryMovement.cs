using KitaLedgers.Models;

namespace KitaLedgers.Model;

public class InventoryMovement
{
    public long Id { get; set; }
    public long ProductId { get; set; }

    // Optional link to the transaction that caused this stock movement.
    public long? TransactionId { get; set; }

    public InventoryMovementType MovementType { get; set; }

    // Signed quantity: positive adds stock, negative removes stock.
    public decimal QuantityDelta { get; set; }

    public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }

    public Product Product { get; set; } = null!;
    public BusinessTransaction? Transaction { get; set; }
}