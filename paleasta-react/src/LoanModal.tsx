import { useState } from "react";
import type { FormEvent } from "react";
import type { BusinessState, Loan } from "./types";
import { money, toCents } from "./domain";
import { todayInManila, recordLoan } from "./loan-records";
import { Button, Field, Select, Icon } from "./ui";
import { Details } from "./Dialog";

export function LoanModal({state,onChange,onClose}:{state:BusinessState;onChange:(next:BusinessState)=>void;onClose:()=>void}) {
  const [kind,setKind]=useState("new"),[error,setError]=useState("");
  const today=todayInManila();
  function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setError("");
    const data=new FormData(e.currentTarget),value=(key:string)=>String(data.get(key)||"").trim();
    try {
      const loan:Loan={id:crypto.randomUUID(),lender:value("lender"),outstandingCents:toCents(value("outstanding")),repaymentCents:toCents(value("repayment")),repaymentFrequency:value("frequency") as Loan["repaymentFrequency"],nextDueDate:value("due"),balanceAsOfDate:value("asOf"),status:value("status") as Loan["status"]};
      onChange(recordLoan(state,loan,kind==="new"?{amountCents:toCents(value("received")),date:value("asOf"),payment:value("payment")}:undefined));
      onClose();
    } catch(err){setError(err instanceof Error?err.message:"Check the loan details.");}
  }
  return <Details title="Record business loan" onClose={onClose} showFooterClose={false}>
    <div className="mb-5 flex items-center gap-3"><span className="icon-badge"><Icon name="inflow" /></span><p className="text-sm text-muted">Track borrowed funds and the next repayment.</p></div>
    <form className="space-y-4" onSubmit={submit}>
      <Select label="What are you recording?" value={kind} onChange={e=>setKind(e.target.value)}>
        <option value="new">New funds received · add cash inflow</option>
        <option value="existing">Existing balance · no new cash</option>
      </Select>
      <p className="notice text-xs">{kind==="new"?"Net funds received are recorded as financing cash inflow, separate from sales. Use Record loan payment separately when a repayment has been made.":"Updates the loan register only. Money received earlier will not be added again."}</p>
      {error&&<p className="error" role="alert">{error}</p>}
      <Field label="Lender / loan label" name="lender" required maxLength={80} placeholder="Use a label, not an account number" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Outstanding loan balance (PHP)" name="outstanding" required inputMode="decimal" />
        <Field label="Scheduled repayment (PHP)" name="repayment" required inputMode="decimal" />
        {kind==="new"&&<Field label="Net cash received (PHP)" name="received" required inputMode="decimal" />}
        <Field label={kind==="new"?"Funds received / balance as of":"Balance as of"} name="asOf" type="date" defaultValue={today} min="2000-01-01" max="2099-12-31" required />
        <Field label="Next payment due" name="due" type="date" min="2000-01-01" max="2099-12-31" required />
        <Select label="Repayment frequency" name="frequency"><option value="monthly">Monthly</option><option value="weekly">Weekly</option></Select>
        <Select label="Loan status (owner-reported)" name="status"><option value="current">Current</option><option value="overdue">Overdue</option></Select>
        {kind==="new"&&<Select label="Funds received through" name="payment">{["Bank transfer","Cash","GCash","Maya"].map(s=><option key={s}>{s}</option>)}</Select>}
      </div>
      {kind==="new"&&<p className="text-xs text-muted">Enter the actual cash received after any fees. Fees are not automatically recorded as expenses.</p>}
      <div className="flex flex-wrap gap-3"><Button type="submit">Save loan record</Button><Button variant="secondary" onClick={onClose}>Cancel</Button></div>
      <p className="text-xs text-muted">This is a record of your existing loan, not a loan application. Amounts are stored locally in this prototype.</p>
      <span className="sr-only">Amounts in PHP, for example {money(100000,true)}.</span>
    </form>
  </Details>;
}

