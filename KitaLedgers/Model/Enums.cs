namespace KitaLedgers.Model;


public enum TransactionType
{
    Income,
    Expense
}

public enum TransactionStatus
{
    Draft,
    Posted,
    Voided
}

public enum InventoryMovementType
{
    Purchase,
    Sale,
    Adjustment,
    Return,
    Damage,
    Other
}

public enum AdvisorAssessmentStatus
{
    Pending,
    Processing,
    Completed,
    Failed
}

public enum FindingSeverity
{
    Information,
    Low,
    Medium,
    High,
    Critical
}

public enum AdvisorActionStatus
{
    Pending,
    InProgress,
    Completed,
    Dismissed
}

public enum PassportReportFormat
{
    Pdf,
    Csv,
    Json
}

public enum PassportReportStatus
{
    Pending,
    Generated,
    Failed
}

public enum EvidenceStatus 
{ SelfReported, OwnerConfirmed, ReceiptAttached }
