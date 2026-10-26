export const AI_SITUATIONS = [
  {
    id: "cash-flow",
    title: "Cash flow",
    question:
      "Can I spend ₱5,000 this week without affecting bills and loan payments?",
    guidance:
      "Use the app-provided planning balance as current cash for the prototype, then reserve upcoming bills and scheduled installments. Give the remaining balance without asking the owner to repeat their cash.",
  },
  {
    id: "restocking",
    title: "Restocking",
    question:
      "Which products should I restock first, and how much can I budget?",
    guidance:
      "Use inventory quantities, restock points, buying costs and loan commitments. Stock levels alone do not establish demand; request product-level sales when missing.",
  },
  {
    id: "pricing",
    title: "Pricing & margins",
    question: "Should I increase my selling price for cooking oil?",
    guidance:
      "Show recorded selling price less unit buying cost as a unit gross margin, not net profit. Ask about other costs, losses, demand and competitor quotes.",
  },
  {
    id: "expansion",
    title: "Business expansion",
    question: "Can I afford a refrigerator for a new beverage line?",
    guidance:
      "Use the app-provided planning balance. Request purchase cost, operating costs, funding terms and expected demand. Compare conditional scenarios without inventing forecasts.",
  },
  {
    id: "repayment",
    title: "Loan repayments",
    question: "Can my business cover its next loan repayment?",
    guidance:
      "Use each recorded balance date, repayment frequency, due date and owner-reported status. Do not convert weekly installments into exact monthly dues or double-count payments already in the ledger.",
  },
  {
    id: "borrowing",
    title: "New loan comparison",
    question: "Should I take another business loan or wait?",
    guidance:
      "Review existing debt and commitments. Ask for actual lender quotes, fees, interest basis and schedule. Do not invent rates, approval odds or creditworthiness.",
  },
  {
    id: "passport",
    title: "Financial Passport",
    question: "What is missing from my portfolio before I approach a bank?",
    guidance:
      "Review record coverage, transaction history, inventory and debt disclosures. A portfolio is not an audit or approval; ask for the bank's actual document requirements.",
  },
  {
    id: "trends",
    title: "Sales & expense patterns",
    question: "What patterns can you see in my transactions?",
    guidance:
      "Distinguish complete summary totals from the bounded transaction sample. Cash inflows can include funding, not just sales. Do not infer product sales or seasonality from absent data.",
  },
  {
    id: "records",
    title: "Record quality",
    question: "Are there entries I should review or reconcile?",
    guidance:
      "Flag possible duplicates, missing evidence and inconsistencies as items for review, not proven errors or fraud. Do not treat missing dates as zero-sales days.",
  },
  {
    id: "shortfall",
    title: "Cash shortfall",
    question:
      "Sales are slow and a repayment is due. What should I review first?",
    guidance:
      "Use the recorded planning balance and clarify essential obligations and due dates; discuss contacting the lender about available options without promising deferment or telling the owner to skip payments.",
  },
];
