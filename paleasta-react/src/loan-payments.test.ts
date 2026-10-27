import { expect, it } from "vitest";
import { createDemoState } from "./demo-data";
import { isBusinessState, isLoan, monthlyCashFlow, receiptCoverage, totals } from "./domain";
import { dueLabel, upcomingLoans } from "./loan-records";
import { paymentCents, recordLoanPayment } from "./loan-payments";
import type { LoanPaymentInput } from "./loan-payments";

const initial=()=>createDemoState();
const input:LoanPaymentInput={loanId:"sample-loan-coop-2026",principalCents:300000,interestCents:50000,date:"2026-10-30",payment:"Bank transfer",nextDueDate:"2026-11-30"};
it("records total financing cash outflow and only reduces principal atomically",()=>{
  const state=initial(),before=structuredClone(state),next=recordLoanPayment(state,input);
  expect(state).toEqual(before);
  expect(next.transactions).toHaveLength(state.transactions.length+1);
  expect(next.transactions[0]).toMatchObject({cashKind:"loan_repayment",type:"outflow",loanId:input.loanId,amountCents:350000,loanPayment:{principalCents:300000,interestCents:50000}});
  expect(next.loans![0]).toMatchObject({outstandingCents:2700000,balanceAsOfDate:"2026-10-30",nextDueDate:"2026-11-30",repaymentFrequency:"monthly",repaymentCents:350000,status:"current"});
  expect(next.loans![1]).toBe(state.loans![1]);
  expect(totals(next.transactions).outflow-totals(state.transactions).outflow).toBe(350000);
  expect(totals(next.transactions).balance-totals(state.transactions).balance).toBe(-350000);
  expect(monthlyCashFlow(next.transactions).at(-1)!.outflow-monthlyCashFlow(state.transactions).at(-1)!.outflow).toBe(350000);
  expect(receiptCoverage(next.transactions)).toBe(receiptCoverage(state.transactions));
  expect(isBusinessState(next)).toBe(true);
});
it("keeps lender-confirmed due date for partial, overdue and interest-only payments",()=>{
  const state=initial();
  const next=recordLoanPayment(state,{...input,principalCents:10000,date:"2026-11-01",nextDueDate:"2026-10-30"});
  expect(next.loans![0]).toMatchObject({outstandingCents:2990000,nextDueDate:"2026-10-30",status:"overdue"});
  const interestOnly=recordLoanPayment(state,{...input,principalCents:0});
  expect(interestOnly.loans![0].outstandingCents).toBe(state.loans![0].outstandingCents);
  expect(interestOnly.transactions[0].amountCents).toBe(50000);
  const weekly=recordLoanPayment(state,{...input,loanId:state.loans![1].id,nextDueDate:"2026-11-09"});
  expect(weekly.loans![1]).toMatchObject({repaymentFrequency:"weekly",nextDueDate:"2026-11-09"});
});
it("marks a full payoff paid and removes reminders and further payments",()=>{
  const state=initial(),next=recordLoanPayment(state,{...input,principalCents:3000000,interestCents:0,nextDueDate:undefined});
  expect(next.loans![0]).toMatchObject({outstandingCents:0,status:"paid",balanceAsOfDate:input.date});
  expect(isBusinessState(next)).toBe(true);
  expect(dueLabel(next.loans![0],"2026-10-30")).toBe("Paid off");
  expect(upcomingLoans(next.loans,"2026-10-30")).not.toContainEqual(next.loans![0]);
  expect(()=>recordLoanPayment(next,input)).toThrow(/paid off/);
});
it("rejects invalid inputs without changing either cash or debt",()=>{
  const state=initial(),before=structuredClone(state);
  for(const patch of [{loanId:"missing"},{principalCents:-1},{interestCents:-1},{principalCents:0.5},{interestCents:NaN},{principalCents:3000001},{principalCents:0,interestCents:0},{date:"2026-02-31"},{date:"2026-10-26"},{nextDueDate:undefined},{nextDueDate:"2026-11-31"},{payment:" "},{interestCents:100000000001}]){
    expect(()=>recordLoanPayment(state,{...input,...patch})).toThrow();
    expect(state).toEqual(before);
  }
  expect(paymentCents("0")).toBe(0);
  expect(paymentCents("0.00")).toBe(0);
  expect(paymentCents("0.29")).toBe(29);
  for(const value of ["", "-1", "1e2", "NaN", "0.001"])expect(()=>paymentCents(value)).toThrow();
});
it("validates saved payment metadata and paid status while allowing removed loan links",()=>{
  const next=recordLoanPayment(initial(),input),entry=next.transactions[0];
  expect(isBusinessState({...next,loans:null})).toBe(true);
  for(const patch of [{loanPayment:undefined},{loanPayment:{principalCents:300001,interestCents:50000}},{loanPayment:{principalCents:-1,interestCents:350001}},{type:"inflow"},{loanId:""},{cashKind:undefined},{cashKind:"loan_disbursement"}])expect(isBusinessState({...next,transactions:[{...entry,...patch}]})).toBe(false);
  expect(isLoan({...next.loans![0],status:"paid"})).toBe(false);
  expect(isLoan({...next.loans![0],outstandingCents:0})).toBe(false);
  expect(isBusinessState({...next,loans:[next.loans![0],next.loans![0]]})).toBe(false);
});
