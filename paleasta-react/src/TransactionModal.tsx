import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type {
  BusinessState,
  Evidence,
  Mode,
  Product,
  Transaction,
} from "./types";
import { DEMO_DATE } from "./demo-data";
import { money, recordInventory, toCents } from "./domain";
import { Button, Field, Icon, Lea, Select } from "./ui";

const modes: { id: Mode; label: string }[] = [
  { id: "inventory", label: "Inventory" },
  { id: "inflow", label: "Cash inflow" },
  { id: "outflow", label: "Cash outflow" },
];
type Props = {
  state: BusinessState;
  initialMode: Mode;
  product?: Product;
  onClose: () => void;
  onSave: (next: BusinessState) => void;
};

export default function TransactionModal({
  state,
  initialMode,
  product,
  onClose,
  onSave,
}: Props) {
  const [mode, setMode] = useState(initialMode);
  const [evidence, setEvidence] = useState<Evidence>("Self-reported");
  const [receipt, setReceipt] = useState("");
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [cost, setCost] = useState(
    product ? (product.costCents / 100).toFixed(2) : "",
  );
  const [price, setPrice] = useState(
    product ? (product.priceCents / 100).toFixed(2) : "",
  );
  const [amount, setAmount] = useState("");
  const panel = useRef<HTMLElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current
      ?.querySelector<HTMLInputElement>('input:not([type="file"])')
      ?.focus();
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const controls = panel.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled):not([type="hidden"]), select, textarea, [tabindex="0"]',
        );
        const visible = Array.from(controls ?? []).filter(
          (el) => el.getClientRects().length,
        );
        const first = visible[0],
          last = visible[visible.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", keyboard);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", keyboard);
      previous?.focus();
    };
  }, [onClose]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const get = (name: string) => String(data.get(name) ?? "").trim();
    try {
      if (evidence === "Receipt attached" && !receipt)
        throw new Error("Choose a receipt file, or select Self-reported.");
      const date = get("date") || DEMO_DATE;
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date))
      )
        throw new Error("Choose a valid transaction date.");
      if (mode === "inventory") {
        const next = recordInventory(state, {
          name: get("name"),
          category: get("category"),
          quantity: Number(quantity),
          costCents: toCents(cost),
          priceCents: toCents(price),
          supplier: get("supplier"),
          payment: get("payment"),
          paid: data.get("paid") === "on",
          date,
          evidence,
          barcode: get("barcode"),
          receiptName: receipt || undefined,
          ...(product ? { productId: product.id } : {}),
        });
        onSave(next);
      } else {
        const description = get("description");
        if (!description)
          throw new Error("Add a source or category for this transaction.");
        const transaction: Transaction = {
          id: crypto.randomUUID(),
          date,
          type: mode,
          amountCents: toCents(amount),
          description: get("notes") || description,
          counterparty: get("counterparty"),
          category: description,
          payment: get("payment"),
          evidence,
          ...(receipt ? { receiptName: receipt } : {}),
        };
        onSave({
          ...state,
          transactions: [transaction, ...state.transactions],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please check your entry.");
    }
  }

  function chooseFile(file?: File) {
    if (!file) return;
    if (
      !/\.(png|jpe?g|pdf)$/i.test(file.name) ||
      !["image/png", "image/jpeg", "application/pdf", ""].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError("Choose a PNG, JPG or PDF no larger than 10 MB.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setReceipt(file.name);
    setEvidence("Receipt attached");
    setError("");
  }

  let stockCost = 0,
    margin = 0;
  try {
    stockCost = Math.round(Number(quantity) * toCents(cost));
    margin = toCents(price) - toCents(cost);
  } catch {
    /* Unfinished fields show a neutral summary. */
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="transaction-dialog"
        data-mode={mode}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-title"
        ref={panel}
      >
        <form onSubmit={submit}>
          <header className="modal-header">
            <div className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-soft">
                <Icon name="record" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="transaction-title" className="text-2xl">
                  Record transaction
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Keep your business records clear and up to date.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close transaction"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg hover:bg-soft"
                onClick={onClose}
              >
                <Icon name="close" />
              </button>
            </div>
            <div
              className="flex gap-2 rounded-xl bg-soft p-1"
              aria-label="Transaction mode"
            >
              {modes.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  className={`mode-tab mode-${tab.id} ${mode === tab.id ? "active" : ""}`}
                  aria-pressed={mode === tab.id}
                  onClick={() => {
                    setMode(tab.id);
                    setError("");
                  }}
                >
                  <Icon name={tab.id} active={mode === tab.id} />
                  {tab.label}
                </button>
              ))}
            </div>
          </header>
          <div className="modal-body">
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <section className="space-y-5">
              <div className="modal-type">
                <Icon name={mode} />
                <span>
                  {modes.find((t) => t.id === mode)?.label} ·{" "}
                  {mode === "inventory"
                    ? "Stock and buying costs"
                    : mode === "inflow"
                      ? "Money received by the business"
                      : "Money paid by the business"}
                </span>
              </div>
              <div className="modal-fields" key={mode}>
                {mode === "inventory" ? (
                  <>
                    <Field
                      label="Product name"
                      name="name"
                      placeholder="e.g. Pancit Canton 80 g"
                      defaultValue={product?.name}
                      required
                      maxLength={100}
                    />
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                      <Field
                        label="Category"
                        name="category"
                        defaultValue={product?.category}
                        placeholder="e.g. Instant noodles"
                        required
                        maxLength={60}
                      />
                      <Field
                        label="Barcode (optional)"
                        name="barcode"
                        defaultValue={product?.barcode}
                        maxLength={40}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3 sm:gap-6">
                      <Field
                        label={product ? "Quantity to add" : "Quantity"}
                        name="quantity"
                        type="number"
                        min="0.01"
                        max="1000000"
                        step="0.01"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                      />
                      <Field
                        label="Buying cost / unit"
                        name="cost"
                        inputMode="decimal"
                        placeholder="12.50"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        required
                      />
                      <Field
                        label="Selling price / unit"
                        name="price"
                        inputMode="decimal"
                        placeholder="16.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                      <Field
                        label="Supplier"
                        name="supplier"
                        defaultValue={product?.supplier}
                        maxLength={100}
                      />
                      <Select label="Payment channel" name="payment">
                        <option>Cash</option>
                        <option>GCash</option>
                        <option>Maya</option>
                        <option>Bank transfer</option>
                      </Select>
                    </div>
                    <label className="flex items-start gap-3 text-sm text-muted">
                      <input
                        className="mt-1 size-4 accent-primary"
                        type="checkbox"
                        name="paid"
                        defaultChecked
                      />
                      Also record the buying cost as a cash outflow.
                    </label>
                  </>
                ) : (
                  <>
                    <Field
                      label="Amount (PHP)"
                      name="amount"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                    <Field
                      label={
                        mode === "inflow"
                          ? "Source of cash inflow"
                          : "Expense category"
                      }
                      name="description"
                      placeholder={
                        mode === "inflow"
                          ? "e.g. Daily retail sales"
                          : "e.g. Utilities / Electricity"
                      }
                      maxLength={120}
                      required
                    />
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                      <Field
                        label={
                          mode === "inflow"
                            ? "Customer / payer (optional)"
                            : "Supplier / payee (optional)"
                        }
                        name="counterparty"
                        maxLength={100}
                      />
                      <Select label="Payment channel" name="payment">
                        <option>Cash</option>
                        <option>GCash</option>
                        <option>Maya</option>
                        <option>Bank transfer</option>
                      </Select>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                      <Field
                        label="Transaction date"
                        name="date"
                        type="date"
                        min="2000-01-01"
                        max="2099-12-31"
                        defaultValue={DEMO_DATE}
                        required
                      />
                      <Field
                        label="Notes (optional)"
                        name="notes"
                        maxLength={180}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="cash-summary flex items-start gap-3 rounded-xl bg-page p-3 text-sm font-semibold text-forest">
                <Icon name={mode} />
                <span>
                  {mode === "inventory"
                    ? stockCost
                      ? `Stock cost: ${money(stockCost, true)} · Margin: ${money(margin, true)} / unit`
                      : "Enter quantity and prices to see the stock cost."
                    : amount && !Number.isNaN(Number(amount))
                      ? `${mode === "inflow" ? "Cash inflow" : "Cash outflow"}: ${mode === "inflow" ? "+" : "−"}${money(Math.round(Number(amount) * 100), true)}`
                      : "Enter an amount to see this entry’s cash movement."}
                </span>
              </div>
            </section>
            <section className="space-y-4">
              <h3 className="flex items-center gap-2">
                <Icon name="receipt" />
                Receipt & record evidence
              </h3>
              <div className="choices">
                {(
                  [
                    "Self-reported",
                    "Receipt attached",
                    "Owner-confirmed",
                  ] as Evidence[]
                ).map((choice, i) => (
                  <button
                    type="button"
                    key={choice}
                    className={`choice ${evidence === choice ? "active" : ""}`}
                    aria-pressed={evidence === choice}
                    onClick={() => setEvidence(choice)}
                  >
                    <Icon name={["record", "receipt", "owner"][i]} />
                    {choice}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-page p-4">
                <Icon name="camera" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {receipt || "Attach a receipt"}
                  </p>
                  <p className="text-xs text-muted">
                    PNG, JPG or PDF · up to 10 MB
                  </p>
                  <p className="text-xs text-muted">
                    Only the filename is saved in this prototype.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => fileInput.current?.click()}
                >
                  Choose file
                </Button>
                <input
                  ref={fileInput}
                  type="file"
                  className="sr-only"
                  tabIndex={-1}
                  accept=".png,.jpg,.jpeg,.pdf"
                  aria-label="Receipt file"
                  onChange={(e) => chooseFile(e.target.files?.[0])}
                />
              </div>
            </section>
            <div className="flex items-center gap-3 rounded-xl bg-soft p-4">
              <Lea />
              <div>
                <p className="font-semibold text-forest">
                  A clearer entry helps LEA help you.
                </p>
                <p className="mt-1 text-muted">
                  Keep receipts and details up to date for business advice and
                  your Financial Passport.
                </p>
              </div>
            </div>
          </div>
          <footer className="modal-footer">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="sm:min-w-56">
              <Icon name="check" />
              Save{" "}
              {mode === "inventory"
                ? "inventory"
                : mode === "inflow"
                  ? "cash inflow"
                  : "cash outflow"}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
