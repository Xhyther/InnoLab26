import { CashFlowChart } from "./CashFlowChart";
import { Details } from "./Dialog";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { dueLabel } from "./loan-records";
import { AI_SITUATIONS } from "./ai-situations";
import { LoanContext } from "./LoanContext";
import { sanitizeAdviceHtml } from "./chat-html";
import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import type { BusinessState, Mode, Product, Transaction } from "./types";
import { dateLabel, money, receiptCoverage, totals } from "./domain";
import {
  Badge,
  Button,
  Card,
  Field,
  Icon,
  Lea,
  PageTitle,
  Select,
  Stat,
} from "./ui";
import { go } from "./navigation";

export type WorkspaceProps = {
  state: BusinessState;
  onChange: (state: BusinessState) => void;
  onTransaction: (mode: Mode, product?: Product) => void;
  notify: (message: string) => void;
  onAsk: (question: string) => void;
  onReset: () => void;
  isAsking: boolean;
  aiError: string;
};
export type Message = { role: "user" | "lea"; text: string };
function exportFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function csvCell(value: string | number) {
  const clean =
    typeof value === "string" && /^[=+\-@\t\r]/.test(value)
      ? "'" + value
      : String(value);
  return '"' + clean.replaceAll('"', '""') + '"';
}
function evidenceClass(t: Transaction) {
  return t.evidence === "Receipt attached"
    ? "bg-soft text-forest"
    : "bg-page text-muted";
}

