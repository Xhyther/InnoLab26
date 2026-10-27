import type {
  BusinessState,
  InventoryInput,
  Transaction,
  Loan,
} from "./types.ts";

export function toCents(value: string): number {
  const clean = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(clean))
    throw new Error("Enter a positive amount with at most two decimal places.");
  const [whole, fraction = ""] = clean.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 100000000000)
    throw new Error(
      "Enter an amount greater than zero and no more than ₱1 billion.",
    );
  return amount;
}
export const money = (cents: number, decimals = false) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(cents / 100);
export const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value + "T00:00:00Z"));
export function totals(transactions: Transaction[]) {
  const inflow = transactions
    .filter((t) => t.type === "inflow")
    .reduce((s, t) => s + t.amountCents, 0);
  const outflow = transactions
    .filter((t) => t.type === "outflow")
    .reduce((s, t) => s + t.amountCents, 0);
  const loanInflow=transactions.filter(t=>t.type==="inflow"&&t.cashKind==="loan_disbursement").reduce((s,t)=>s+t.amountCents,0);
  return { inflow, outflow, balance: inflow - outflow,loanInflow,nonLoanInflow:inflow-loanInflow };
}
export function receiptCoverage(transactions: Transaction[]) {
  const expenses = transactions.filter((t) => t.type === "outflow" && t.cashKind !== "loan_repayment");
  return expenses.length
    ? Math.round(
        (expenses.filter((t) => t.evidence === "Receipt attached").length /
          expenses.length) *
          100,
      )
    : 0;
}
export function recordInventory(
  state: BusinessState,
  input: InventoryInput,
): BusinessState {
  if (
    !input.name.trim() ||
    !Number.isFinite(input.quantity) ||
    input.quantity <= 0 ||
    input.quantity > 1000000
  )
    throw new Error("Add a product name and a quantity greater than zero.");
  if (
    ![input.costCents, input.priceCents].every(
      (n) => Number.isSafeInteger(n) && n > 0,
    )
  )
    throw new Error("Check the buying and selling prices.");
  const cost = Math.round(input.quantity * input.costCents);
  if (!Number.isSafeInteger(cost) || cost > 100000000000)
    throw new Error("The stock cost exceeds the prototype limit.");
  const existing = input.productId
    ? state.products.find((p) => p.id === input.productId)
    : undefined;
  if (input.productId && !existing)
    throw new Error("The selected product no longer exists.");
  const quantity =
    Math.round(((existing?.quantity || 0) + input.quantity) * 100) / 100;
  if (quantity > 1000000)
    throw new Error(
      "The resulting stock quantity exceeds the prototype limit.",
    );
  // shortcut: weighted unit cost is rounded to centavos; use an accounting ledger for production costing.
  const unitCost = existing
    ? Math.round((existing.quantity * existing.costCents + cost) / quantity)
    : input.costCents;
  const product = {
    id: existing?.id || crypto.randomUUID(),
    name: input.name.trim(),
    category: input.category.trim() || "Other",
    quantity,
    unit: existing?.unit || "pcs",
    costCents: unitCost,
    priceCents: input.priceCents,
    threshold: existing?.threshold ?? 10,
    supplier: input.supplier,
    barcode: input.barcode || "",
  };
  const products = existing
    ? state.products.map((p) => (p.id === existing.id ? product : p))
    : [product, ...state.products];
  const transactions: Transaction[] = input.paid
    ? [
        {
          id: crypto.randomUUID(),
          date: input.date,
          description: "Inventory: " + input.name.trim(),
          category: "Restock",
          type: "outflow",
          amountCents: cost,
          payment: input.payment,
          evidence: input.evidence,
          ...(input.receiptName ? { receiptName: input.receiptName } : {}),
        },
        ...state.transactions,
      ]
    : state.transactions;
  return { ...state, products, transactions };
}
export function isBusinessState(value: unknown): value is BusinessState {
  if (!value || typeof value !== "object") return false;
  const d = value as BusinessState;
  const str = (x: unknown) => typeof x === "string" && x.length <= 2000;
  const cents = (x: unknown) =>
    typeof x === "number" &&
    Number.isSafeInteger(x) &&
    x > 0 &&
    x <= 100000000000;
  const evidence = ["Self-reported", "Receipt attached", "Owner-confirmed"];
  return (
    d.version === 1 &&
    (d.sampleRevision===undefined || d.sampleRevision===2 || d.sampleRevision===3) &&
    (d.loans == null ||
      (Array.isArray(d.loans) &&
        d.loans.length <= 100 &&
        d.loans.every(isLoan) && new Set(d.loans.map(l=>l.id)).size===d.loans.length)) &&
    Array.isArray(d.transactions) &&
    d.transactions.length <= 10000 &&
    d.transactions.every(
      (t) =>
        t &&
        str(t.id) &&
        str(t.description) &&
        str(t.category) &&
        str(t.payment) &&
        /^\d{4}-\d{2}-\d{2}$/.test(t.date) &&
        Number.isFinite(Date.parse(t.date)) &&
        ["inflow", "outflow"].includes(t.type) &&
        cents(t.amountCents) &&
        evidence.includes(t.evidence) &&
        (t.receiptName === undefined || str(t.receiptName)) &&
        (t.counterparty === undefined || str(t.counterparty)) && (t.loanId===undefined||str(t.loanId)) &&
        (t.cashKind===undefined||(t.cashKind==="loan_disbursement"&&t.type==="inflow"&&str(t.loanId)&&!!t.loanId?.trim())||(t.cashKind==="loan_repayment"&&t.type==="outflow"&&str(t.loanId)&&!!t.loanId?.trim())) &&
        (t.cashKind==="loan_repayment" ? !!t.loanPayment &&
          [t.loanPayment.principalCents,t.loanPayment.interestCents].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=100000000000) &&
          t.loanPayment.principalCents+t.loanPayment.interestCents===t.amountCents : t.loanPayment===undefined),
    ) &&
    Array.isArray(d.products) &&
    d.products.length <= 10000 &&
    d.products.every(
      (p) =>
        p &&
        str(p.id) &&
        str(p.name) &&
        str(p.category) &&
        str(p.unit) &&
        str(p.supplier) &&
        str(p.barcode) &&
        Number.isFinite(p.quantity) &&
        p.quantity >= 0 &&
        p.quantity <= 1000000 &&
        Number.isFinite(p.threshold) &&
        p.threshold >= 0 &&
        cents(p.costCents) &&
        cents(p.priceCents),
    ) &&
    !!d.profile &&
    [
      d.profile.name,
      d.profile.owner,
      d.profile.mobile,
      d.profile.location,
      d.profile.businessType,
    ].every(str) &&
    !!d.preferences &&
    str(d.preferences.language) &&
    str(d.preferences.reminder) &&
    typeof d.preferences.leaContext === "boolean"
  );
}
export function isLoan(value: unknown): value is Loan {
  if (!value || typeof value !== "object") return false;
  const l = value as Loan;
  const amount = (n: unknown) =>
    typeof n === "number" &&
    Number.isSafeInteger(n) &&
    n > 0 &&
    n <= 100000000000;
  const date = (s: unknown) =>
    typeof s === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    Number.isFinite(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s;
  return (
    typeof l.id === "string" &&
    l.id.length > 0 &&
    l.id.length <= 100 &&
    typeof l.lender === "string" &&
    l.lender.trim().length > 0 &&
    l.lender.length <= 80 &&
    (l.status==="paid" ? l.outstandingCents===0 : amount(l.outstandingCents)) &&
    amount(l.repaymentCents) &&
    ["monthly", "weekly"].includes(l.repaymentFrequency) &&
    ["current", "overdue", "paid"].includes(l.status) &&
    date(l.nextDueDate) &&
    date(l.balanceAsOfDate)
  );
}

export function monthlyCashFlow(transactions:Transaction[]) {
  const months=new Map<string,{month:string;inflow:number;outflow:number}>();
  for(const t of transactions){const month=t.date.slice(0,7),row=months.get(month)??{month,inflow:0,outflow:0};row[t.type]+=t.amountCents;months.set(month,row);}
  return [...months.values()].sort((a,b)=>a.month.localeCompare(b.month));
}
