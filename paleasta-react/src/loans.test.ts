import { expect, it } from "vitest";
import { createDemoState } from "./demo-data";
import { isBusinessState, isLoan } from "./domain";

const loan = {
  id: "loan1",
  lender: "Demo lender",
  outstandingCents: 3000000,
  repaymentCents: 350000,
  repaymentFrequency: "monthly",
  nextDueDate: "2024-11-05",
  balanceAsOfDate: "2024-10-26",
  status: "current",
};
it("accepts old saved accounts, unknown debt, confirmed no debt and valid loans", () => {
  const state = createDemoState();
  expect(isBusinessState(state)).toBe(true);
  expect(isBusinessState({ ...state, loans: null })).toBe(true);
  expect(isBusinessState({ ...state, loans: [] })).toBe(true);
  expect(isBusinessState({ ...state, loans: [loan] })).toBe(true);
  expect(isLoan(loan)).toBe(true);
});
it("rejects malformed loan terms and impossible dates in saved data", () => {
  for (const invalid of [
    { ...loan, outstandingCents: -1 },
    { ...loan, repaymentCents: Infinity },
    { ...loan, nextDueDate: "2024-02-31" },
    { ...loan, lender: " " },
    { ...loan, repaymentFrequency: "unknown" },
    null,
  ]) {
    expect(isLoan(invalid)).toBe(false);
    expect(isBusinessState({ ...createDemoState(), loans: [invalid] })).toBe(
      false,
    );
  }
});
