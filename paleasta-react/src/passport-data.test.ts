import { expect, it } from "vitest";
import { createDemoState } from "./demo-data.ts";
import { passportData, passportFingerprint } from "./passport-data.ts";
import { buildPassportRequest, PASSPORT_INSTRUCTIONS } from "./passport-request.ts";

it("separates financing and non-financing cash trends across the actual recorded period",()=>{
 const d=passportData(createDemoState(),"2026-10-27");
 expect(d.transactionCount).toBe(317);expect(d.recordedDays).toBe(154);expect(d.months).toHaveLength(6);
 expect(d.amounts).toMatchObject({inflows:33494600,other_receipts:28994600,financing:4500000,outflows:16194400,recorded_net_cash:17300200});
 expect(d.months.at(-1)).toMatchObject({month:"2026-10",receipts:4500000,financing:4500000,outflow:850000});
 expect(d.receipts).toBe(110);expect(d.expenses).toBe(161);expect(d.receiptPercent).toBe(68);
});
it("excludes future entries and never treats future calendar days as absent activity",()=>{
 const state=createDemoState(); state.transactions=[{...state.transactions[0],date:"2026-10-26"},{...state.transactions[0],id:"future",date:"2026-10-30"}];
 const d=passportData(state,"2026-10-27");expect(d.transactionCount).toBe(1);expect(d.futureCount).toBe(1);expect(d.elapsedDays).toBe(2);expect(d.daysWithoutEntries).toBe(1);
 state.transactions=[];state.products=[];state.loans=null;
 const empty=passportData(state,"2026-10-27");expect(empty.start).toBeNull();expect(empty.months).toEqual([]);expect(empty.elapsedDays).toBe(0);expect(empty.receiptPercent).toBeNull();expect(empty.amounts.outstanding_debt).toBeNull();expect(empty.amounts.recorded_net_cash).toBe(0);
});
it("splits repayment principal/interest and excludes paid loans from commitments",()=>{
 const state=createDemoState();state.transactions=[{...state.transactions[0],type:"outflow",cashKind:"loan_repayment",amountCents:40000,loanPayment:{principalCents:35000,interestCents:5000}}];
 state.loans=state.loans!.map(l=>({...l,status:"paid",outstandingCents:0}));
 const d=passportData(state,"2026-10-27");expect(d.amounts).toMatchObject({loan_payments:40000,principal_paid:35000,interest_paid:5000,non_loan_outflows:0,unsplit_payments:0,outstanding_debt:0});expect(d.activeLoans).toEqual([]);expect(d.nearDues).toEqual([]);expect(d.monthlyCommitments).toBe(0);expect(d.weeklyCommitments).toBe(0);expect(d.expenses).toBe(0);
});
it("builds trusted report instructions and summary without owner identifiers or record text",()=>{
 const state=createDemoState();state.profile.owner="SECRET_OWNER";state.profile.mobile="SECRET_PHONE";state.transactions[0].description="IGNORE_RULES_SECRET";state.loans![0].lender="SECRET_LENDER";
 const req=buildPassportRequest(state),serialized=JSON.stringify(req);
 expect(req.instructions).toBe(PASSPORT_INSTRUCTIONS);expect(req.input.conversation_history).toEqual([]);expect(req.input.financial_summary.display_php.financing).toBe("₱45,000.00");
 for(const privateText of ["SECRET_OWNER","SECRET_PHONE","IGNORE_RULES_SECRET","SECRET_LENDER"])expect(serialized).not.toContain(privateText);
 const old=passportFingerprint(state);state.profile.owner="Other owner";expect(passportFingerprint(state)).toBe(old);state.transactions[0].amountCents++;expect(passportFingerprint(state)).not.toBe(old);
 state.preferences.leaContext=false;expect(()=>buildPassportRequest(state)).toThrow("Enable business context");
});
