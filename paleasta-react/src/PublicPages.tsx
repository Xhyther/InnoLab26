import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Profile } from "./types";
import { Badge, Brand, Button, Card, Field, Icon, Lea, Select } from "./ui";
import { go } from "./navigation";
import "./Landing.css";

type PublicProps = {
  onEnter: (profile?: Profile) => void;
  notify: (message: string) => void;
};
export function Landing({ onEnter, notify }: PublicProps) {
  const [tab, setTab] = useState<"signup" | "signin">("signup");
  const accountDialog = useRef<HTMLDialogElement>(null);
  function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (tab === "signup") onEnter({
      name: String(form.get("name")), owner: String(form.get("owner")),
      mobile: String(form.get("mobile")), location: String(form.get("location")),
      businessType: String(form.get("businessType")),
    });
    else onEnter();
  }
  const scroll = (id: string) => document.getElementById(id)?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
  });
  const start = () => { setTab("signup"); accountDialog.current?.showModal(); };
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <button aria-label="PaLEAsta home" onClick={() => scroll("landing-top")}><Brand /></button>
          <nav aria-label="Website navigation">
            <button onClick={() => scroll("how-it-works")}>How it works</button>
            <button onClick={() => scroll("why-paleasta")}>Why PaLEAsta!</button>
          </nav>
          <div className="landing-header-actions">
            <button onClick={() => go("signin")}>Log in</button>
            <button onClick={start}>Get started</button>
          </div>
        </div>
      </header>
      <main id="landing-top">
        <section className="landing-hero landing-container" aria-labelledby="landing-title">
          <div className="landing-hero-copy">
            <p className="landing-pill"><Icon name="record" /> Built for Filipino small businesses</p>
            <h1 id="landing-title">Your hard work has a story.<br /><span>Make every peso count.</span></h1>
            <p className="landing-lead">Track your store’s finances, get practical AI business advice, and build a clearer financial record—all in one simple place.</p>
            <div className="landing-actions">
              <Button onClick={start}>Start your local demo <span aria-hidden="true">→</span></Button>
              <Button variant="secondary" onClick={() => onEnter()}>View dashboard <span aria-hidden="true">↗</span></Button>
            </div>
            <div className="landing-trust"><span>✓ &nbsp; Simple daily records</span><span>◆ &nbsp; Evidence-aware reports</span></div>
            <div className="landing-lea-intro"><Lea size={88} /><div><strong>Meet LEA, your AI financial adviser.</strong><p>Advice grounded in your business records,<br className="landing-desktop-break" /> for the decisions that move you forward.</p></div></div>
            <button className="landing-demo-link" onClick={() => onEnter()}>Explore the demo without signing up →</button>
          </div>
          <div className="landing-overview" aria-label="Illustrative October business overview">
            <div className="landing-preview-header"><div className="landing-preview-brand"><span className="landing-preview-mark"><Icon name="overview" /></span><div><strong>PaLEAsta!</strong><p>Business overview</p></div></div><span className="landing-preview-tag">Sample data</span></div>
            <div className="landing-preview-greeting"><strong>Good morning!</strong><p>Nena’s Sari-Sari Store</p></div>
            <div className="landing-preview-stats">
              <div><p><Icon name="inflow" /> Non-loan receipts</p><strong>₱45,000</strong></div>
              <div><p><Icon name="outflow" /> Recorded outflow</p><strong>₱8,500</strong></div>
              <div><p><Icon name="balance" /> Difference</p><strong>₱36,500</strong></div>
            </div>
            <div className="landing-preview-table"><div className="landing-table-title"><strong>Recent transactions</strong><span>October example</span></div><table><thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Evidence</th></tr></thead><tbody>
              <tr><td>Oct 24</td><td>Grocery supplies</td><td className="landing-outflow">− ₱2,500</td><td><span className="landing-proof" aria-label="Receipt recorded">✓</span></td></tr>
              <tr><td>Oct 24</td><td>Sales (cash)</td><td>+ ₱4,200</td><td><span className="landing-proof" aria-label="Receipt recorded">✓</span></td></tr>
              <tr><td>Oct 23</td><td>Electricity bill</td><td className="landing-outflow">− ₱1,500</td><td><span aria-label="Evidence not recorded">ⓘ</span></td></tr>
              <tr><td>Oct 23</td><td>Sales (cash)</td><td>+ ₱3,800</td><td><span className="landing-proof" aria-label="Receipt recorded">✓</span></td></tr>
            </tbody></table></div>
            <p className="landing-preview-note"><span aria-hidden="true">ⓘ</span> Illustrative October snapshot. Receipts exclude loan proceeds; the difference is not cash on hand. Evidence is recorded, not independently verified.</p>
          </div>
        </section>
        <section id="advice" className="landing-advice landing-container" aria-labelledby="landing-advice-title">
          <div className="landing-advice-copy"><p className="landing-eyebrow">The main feature / LEA AI financial adviser</p><h2 id="landing-advice-title">Advice that starts<br />with your business.</h2><p className="landing-lead">LEA uses your current financial standing to help you think through decisions, compare plans, and identify steps toward your business goals.</p><Lea size={164} /></div>
          <div className="landing-advice-panel"><div className="landing-panel-title"><strong>Plan a decision with LEA</strong><span>Illustrative example</span></div>
            <div className="landing-advice-stats"><div><p>Receipt–outflow difference</p><strong>₱36,500</strong></div><div><p>October non-loan receipts</p><strong>₱45,000</strong></div></div>
            <div className="landing-goal"><strong>Your business goal</strong><dl><div><dt>Question for LEA</dt><dd>Can I add a new product line?</dd></div><div><dt>Business context</dt><dd>Cash flow, costs & inventory</dd></div><div><dt>Plan to explore</dt><dd>Budget & expected demand</dd></div></dl></div>
            <div className="landing-advice-answer"><Lea size={40} /><div><strong>LEA / Advice based on your records</strong><p>“Let’s compare the cost with your cash on hand, upcoming bills, and sales trends before you decide.”</p></div></div>
          </div>
        </section>
        <section className="landing-audience" aria-label="Businesses we support"><div className="landing-container"><p className="landing-eyebrow">Built for the businesses that keep our communities moving</p><div>{[["inventory", "Sari-sari stores"], ["record", "Market vendors"], ["owner", "Home-based sellers"], ["transactions", "Micro retailers"]].map(([icon, label]) => <span key={label}><Icon name={icon} />{label}</span>)}</div></div></section>
        <section id="why-paleasta" className="landing-benefits landing-container" aria-labelledby="landing-benefits-title">
          <div><p className="landing-eyebrow">Your business, organized</p><h2 id="landing-benefits-title">Managing your daily sales shouldn’t feel like a second job.</h2><p className="landing-lead">Manual tracking wastes time, risks lost data, and makes it hard to see the big picture. Bring your scattered records into one simple app to understand your position and get AI-driven advice on your next move.</p></div>
          <div id="how-it-works" className="landing-benefit-list">{[
            ["balance", "Track every peso", "Record daily sales and expenses, and see which entries have supporting evidence."],
            ["adviser", "Get practical guidance", "Turn recorded activity into prioritized, understandable insights and actionable next steps."],
            ["passport", "Build your Financial Passport", "Organize financial indicators, supporting records, and data limitations into a draft report for potential lenders."],
            ["overview", "Understand your finances", "Bring your business data together for AI-powered financial insights, then review your next decision with confidence."],
          ].map(([icon, title, copy]) => <article key={title}><span className="landing-benefit-icon"><Icon name={icon} /></span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div>
        </section>
        <section id="passport-intro" className="landing-cta" aria-labelledby="landing-cta-title"><div className="landing-container"><p className="landing-pill">A little help. A lot more clarity.</p><h2 id="landing-cta-title">Ready to tell your business story?</h2><p>Start recording today. Build a clearer picture of your business<br className="landing-desktop-break" /> and a draft Financial Passport to support your next application.</p><Button variant="white" onClick={start}>Try PaLEAsta! <span aria-hidden="true">→</span></Button><p className="landing-cta-note">Local demo · No real account created · Loan decisions remain with the lender.</p></div></section>
      </main>
      <footer className="landing-footer landing-container"><div className="landing-footer-grid"><div><Brand /><p>Grassroots bookkeeping and a clearer financial story for sari-sari stores, market vendors, and community micro-enterprises across the Philippines.</p></div><div><h3>Platform</h3><button onClick={() => scroll("why-paleasta")}>Features</button><button onClick={() => go("passport")}>Financial Passport</button><button onClick={() => scroll("advice")}>Meet LEA</button></div><div><h3>Resources</h3><button onClick={() => scroll("how-it-works")}>How it works</button><button onClick={() => go("help")}>Help & Guides</button><button onClick={() => onEnter()}>Open dashboard</button></div><div><h3>Trust & Legal</h3><button onClick={() => notify("Prototype privacy: records are saved locally. Questions, recent conversation and enabled business context are sent to Gemini. PINs and receipt files are not stored.")}>Prototype privacy</button><button onClick={() => notify("This is a frontend demonstration, not a financial or lending service. Financial Passport reports are drafts, not independent verification or loan approval.")}>About this prototype</button><button onClick={() => go("help")}>Community guidance</button></div></div><div className="landing-footer-bottom"><p>© 2026 PaLEAsta! · Built for Philippine small businesses & MSMEs.</p><p>Your business. Your story. Your next step.</p></div></footer>
      <dialog ref={accountDialog} className="landing-account-dialog" aria-label="Start your local PaLEAsta demo"><button className="landing-dialog-close" aria-label="Close account form" onClick={() => accountDialog.current?.close()}>×</button><Card className="p-7">
            <div id="signup" className="scroll-mt-8">
              <div
                className="mb-5 flex gap-2 rounded-xl bg-soft p-1"
                aria-label="Account mode"
              >
                {(["signup", "signin"] as const).map((t) => (
                  <button
                    key={t}
                    className={`flex-1 rounded-lg px-3 py-3 font-semibold text-forest ${tab === t ? "bg-white" : ""}`}
                    aria-pressed={tab === t}
                    onClick={() => setTab(t)}
                  >
                    {t === "signup" ? "Create account" : "Sign in"}
                  </button>
                ))}
              </div>
              <h3>
                {tab === "signup"
                  ? "Start your journey with LEA."
                  : "Welcome back to your business."}
              </h3>
              <p className="mt-2 text-sm text-muted">
                Local prototype · No real account is created.
              </p>
              <form className="mt-6 space-y-4" onSubmit={enter}>
                {tab === "signup" && (
                  <>
                    <Field
                      label="Business name"
                      name="name"
                      placeholder="e.g. Nena's Sari-Sari Store"
                      required
                      maxLength={100}
                    />
                    <Field
                      label="Your name"
                      name="owner"
                      placeholder="Full name"
                      required
                      maxLength={100}
                    />
                  </>
                )}
                <div
                  className={
                    tab === "signup" ? "grid gap-4 sm:grid-cols-2" : ""
                  }
                >
                  <Field
                    label="Mobile number"
                    name="mobile"
                    type="tel"
                    placeholder="09XX XXX XXXX"
                    pattern="[+0-9 ()-]{10,20}"
                    required
                    maxLength={20}
                  />
                  {tab === "signup" && (
                    <Select label="Business type" name="businessType">
                      <option>Sari-sari store</option>
                      <option>Market vendor</option>
                      <option>Food business</option>
                      <option>Other MSME</option>
                    </Select>
                  )}
                </div>
                <div
                  className={
                    tab === "signup" ? "grid gap-4 sm:grid-cols-2" : ""
                  }
                >
                  {tab === "signup" && (
                    <Field
                      label="Barangay & city"
                      name="location"
                      placeholder="e.g. Pasig City"
                      required
                      maxLength={120}
                    />
                  )}
                  <Field
                    label="4-digit store PIN"
                    name="pin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    minLength={4}
                    maxLength={4}
                    placeholder="••••"
                    required
                    autoComplete="off"
                  />
                </div>
                <Button type="submit" className="w-full">
                  {tab === "signup"
                    ? "Get started with LEA →"
                    : "Enter the demo →"}
                </Button>
                <p className="text-xs text-muted">
                  Demo sign-in only. PINs are not sent or stored. Use fictional
                  information.
                </p>
              </form>
            </div>
          </Card></dialog>
    </div>
  );
}

