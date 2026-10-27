using KitaLedgers.Model;
using KitaLedgers.Models;
using Microsoft.EntityFrameworkCore;

namespace KitaLedgers.Data;

/// <summary>Development only. Creates a sample business with ~6 months of transactions.</summary>
public static class DemoDataSeeder
{
    public static async Task<long> SeedAsync(ApplicationDbContext db, string userId)
    {
        var existing = await db.Businesses.FirstOrDefaultAsync(b => b.OwnerUserId == userId);
        if (existing is not null) return existing.Id;

        var biz = new Business { OwnerUserId = userId, Name = "Aling Nena's Store", OwnerNickname = "Aling Nena" };
        db.Businesses.Add(biz);
        await db.SaveChangesAsync();

        TransactionCategory Cat(string name, TransactionType type, bool loan = false) =>
            new() { BusinessId = biz.Id, Name = name, Type = type, IsLoanProceeds = loan };

        var sales = Cat("Retail Sales", TransactionType.Income);
        var loan = Cat("Loan proceeds", TransactionType.Income, loan: true);
        var inventory = Cat("Inventory purchase", TransactionType.Expense);
        var operating = Cat("Operating expense", TransactionType.Expense);
        var transport = Cat("Transport", TransactionType.Expense);
        db.TransactionCategories.AddRange(sales, loan, inventory, operating, transport);
        await db.SaveChangesAsync();

        var rng = new Random(42);
        var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(8));
        var start = new DateOnly(today.Year, today.Month, 1).AddMonths(-5);
        var items = new List<BusinessTransaction>();

        BusinessTransaction Tx(TransactionCategory c, decimal amount, DateOnly d, string desc, string method, EvidenceStatus ev) => new()
        {
            BusinessId = biz.Id, CategoryId = c.Id, Type = c.Type, Amount = amount,
            TransactionDate = d, Description = desc, PaymentMethod = method, EvidenceStatus = ev,
            Status = TransactionStatus.Posted,
        };

        EvidenceStatus ExpenseEvidence() => rng.Next(100) switch
        {
            < 60 => EvidenceStatus.ReceiptAttached,
            < 80 => EvidenceStatus.OwnerConfirmed,
            _ => EvidenceStatus.SelfReported,
        };

        for (var d = start; d <= today; d = d.AddDays(1))
        {
            // Leave some gaps this month so "days unlogged" has something to show.
            if (d.Year == today.Year && d.Month == today.Month && rng.Next(100) < 25) continue;

            items.Add(Tx(sales, rng.Next(9, 33) * 100, d, "Store sales (Morning & Afternoon)", "Cash", EvidenceStatus.SelfReported));
            if (rng.Next(100) < 30) items.Add(Tx(inventory, rng.Next(5, 25) * 100, d, "Beverage restock", "Cash", ExpenseEvidence()));
            if (rng.Next(100) < 12) items.Add(Tx(operating, rng.Next(3, 15) * 100, d, "Meralco electricity bill", "Maya", ExpenseEvidence()));
            if (rng.Next(100) < 10) items.Add(Tx(transport, rng.Next(1, 6) * 100, d, "Delivery transport", "Cash", EvidenceStatus.SelfReported));
        }

        items.Add(Tx(loan, 45_000m, start.AddDays(10), "Micro-loan release", "Bank", EvidenceStatus.OwnerConfirmed));

        db.Transactions.AddRange(items);
        await db.SaveChangesAsync();
        return biz.Id;
    }
}
