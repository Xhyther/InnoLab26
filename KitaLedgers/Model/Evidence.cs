using KitaLedgers.Models;

namespace KitaLedgers.Model;


public class Evidence
{
    public long Id { get; set; }
    public long BusinessId { get; set; }

    public string OriginalFileName { get; set; } = string.Empty;
    public string StorageKey { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
    public long FileSizeBytes { get; set; }

    public string? ChecksumSha256 { get; set; }

    public DateTime UploadedAtUtc { get; set; } = DateTime.UtcNow;

    public Business Business { get; set; } = null!;

    public ICollection<TransactionEvidence> TransactionEvidence { get; set; }
        = new List<TransactionEvidence>();
}