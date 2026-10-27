import type { BusinessState } from "./types";
import { passportData } from "./passport-data";
import { dateLabel, money } from "./domain";
import { dueLabel } from "./loan-records";
import { Badge, Button, Card, PageTitle, Stat } from "./ui";
import { sanitizeAdviceHtml } from "./chat-html";
import { go } from "./navigation";
import "./FinancialPassport.css";

export type PassportReview = {fingerprint:string;html:string;generatedAt:string};
export type PassportProps = {state:BusinessState; review:PassportReview|null; generating:boolean; reportError:string; onGenerate:()=>void; onEnableContext:()=>void};

function Trend({data}:{data:ReturnType<typeof passportData>}) {
  const months=data.months.slice(-6), max=Math.max(1,...months.flatMap(m=>[m.receipts,m.financing,m.outflow]));
  return <Card className="passport-trend space-y-4"><div><h3>Monthly cash activity</h3><p className="mt-1 text-xs text-muted">Last six recorded months · financing shown separately</p></div>
    <div className="flex flex-wrap gap-5 text-xs"><span><i className="passport-dot" style={{background:"#247348"}}/>Other receipts</span><span><i className="passport-dot" style={{background:"#d49b25"}}/>Loan proceeds</span><span><i className="passport-dot" style={{background:"#df7861"}}/>Cash outflows</span></div>
    {!months.length ? <p className="text-muted">Add dated records to see the cash trend.</p> : <>
      <svg viewBox="0 0 660 240" className="w-full" role="img" aria-label="Monthly other receipts, loan proceeds and cash outflows. Exact values follow in the table.">
        {[0,1,2,3].map(n=><g key={n}><line x1="55" x2="650" y1={200-n*55} y2={200-n*55} stroke="#e0e7df"/><text x="48" y={204-n*55} textAnchor="end" fill="#667265" fontSize="10">{Math.round(max*n/3/1000)/100}k</text></g>)}
        {months.map((m,i)=>{const x=75+i*580/months.length;return <g key={m.month}>{(["receipts","financing","outflow"] as const).map((key,j)=><rect key={key} x={x+j*17} y={200-m[key]/max*165} width="13" height={m[key]/max*165} rx="3" fill={["#247348","#d49b25","#df7861"][j]}><title>{m.month+" "+key+": "+money(m[key],true)}</title></rect>)}<text x={x+22} y="224" textAnchor="middle" fill="#667265" fontSize="11">{new Date(m.month+"-01T00:00:00Z").toLocaleDateString("en-PH",{month:"short",timeZone:"UTC"})}</text></g>;})}
      </svg>
      <div className="passport-table"><table><caption className="sr-only">Exact monthly cash totals</caption><thead><tr><th>Month</th><th>Other receipts</th><th>Loan proceeds</th><th>Outflows</th><th>Non-financing net¹</th></tr></thead><tbody>{months.map(m=><tr key={m.month}><td>{m.month}</td><td>{money(m.receipts,true)}</td><td>{money(m.financing,true)}</td><td>{money(m.outflow,true)}</td><td>{money(m.tradingCash,true)}</td></tr>)}</tbody></table></div>
    </>}
    <p className="text-xs text-muted">¹ Other receipts less non-loan outflows; excludes borrowing and loan repayments. This is cash activity, not sales revenue or profit. The latest month may be incomplete.</p>
  </Card>;
}