export function TransactionTable({
  rows,
  details,
  loans,
}: {
  rows: Transaction[];
  details?: (t: Transaction) => void;
  loans?: BusinessState["loans"];
}) {
  return (
    <div className="table-wrap">
      <table className="data-table min-w-[730px]">
        <thead>
          <tr>
            <th>Date</th>
            <th>Details</th>
            <th>Payment</th>
            <th>Evidence</th>
            <th className="text-right">Amount</th>
            {details && (
              <th>
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td className="whitespace-nowrap text-xs text-muted">
                {dateLabel(t.date)}
              </td>
              <td>
                <p className="font-semibold">{t.description}</p>
                <p className="text-xs text-muted">{t.cashKind==="loan_disbursement"?"Cash inflow · financing":t.cashKind==="loan_repayment"?"Cash outflow · loan payment":t.category}</p>
                {t.loanId&&loans?.find(l=>l.id===t.loanId)&&<span className="due-badge">{dueLabel(loans.find(l=>l.id===t.loanId)!)}</span>}
              </td>
              <td className="text-muted">{t.payment}</td>
              <td>
                <span
                  className={`inline-block rounded-full px-2 py-1 text-[11px] ${evidenceClass(t)}`}
                >
                  {t.evidence}
                </span>
              </td>
              <td
                className={`amount text-right ${t.type === "inflow" ? "text-primary" : "text-outflow"}`}
              >
                {t.type === "inflow" ? "+" : "−"}
                {money(t.amountCents, true)}
              </td>
              {details && (
                <td>
                  <button
                    className="whitespace-nowrap text-xs font-semibold text-primary hover:underline"
                    onClick={() => details(t)}
                  >
                    View →
                  </button>
                </td>
              )}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td
                colSpan={details ? 6 : 5}
                className="py-12 text-center text-muted"
              >
                No entries match these filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export function Overview({ state, onChange, onTransaction, onAsk }: WorkspaceProps) {
  const [question, setQuestion] = useState("");
  const values = totals(state.transactions);
  const missing = Math.max(
    0,
    31 -
      new Set(
        state.transactions
          .filter((t) => t.date.startsWith("2026-10"))
          .map((t) => t.date),
      ).size,
  );
  function ask(event: FormEvent) {
    event.preventDefault();
    if (question.trim()) onAsk(question.trim());
  }
  return (
    <>
      <PageTitle
        title={`Good morning, ${state.profile.owner.split(" ")[0] || "business owner"}`}
        description="Here's how your business is doing. Explore your numbers and plan your next step."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => go("passport")}>
              Financial Passport
            </Button>
            <Button onClick={() => onTransaction("inflow")}>
              <Icon name="plus" />
              Record transaction
            </Button>
          </div>
        }
      />
      <section className="rounded-[20px] bg-forest p-6 text-white">
        <div className="flex items-center gap-4">
          <Lea size={64} />
          <div>
            <p className="eyebrow text-leaf">Your AI financial adviser</p>
            <h2 className="mt-1 text-2xl text-white md:text-[32px]">
              What are you planning for your business?
            </h2>
          </div>
        </div>
        <p className="mt-4">
          LEA uses your current business standing to help you explore decisions
          and plan your next steps.
        </p>
        <div className="my-4 flex flex-wrap gap-x-6 gap-y-2 font-semibold text-leaf">
          <span>Cash movement: {money(values.balance)}</span>
          <span>Non-loan inflows: {money(values.nonLoanInflow)}</span>
          <span className="text-outflow-light">
            Cash outflows: {money(values.outflow)}
          </span>
        </div>
        <form
          className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3"
          onSubmit={ask}
        >
          <input
            aria-label="Ask LEA about a business decision"
            className="min-w-40 flex-1 bg-transparent px-1 py-2 text-sm text-ink"
            placeholder="Ask about a decision, a plan, or your loan portfolio…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={2000}
            required
          />
          <Button type="submit" className="min-w-36">
            Ask LEA →
          </Button>
        </form>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-leaf">
          {[
            "Plan a restock",
            "Understand cash flow",
            "Prepare a bank loan portfolio",
          ].map((s) => (
            <button
              className="text-left hover:underline"
              key={s}
              onClick={() => onAsk(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-white/70">
          LEA uses your business records to help you compare plans and decisions.
        </p>
      </section>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Total balance"
          value={money(values.balance)}
          caption="Current recorded net cash movement"
          icon="balance"
        />
        <Stat
          label="Cash inflow"
          value={money(values.inflow)}
          caption={money(values.loanInflow)+" loan proceeds · financing, not sales"}
          icon="inflow"
        />
        <Stat
          label="Cash outflow"
          value={money(values.outflow)}
          caption="Expenses and recorded loan payments"
          icon="outflow"
        />
      </div>
      <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(270px,1fr)]">
        <Card className="flex flex-col">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3>Monthly Cash Flow</h3>
              <p className="mt-1 text-xs text-muted">
                Last six recorded months
              </p>
            </div>
            <Badge>Recorded activity</Badge>
          </div>
          <CashFlowChart transactions={state.transactions} />
        </Card>
        <Card className="space-y-5">
          <h3>LEA’s priorities</h3>
          <div className="rounded-xl bg-soft p-3">
            <p className="font-semibold">
              {missing} days without entries in October
            </p>
            <p className="mt-2 text-sm text-muted">
              Review missing activity before using your records for a decision.
            </p>
            <button
              className="mt-3 font-semibold text-primary"
              onClick={() => go("transactions")}
            >
              Review records →
            </button>
          </div>
          <div className="rounded-xl bg-soft p-3">
            <p className="font-semibold">Update ending inventory</p>
            <p className="mt-2 text-muted">
              Confirm stock quantities and costs for a clearer financial
              picture.
            </p>
            <button
              className="mt-3 font-semibold text-primary"
              onClick={() => go("inventory")}
            >
              Review stock →
            </button>
          </div>
          <p className="rounded-xl bg-soft p-3 text-sm text-muted">
            LEA: Review margins and stock levels before planning a bundle for
            your customers.
          </p>
        </Card>
      </div>
      <Card><LoanContext state={state} onChange={onChange} /></Card>
      <div className="space-y-4">
        <div className="flex justify-between gap-4">
          <h3>Recent transactions</h3>
          <button
            className="font-semibold text-primary"
            onClick={() => go("transactions")}
          >
            View all ({state.transactions.length}) →
          </button>
        </div>
        <TransactionTable rows={state.transactions.slice(0, 4)} loans={state.loans} />
      </div>
      <p className="text-center text-xs text-muted">
        Figures are based on your locally stored prototype transactions.
      </p>
    </>
  );
}
export function Transactions({ state, onChange, onTransaction, notify }: WorkspaceProps) {
  const [query, setQuery] = useState(""),
    [type, setType] = useState("all"),
    [evidence, setEvidence] = useState("all"),
    [payment, setPayment] = useState("all"),
    [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const values = totals(state.transactions);
  const filtered = state.transactions.filter(
    (t) =>
      (type === "all" || t.type === type) &&
      (evidence === "all" || t.evidence === evidence) &&
      (payment === "all" || t.payment === payment) &&
      (t.description + t.category + t.date)
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 8)),
    current = Math.min(page, pages - 1);
  const update = (fn: (v: string) => void, v: string) => {
    fn(v);
    setPage(0);
  };
  function download() {
    const rows: (string | number)[][] = [
      [
        "Date",
        "Description",
        "Category",
        "Type",
        "Amount (PHP)",
        "Payment",
        "Evidence",
      ],
      ...filtered.map((t) => [
        t.date,
        t.description,
        t.category,
        t.type,
        (t.type === "outflow" ? -t.amountCents : t.amountCents) / 100,
        t.payment,
        t.evidence,
      ]),
    ];
    exportFile(
      "paleasta-transactions.csv",
      "\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n"),
      "text/csv;charset=utf-8",
    );
    notify("Filtered transaction records exported as CSV.");
  }
  return (
    <>
      <PageTitle
        title="Transactions Ledger"
        description="Track sales, expenses, financing and supporting receipts."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={download}>
              Export talaan
            </Button>
            <Button onClick={() => onTransaction("inflow")}>
              <Icon name="plus" />
              Record transaction
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Total inflow"
          subtitle="Pumasok"
          value={money(values.inflow)}
          caption={money(values.loanInflow)+" financing inflows"}
          icon="inflow"
        />
        <Stat
          label="Total outflow"
          subtitle="Lumabas"
          value={money(values.outflow)}
          caption="Expenses and loan payments"
          icon="outflow"
        />
        <Stat
          label="Net cash movement"
          subtitle="Inflow less outflow"
          value={money(values.balance)}
          caption="Based on recorded entries"
          icon="balance"
        />
        <Stat
          label="Recorded entries"
          subtitle="This demo account"
          value={String(state.transactions.length)}
          caption="Owner-recorded transactions"
          icon="entries"
        />
      </div>
      <Card><LoanContext state={state} onChange={onChange} /></Card>
      <Card>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1.2fr_1fr]">
          <Field
            label="Search records"
            placeholder="Search item, category or date…"
            value={query}
            onChange={(e) => update(setQuery, e.target.value)}
          />
          <Select
            label="Transaction type"
            value={type}
            onChange={(e) => update(setType, e.target.value)}
          >
            <option value="all">All types</option>
            <option value="inflow">Cash inflow</option>
            <option value="outflow">Cash outflow</option>
          </Select>
          <Select
            label="Evidence"
            value={evidence}
            onChange={(e) => update(setEvidence, e.target.value)}
          >
            <option value="all">All evidence</option>
            {["Self-reported", "Receipt attached", "Owner-confirmed"].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </Select>
          <Select
            label="Payment channel"
            value={payment}
            onChange={(e) => update(setPayment, e.target.value)}
          >
            <option value="all">All channels</option>
            {["Cash", "GCash", "Maya", "Bank transfer"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </div>
      </Card>
      <TransactionTable
        rows={filtered.slice(current * 8, current * 8 + 8)}
        details={setSelected}
        loans={state.loans}
      />
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
        <p>
          {filtered.length ? current * 8 + 1 : 0}–
          {Math.min((current + 1) * 8, filtered.length)} of {filtered.length}{" "}
          entries
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            disabled={!current}
            onClick={() => setPage(current - 1)}
          >
            Previous
          </Button>
          <span>
            Page {current + 1} / {pages}
          </span>
          <Button
            variant="secondary"
            disabled={current + 1 >= pages}
            onClick={() => setPage(current + 1)}
          >
            Next
          </Button>
        </div>
      </div>
      <Card className="flex items-center gap-5 bg-soft">
        <Lea size={64} />
        <div className="flex-1">
          <h3>
            {receiptCoverage(state.transactions)}% of expenses have receipt
            evidence.
          </h3>
          <p className="mt-2 text-muted">
            Complete records give LEA more context and help you prepare your
            Financial Passport.
          </p>
        </div>
      </Card>
      {selected && (
        <Details title="Transaction details" onClose={() => setSelected(null)}>
          <dl className="space-y-4">
            {Object.entries({
              Date: dateLabel(selected.date),
              Description: selected.description,
              Category: selected.cashKind==="loan_disbursement"?"Cash inflow · financing":selected.cashKind==="loan_repayment"?"Cash outflow · loan payment":selected.category,
              ...(selected.loanPayment?{"Principal paid":money(selected.loanPayment.principalCents,true),"Interest / fees paid":money(selected.loanPayment.interestCents,true)}:{}),
              Amount: money(selected.amountCents, true),
              Direction: selected.type,
              Payment: selected.payment,
              Counterparty: selected.counterparty || "Not recorded",
              Evidence: selected.evidence,
              "Receipt filename": selected.receiptName || "None",
            }).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-semibold text-muted">{k}</dt>
                <dd
                  className={`mt-1 break-words ${(k === "Amount" || k === "Direction") && selected.type === "outflow" ? "text-outflow" : ""}`}
                >
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </Details>
      )}
    </>
  );
}
export function Inventory({ state, onTransaction, onAsk }: WorkspaceProps) {
  const [query, setQuery] = useState(""),
    [lowOnly, setLowOnly] = useState(false);
  const low = state.products.filter((p) => p.quantity <= p.threshold);
  const stock = state.products.reduce(
    (sum, p) => sum + Math.round(p.quantity * p.costCents),
    0,
  );
  const products = state.products.filter(
    (p) =>
      (!lowOnly || p.quantity <= p.threshold) &&
      (p.name + p.category + p.supplier)
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        title="Inventory"
        description="Know what is selling and what needs a restock."
        action={
          <Button onClick={() => onTransaction("inventory")}>
            + Add inventory
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Active products"
          value={String(state.products.length)}
          caption="Items in your business inventory"
        />
        <Stat
          label="Low stock"
          value={String(low.length)}
          caption="At or below the restock point"
        />
        <Stat
          label="Stock at cost"
          value={money(stock)}
          caption="Value of the quantities recorded"
        />
      </div>
      <Card className="flex flex-wrap items-end gap-4">
        <Field
          label="Search products"
          className="min-w-48 flex-1"
          placeholder="Search item, category or supplier…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex gap-3">
          <Button
            variant={lowOnly ? "secondary" : "primary"}
            aria-pressed={!lowOnly}
            onClick={() => setLowOnly(false)}
          >
            All products
          </Button>
          <Button
            variant={lowOnly ? "primary" : "secondary"}
            aria-pressed={lowOnly}
            onClick={() => setLowOnly(true)}
          >
            Low stock ({low.length})
          </Button>
        </div>
      </Card>
      <div className="table-wrap">
        <table className="data-table min-w-[800px]">
          <thead>
            <tr>
              <th>Product</th>
              <th>Stock</th>
              <th>Cost / unit</th>
              <th>Sell / unit</th>
              <th>Stock value</th>
              <th>Status</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted">{p.category}</p>
                </td>
                <td className="whitespace-nowrap">
                  {p.quantity} {p.unit}
                </td>
                <td className="amount">{money(p.costCents, true)}</td>
                <td className="amount">{money(p.priceCents, true)}</td>
                <td className="amount">
                  {money(Math.round(p.quantity * p.costCents), true)}
                </td>
                <td>
                  <Badge>
                    {p.quantity <= p.threshold ? "Low stock" : "In stock"}
                  </Badge>
                </td>
                <td>
                  <button
                    className="whitespace-nowrap text-xs font-semibold text-primary"
                    onClick={() => onTransaction("inventory", p)}
                  >
                    Add stock →
                  </button>
                </td>
              </tr>
            ))}
            {!products.length && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted">
                  No products match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Card className="bg-soft">
        <h3>Plan your next restock with LEA</h3>
        <p className="my-4 text-muted">
          Ask LEA to compare replenishment costs with recorded cash movement and
          upcoming expenses.
        </p>
        <Button onClick={() => onAsk("Help me plan my next restock")}>
          Discuss a restock plan with LEA →
        </Button>
      </Card>
    </>
  );
}
export function Adviser({
  state, onAsk, messages, onChange, isAsking, aiError,
}: WorkspaceProps & { messages: Message[] }) {
  const [question, setQuestion] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const values = totals(state.transactions);

  useEffect(() => {
    const panel = conversationRef.current;
    if (panel) panel.scrollTop = panel.scrollHeight;
  }, [messages.length, isAsking]);

  useEffect(() => {
    const input=questionRef.current;
    if(input){input.style.height="auto";input.style.height=Math.min(input.scrollHeight,160)+"px";}
  },[question]);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!question.trim() || isAsking) return;
    onAsk(question.trim());
    setQuestion("");
    setSelectedTopic(null);
  }
  function chooseQuestion(id: string, text: string) {
    setSelectedTopic(id);
    setQuestion(text);
    questionRef.current?.focus({ preventScroll: true });
  }
  return (
    <>
      <PageTitle title="LEA AI Financial Adviser" description="Advice grounded in your current business standing, decisions and goals." />
      {aiError && <div className="error" role="alert">
        <p>{aiError}</p>
        {messages.some(m => m.role === "user") && <Button variant="secondary" className="mt-3" disabled={isAsking} onClick={() => onAsk(messages.filter(m => m.role === "user").at(-1)!.text)}>Retry question</Button>}
      </div>}
      <div className="adviser-layout">
        <Card className="adviser-chat">
          <div ref={conversationRef} role="log" aria-label="Conversation with LEA" tabIndex={0} aria-live="polite" aria-relevant="additions" className="adviser-conversation space-y-5 pr-2" id="conversation">
            {!messages.length && <p className="rounded-xl bg-page p-4 text-muted">Ask about a business decision, or choose a topic to start a question.</p>}
            {messages.map((m, i) => <article key={i} className={m.role === "user" ? "rounded-2xl border border-line bg-page p-4" : "rounded-xl py-2"}>
              <p className="mb-3 text-xs font-semibold text-primary">{m.role === "user" ? "YOU · BUSINESS PLAN" : "LEA"}</p>
              {m.role === "user" ? <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p> : <div className="lea-answer" dangerouslySetInnerHTML={{ __html: sanitizeAdviceHtml(m.text) }} />}
            </article>)}
            {isAsking && <ThinkingIndicator />}
          </div>
          <form onSubmit={submit} className="adviser-composer space-y-3">
            <div className="field">
              <label htmlFor="lea-question" className="sr-only">Your question or business goal</label>
              <div className="adviser-input">
                <textarea id="lea-question" ref={questionRef} className="adviser-question" placeholder="Ask LEA about your business…" rows={1} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();e.currentTarget.form?.requestSubmit();}}} value={question} onChange={e => { setQuestion(e.target.value); setSelectedTopic(null); }} maxLength={2000} required />
                <div className="adviser-input-actions"><p className="adviser-footnote text-xs text-muted">{state.preferences.leaContext ? "Uses your financial records" : "Business context is off"}<span aria-hidden="true"> · </span>Check missing records and cash commitments.</p><Button type="submit" className="adviser-send" disabled={isAsking || !question.trim()} aria-label={isAsking ? "Waiting for LEA" : "Send message"} title="Send message"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6" /></svg></Button></div>
              </div>
            </div>

          </form>
        </Card>
        <aside className="adviser-context space-y-5" role="region" aria-label="Business context and question suggestions" tabIndex={0}>
          <Card className="space-y-3">
            <div><h3 className="text-lg">Explore with LEA</h3><p className="mt-1 text-xs text-muted">Choose a topic to start your question.</p></div>
            <div className="grid grid-cols-2 gap-2">
              {AI_SITUATIONS.map(s => <button type="button" key={s.id} className="question-chip" aria-pressed={selectedTopic === s.id} title={s.question} onClick={() => chooseQuestion(s.id, s.question)}>{s.title}</button>)}
            </div>
          </Card>
          <Card className="space-y-4">
            <h3>Business context</h3>
            <Badge>{state.preferences.leaContext ? "Included in next request" : "Not shared with LEA"}</Badge>
            {[
              ["Net cash movement", money(values.balance)],
              ["Recorded inflows", money(values.inflow)],
              ["Cash outflows", money(values.outflow)],
              ["Receipt coverage", receiptCoverage(state.transactions) + "%"],
            ].map(([label, value]) => <div className="flex justify-between gap-4" key={label}>
              <span className="text-muted">{label}</span>
              <strong className={`amount ${label === "Cash outflows" ? "text-outflow" : ""}`}>{value}</strong>
            </div>)}
            <details className="rounded-xl border border-line p-3">
              <summary className="font-semibold">Transaction history · {state.transactions.length} entries</summary>
              <p className="my-2 text-xs text-muted">Up to the most recent 100 entries are sent; totals cover all recorded entries.</p>
              <div className="space-y-3">{[...state.transactions].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5).map(t => <div key={t.id} className="text-xs">
                <p className="font-semibold">{t.description}</p>
                <p className="text-muted">{dateLabel(t.date)} · <span className={t.type === "outflow" ? "text-outflow" : "text-primary"}>{t.type === "outflow" ? "−" : "+"}{money(t.amountCents,true)}</span></p>
              </div>)}</div>
              <Button variant="ghost" className="mt-2" onClick={() => go("transactions")}>View all transactions</Button>
            </details>
            <details className="rounded-xl border border-line p-3">
              <summary className="font-semibold">Inventory · {state.products.length} products</summary>
              <p className="my-2 text-xs text-muted">Quantities, buying costs, prices and restock points are included for up to 100 products.</p>
              <div className="space-y-2">{state.products.slice(0,6).map(p => <p key={p.id} className="text-xs">{p.name} · {p.quantity} {p.unit}{p.quantity <= p.threshold ? " · Low stock" : ""}</p>)}</div>
              <Button variant="ghost" className="mt-2" onClick={() => go("inventory")}>Review inventory</Button>
            </details>
            <LoanContext state={state} onChange={onChange} />
          </Card>
          <Card className="space-y-4 bg-soft">
            <h3>Build toward your passport</h3>
            <p className="text-muted">Use the same financial records to prepare a clear portfolio for bank review.</p>
            <Button variant="secondary" className="w-full" onClick={() => go("passport")}>View Financial Passport</Button>
          </Card>
        </aside>
      </div>
    </>
  );
}


export { Passport, Report } from "./FinancialPassport";
export function Settings({ state, onChange, notify, onReset }: WorkspaceProps) {
  function save(
    e: FormEvent<HTMLFormElement>,
    kind: "profile" | "preferences",
  ) {
    e.preventDefault();
    const data = new FormData(e.currentTarget),
      value = (key: string) => String(data.get(key) || "").trim();
    if (kind === "profile")
      onChange({
        ...state,
        profile: {
          name: value("name"),
          owner: value("owner"),
          location: value("location"),
          mobile: value("mobile"),
          businessType: value("businessType"),
        },
      });
    else
      onChange({
        ...state,
        preferences: {
          ...state.preferences,
          language: value("language"),
          reminder: value("reminder"),
        },
      });
    notify("Saved in this browser only.");
  }
  return (
    <>
      <PageTitle
        title="Settings"
        description="Manage your business profile, account and data preferences."
      />
      <Card>
        <form className="space-y-5" onSubmit={(e) => save(e, "profile")}>
          <h3>Business profile</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Business name"
              name="name"
              defaultValue={state.profile.name}
              required
              maxLength={100}
            />
            <Field
              label="Owner name"
              name="owner"
              defaultValue={state.profile.owner}
              required
              maxLength={100}
            />
            <Field
              label="Business type"
              name="businessType"
              defaultValue={state.profile.businessType}
              required
              maxLength={80}
            />
            <Field
              label="Barangay & city"
              name="location"
              defaultValue={state.profile.location}
              required
              maxLength={120}
            />
            <Field
              label="Mobile number (optional)"
              name="mobile"
              type="tel"
              defaultValue={state.profile.mobile}
              maxLength={20}
            />
            <Field
              label="Currency"
              value="Philippine peso · PHP (₱)"
              readOnly
            />
          </div>
          <Button type="submit">Save business profile</Button>
        </form>
      </Card>
      <Card>
        <form className="space-y-5" onSubmit={(e) => save(e, "preferences")}>
          <h3>Preferences</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="LEA conversation language"
              name="language"
              defaultValue={state.preferences.language}
            >
              <option>Tagalog & English</option>
              <option>English</option>
              <option>Tagalog</option>
            </Select>
            <Field
              label="Preferred reminder time"
              name="reminder"
              type="time"
              defaultValue={state.preferences.reminder}
              required
            />
          </div>
          <p className="text-sm text-muted">
            Preferences are saved locally. LEA receives your chosen language; reminders are not sent.
          </p>
          <Button type="submit">Save preferences</Button>
        </form>
      </Card>
      <Card className="space-y-5">
        <h3>Privacy & data</h3>
        <label className="flex items-start justify-between gap-5">
          <span>
            <strong>Business context for LEA</strong>
            <span className="mt-1 block text-muted">
              Include transaction history, inventory and loan records in requests to Gemini. Changing this setting clears the current conversation.
            </span>
          </span>
          <input
            className="mt-1 size-5 accent-primary"
            type="checkbox"
            checked={state.preferences.leaContext}
            onChange={(e) => {
              onChange({
                ...state,
                preferences: {
                  ...state.preferences,
                  leaContext: e.target.checked,
                },
              });
              notify("LEA context preference saved.");
            }}
          />
        </label>
        <div className="flex items-start justify-between gap-4">
          <div>
            <strong>Sharing with banks</strong>
            <p className="mt-1 text-muted">
              No business records are shared by this prototype.
            </p>
          </div>
          <Badge>Not connected</Badge>
        </div>
        <div>
          <Button
            variant="secondary"
            onClick={() => {
              exportFile(
                "paleasta-demo-data.json",
                JSON.stringify(state, null, 2),
                "application/json",
              );
              notify("Local demo data exported.");
            }}
          >
            Export local data
          </Button>
        </div>
      </Card>
      <Card className="space-y-4">
        <h3>Prototype account & reset</h3>
        <p className="text-muted">
          No real authentication is implemented. PINs and receipt contents are
          never saved. Reset restores the original sample data.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => go("recovery")}>
            Try PIN recovery
          </Button>
          <Button variant="secondary" onClick={() => go("signin")}>
            Leave workspace
          </Button>
          <Button variant="secondary" onClick={onReset}>
            Reset demo data
          </Button>
        </div>
      </Card>
    </>
  );
}
export function Help({ onAsk }: WorkspaceProps) {
  return (
    <>
      <PageTitle
        title="Help & Guides"
        description="A little guidance for your records, business decisions and Financial Passport."
      />
      <Card className="flex flex-wrap items-center gap-5 bg-soft">
        <Lea size={88} />
        <div className="min-w-48 flex-1">
          <h3>Start with what you want to do.</h3>
          <p className="my-3 text-muted">
            Need help understanding the numbers? LEA uses your current records
            to explain patterns and explore a plan with you.
          </p>
          <Button
            onClick={() => onAsk("Help me understand my business standing")}
          >
            Ask LEA →
          </Button>
        </div>
      </Card>
      <div className="grid gap-6 md:grid-cols-3">
        {[
          [
            "Keep daily records",
            "Record sales, expenses and available receipts. Review entries regularly.",
            "transactions",
          ],
          [
            "Organize your inventory",
            "Keep quantities and costs up to date to support restock decisions.",
            "inventory",
          ],
          [
            "Prepare your portfolio",
            "Review record coverage, business details and documents before approaching a bank.",
            "passport",
          ],
        ].map(([title, body, page]) => (
          <Card className="flex flex-col gap-4" key={title}>
            <h3>{title}</h3>
            <p className="flex-1 text-muted">{body}</p>
            <Button
              variant="secondary"
              onClick={() =>
                go(page as "transactions" | "inventory" | "passport")
              }
            >
              Open {page === "passport" ? "Financial Passport" : page}
            </Button>
          </Card>
        ))}
      </div>
      <Card className="space-y-5">
        <h3>Frequently asked questions</h3>
        {[
          [
            "What does LEA use to give advice?",
            "The current business records in this browser and the goals in your question. Replies use the configured Gemini API, your recent conversation, and the business context you enable.",
          ],
          [
            "Does a Financial Passport guarantee a loan?",
            "No. It organizes financial standing and supporting records. The lender determines eligibility, requirements and approval.",
          ],
          [
            "Where is my data stored?",
            "Records are stored in this browser. Questions, recent conversation and enabled business context are sent to Gemini when you ask LEA. Use fictional data while testing.",
          ],
          [
            "How can I save a PDF?",
            "Open Financial Passport, choose Preview portfolio, then Print / Save PDF. Select Save as PDF in your browser’s print dialog.",
          ],
          [
            "What happens to uploaded receipts?",
            "Only the filename is retained for the prototype. Files are not uploaded, stored or verified.",
          ],
        ].map(([question, answer]) => (
          <details className="rounded-xl border border-line p-4" key={question}>
            <summary className="font-semibold">{question}</summary>
            <p className="mt-3 text-muted">{answer}</p>
          </details>
        ))}
      </Card>
    </>
  );
}





