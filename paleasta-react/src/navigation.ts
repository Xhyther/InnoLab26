import type { Page } from "./types";
export const asset = (name: string) => `/assets/${name}`;
export const pages: { id: Page; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "adviser", label: "LEA AI Adviser" },
  { id: "transactions", label: "Transactions" },
  { id: "inventory", label: "Inventory" },
  { id: "passport", label: "Financial Passport" },
  { id: "settings", label: "Settings" },
];
export function go(page: Page | "landing" | "signin" | "recovery" | "report") {
  window.location.hash =
    page === "landing"
      ? "/"
      : page === "signin" || page === "recovery"
        ? "/" + page
        : "/app/" + page;
  window.scrollTo({ top: 0, behavior: "instant" });
}
