import { recordLoanPayment } from './loan-payments';
import { prepareBusinessForAi } from './ai-request';
import { expect,it } from "vitest";
import { createDemoState } from "./demo-data";
import { buildLeaRequest } from "./ai-request";
it("uses the recorded balance for planning and provides exact peso strings",()=>{
 const request=buildLeaRequest(createDemoState(),"What is my balance?");
 const cash=request.input.business_context!.cash_flow;
 expect(cash.planning_balance_centavos).toBe(17300200);
 expect(cash.opening_balance_assumption_centavos).toBe(0);
 expect(cash.display_php.current_recorded_balance).toBe("₱173,002.00");
 expect(cash.display_php.recorded_inflows).toBe("₱334,946.00");
 expect(cash.verified_available_cash_centavos).toBeNull();
 expect(request.instructions).toContain("Do not ask the owner to restate");
 expect(request.instructions).toContain("Use display_php strings verbatim");
 expect(request.input.business_context!.transaction_history.monthly_totals).toHaveLength(6);
});


it("passes loan-payment allocation to LEA and excludes paid-off commitments",()=>{
 const state=recordLoanPayment(createDemoState(),{loanId:"sample-loan-coop-2026",principalCents:3000000,interestCents:50000,date:"2026-10-27",payment:"Bank transfer"});
 const safe=prepareBusinessForAi(state);
 expect(safe.transactions[0].loanPayment).toEqual({principalCents:3000000,interestCents:50000});
 const context=buildLeaRequest(safe,"Review my current standing").input.business_context!;
 expect(context.cash_flow).toMatchObject({loan_payment_outflow_centavos:3050000,loan_principal_paid_centavos:3000000,loan_interest_fees_paid_centavos:50000,other_outflow_centavos:16194400});
 expect(context.loans.scheduled_payments_centavos).toEqual({weekly:150000,monthly:0});
 expect(context.transaction_history.records[0].loan_payment).toEqual({principal_centavos:3000000,interest_fees_centavos:50000});
});

