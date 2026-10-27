import { expect,it } from "vitest";
import { LEA_INSTRUCTIONS,buildLeaRequest } from "./ai-request";
import { createDemoState } from "./demo-data";
it("requests a conversational adviser rather than a repeated report",()=>{
 expect(LEA_INSTRUCTIONS).not.toContain("Use these headings");
 expect(LEA_INSTRUCTIONS).toContain("Do not use a fixed report template");
 expect(LEA_INSTRUCTIONS).toContain("one focused follow-up question");
 expect(LEA_INSTRUCTIONS).toContain("Do not infer loan affordability from principal alone");
});
it("keeps the hospital purpose and amount available for the next short follow-up",()=>{
 const history=[
 {role:"user" as const,text:"ok lang ba na mag loan ako para sa hospital?"},
 {role:"lea" as const,text:"Magkano ang kailangan para sa hospital?"},
 {role:"user" as const,text:"900k"},
 {role:"lea" as const,text:"Kailangan nating tingnan ang paraan ng pagbabayad."},
 ];
 const request=buildLeaRequest(createDemoState(),"anong gagawin ko alangang hindi ako magpa hospital?",history);
 expect(request.input.conversation_history.map(m=>m.content)).toEqual(history.map(m=>m.text));
 expect(request.instructions).toContain("Interpret short follow-ups");
 expect(request.instructions).toContain("Do not suggest skipping or delaying necessary care");
 expect(request.instructions).toContain("Do not ask for a diagnosis");
});


it("defaults to ending a complete answer without permission questions or unrelated figures",()=>{
 expect(LEA_INSTRUCTIONS).toContain("Default to answering and stopping");
 expect(LEA_INSTRUCTIONS).toContain("Most replies should contain no question");
 expect(LEA_INSTRUCTIONS).toContain("Do not end with permission or engagement questions");
 expect(LEA_INSTRUCTIONS).not.toContain("Situation guidance:");
});
it("accepts the owner's correction and keeps refusals factual and brief",()=>{
 expect(LEA_INSTRUCTIONS).toContain("Do not infer stress");
 expect(LEA_INSTRUCTIONS).toContain("Accept an explicit denial");
 expect(LEA_INSTRUCTIONS).toContain("Never invent products");
 expect(LEA_INSTRUCTIONS).toContain("Do not include balances or loan reminders in a refusal");
});


it("reinforces user facts without treating an assistant's invented medical purpose as the user's goal",()=>{
 const request=buildLeaRequest(createDemoState(),"oo 500k",[
  {role:"user",text:"wala nmn pera lng"},
  {role:"lea",text:"Naiintindihan ko ang stress mo. Hospital bill ba ito?"},
 ]);
 expect(request.input.recent_user_statements).toEqual(["wala nmn pera lng","oo 500k"]);
 expect(request.instructions).not.toContain("Only when the owner explicitly discusses paying for necessary medical care");
});


it("reviews supplied financial records for a bank portfolio instead of a generic requirements list",()=>{
 const request=buildLeaRequest(createDemoState(),"What is missing from my portfolio before I approach a bank?");
 expect(request.input.business_context?.portfolio_review).toMatchObject({
  recorded_months:6,transaction_count:317,recorded_days:154,expense_receipt_coverage_percent:68,inventory_products:6,
  recorded_inventory_cost_php:"₱4,816.00",bank_requirements:"Not supplied; do not infer a bank's document checklist",
 });
 expect(request.instructions).toContain("Start with the records already supplied");
 expect(request.input.business_context?.portfolio_review?.expense_entries_without_receipt_metadata).toBeGreaterThan(0);
});
it("does not expose a portfolio review when business context is disabled",()=>{
 const state=createDemoState();state.preferences.leaContext=false;
 expect(buildLeaRequest(state,"Review my bank portfolio").input.business_context).toBeNull();
});

