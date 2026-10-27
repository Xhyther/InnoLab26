using KitaLedgers.Model;
using KitaLedgers.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace KitaLedgers.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Business> Businesses => Set<Business>();
    public DbSet<TransactionCategory> TransactionCategories => Set<TransactionCategory>();
    public DbSet<BusinessTransaction> Transactions => Set<BusinessTransaction>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<InventoryMovement> InventoryMovements => Set<InventoryMovement>();
    public DbSet<Evidence> EvidenceFiles => Set<Evidence>();
    public DbSet<TransactionEvidence> TransactionEvidence => Set<TransactionEvidence>();
    public DbSet<FinancialSnapshot> FinancialSnapshots => Set<FinancialSnapshot>();
    public DbSet<PassportReport> PassportReports => Set<PassportReport>();
    public DbSet<AdvisorAssessment> AdvisorAssessments => Set<AdvisorAssessment>();
    public DbSet<AdvisorFinding> AdvisorFindings => Set<AdvisorFinding>();
    public DbSet<AdvisorAction> AdvisorActions => Set<AdvisorAction>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Rule: every relationship is configured exactly once, from the dependent side,
        // with BOTH navigations named. A bare .WithMany() on an entity that has a
        // collection navigation makes EF invent a shadow FK column.

        // Business
        builder.Entity<Business>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.OwnerNickname)
                .HasMaxLength(80);

            entity.Property(x => x.BusinessType)
                .HasMaxLength(80);

            entity.Property(x => x.CurrencyCode)
                .HasColumnType("char(3)")
                .IsRequired();

            entity.Property(x => x.OpeningBalance)
                .HasPrecision(18, 2);

            entity.HasOne(x => x.Owner)
                .WithMany(x => x.Businesses)
                .HasForeignKey(x => x.OwnerUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.OwnerUserId, x.IsArchived });
        });

        // Categories
        builder.Entity<TransactionCategory>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.Type)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.HasOne(x => x.Business)
                .WithMany(x => x.Categories)
                .HasForeignKey(x => x.BusinessId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.BusinessId, x.Type, x.Name })
                .IsUnique();
        });

        // Transactions
        builder.Entity<BusinessTransaction>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Amount)
                .HasPrecision(18, 2);

            entity.Property(x => x.Type)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(x => x.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(x => x.EvidenceStatus)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(x => x.PaymentMethod)
                .HasMaxLength(30);

            entity.Property(x => x.Description)
                .HasMaxLength(1000);

            entity.HasOne(x => x.Business)
                .WithMany(x => x.Transactions)
                .HasForeignKey(x => x.BusinessId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Category)
                .WithMany(x => x.Transactions)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.BusinessId, x.TransactionDate });
            entity.HasIndex(x => new { x.BusinessId, x.Status, x.TransactionDate });

            entity.ToTable(t => t.HasCheckConstraint("CK_Tx_Amount_Positive", "\"Amount\" > 0"));
        });

        // Products
        builder.Entity<Product>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.SKU)
                .HasMaxLength(80);

            entity.Property(x => x.UnitOfMeasure)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(x => x.ReorderLevel)
                .HasPrecision(18, 3);

            entity.HasOne(x => x.Business)
                .WithMany(x => x.Products)
                .HasForeignKey(x => x.BusinessId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.BusinessId, x.SKU })
                .IsUnique();
        });

        // Inventory movements
        builder.Entity<InventoryMovement>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.QuantityDelta)
                .HasPrecision(18, 3);

            entity.Property(x => x.MovementType)
                .HasConversion<string>()
                .HasMaxLength(30);

            entity.Property(x => x.Notes)
                .HasMaxLength(1000);

            entity.HasOne(x => x.Product)
                .WithMany(x => x.InventoryMovements)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Transaction)
                .WithMany(x => x.InventoryMovements)
                .HasForeignKey(x => x.TransactionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.ProductId, x.OccurredAtUtc });
        });

        // Evidence
        builder.Entity<Evidence>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.OriginalFileName)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(x => x.StorageKey)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(x => x.ContentType)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.ChecksumSha256)
                .HasMaxLength(64);

            entity.HasOne(x => x.Business)
                .WithMany(x => x.EvidenceFiles)
                .HasForeignKey(x => x.BusinessId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.BusinessId, x.UploadedAtUtc });
        });

        // Transaction-evidence many-to-many junction
        builder.Entity<TransactionEvidence>(entity =>
        {
            entity.HasKey(x => new { x.TransactionId, x.EvidenceId });

            entity.HasOne(x => x.Transaction)
                .WithMany(x => x.TransactionEvidence)
                .HasForeignKey(x => x.TransactionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Evidence)
                .WithMany(x => x.TransactionEvidence)
                .HasForeignKey(x => x.EvidenceId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Financial snapshots
        builder.Entity<FinancialSnapshot>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.MetricsJson)
                .HasColumnType("json")
                .IsRequired();

            entity.Property(x => x.SchemaVersion)
                .IsRequired();

            entity.HasOne(x => x.Business)
                .WithMany(x => x.FinancialSnapshots)
                .HasForeignKey(x => x.BusinessId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.BusinessId, x.PeriodEnd });
        });

        // Advisor assessments
        builder.Entity<AdvisorAssessment>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(x => x.RulesVersion)
                .HasMaxLength(50)
                .IsRequired();

            entity.HasOne(x => x.Business)
                .WithMany(x => x.AdvisorAssessments)
                .HasForeignKey(x => x.BusinessId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Snapshot)
                .WithMany(x => x.AdvisorAssessments)
                .HasForeignKey(x => x.SnapshotId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.BusinessId, x.StartedAtUtc });
        });

        // Advisor findings
        builder.Entity<AdvisorFinding>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Code)
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(x => x.Severity)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(x => x.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(x => x.Description)
                .HasMaxLength(3000)
                .IsRequired();

            entity.Property(x => x.MetricValue)
                .HasPrecision(18, 2);

            entity.HasOne(x => x.Assessment)
                .WithMany(x => x.Findings)
                .HasForeignKey(x => x.AssessmentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.AssessmentId, x.Severity });
        });

        // Advisor actions
        builder.Entity<AdvisorAction>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(x => x.Description)
                .HasMaxLength(2000);

            entity.Property(x => x.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.HasOne(x => x.Finding)
                .WithMany(x => x.Actions)
                .HasForeignKey(x => x.FindingId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Passport reports
        builder.Entity<PassportReport>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Format)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(x => x.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(x => x.StorageKey)
                .HasMaxLength(500);

            entity.HasOne(x => x.Snapshot)
                .WithMany(x => x.Reports)
                .HasForeignKey(x => x.SnapshotId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}