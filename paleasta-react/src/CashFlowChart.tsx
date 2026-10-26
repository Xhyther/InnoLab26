import type { Transaction } from "./types";
import { monthlyCashFlow,money } from "./domain";

export function CashFlowChart({transactions}:{transactions:Transaction[]}) {
  const months=monthlyCashFlow(transactions).slice(-6);
  if(!months.length)return <p className="my-10 text-muted">Record transactions to see your monthly cash flow.</p>;
  const ceiling=Math.max(1,...months.flatMap(m=>[m.inflow,m.outflow]));
  const x=(i:number)=>28+i*544/Math.max(1,months.length-1),y=(amount:number)=>192-amount/ceiling*160;
  const label=(month:string)=>new Intl.DateTimeFormat("en-PH",{month:"short",timeZone:"UTC"}).format(new Date(month+"-01T00:00:00Z"));
  return <figure className="mt-6 flex flex-1 flex-col justify-end" aria-label="Recorded monthly cash flow">
    <div className="mb-2 flex flex-wrap gap-4 text-xs"><span className="font-semibold text-primary">● Cash inflows</span><span className="font-semibold text-outflow">● Cash outflows</span></div>
    <svg viewBox="0 0 600 215" className="w-full" role="img" aria-label={"Monthly cash inflows and outflows, "+months[0].month+" to "+months.at(-1)!.month}>
      {[32,85,138,192].map(v=><line key={v} x1="28" y1={v} x2="572" y2={v} stroke="var(--color-line)" strokeDasharray="4 5" />)}
      {(["inflow","outflow"] as const).map(type=><g key={type} stroke={type==="inflow"?"var(--color-primary)":"var(--color-outflow)"}>
        <polyline points={months.map((m,i)=>x(i)+","+y(m[type])).join(" ")} fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {months.map((m,i)=><circle key={m.month} cx={x(i)} cy={y(m[type])} r="4" fill="white" strokeWidth="2"><title>{label(m.month)+" "+type+": "+money(m[type],true)}</title></circle>)}
      </g>)}
    </svg>
    <figcaption className="flex justify-between gap-2 px-4 text-xs text-muted">{months.map(m=><span key={m.month}>{label(m.month)}</span>)}</figcaption>
    <p className="mt-5 rounded-xl bg-soft p-3 text-xs text-muted">Recorded monthly totals · {months[0].month} to {months.at(-1)!.month}. Inflows include financing; cash movement is not profit or verified available cash.</p>
  </figure>;
}

