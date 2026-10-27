import type { BusinessState, Loan, Transaction } from "./types.ts";
import { isLoan } from "./domain.ts";
import { createDemoState } from "./demo-data.ts";

export function todayInManila(now = new Date()): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Manila", year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now).map(p=>[p.type,p.value]));
  return parts.year+"-"+parts.month+"-"+parts.day;
}
export function daysUntilDue(loan: Loan, asOf=todayInManila()) {
  return Math.round((Date.parse(loan.nextDueDate+"T00:00:00Z")-Date.parse(asOf+"T00:00:00Z"))/86400000);
}
export function dueLabel(loan: Loan, asOf=todayInManila()) {
  if(loan.status==="paid"||loan.outstandingCents===0)return "Paid off";
  const days=daysUntilDue(loan,asOf);
  return days<0 ? "Overdue by "+Math.abs(days)+" days" : days===0 ? "Due today" : days===1 ? "Due tomorrow" : "Due in "+days+" days";
}
export function upcomingLoans(loans: Loan[] | null | undefined, asOf=todayInManila()) {
  return (loans ?? []).filter(l=>{const d=daysUntilDue(l,asOf);return l.status!=="paid"&&l.outstandingCents>0&&d>=0&&d<=7;}).sort((a,b)=>a.nextDueDate.localeCompare(b.nextDueDate));
}
export function recordLoan(state:BusinessState,loan:Loan,receipt?:{amountCents:number;date:string;payment:string}):BusinessState {
  if(!isLoan(loan))throw new Error("Check the loan dates, amounts and lender label.");
  if((state.loans?.length ?? 0)>=100)throw new Error("This prototype supports up to 100 loan records.");
  if(state.loans?.some(l=>l.id===loan.id))throw new Error("This loan is already recorded.");
  let transactions=state.transactions;
  if(receipt) {
    const validDate=/^\d{4}-\d{2}-\d{2}$/.test(receipt.date)&&Number.isFinite(Date.parse(receipt.date))&&new Date(receipt.date).toISOString().slice(0,10)===receipt.date;
    if(!Number.isSafeInteger(receipt.amountCents)||receipt.amountCents<=0||receipt.amountCents>loan.outstandingCents||!validDate||receipt.date>loan.nextDueDate||!receipt.payment.trim())throw new Error("Check the cash received and funding date. Net proceeds cannot exceed the loan balance.");
    const entry:Transaction={id:crypto.randomUUID(),date:receipt.date,description:"Loan proceeds · "+loan.lender,category:"Loan proceeds",type:"inflow",amountCents:receipt.amountCents,payment:receipt.payment,evidence:"Self-reported",cashKind:"loan_disbursement",loanId:loan.id};
    transactions=[entry,...state.transactions];
  }
  return {...state,loans:[...(state.loans ?? []),loan],transactions};
}
export function upgradeSampleAccount(state:BusinessState):BusinessState {
  if(state.sampleRevision===3)return state;
  const seed=createDemoState(), originals=seed.transactions.filter(t=>/^(t[1-8]|s[0-9]+|e[0-9]+)$/.test(t.id));
  const recognized=originals.every(sample=>state.transactions.some(t=>t.id===sample.id&&t.amountCents===sample.amountCents&&t.description===sample.description&&["2024","2026"].includes(t.date.slice(0,4))&&t.date.slice(4)===sample.date.slice(4)));
  if(!recognized)return state;
  const originalIds=new Set(originals.map(t=>t.id));
  const transactions=state.transactions.map(t=>originalIds.has(t.id)&&t.date.startsWith("2024")?{...t,date:"2026"+t.date.slice(4)}:t);
  for(const t of seed.transactions.filter(t=>state.sampleRevision===2?t.id.startsWith("hist-"):!originalIds.has(t.id)))if(!transactions.some(existing=>existing.id===t.id))transactions.push(t);
  const loans=[...(state.loans ?? [])];
  for(const l of state.sampleRevision===2?[]:seed.loans ?? [])if(!loans.some(existing=>existing.id===l.id))loans.push(l);
  return {...state,sampleRevision:3,loans:state.sampleRevision===2?state.loans:loans,transactions:transactions.sort((a,b)=>b.date.localeCompare(a.date))};
}


