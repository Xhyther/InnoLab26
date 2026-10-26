import { expect,it } from "vitest";
import { createDemoState } from "./demo-data";
import { monthlyCashFlow,totals,isBusinessState } from "./domain";
import { upgradeSampleAccount } from "./loan-records";
it("contains six deterministic months while retaining October's loan entries",()=>{
 const data=createDemoState();
 expect(monthlyCashFlow(data.transactions).map(m=>m.month)).toEqual(["2026-05","2026-06","2026-07","2026-08","2026-09","2026-10"]);
 expect(data.transactions.filter(t=>t.date.startsWith("2026-10"))).toHaveLength(50);
 expect(new Set(data.transactions.map(t=>t.id)).size).toBe(data.transactions.length);
 expect(isBusinessState(data)).toBe(true);
 expect(data.transactions.every(t=>t.date<="2026-10-27")).toBe(true);
 const months=monthlyCashFlow(data.transactions);
 expect(months.reduce((n,m)=>n+m.inflow-m.outflow,0)).toBe(totals(data.transactions).balance);
});
it("expands an October sample once without re-adding a removed loan or losing custom entries",()=>{
 const current=createDemoState();
 const older={...current,sampleRevision:2 as const,loans:[],transactions:current.transactions.filter(t=>!t.id.startsWith("hist-"))};
 const custom={...older.transactions[0],id:"owner-entry",description:"Owner's additional sale"};
 older.transactions.push(custom);
 const next=upgradeSampleAccount(older);
 expect(new Set(next.transactions.map(t=>t.date.slice(0,7))).size).toBe(6);
 expect(next.loans).toEqual([]);
 expect(next.transactions).toContainEqual(custom);
 expect(upgradeSampleAccount(next)).toBe(next);
});

