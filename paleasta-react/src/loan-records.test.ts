import { expect, it } from "vitest";
import { createDemoState } from "./demo-data";
import { recordLoan, dueLabel, upcomingLoans, upgradeSampleAccount } from "./loan-records";
import { totals } from "./domain";
const loan = { id:"new-loan",lender:"Test lender",outstandingCents:1000000,repaymentCents:100000,repaymentFrequency:"monthly" as const,balanceAsOfDate:"2026-10-27",nextDueDate:"2026-11-02",status:"current" as const };
it("records a new loan and net financing inflow atomically without calling it sales",()=>{
 const state=createDemoState(), next=recordLoan(state,loan,{amountCents:950000,date:"2026-10-27",payment:"Bank transfer"});
 expect(next.loans).toHaveLength((state.loans?.length ?? 0)+1);
 expect(next.transactions[0]).toMatchObject({type:"inflow",cashKind:"loan_disbursement",loanId:loan.id,amountCents:950000});
 expect(totals(next.transactions).loanInflow-totals(state.transactions).loanInflow).toBe(950000);
 expect(totals(next.transactions).nonLoanInflow).toBe(totals(state.transactions).nonLoanInflow);
 expect(state.transactions).not.toContainEqual(next.transactions[0]);
});
it("recording an existing balance does not create a second cash inflow",()=>{
 const state=createDemoState(), next=recordLoan(state,loan);
 expect(next.transactions).toBe(state.transactions);
 expect(()=>recordLoan(next,loan)).toThrow();
 expect(()=>recordLoan(state,loan,{amountCents:1100000,date:"2026-10-27",payment:"Cash"})).toThrow();
});
it("includes both seeded financing entries and repayments coming due",()=>{
 const state=createDemoState();
 expect(state.transactions).toHaveLength(317);
 expect(totals(state.transactions)).toMatchObject({inflow:33494600,outflow:16194400,balance:17300200,loanInflow:4500000,nonLoanInflow:28994600});
 expect(upcomingLoans(state.loans,"2026-10-27")).toHaveLength(2);
 expect(dueLabel(state.loans![0],"2026-10-27")).toBe("Due in 3 days");
});
it("upgrades the original sample rows once while preserving custom records",()=>{
 const state=createDemoState();
 const old={...state,sampleRevision:undefined,loans:null,transactions:state.transactions.filter(t=>!t.loanId&&!t.id.startsWith("hist-")).map(t=>({...t,date:t.date.replace("2026","2024")}))};
 const upgraded=upgradeSampleAccount(old);
 expect(upgraded.transactions).toHaveLength(317);
 expect(upgraded.transactions.every(t=>t.date.startsWith("2026"))).toBe(true);
 expect(upgradeSampleAccount(upgraded)).toBe(upgraded);
 const custom={...old,transactions:[{...old.transactions[0],id:"custom"}]};
 expect(upgradeSampleAccount(custom)).toBe(custom);
});

