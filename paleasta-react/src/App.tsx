import { upgradeSampleAccount } from "./loan-records";
import { prepareBusinessForAi } from "./ai-request";
import { useCallback, useEffect, useState, useRef } from "react";
import type { BusinessState, Mode, Page, Product, Profile } from "./types";
import { createDemoState, STORAGE_KEY } from "./demo-data";
import { isBusinessState } from "./domain";
import { Brand, Button, Icon, Lea } from "./ui";
import { asset, go, pages } from "./navigation";
import { Auth, Landing } from "./PublicPages";
import TransactionModal from "./TransactionModal";
import {
  Adviser,
  Help,
  Inventory,
  Overview,
  Passport,
  Report,
  Settings,
  Transactions,
} from "./Workspace";
import type { Message, WorkspaceProps } from "./Workspace";

function loadBusiness(): { data: BusinessState; warning: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { data: createDemoState(), warning: "" };
    const value: unknown = JSON.parse(raw);
    if (isBusinessState(value)) {
      const upgraded=upgradeSampleAccount(value);
      if(upgraded!==value){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(upgraded));}catch{/* The updated sample remains usable in memory. */}
        return {data:upgraded,warning:"Sample account expanded to May–October 2026. Custom entries and existing loan records were preserved."};
      }
      return {data:value,warning:""};
    }
    return {
      data: createDemoState(),
      warning:
        "Saved demo data was invalid. A fresh sample account has been loaded.",
    };
  } catch {
    return {
      data: createDemoState(),
      warning:
        "Browser storage is unavailable or unreadable. The prototype can still run in memory.",
    };
  }
}
const initialMessages: Message[] = [];
const readRoute = () => window.location.hash.slice(1) || "/";
export default function App() {
  const [loaded] = useState(loadBusiness);
  const [state, setState] = useState(loaded.data);
  const [route, setRoute] = useState(readRoute);
  const [toast, setToast] = useState(loaded.warning);
  const [storageWarning, setStorageWarning] = useState("");
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState<{ mode: Mode; product?: Product } | null>(
    null,
  );
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isAsking,setIsAsking] = useState(false);
  const [aiError,setAiError] = useState("");
  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => () => { requestRef.current?.abort(); }, []);
  const closeModal = useCallback(() => setModal(null), []);
  useEffect(() => {
    const change = () => {
      setRoute(readRoute());
      setMenu(false);
      setModal(null);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  function change(next: BusinessState) {
    if(next.preferences.leaContext !== state.preferences.leaContext) {
      requestRef.current?.abort(); requestRef.current=null; setIsAsking(false); setMessages([]); setAiError("");
    }
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStorageWarning("");
    } catch {
      setStorageWarning(
        "Your browser could not save this change. Export a copy from Settings; changes currently remain in memory only.",
      );
    }
  }
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 6500);
    return () => clearTimeout(timer);
  }, [toast]);
  function enter(profile?: Profile) {
    if (profile) change({ ...state, profile });
    go("overview");
    setToast("Welcome! This is a local prototype with sample business data.");
  }
  async function ask(question: string) {
    question=question.trim();
    if(!question || requestRef.current)return;
    const history=messages.at(-1)?.role === "user" && messages.at(-1)?.text === question ? messages.slice(0,-1) : messages;
    const controller=new AbortController();
    requestRef.current=controller;setIsAsking(true);setAiError("");
    setMessages([...history,{role:"user",text:question}]);go("adviser");
    const timer=setTimeout(() => controller.abort("timeout"),65000);
    try {
      const response=await fetch("/api/chat",{
        method:"POST",headers:{"Content-Type":"application/json"},signal:controller.signal,
        body:JSON.stringify({
          question,language:state.preferences.language,history:history.slice(-8).map(m => ({role:m.role,text:m.text.slice(0,4000)})),
          business:state.preferences.leaContext ? prepareBusinessForAi(state) : null,
        }),
      });
      const data=await response.json() as {html?:unknown;error?:unknown};
      if(!response.ok)throw new Error(typeof data.error === "string" ? data.error : "The AI request failed.");
      if(typeof data.html !== "string" || !data.html.trim() || data.html.length>40000)throw new Error("The AI returned an invalid reply.");
      if(requestRef.current === controller)setMessages([...history,{role:"user",text:question},{role:"lea",text:data.html}]);
    }catch(err){
      if(requestRef.current === controller && (!controller.signal.aborted || controller.signal.reason === "timeout"))setAiError(controller.signal.reason === "timeout" ? "The AI request timed out. Please try again." : err instanceof Error ? err.message : "Could not reach the AI server.");
    }finally{
      clearTimeout(timer);
      if(requestRef.current === controller){requestRef.current=null;setIsAsking(false);}
    }
  }
  function reset() {
    if (
      !window.confirm(
        "Reset this browser’s demo transactions, products, profile and preferences to the original sample data?",
      )
    )
      return;
    requestRef.current?.abort();requestRef.current=null;setIsAsking(false);setAiError("");
    change(createDemoState());
    go("overview");
    setMessages(initialMessages);
    setToast("Original demo data restored.");
  }
  const pageName = route.replace("/app/", "") as Page;
  const page = [...pages.map((p) => p.id), "help"].includes(pageName)
    ? pageName
    : "overview";
  const workspace: WorkspaceProps = {
    state,
    onChange: change,
    onTransaction: (mode, product) => setModal({ mode, product }),
    notify: setToast,
    onAsk: ask,
    onReset: reset,
    isAsking,aiError,
  };
  let content;
  switch (page) {
    case "transactions":
      content = <Transactions {...workspace} />;
      break;
    case "inventory":
      content = <Inventory {...workspace} />;
      break;
    case "adviser":
      content = <Adviser {...workspace} messages={messages} />;
      break;
    case "passport":
      content = <Passport {...workspace} />;
      break;
    case "settings":
      content = <Settings {...workspace} />;
      break;
    case "help":
      content = <Help {...workspace} />;
      break;
    default:
      content = <Overview {...workspace} />;
  }
  const publicPage = !route.startsWith("/app/");
  return (
    <>
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      {publicPage ? (
        route === "/signin" || route === "/recovery" ? (
          <Auth
            key={route}
            recovery={route === "/recovery"}
            onEnter={enter}
            notify={setToast}
          />
        ) : (
          <Landing onEnter={enter} notify={setToast} />
        )
      ) : route === "/app/report" ? (
        <Report state={state} />
      ) : (
        <>
          <div inert={!!modal}>
            {menu && (
              <button
                aria-label="Close navigation"
                className="fixed inset-0 z-20 bg-black/25 lg:hidden"
                onClick={() => setMenu(false)}
              />
            )}
            <aside
              className={`sidebar ${menu ? "open" : ""}`}
              aria-label="Business workspace navigation"
            >
              <div>
                <div className="flex items-center justify-between">
                  <button
                    aria-label="Business Overview"
                    onClick={() => go("overview")}
                  >
                    <Brand />
                  </button>
                  <button
                    aria-label="Close navigation"
                    className="mobile-menu p-2"
                    onClick={() => setMenu(false)}
                  >
                    ×
                  </button>
                </div>
                <p className="eyebrow mb-4 mt-8">Your business</p>
                <nav className="space-y-2">
                  {pages.map((item) => (
                    <button
                      key={item.id}
                      className={`nav-link ${page === item.id ? "active" : ""}`}
                      aria-current={page === item.id ? "page" : undefined}
                      onClick={() => go(item.id)}
                    >
                      <Icon name={item.id} active={page === item.id} />
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-soft p-3">
                  <Lea />
                  <div>
                    <p className="font-semibold text-forest">
                      LEA is here to help
                    </p>
                    <p className="text-xs text-muted">
                      Advice from your records
                    </p>
                  </div>
                </div>
                <button
                  className={`nav-link ${page === "help" ? "bg-soft" : ""}`}
                  aria-current={page === "help" ? "page" : undefined}
                  onClick={() => go("help")}
                >
                  <Icon name="help" />
                  Help & Guides
                </button>
                <button
                  className="w-full px-3 text-left text-xs text-muted underline"
                  onClick={() => go("landing")}
                >
                  Back to website
                </button>
              </div>
            </aside>
            <div className="app-main">
              <header className="app-header">
                <div className="flex min-w-0 items-center gap-3">
                  <Button
                    className="mobile-menu px-3"
                    variant="secondary"
                    aria-label="Open navigation"
                    onClick={() => setMenu(true)}
                  >
                    Menu
                  </Button>
                  <img
                    src={asset("78d53.png")}
                    width="32"
                    height="32"
                    alt=""
                    className="hidden shrink-0 rounded-lg sm:block"
                  />
                  <button
                    className="truncate text-left font-semibold"
                    onClick={() => go("settings")}
                  >
                    {state.profile.name}
                  </button>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  {/* <span className="hidden rounded-lg bg-soft px-3 py-1 text-xs sm:block">
                    Local prototype
                  </span> */}
                  <button
                    className="hidden p-1 md:block"
                    aria-label="View record reminders"
                    onClick={() =>
                      setToast(
                        "Review missing entries and stock levels in the Overview priorities.",
                      )
                    }
                  >
                    <Icon name="bell" />
                  </button>
                  <button
                    className="flex items-center gap-2"
                    aria-label="Open business profile"
                    onClick={() => go("settings")}
                  >
                    <img
                      src={asset("26315.png")}
                      width="32"
                      height="32"
                      alt="Demo store owner"
                      className="rounded-full"
                    />
                    <span className="hidden text-left text-xs xl:block">
                      <strong className="block">{state.profile.owner}</strong>
                      <span className="text-muted">Store owner</span>
                    </span>
                  </button>
                </div>
              </header>
              <main id="main-content" tabIndex={-1} className="workspace">
                {storageWarning && (
                  <p className="error" role="alert">
                    {storageWarning}
                  </p>
                )}
                {content}
              </main>
            </div>
          </div>
          {modal && (
            <TransactionModal
              state={state}
              initialMode={modal.mode}
              product={modal.product}
              onClose={closeModal}
              onSave={(next) => {
                change(next);
                closeModal();
                setToast(
                  "Entry saved in this browser. Your totals and portfolio are updated.",
                );
              }}
            />
          )}
        </>
      )}
      {toast && (
        <div
          className="toast fixed right-4 bottom-4 z-[100] flex max-w-[calc(100vw-32px)] items-start gap-4 rounded-2xl border border-line bg-white p-4 shadow-lg sm:max-w-md"
          role="status"
        >
          <p className="text-sm">{toast}</p>
          <button
            className="shrink-0 px-1"
            aria-label="Dismiss message"
            onClick={() => setToast("")}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
