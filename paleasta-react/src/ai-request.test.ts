import { expect, it } from "vitest";
import { createDemoState } from "./demo-data";
import { buildLeaRequest } from "./ai-request";

it("packages exact recorded figures and limits context to business fields", () => {
  const state = createDemoState();
  state.profile.mobile = "09123456789";
  state.profile.owner = "PRIVATE_OWNER";
  const request = buildLeaRequest(state, "  Can I afford a restock?  ");
  expect(request.input.question).toBe("Can I afford a restock?");
  expect(request.input.business_context?.cash_flow).toMatchObject({
    recorded_inflow_centavos: 33494600,
    recorded_outflow_centavos: 16194400,
    loan_proceeds_centavos:4500000,other_inflow_centavos:28994600,
    net_cash_movement_centavos: 17300200,
    verified_available_cash_centavos: null,
    upcoming_bills_centavos: null,
  });
  expect(request.input.business_context?.record_period).toEqual({
    from: "2026-05-01",
    to: "2026-10-26",
  });
  expect(request.input.business_context?.recorded_days).toBe(154);
  expect(JSON.stringify(request)).not.toContain("09123456789");
  expect(JSON.stringify(request)).not.toContain("PRIVATE_OWNER");
  expect(request.instructions).toContain("never guarantee");
});

it("omits business records when context is disabled", () => {
  const state = createDemoState();
  state.preferences.leaContext = false;
  const request = buildLeaRequest(state, "What should I review?");
  expect(request.input.business_context).toBeNull();
  expect(request.input.preferred_language).toBe("Tagalog & English");
});

it("includes dated history, complete demo inventory and the seeded financing and loan register", () => {
  const context = buildLeaRequest(createDemoState(), "Review my business").input
    .business_context!;
  expect(context.transaction_history.total_records).toBe(317);
  expect(context.transaction_history.records).toHaveLength(100);
  expect(context.transaction_history.truncated).toBe(true);
  expect(context.transaction_history.records[0]).toMatchObject({
    date: "2026-10-26",
    direction: "inflow",
    amount_centavos: 43200,
  });
  expect(context.inventory.products_included).toHaveLength(6);
  expect(context.loans.status).toBe("owner_reported");
  expect(context.loans.total_outstanding_centavos).toBe(4500000);
});

it("keeps recorded loans distinct from ledger outflows and from confirmed zero debt", () => {
  const state = createDemoState();
  state.loans = [
    {
      id: "loan1",
      lender: "Demo lender",
      outstandingCents: 3000000,
      repaymentCents: 350000,
      repaymentFrequency: "monthly",
      nextDueDate: "2026-11-05",
      balanceAsOfDate: "2026-10-26",
      status: "current",
    },
  ];
  const context = buildLeaRequest(state, "Can I afford another loan?").input
    .business_context!;
  expect(context.loans.status).toBe("owner_reported");
  expect(context.loans.total_outstanding_centavos).toBe(3000000);
  expect(context.loans.scheduled_payments_centavos).toEqual({
    weekly: 0,
    monthly: 350000,
  });
  expect(context.loans.records[0].next_due_date).toBe("2026-11-05");
  expect(context.cash_flow.recorded_outflow_centavos).toBe(16194400);
  state.loans = [];
  expect(
    buildLeaRequest(state, "Review debt").input.business_context?.loans.status,
  ).toBe("owner_confirmed_none");
});

it("labels bounded context as partial instead of implying that all history is included", () => {
  const state = createDemoState();
  state.transactions = Array.from({ length: 120 }, (_, i) => ({
    ...state.transactions[0],
    id: String(i),
  }));
  const context = buildLeaRequest(state, "Review transactions").input
    .business_context!;
  expect(context.transaction_history.records).toHaveLength(100);
  expect(context.transaction_history.total_records).toBe(120);
  expect(context.transaction_history.truncated).toBe(true);
});
