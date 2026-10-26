import { describe, expect, it } from "vitest";
import { toCents, totals, recordInventory, isBusinessState } from "./domain";
import { createDemoState } from "./demo-data";

describe("prototype business rules", () => {
  it("parses peso amounts exactly and rejects invalid financial inputs", () => {
    expect(toCents("12.50")).toBe(1250);
    expect(toCents("0.29")).toBe(29);
    for (const value of ["", "-1", "Infinity", "12.345", "abc", "1e3"]) {
      expect(() => toCents(value)).toThrow();
    }
  });
  it("starts with the financial standing shown in the approved design", () => {
    const data = createDemoState();
    expect(totals(data.transactions)).toEqual({
      inflow: 33494600,
      outflow: 16194400,
      balance: 17300200,
      loanInflow:4500000,nonLoanInflow:28994600,
    });
    expect(data.transactions).toHaveLength(317);
    expect(
      data.products.reduce(
        (sum, p) => sum + Math.round(p.quantity * p.costCents),
        0,
      ),
    ).toBe(481600);
  });
  it("records inventory and its cash payment together without mutating the source", () => {
    const initial = createDemoState();
    const next = recordInventory(initial, {
      name: "New product",
      category: "Food",
      quantity: 2,
      costCents: 1250,
      priceCents: 1600,
      supplier: "Supplier",
      payment: "Cash",
      paid: true,
      date: "2026-10-26",
      evidence: "Self-reported",
    });
    expect(initial.products).toHaveLength(6);
    expect(next.products).toHaveLength(7);
    expect(next.transactions[0].amountCents).toBe(2500);
    expect(next.transactions[0].type).toBe("outflow");
    expect(totals(next.transactions).balance).toBe(17297700);
  });
  it("rejects invalid quantities and malformed stored data", () => {
    const initial = createDemoState();
    expect(isBusinessState(initial)).toBe(true);
    expect(
      isBusinessState({ ...initial, transactions: [{ amountCents: -5 }] }),
    ).toBe(false);
    expect(
      isBusinessState({
        ...initial,
        products: [{ ...initial.products[0], quantity: Infinity }],
      }),
    ).toBe(false);
    expect(() =>
      recordInventory(initial, {
        name: "Item",
        category: "Food",
        quantity: 0,
        costCents: 1250,
        priceCents: 1600,
        supplier: "",
        payment: "Cash",
        paid: true,
        date: "2026-10-26",
        evidence: "Self-reported",
      }),
    ).toThrow();
  });
});

it("restocks the existing product with weighted cost without duplicating it", () => {
  const initial = createDemoState(),
    product = initial.products[0];
  const next = recordInventory(initial, {
    productId: product.id,
    name: product.name,
    category: product.category,
    quantity: 10,
    costCents: 1500,
    priceCents: 1600,
    supplier: "Supplier",
    payment: "Cash",
    paid: false,
    date: "2026-10-26",
    evidence: "Self-reported",
  });
  expect(next.products).toHaveLength(6);
  expect(next.products.find((p) => p.id === product.id)).toMatchObject({
    quantity: 50,
    costCents: 1300,
    unit: product.unit,
  });
  expect(next.transactions).toBe(initial.transactions);
  expect(initial.products[0].quantity).toBe(40);
});
