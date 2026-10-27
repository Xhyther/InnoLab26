import type { BusinessState, Transaction } from "./types";
import { isLoan, toCents } from "./domain";

export type LoanPaymentInput = {
  loanId: string;
  principalCents: number;
  interestCents: number;
  date: string;
  payment: string;
  nextDueDate?: string;
};

export function paymentCents(value: string): number {
  if (/^0(?:\.0{1,2})?$/.test(value.trim())) return 0;
  return toCents(value);
}

export function recordLoanPayment(state: BusinessState, input: LoanPaymentInput): BusinessState {
  const loan=state.loans?.find(l=>l.id===input.loanId);
  if(!loan||!isLoan(loan))throw new Error("Select an existing business loan.");
  if(loan.status==="paid"||loan.outstandingCents===0)throw new Error("This loan is already paid off.");
  if(![input.principalCents,input.interestCents].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=100000000000))throw new Error("Enter valid principal and interest / fees, including zero where needed.");
  const total=input.principalCents+input.interestCents;
  if(!Number.isSafeInteger(total)||total<=0||total>100000000000)throw new Error("The total payment must be greater than zero and no more than ₱1 billion.");
  if(input.principalCents>loan.outstandingCents)throw new Error("Principal paid cannot exceed the outstanding loan balance.");
  const validDate=(s:string|undefined)=>!!s&&/^20\d{2}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
  if(!validDate(input.date)||input.date<loan.balanceAsOfDate)throw new Error("Payment date must be on or after the current balance-as-of date.");
  if(typeof input.payment!=="string"||!input.payment.trim()||input.payment.length>2000)throw new Error("Choose how this payment was made.");
  const outstandingCents=loan.outstandingCents-input.principalCents;
  if(outstandingCents>0&&!validDate(input.nextDueDate))throw new Error("Enter the next payment due date confirmed by your lender.");
  if(state.transactions.length>=10000)throw new Error("This prototype supports up to 10,000 transactions.");
  const updated={...loan,outstandingCents,balanceAsOfDate:input.date,nextDueDate:outstandingCents>0?input.nextDueDate!:loan.nextDueDate,status:outstandingCents===0?"paid" as const:input.nextDueDate!<input.date?"overdue" as const:"current" as const};
  const entry:Transaction={id:crypto.randomUUID(),date:input.date,description:"Loan payment · "+loan.lender,category:"Loan payment",type:"outflow",amountCents:total,payment:input.payment.trim(),evidence:"Self-reported",cashKind:"loan_repayment",loanId:loan.id,loanPayment:{principalCents:input.principalCents,interestCents:input.interestCents}};
  return {...state,loans:state.loans!.map(l=>l.id===loan.id?updated:l),transactions:[entry,...state.transactions]};
}
