import { useState } from "react";
import type { BusinessState } from "./types";
import { money, dateLabel } from "./domain";
import { dueLabel, upcomingLoans, daysUntilDue } from "./loan-records";
import { Button } from "./ui";
import { LoanModal } from "./LoanModal";

export function LoanContext({state,onChange,expanded=false}:{state:BusinessState;onChange:(next:BusinessState)=>void;expanded?:boolean}) {
  const [adding,setAdding]=useState(false);
  const due=upcomingLoans(state.loans),overdue=(state.loans ?? []).filter(l=>daysUntilDue(l)<0);
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3"><strong>Business loans</strong><Button variant="secondary" onClick={()=>setAdding(true)}>Add business loan</Button></div>
    {due.length>0&&<p className="rounded-xl bg-soft p-3 text-sm"><strong>{money(due.reduce((s,l)=>s+l.repaymentCents,0),true)}</strong> repayments due in the next 7 days · {due.length} loans</p>}
    {overdue.length>0&&<p className="error">{overdue.length} scheduled repayment{overdue.length===1?" is":"s are"} overdue. Confirm payment records.</p>}
    <details className="rounded-xl border border-line p-3" open={expanded||undefined}>
      <summary className="font-semibold">{state.loans==null?"Loan information not recorded":state.loans.length?state.loans.length+" loan records · "+money(state.loans.reduce((s,l)=>s+l.outstandingCents,0),true)+" outstanding":"Owner confirms no outstanding loans"}</summary>
      <p className="my-3 text-xs text-muted">Owner-reported balances and repayment dates. A schedule is not a recorded payment.</p>
      {state.loans?.map(loan=><div key={loan.id} className="my-3 space-y-2 rounded-xl bg-page p-3 text-sm">
        <strong className="block">{loan.lender}</strong>
        <p>Balance: <span className="text-outflow">{money(loan.outstandingCents,true)}</span> · as of {dateLabel(loan.balanceAsOfDate)}</p>
        <p>{money(loan.repaymentCents,true)} / {loan.repaymentFrequency} · next due {dateLabel(loan.nextDueDate)}</p>
        <span className={daysUntilDue(loan)<0?"badge text-outflow":"due-badge"}>{dueLabel(loan)}</span>
        <p className="text-xs text-muted">Reported status: {loan.status}</p>
        <button className="text-xs text-outflow underline" onClick={()=>{if(window.confirm("Remove this loan register entry? Its recorded cash inflow will stay in transaction history.")){const remaining=state.loans?.filter(l=>l.id!==loan.id)??[];onChange({...state,loans:remaining.length?remaining:null});}}}>Remove loan</button>
      </div>)}
      {!state.loans?.length&&<Button variant="ghost" onClick={()=>onChange({...state,loans:state.loans==null?[]:null})}>{state.loans==null?"Confirm no outstanding loans":"Mark loan information unknown"}</Button>}
    </details>
    {adding&&<LoanModal state={state} onChange={onChange} onClose={()=>setAdding(false)} />}
  </div>;
}

