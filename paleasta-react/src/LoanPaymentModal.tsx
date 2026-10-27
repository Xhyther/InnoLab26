import { useState } from "react";
import type { FormEvent } from "react";
import type { BusinessState } from "./types";
import { dateLabel, money } from "./domain";
import { todayInManila } from "./loan-records";
import { paymentCents, recordLoanPayment } from "./loan-payments";
import { Button, Field, Icon, Select } from "./ui";
import { Details } from "./Dialog";

export function LoanPaymentModal({state,onChange,onClose,loanId,onAddLoan}:{state:BusinessState;onChange:(next:BusinessState)=>void;onClose:()=>void;loanId?:string;onAddLoan:()=>void}) {
  const loans=(state.loans??[]).filter(l=>l.status!=="paid"&&l.outstandingCents>0);
  const [selected,setSelected]=useState(loanId??loans[0]?.id??""),[principal,setPrincipal]=useState(""),[interest,setInterest]=useState("0"),[error,setError]=useState("");
  const loan=loans.find(l=>l.id===selected);
  let principalCents=NaN,interestCents=NaN;
  try {principalCents=paymentCents(principal);interestCents=paymentCents(interest);}catch{/* Show a preview once both amounts are valid. */}
  const total=principalCents+interestCents,remaining=loan?loan.outstandingCents-principalCents:NaN;
  function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setError("");
    const data=new FormData(e.currentTarget);
    try {
      onChange(recordLoanPayment(state,{loanId:selected,principalCents:paymentCents(principal),interestCents:paymentCents(interest),date:String(data.get("date")??""),payment:String(data.get("payment")??""),nextDueDate:String(data.get("due")??"")}));
      onClose();
    }catch(err){setError(err instanceof Error?err.message:"Check the payment details.");}
  }
  return <Details title="Record loan payment" onClose={onClose} showFooterClose={false}>
    <div className="mb-5 flex items-center gap-3"><span className="icon-badge bg-outflow-soft text-outflow"><Icon name="outflow" /></span><p className="text-sm text-muted">Record a payment already made toward an existing loan.</p></div>
    {!loan?<div className="space-y-4"><p>No outstanding loan is available. Add the business loan first, then record its payment.</p><Button onClick={onAddLoan}>Add business loan</Button><Button variant="secondary" onClick={onClose}>Cancel</Button></div>:<form className="space-y-4" onSubmit={submit}>
      <Select label="Business loan" value={selected} onChange={e=>{setSelected(e.target.value);setPrincipal("");setInterest("0");setError("");}}>{loans.map(l=><option key={l.id} value={l.id}>{l.lender} · {money(l.outstandingCents,true)} outstanding</option>)}</Select>
      <p className="notice text-xs">Cash outflow · loan payment. Principal reduces debt; interest / fees do not. This saves your local records and does not send money to a lender.</p>
      {error&&<p role="alert" className="error">{error}</p>}
      <p className="text-xs text-muted">Balance as of {dateLabel(loan.balanceAsOfDate)} · scheduled {money(loan.repaymentCents,true)} / {loan.repaymentFrequency}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Principal paid (PHP)" name="principal" value={principal} onChange={e=>setPrincipal(e.target.value)} required inputMode="decimal" placeholder="0.00" />
        <Field label="Interest / fees paid (PHP)" name="interest" value={interest} onChange={e=>setInterest(e.target.value)} required inputMode="decimal" />
        <Field label="Payment date" name="date" type="date" defaultValue={todayInManila()} min={loan.balanceAsOfDate} max="2099-12-31" required />
        <Select label="Paid through" name="payment">{["Bank transfer","Cash","GCash","Maya"].map(s=><option key={s}>{s}</option>)}</Select>
        {remaining!==0&&<Field key={selected} className="sm:col-span-2" label="Next payment due (from lender)" name="due" type="date" min="2000-01-01" max="2099-12-31" required />}
      </div>
      <div className="rounded-xl bg-page p-3 text-sm" aria-live="polite"><p>Total cash outflow: <strong className="text-outflow">{Number.isFinite(total)?money(total,true):"Enter both amounts"}</strong></p><p>Remaining principal: {Number.isFinite(remaining)&&remaining>=0?money(remaining,true):"Check principal amount"}</p>{remaining===0&&<p>This loan will be marked paid off.</p>}</div>
      {remaining!==0&&<p className="text-xs text-muted">Confirm the next due date with your lender. For a partial payment, you may keep the same due date; an unpaid balance can still be overdue.</p>}
      <div className="flex flex-wrap gap-3"><Button type="submit" className="bg-outflow hover:bg-outflow/90">Save loan payment</Button><Button variant="secondary" onClick={onClose}>Cancel</Button></div>
    </form>}
  </Details>;
}
