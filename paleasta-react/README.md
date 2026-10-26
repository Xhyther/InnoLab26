# PaLEAsta! — React + TypeScript + Tailwind

A local prototype for Philippine MSMEs: business records, inventory, a Financial Passport, and **LEA connected to the Gemini API**. Canned AI replies and the prompt-preview UI have been removed.

## Run the project and enable real AI

1. Install **Node.js 24 LTS or newer** from https://nodejs.org/.
2. Extract the ZIP and open `paleasta-react` in VS Code.
3. Open a terminal in that folder and install dependencies:

   ```sh
   npm install
   ```

4. Create your own Gemini account and API key at [Gemini Console](https://aistudio.google.com/apikey). Use a free-tier Google AI Studio project to try the free quota. Linking billing can incur charges. Free access has account/model limits; see [official rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).
5. Copy `.env.example` to `.env` **if you do not already have one**, then edit it locally:

   ```dotenv
   GEMINI_API_KEY=your_actual_key
   GEMINI_MODEL=gemini-3.8-flash
   ```

   Never paste your key into chat, React code, a `VITE_*` variable, or a public repository. The blank `.env.example` is safe to share; your filled `.env` is ignored by Git.

6. Start the app:

   ```sh
   npm run dev
   ```

7. Open the Local URL shown in the terminal, usually http://localhost:5173. Choose **Explore the demo without signing up**, then **LEA AI Adviser**.
8. Ask a question. The app now calls Gemini through its local server. If no key is configured, it shows a setup error instead of a fake answer.

Restart `npm run dev` after changing `.env`. One command runs both the Vite frontend and its local API middleware; no second terminal or Express installation is required.

On Windows, if PowerShell blocks `npm.ps1`, use `npm.cmd install` and `npm.cmd run dev`, or use Command Prompt.

## What is connected

```text
React chat → POST /api/chat → local Node server → Gemini Generate Content
           ← sanitized HTML displayed in the chat ← provider reply
```

The key and LEA's governing instructions are controlled on the server. The browser sends the question, recent conversation and enabled local business records. The server validates them and rebuilds the prompt itself. Errors, timeouts and rate limits stay visible; there is no canned-answer fallback.

The default model is `gemini-3.8-flash`. Set `GEMINI_MODEL` to another supported text model if your project has different model access. The chat does not display provider or configuration banners.

The free tier is suitable for trying the prototype, not an unlimited service. Longer conversations or larger context can reach token quotas. The app does not enable billing or create an API key for you. Google's free tier may use content to improve its products. Use fictional records for testing; review [the current pricing and data-use terms](https://ai.google.dev/gemini-api/docs/pricing) before real business use.

## Business context and conversation

- Dated transaction history: up to the most recent **100 entries**, plus totals over all recorded entries.
- Inventory: up to **100 products**, quantities, buying costs, selling prices, restock points and total recorded stock value.
- Business loans: owner-entered outstanding balances, balance dates, scheduled repayments, frequencies, due dates and reported status.
- Missing loan information is **unknown**, not zero debt. Only an explicit owner declaration marks no outstanding loans.
- Add loans from **Overview**, **Transactions**, or **LEA AI Adviser → Business context** using the dedicated loan dialog. New funds create a financing cash inflow; existing balances update the register without adding cash again. Repayments due within 7 days use the Manila calendar date and are schedules, not recorded payments.
- Every turn sends refreshed context and at most eight recent chat messages. Conversation is kept in memory and resets on refresh.
- Turning business context off/on clears the chat to avoid resending old financial details. When off, the business payload is `null`.
- Dedicated owner/mobile/location fields, counterparties and receipt filenames are omitted before the browser sends records to the local API. Free-text questions, product descriptions and lender labels can still contain personal information: use fictional data.
- Live replies are requested as simple HTML fragments and passed through [DOMPurify](https://github.com/cure53/DOMPurify) with a small tag allowlist and no attributes before rendering.

See [AI-PROMPT.md](AI-PROMPT.md) for the complete instructions, situation-specific questions, HTML example and follow-up strategy. Files in `examples/` show generated request shapes with fictional data.

## Included screens

Landing and prototype account forms; Overview with a line graph; LEA chat; searchable/exportable transaction ledger; inventory and restocking; Financial Passport and printable portfolio; Settings; Help & Guides.

Inflow uses a green rising graph. Outflow uses a warm-red falling graph across summaries, records, details and entry controls. Brief CSS animations respect reduced-motion preferences.

Initial fictional sample records cover October 2026: ₱90,000 inflows (₱45,000 other receipts + ₱45,000 loan proceeds), ₱8,500 outflows, ₱81,500 net movement and six products. Two sample loans have ₱3,500 due October 30 and ₱1,500 due November 2. Recognized original sample accounts upgrade once while retaining custom entries; unrelated accounts are preserved. The Overview line chart is illustrative; cards and records update from local data.

## Initialization from an empty folder

The supplied project is already initialized. To reproduce its base setup separately:

```sh
npm create vite@latest paleasta-react -- --template react-ts
cd paleasta-react
npm install
npm install tailwindcss @tailwindcss/vite @fontsource/inter @fontsource/nunito dompurify
npm install -D vitest @playwright/test
```

Enable React and Tailwind in `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({ plugins: [react(), tailwindcss()] });
```

Import `@import "tailwindcss";` in `src/index.css`. Tailwind v4 uses the Vite plugin; no older `tailwindcss init -p` step is needed. The completed project's Vite config additionally registers the local API middleware in `server/lea-api.ts`.

Copy the provided `src/`, `public/`, `server/`, config and test files to reproduce this implementation. Then follow the key setup above.

Official setup references: [Vite](https://vite.dev/guide/) · [Tailwind with Vite](https://tailwindcss.com/docs/installation/using-vite) · [Gemini quickstart](https://ai.google.dev/gemini-api/docs/api-key)

## Checks and local production build

```sh
npm test
npm run lint
npm run build
npm run test:e2e
```

Browser tests use installed Google Chrome. If unavailable, run `npx playwright install chromium` and remove `channel: "chrome"` from `playwright.config.ts`. Tests simulate provider responses and never need your real key.

To run the built frontend with its local API:

```sh
npm run build
npm start
```

Open http://127.0.0.1:3001. `npm start` reads `.env` and serves the `dist/` output and API. `npm run preview` is also available for local checks.

## Files to edit

| File                   | Purpose                                                 |
| ---------------------- | ------------------------------------------------------- |
| `src/App.tsx`          | Navigation, chat request lifecycle, local storage       |
| `src/Workspace.tsx`    | Workspace screens and sanitized HTML chat               |
| `src/LoanContext.tsx`  | Local loan register                                     |
| `src/ai-request.ts`    | Business context and master instructions                |
| `src/ai-situations.ts` | Guidance and questions for ten situations               |
| `src/chat-html.ts`     | HTML allowlist and sanitization                         |
| `server/lea-api.ts`    | Validation, server-side prompt, Gemini request and errors |
| `server/index.ts`      | Local server for the built application                  |
| `src/index.css`        | Tailwind, tokens, layouts, animations                   |
| `src/domain.ts`        | Money, stock and saved-data validation                  |
| `src/demo-data.ts`     | Historical sample business records                      |

## Prototype boundaries

The AI connection is real once your key is configured, but account forms are still demonstrations: no secure login, database, SMS, bank connection, document submission or real receipt storage exists. Records remain in localStorage; export them from Settings before clearing browser data.

The server binds to localhost and limits origins/requests. It is **not a public multi-user backend**. Before public deployment, add real authentication, authorization, server-owned business records and per-user quotas. Do not trust browser-supplied financial data for production decisions.

API keys and provider calls must remain server-side. The prompt and HTML sanitizer are not substitutes for record-access authorization. Financial Passport is a draft, not a credit rating or loan approval.

Original design: [PaLEAsta! Official](https://www.figma.com/design/arpijplKJHpB8lPDAK6pvY/PaLEAsta----Official?node-id=0-1)

## If you see “Use POST for chat”

Do not open `/api/chat` in the browser address bar. That sends a GET request to an API endpoint. Open the app's Local URL from Vite, choose **LEA AI Adviser**, type a question and click **Ask LEA**. The form sends POST with the required JSON. After changing `.env`, restart the dev server.

## Gemini project free-tier access is unavailable

A valid key can list models while generation still returns 403. Google evaluates free-tier eligibility at the project/account level; a new key in the same restricted project does not fix it. Check the project's status in Google AI Studio. This app does not enable billing.

For an ineligible project, Google's documented way to enable generation is an active paid billing account. Paid-tier usage is billed and does not unlock free quota. If you need to stay free, use a project/account Google actually marks eligible rather than assuming a replacement key or model will remove the restriction.

Official explanation: [Gemini project restricted or unavailable](https://ai.google.dev/gemini-api/docs/troubleshooting#project-unavailable).

## If you see “Use POST for chat”

Do not open `/api/chat` in the browser address bar. That sends a GET request to an API endpoint. Open the app's Local URL from Vite, choose **LEA AI Adviser**, type a question and click **Ask LEA**. The form sends POST with the required JSON. After changing `.env`, restart the dev server.

The adviser has separate chat and context scroll panes. Question chips fill the composer; LEA’s mascot cycles through thinking, pondering and computing while an API response is pending. Reduced motion preferences are respected.
