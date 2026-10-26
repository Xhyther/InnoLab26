import { useEffect, useState } from "react";
import { Lea } from "./ui";
const phrases=["LEA is thinking…","LEA is pondering…","LEA is computing…"];
export function ThinkingIndicator() {
  const [phase,setPhase]=useState(0);
  useEffect(()=>{const timer=setInterval(()=>setPhase(p=>(p+1)%phrases.length),2000);return()=>clearInterval(timer);},[]);
  return <div className="thinking-indicator" role="status">
    <Lea size={48} /><span className="sr-only">LEA is preparing a reply.</span>
    <div aria-hidden="true"><p className="text-sm font-semibold text-forest">{phrases[phase]}</p><div className="thinking-dots"><span /><span /><span /></div></div>
  </div>;
}