export function Auth({
  recovery,
  onEnter,
  notify,
}: PublicProps & { recovery?: boolean }) {
  const [requested, setRequested] = useState(false),
    [error, setError] = useState("");
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    if (recovery) {
      if (String(form.get("code")) !== "123456") {
        setError("Use the displayed demo recovery code: 123456.");
        return;
      }
      if (form.get("pin") !== form.get("confirm")) {
        setError("The new PINs must match.");
        return;
      }
      notify("Demo recovery completed. No real account or PIN was changed.");
      go("signin");
    } else onEnter();
  }
  return (
    <div className="min-h-screen bg-page">
      <header className="section-container flex flex-wrap justify-between gap-5 bg-white py-6">
        <Brand />
        <Button variant="secondary" onClick={() => go("landing")}>
          ← Back to website
        </Button>
      </header>
      <main className="section-container grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className="space-y-6">
          <Badge>{recovery ? "DEMO ACCOUNT RECOVERY" : "WELCOME BACK"}</Badge>
          <h1 className="text-[40px]">
            {recovery ? (
              <>
                Let’s get you
                <br />
                back to business.
              </>
            ) : (
              <>
                Your business.
                <br />
                Your next step.
                <br />A little help from LEA.
              </>
            )}
          </h1>
          <p className="max-w-lg text-base text-muted">
            {recovery
              ? "Explore the recovery flow with a local demo code. No text message is sent."
              : "Pick up your records, explore your next decision, and keep building your Financial Passport."}
          </p>
          <Lea size={240} />
        </div>
        <Card className="p-7">
          <h2>{recovery ? "Recover your account" : "Sign in to PaLEAsta!"}</h2>
          <p className="my-4 text-muted">
            Prototype only. No credentials are sent or stored.
          </p>
          <form onSubmit={submit} className="space-y-5">
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <Field
              label="Mobile number"
              name="mobile"
              type="tel"
              pattern="[+0-9 ()-]{10,20}"
              placeholder="09XX XXX XXXX"
              required
              maxLength={20}
            />
            {recovery && (
              <>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => setRequested(true)}
                >
                  Request demo recovery code
                </Button>
                {requested && (
                  <p className="notice">
                    Demo code: <strong>123456</strong>. No SMS was sent.
                  </p>
                )}
                <Field
                  label="Recovery code"
                  name="code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  disabled={!requested}
                />
              </>
            )}
            <Field
              label={recovery ? "New 4-digit PIN" : "4-digit store PIN"}
              name="pin"
              type="password"
              pattern="[0-9]{4}"
              minLength={4}
              maxLength={4}
              inputMode="numeric"
              autoComplete="off"
              required
            />
            {recovery && (
              <Field
                label="Confirm PIN"
                name="confirm"
                type="password"
                pattern="[0-9]{4}"
                maxLength={4}
                inputMode="numeric"
                autoComplete="off"
                required
              />
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={recovery && !requested}
            >
              {recovery
                ? "Reset demo PIN & return to sign in"
                : "Enter the demo"}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => go(recovery ? "signin" : "recovery")}
            >
              {recovery ? "← Back to sign in" : "Forgot your PIN?"}
            </Button>
            {!recovery && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => go("landing")}
              >
                Create an account
              </Button>
            )}
          </form>
        </Card>
      </main>
    </div>
  );
}