function FinancialSections({state}:{state:BusinessState}) {
  const d=passportData(state),p=d.display_php;
  return <>
    <div className="grid gap-4 sm:grid-cols-3 passport-coverage">
      <Stat label="Records period" value={d.start ? d.start.slice(0,7)+" – "+d.end!.slice(0,7) : "No records"} caption={d.start ? dateLabel(d.start)+" to "+dateLabel(d.end!) : "Add transactions to begin"}/>
      <Stat label="Recorded activity" value={d.transactionCount+" entries"} caption={d.recordedDays+" recorded days · "+d.elapsedDays+" elapsed days"}/>
      <Stat label="Receipt metadata" value={d.receiptPercent === null ? "No expenses" : d.receiptPercent+"%"} caption={d.receipts+" of "+d.expenses+" non-loan expense entries"}/>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 passport-totals">{[["Other receipts",p.other_receipts,"Excludes loan proceeds"],["Financing inflows",p.financing,"Loan proceeds · not retail revenue"],["Cash outflows",p.outflows,"Includes recorded loan payments"],["Recorded net cash",p.recorded_net_cash,"Zero opening balance assumed · not profit"]].map(([label,value,caption])=><Stat key={label} label={label} value={value} caption={caption}/>)}</div>
    <Trend data={d}/>
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="passport-debt space-y-4"><h3>Owner-reported debt & payments</h3><p className="text-3xl font-bold text-forest">{p.outstanding_debt}</p><p className="text-xs text-muted">Current outstanding debt · balances and schedules are owner-reported</p>
        {state.loans == null ? <p>Loan information has not been recorded. Debt is unknown.</p> : !d.activeLoans.length ? <p>No active loan commitments reported. This owner declaration is unverified.</p> : <><p className="text-sm">Scheduled installments: {money(d.monthlyCommitments,true)} monthly · {money(d.weeklyCommitments,true)} weekly.</p>{d.activeLoans.map(l=><div className="border-t border-line pt-3 text-sm" key={l.id}><strong>{l.lender}</strong><p>{money(l.outstandingCents,true)} outstanding as of {dateLabel(l.balanceAsOfDate)}</p><p>{money(l.repaymentCents,true)} {l.repaymentFrequency} · next due {dateLabel(l.nextDueDate)}</p><p className="text-primary">{dueLabel(l,d.asOf)}</p></div>)}<p className="text-xs text-muted">{d.nearDues.length} installment(s) due in the next 7 days. Interest terms and full maturity schedules are not recorded.</p></>}
        <dl className="passport-amounts">{[["Non-loan outflows",p.non_loan_outflows],["Recorded loan payments",p.loan_payments],["Principal portion",p.principal_paid],["Interest / fees portion",p.interest_paid],["Payment split not recorded",p.unsplit_payments]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      </Card>
      <Card className="passport-evidence space-y-4"><h3>Evidence & preparation</h3><p><strong>{d.recordedDays} days with entries</strong> across the recorded period.</p><p className="text-sm text-muted">{d.daysWithoutEntries} elapsed days without entries from the first record through {dateLabel(d.asOf)}. Confirm closed days and missing activity; no entries does not prove no sales.</p><p><strong>{d.receipts} receipt metadata labels</strong> on {d.expenses} non-loan expenses.</p><p className="text-sm text-muted">{d.expenses-d.receipts} expense entries lack receipt metadata. Only receipt filenames / labels are retained; contents are not stored or verified.</p><p><strong>{d.productCount} inventory products · {p.inventory_cost}</strong></p><p className="text-sm text-muted">Current inventory at recorded cost. Confirm quantities and valuation; historical closing inventory and other unrecorded costs are needed to establish profit.</p><p className="text-sm text-muted">Reconcile the ledger with actual cash, bank and wallet balances. Confirm loan statements, terms and schedules. Ask the selected bank for its specific requirements.</p></Card>
    </div>
    <p className="text-xs text-muted">Scope: all recorded transactions dated through {dateLabel(d.asOf)} (Asia/Manila). {d.futureCount ? d.futureCount+" future-dated entries excluded. " : ""}Inventory and loan balances are current owner-reported snapshots. Figures are calculated by the app.</p>
  </>;
}
function ReviewSection({review,generating,reportError,onGenerate,state,onEnableContext}:PassportProps) {
  return <Card className="passport-review space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3>LEA’s financial review</h3><div className="no-print"><Button onClick={onGenerate} disabled={generating || !state.preferences.leaContext}>{generating ? "Generating review…" : review ? "Regenerate AI review" : reportError ? "Retry AI review" : "Generate AI review"}</Button></div></div>
    {!state.preferences.leaContext && <div className="no-print rounded-xl bg-soft p-4"><p>Business context is off. Enable it to send a financial summary to Gemini for this review. Owner identity and contact details are excluded.</p><Button variant="secondary" className="mt-3" onClick={onEnableContext}>Enable business context</Button></div>}
    {generating && <p role="status">LEA is reviewing the current financial summary…</p>}
    {reportError && <p className="error no-print" role="alert">{reportError}</p>}
    {review ? <><p className="text-xs text-muted">AI-generated narrative · {new Date(review.generatedAt).toLocaleString("en-PH",{timeZone:"Asia/Manila"})} Manila time · review before sharing</p><div className="chat-advice passport-narrative" dangerouslySetInnerHTML={{__html:sanitizeAdviceHtml(review.html)}}/></> : <p className="text-muted">Generate a review of financial position, evidence strengths, record gaps and preparation actions. Updated records require a fresh AI review.</p>}
  </Card>;
}
export function Passport(props:PassportProps) {
  return <div className="financial-passport space-y-6"><PageTitle title="Financial Passport" description="Your records, evidence and financial story — prepared for a bank’s review." action={<Button variant="secondary" onClick={()=>go("report")}>Preview portfolio →</Button>}/>
    <section className="passport-hero rounded-[20px] bg-forest p-7 text-white"><Badge>Owner-recorded · Draft for review</Badge><h2 className="mt-4 text-3xl text-white">A clearer view of your business</h2><p className="mt-3 max-w-2xl text-white/80">Bring together your cash activity, debt commitments and supporting evidence. LEA turns your current numbers into a focused financial review.</p><div className="mt-5 flex flex-wrap items-center gap-4"><Button onClick={props.onGenerate} disabled={props.generating || !props.state.preferences.leaContext}>{props.generating ? "Generating review…" : props.review ? "Regenerate AI review" : "Generate AI review"}</Button><span className="text-xs text-white/70">App-calculated figures · AI-written narrative</span></div></section>
    <FinancialSections state={props.state}/><ReviewSection {...props}/><p className="text-xs text-muted">Draft for owner review. This report is not an audit or credit rating and does not guarantee loan approval. No bank submission happens here.</p></div>;
}
export function Report(props:PassportProps) {
  return <div className="financial-passport mx-auto max-w-[1000px] space-y-6 px-5 py-8"><div className="no-print flex flex-wrap justify-between gap-3"><Button variant="secondary" onClick={()=>go("passport")}>← Back to Financial Passport</Button><Button onClick={()=>window.print()}>Print / Save PDF</Button></div><article className="report space-y-6"><div className="rounded-2xl bg-forest p-7 text-white"><p className="eyebrow text-leaf">PaLEAsta! · Owner-recorded draft</p><h1 className="mt-3 text-4xl text-white">Financial Passport</h1><h2 className="mt-4 text-white">{props.state.profile.name}</h2><p className="mt-2 text-white/80">{props.state.profile.owner} · {props.state.profile.businessType}<br/>{props.state.profile.location}</p></div><FinancialSections state={props.state}/><ReviewSection {...props}/><p className="text-xs text-muted">Prepared from locally recorded data. Not an audit, verified credit rating or loan approval. The bank independently reviews eligibility and evidence. Do not submit sample records as actual business records.</p></article></div>;
}

