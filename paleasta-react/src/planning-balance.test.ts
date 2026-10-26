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

