using System.Globalization;
using KitaLedgers.Model;
using Microsoft.EntityFrameworkCore;

namespace KitaLedgers.Data;

// ───────────────────────── DTOs ─────────────────────────

public sealed record DashboardDto(
    string BusinessName,
    string OwnerNickname,
    string Greeting,
    decimal Cash,
    decimal? CashDeltaPct,
    decimal Inflow,
    decimal NonLoanInflow,
    decimal? InflowDeltaPct,
    decimal Outflow,
    decimal? OutflowDeltaPct,
    IReadOnlyList<MonthPoint> Months,
    string PeriodLabel,
    int UnloggedDays,
    string MonthName,
    IReadOnlyList<RecentTx> Recent,
    int TotalTransactions);

public sealed record MonthPoint(string Label, decimal Inflow, decimal Outflow);

public sealed record RecentTx(
    long Id,
    DateOnly Date,
    string Description,
    string PaymentMethod,
    string Category,
    TransactionType Type,
    decimal Amount,
    EvidenceStatus Evidence);

// ───────────────────────── Service ─────────────────────────

public interface IDashboardService
{
    /// <summary>Null when the user has no active business yet.</summary>
    Task<DashboardDto?> GetAsync(string userId, CancellationToken ct = default);
}

/// <summary>
/// KPI definitions (change them here, nowhere else):
///  • Cash            = opening balance + all-time net of posted transactions
///  • Inflow/Outflow  = posted totals across the 6-month chart window
///  • Delta vs last month = this month to date vs the same number of days last month
/// </summary>
public sealed class DashboardService(IDbContextFactory<ApplicationDbContext> factory) : IDashboardService
{
    private const int WindowMonths = 6;

    private static readonly TimeZoneInfo Manila = ResolveManila();

    private sealed record Row(DateOnly Date, TransactionType Type, decimal Amount, bool IsLoan);

    public async Task<DashboardDto?> GetAsync(string userId, CancellationToken ct = default)
    {
        await using var db = await factory.CreateDbContextAsync(ct);

        // Ownership scoping: the business is always resolved from the signed-in user, never from client input.
        var biz = await db.Businesses.AsNoTracking()
            .Where(b => b.OwnerUserId == userId && !b.IsArchived)
            .OrderBy(b => b.Id)
            .FirstOrDefaultAsync(ct);
        if (biz is null) return null;

        var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Manila);
        var today = DateOnly.FromDateTime(nowLocal);
        var monthStart = new DateOnly(today.Year, today.Month, 1);
        var windowStart = monthStart.AddMonths(-(WindowMonths - 1));
        var prevStart = monthStart.AddMonths(-1);

        var posted = db.Transactions.AsNoTracking()
            .Where(t => t.BusinessId == biz.Id && t.Status == TransactionStatus.Posted);

        // Window rows: a few hundred at most for a small business, so aggregate in memory
        // (avoids provider-specific DateOnly.Month/Year translation issues).

        var all = await posted
            .Select(t => new Row(t.TransactionDate, t.Type, t.Amount, t.Category.IsLoanProceeds))
            .ToListAsync(ct);

        var rows = all.Where(r => r.Date >= windowStart).ToList();
        var allTimeNet = all.Sum(r => r.Type == TransactionType.Income ? r.Amount : -r.Amount);

        var cash = biz.OpeningBalance + allTimeNet;

        var inflow = Sum(rows, TransactionType.Income);
        var outflow = Sum(rows, TransactionType.Expense);
        var nonLoanInflow = rows.Where(r => r.Type == TransactionType.Income && !r.IsLoan).Sum(r => r.Amount);

        // Month-over-month, like-for-like (to-date vs same day count last month)
        var prevDays = Math.Min(today.Day, DateTime.DaysInMonth(prevStart.Year, prevStart.Month));
        var prevEnd = prevStart.AddDays(prevDays - 1);
        var cur = rows.Where(r => r.Date >= monthStart).ToList();
        var prev = rows.Where(r => r.Date >= prevStart && r.Date <= prevEnd).ToList();

        var netSincePrevEnd = rows.Where(r => r.Date > prevEnd)
            .Sum(r => r.Type == TransactionType.Income ? r.Amount : -r.Amount);
        var cashAtPrevPoint = cash - netSincePrevEnd;

        var months = Enumerable.Range(0, WindowMonths).Select(i =>
        {
            var s = windowStart.AddMonths(i);
            var e = s.AddMonths(1);
            var m = rows.Where(r => r.Date >= s && r.Date < e).ToList();
            return new MonthPoint(
                s.ToString("MMM", CultureInfo.InvariantCulture),
                Sum(m, TransactionType.Income),
                Sum(m, TransactionType.Expense));
        }).ToList();

        var loggedDays = cur.Select(r => r.Date).Distinct().Count();
        var unlogged = Math.Max(0, today.Day - loggedDays);

        var recent = await posted
            .OrderByDescending(t => t.TransactionDate).ThenByDescending(t => t.Id)
            .Take(5)
            .Select(t => new RecentTx(t.Id, t.TransactionDate, t.Description, t.PaymentMethod,
                t.Category.Name, t.Type, t.Amount, t.EvidenceStatus))
            .ToListAsync(ct);

        var total = await posted.CountAsync(ct);

        return new DashboardDto(
            BusinessName: biz.Name,
            OwnerNickname: string.IsNullOrWhiteSpace(biz.OwnerNickname) ? biz.Name : biz.OwnerNickname,
            Greeting: nowLocal.Hour switch { < 12 => "Good morning", < 18 => "Good afternoon", _ => "Good evening" },
            Cash: cash,
            CashDeltaPct: Pct(cash, cashAtPrevPoint),
            Inflow: inflow,
            NonLoanInflow: nonLoanInflow,
            InflowDeltaPct: Pct(Sum(cur, TransactionType.Income), Sum(prev, TransactionType.Income)),
            Outflow: outflow,
            OutflowDeltaPct: Pct(Sum(cur, TransactionType.Expense), Sum(prev, TransactionType.Expense)),
            Months: months,
            PeriodLabel: $"{months[0].Label} – {months[^1].Label} {today.Year}",
            UnloggedDays: unlogged,
            MonthName: monthStart.ToString("MMMM", CultureInfo.InvariantCulture),
            Recent: recent,
            TotalTransactions: total);
    }

    private static decimal Sum(IEnumerable<Row> rows, TransactionType type) =>
        rows.Where(r => r.Type == type).Sum(r => r.Amount);

    private static decimal? Pct(decimal current, decimal previous) =>
        previous == 0 ? null : Math.Round((current - previous) / Math.Abs(previous) * 100m, 1);

    private static TimeZoneInfo ResolveManila()
    {
        try { return TimeZoneInfo.FindSystemTimeZoneById("Asia/Manila"); }
        catch (TimeZoneNotFoundException)
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById("Singapore Standard Time"); }
            catch { return TimeZoneInfo.CreateCustomTimeZone("PHT", TimeSpan.FromHours(8), "PHT", "PHT"); }
        }
    }
}
