import { money, totals } from "./domain.ts";
import { todayInManila, upcomingLoans } from "./loan-records.ts";
import type { BusinessState } from "./types.ts";

export function passportData(state: BusinessState, asOf = todayInManila()) {
  const rows = state.transactions.filter(t => t.date <= asOf);
  const dates = [...new Set(rows.map(t => t.date))].sort();
  const start = dates[0] ?? null, end = dates.at(-1) ?? null;
  const elapsedDays = start ? Math.floor((Date.parse(asOf + "T00:00:00Z") - Date.parse(start + "T00:00:00Z")) / 86400000) + 1 : 0;
  const values = totals(rows);
  const payments = rows.filter(t => t.type === "outflow" && t.cashKind === "loan_repayment");
  const repayment = payments.reduce((s,t) => s+t.amountCents,0);
  const principal = payments.reduce((s,t) => s+(t.loanPayment?.principalCents ?? 0),0);
  const interest = payments.reduce((s,t) => s+(t.loanPayment?.interestCents ?? 0),0);
  const expenses = rows.filter(t => t.type === "outflow" && t.cashKind !== "loan_repayment");
  const receipts = expenses.filter(t => t.evidence === "Receipt attached").length;
  const months: {month:string; receipts:number; financing:number; outflow:number; tradingCash:number}[] = [];
  if(start && end) {
    for(let month = start.slice(0,7); month <= end.slice(0,7);) {
      const v = totals(rows.filter(t => t.date.startsWith(month)));
      const operatingOut = rows.filter(t => t.date.startsWith(month) && t.type === "outflow" && t.cashKind !== "loan_repayment").reduce((s,t)=>s+t.amountCents,0);
      months.push({month,receipts:v.nonLoanInflow,financing:v.loanInflow,outflow:v.outflow,tradingCash:v.nonLoanInflow-operatingOut});
      const next = new Date(month+"-01T00:00:00Z"); next.setUTCMonth(next.getUTCMonth()+1); month = next.toISOString().slice(0,7);
    }
  }
  const activeLoans = (state.loans ?? []).filter(l => l.outstandingCents > 0 && l.status !== "paid");
  const amounts = {
    inflows:values.inflow,other_receipts:values.nonLoanInflow,financing:values.loanInflow,outflows:values.outflow,
    recorded_net_cash:values.balance,non_loan_outflows:values.outflow-repayment,loan_payments:repayment,
    principal_paid:principal,interest_paid:interest,unsplit_payments:repayment-principal-interest,
    inventory_cost:state.products.reduce((s,p)=>s+Math.round(p.quantity*p.costCents),0),
    outstanding_debt:state.loans == null ? null : activeLoans.reduce((s,l)=>s+l.outstandingCents,0),
  };
  return {asOf,start,end,transactionCount:rows.length,futureCount:state.transactions.length-rows.length,
    recordedDays:dates.length,elapsedDays,daysWithoutEntries:Math.max(0,elapsedDays-dates.length),
    expenses:expenses.length,receipts,receiptPercent:expenses.length ? Math.round(receipts/expenses.length*100) : null,
    productCount:state.products.length,amounts,months,activeLoans,nearDues:upcomingLoans(state.loans,asOf),
    weeklyCommitments:activeLoans.filter(l=>l.repaymentFrequency==="weekly").reduce((s,l)=>s+l.repaymentCents,0),
    monthlyCommitments:activeLoans.filter(l=>l.repaymentFrequency==="monthly").reduce((s,l)=>s+l.repaymentCents,0),
    display_php:Object.fromEntries(Object.entries(amounts).map(([key,value])=>[key,value === null ? "Unknown" : money(value,true)])),
  };
}

export function passportFingerprint(state: BusinessState, asOf = todayInManila()) {
  return JSON.stringify({asOf,context:state.preferences.leaContext,language:state.preferences.language,
    transactions:state.transactions.map(t=>[t.id,t.date,t.type,t.amountCents,t.cashKind,t.loanPayment,t.evidence]),
    inventory:state.products.map(p=>[p.id,p.quantity,p.costCents]),loans:state.loans});
}
