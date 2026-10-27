export type Page =
  | "overview"
  | "transactions"
  | "inventory"
  | "adviser"
  | "passport"
  | "settings"
  | "help";
export type Mode = "inventory" | "inflow" | "outflow";
export type Evidence = "Self-reported" | "Receipt attached" | "Owner-confirmed";
export type Transaction = {
  loanId?: string;
  cashKind?: "loan_disbursement" | "loan_repayment";
  loanPayment?: { principalCents: number; interestCents: number };
  id: string;
  date: string;
  description: string;
  category: string;
  type: "inflow" | "outflow";
  amountCents: number;
  payment: string;
  evidence: Evidence;
  receiptName?: string;
  counterparty?: string;
};
export type Product = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  costCents: number;
  priceCents: number;
  threshold: number;
  supplier: string;
  barcode: string;
};
export type Profile = {
  name: string;
  owner: string;
  mobile: string;
  location: string;
  businessType: string;
};
export type Preferences = {
  language: string;
  reminder: string;
  leaContext: boolean;
};
export type BusinessState = {
  version: 1;
  sampleRevision?: 2 | 3;
  loans?: Loan[] | null;
  transactions: Transaction[];
  products: Product[];
  profile: Profile;
  preferences: Preferences;
};
export type InventoryInput = {
  productId?: string;
  name: string;
  category: string;
  quantity: number;
  costCents: number;
  priceCents: number;
  supplier: string;
  payment: string;
  paid: boolean;
  date: string;
  evidence: Evidence;
  barcode?: string;
  receiptName?: string;
  counterparty?: string;
};
export type Loan = {
  id: string;
  lender: string;
  outstandingCents: number;
  repaymentCents: number;
  repaymentFrequency: "monthly" | "weekly";
  nextDueDate: string;
  balanceAsOfDate: string;
  status: "current" | "overdue" | "paid";
};
