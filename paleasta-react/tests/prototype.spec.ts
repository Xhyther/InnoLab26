import { test, expect } from "@playwright/test";

test("landing, all workspace tabs, assets and stat alignment", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Your hard work has a story/ }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "test-results/landing-desktop.png",
    fullPage: true,
  });
  await expect
    .poll(() =>
      page
        .locator("img")
        .evaluateAll(
          (imgs) =>
            imgs.filter((img) => !img.complete || !img.naturalWidth).length,
        ),
    )
    .toBe(0);
  await page.getByRole("button", { name: /Explore the demo/ }).click();
  await expect(
    page.getByRole("heading", { name: "Good morning, Elena" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/overview-desktop.png",
    fullPage: true,
  });
  const tabs = [
    ["Transactions", "Transactions Ledger"],
    ["Inventory", "Inventory"],
    ["LEA AI Adviser", "LEA AI Financial Adviser"],
    ["Financial Passport", "Financial Passport"],
    ["Settings", "Settings"],
    ["Help & Guides", "Help & Guides"],
  ];
  for (const [name, heading] of tabs) {
    await page
      .locator(".sidebar")
      .getByRole("button", { name, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: heading, exact: true }).first(),
    ).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator("img")
          .evaluateAll(
            (imgs) =>
              imgs.filter((img) => !img.complete || !img.naturalWidth).length,
          ),
      )
      .toBe(0);
  }
  await page.goto("/#/app/transactions");
  const positions = await page
    .locator(".stat-value")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
  expect(new Set(positions.map(Math.round)).size).toBe(1);
  await page.screenshot({
    path: "test-results/transactions-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("consistent modal modes, validation, save, details and persistence", async ({
  page,
}) => {
  await page.goto("/#/app/transactions");
  await page
    .getByRole("button", { name: "Record transaction", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  const sizes: number[] = [];
  for (const mode of ["Inventory", "Cash outflow", "Cash inflow"]) {
    await dialog.getByRole("button", { name: mode, exact: true }).click();
    if (mode === "Cash outflow")
      await dialog.screenshot({
        path: "test-results/outflow-modal.png",
        animations: "disabled",
      });
    sizes.push((await dialog.locator(".modal-header").boundingBox())!.height);
    expect((await dialog.boundingBox())!.width).toBe(672);
  }
  expect(new Set(sizes).size).toBe(1);
  await dialog.getByLabel("Amount (PHP)").fill("12.345");
  await dialog.getByLabel("Source of cash inflow").fill("Prototype sale");
  await dialog.getByRole("button", { name: "Save cash inflow" }).click();
  await expect(dialog.getByRole("alert")).toContainText("two decimal");
  await dialog.getByLabel("Amount (PHP)").fill("125.50");
  await dialog.getByLabel("Customer / payer (optional)").fill("Demo customer");
  await dialog.getByRole("button", { name: "Save cash inflow" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("cell", { name: "+₱125.50", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByLabel("Search records").fill("Prototype sale");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "View →", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Demo customer");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export talaan" }).click();
  expect((await download).suggestedFilename()).toBe(
    "paleasta-transactions.csv",
  );
});

test("restock updates quantity and recorded cost, then survives reload", async ({
  page,
}) => {
  await page.goto("/#/app/inventory");
  const row = page.locator("tbody tr").filter({ hasText: "Pancit Canton" });
  await row.getByRole("button", { name: "Add stock →" }).click();
  await page.getByLabel("Quantity to add").fill("10");
  await page.getByLabel("Buying cost / unit").fill("15.00");
  await page
    .getByRole("button", { name: "Save inventory", exact: true })
    .click();
  await expect(row).toContainText("50 pcs");
  await expect(row).toContainText("₱13.00");
  await expect(page.locator("tbody tr")).toHaveCount(6);
  await page.reload();
  await expect(row).toContainText("50 pcs");
  await page.goto("/#/app/transactions");
  await page.getByLabel("Search records").fill("Inventory: Pancit");
  await expect(page.locator("tbody")).toContainText("−₱150.00");
});

test("LEA API requests use records and respect disabled business context", async ({
  page,
}) => {
  const payloads: { business: unknown; history: unknown[] }[] = [];
  await page.route("**/api/chat", async (route) => {
    const body = route.request().postDataJSON();
    payloads.push(body);
    await route.fulfill({
      json: {
        html: body.business
          ? "<p>Your records show ₱173,002 in net movement; approval is the bank's decision.</p>"
          : "<p>Business context is disabled. What information would you like to discuss?</p>",
      },
    });
  });
  await page.goto("/#/app/adviser");
  await page
    .getByLabel("Your question or business goal")
    .fill("Help me prepare a bank loan portfolio");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator("#conversation article").last()).toContainText(
    "₱173,002",
  );
  await expect(page.locator("#conversation article").last()).toContainText(
    "bank's decision",
  );
  expect(payloads[0].business).toHaveProperty("transactions");
  await page.goto("/#/app/settings");
  await page
    .getByRole("checkbox", { name: /Business context for LEA/ })
    .uncheck();
  await page.goto("/#/app/adviser");
  await page
    .getByLabel("Your question or business goal")
    .fill("Help plan a purchase");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator("#conversation article").last()).toContainText(
    "Business context is disabled",
  );
  expect(payloads[1].business).toBeNull();
  expect(payloads[1].history).toHaveLength(0);
});

test("profile, export, reset and portfolio preview work", async ({ page }) => {
  await page.goto("/#/app/settings");
  await page.getByLabel("Business name", { exact: true }).fill("Demo Shop");
  await page.getByRole("button", { name: "Save business profile" }).click();
  await page.reload();
  await expect(page.getByLabel("Business name", { exact: true })).toHaveValue(
    "Demo Shop",
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export local data" }).click();
  expect((await download).suggestedFilename()).toBe("paleasta-demo-data.json");
  await page.goto("/#/app/passport");
  await page
    .getByRole("button", { name: /Preview portfolio/ })
    .first()
    .click();
  await expect(page.locator(".report")).toContainText("Demo Shop");
  await expect(
    page.getByRole("button", { name: "Print / Save PDF" }),
  ).toBeVisible();
  await page.goto("/#/app/settings");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await expect(
    page.getByRole("heading", { name: "Good morning, Elena" }),
  ).toBeVisible();
});

test("auth and recovery are explicitly demo flows", async ({ page }) => {
  await page.goto("/#/signin");
  await page.getByRole("button", { name: "Forgot your PIN?" }).click();
  await page.getByLabel("Mobile number").fill("09123456789");
  await page
    .getByRole("button", { name: "Request demo recovery code" })
    .click();
  await page.getByLabel("Recovery code", { exact: true }).fill("123456");
  await page.getByLabel("New 4-digit PIN").fill("1234");
  await page.getByLabel("Confirm PIN").fill("1234");
  await page
    .getByRole("button", { name: "Reset demo PIN & return to sign in" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Sign in to PaLEAsta!" }),
  ).toBeVisible();
  await page.getByLabel("Mobile number").fill("09123456789");
  await page.getByLabel("4-digit store PIN").fill("1234");
  await page
    .getByRole("button", { name: "Enter the demo", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Good morning, Elena" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("paleasta-prototype-v1")),
  ).toBeNull();
});

test("malformed local data recovers to the sample account", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem(
      "paleasta-prototype-v1",
      '{"version":1,"products":[null]}',
    ),
  );
  await page.goto("/#/app/overview");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Good morning, Elena" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("invalid");
});

test("mobile screens and modals do not overflow the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/",
    "/#/app/overview",
    "/#/app/transactions",
    "/#/app/inventory",
    "/#/app/adviser",
    "/#/app/passport",
    "/#/app/settings",
    "/#/app/help",
    "/#/signin",
    "/#/recovery",
    "/#/app/report",
  ]) {
    await page.goto(
      "/?mobile=" +
        encodeURIComponent(route) +
        (route === "/" ? "" : route.slice(1)),
    );
    await expect(page.locator("h1").first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
      route,
    ).toBeLessThanOrEqual(1);
  }
  await page.goto("/#/app/overview");
  await page.screenshot({
    path: "test-results/overview-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Transactions", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Record transaction", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Inventory", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await page.screenshot({
    path: "test-results/modal-mobile.png",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("loan context persists, follow-ups resend context, and provider HTML is sanitized", async ({
  page,
}) => {
  const requests: {
    business: {
      loans: { outstandingCents: number }[];
      transactions: unknown[];
      products: unknown[];
      profile: { mobile: string };
    };
    history: unknown[];
  }[] = [];
  await page.route("**/api/health", (route) =>
    route.fulfill({ json: { configured: true } }),
  );
  await page.route("**/api/chat", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      json: {
        html: '<h3>Review your commitments</h3><p onclick="window.__unsafe=1"><strong>Check the next payment.</strong></p><img src=x onerror="window.__unsafe=1"><script>window.__unsafe=1</script>',
      },
    });
  });
  await page.goto("/#/app/adviser");
  await expect(page.locator("#conversation article")).toHaveCount(0);
  await expect(page.getByText(/is configured|Checking.*configuration/)).toHaveCount(0);
  
  await page
    .getByRole("button", { name: "Add business loan", exact: true })
    .click();
  await page.getByLabel("What are you recording?").selectOption("existing");
  await page.getByLabel("Lender / loan label").fill("Example business loan");
  await page.getByLabel("Outstanding loan balance (PHP)").fill("30000");
  await page.getByLabel("Scheduled repayment (PHP)").fill("3500");
  await page.getByLabel("Next payment due").fill("2026-11-05");
  await page
    .getByRole("button", { name: "Save loan record", exact: true })
    .click();
  await page
    .getByLabel("Your question or business goal")
    .fill("Can I cover my loan payment?");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".lea-answer h3")).toHaveText(
    "Review your commitments",
  );
  expect(requests[0].business.loans[2].outstandingCents).toBe(3000000);
  expect(requests[0].business.transactions).toHaveLength(317);
  expect(requests[0].business.products).toHaveLength(6);
  expect(requests[0].business.profile.mobile).toBe("");
  await expect(page.locator(".lea-answer img, .lea-answer script")).toHaveCount(
    0,
  );
  expect(
    await page
      .locator(".lea-answer p")
      .evaluate((el) => el.hasAttribute("onclick")),
  ).toBe(false);
  await page
    .getByLabel("Your question or business goal")
    .fill("What if I delay the purchase?");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".lea-answer")).toHaveCount(2);
  expect(requests[1].history).toHaveLength(2);
  expect(requests[1].business.loans).toHaveLength(3);
  await page.screenshot({
    path: "test-results/adviser-api.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.reload();
  await page.locator("summary").filter({hasText:"3 loan records"}).click();
  await expect(
    page.getByText("Example business loan", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".lea")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});
test("API errors remain visible and never produce a canned answer", async ({
  page,
}) => {
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      status: 503,
      json: {
        error:
          "Add GEMINI_API_KEY to the server .env file and restart the app to enable LEA.",
      },
    }),
  );
  await page.goto("/#/app/adviser");
  await page.getByLabel("Your question or business goal").fill("Help me plan");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("GEMINI_API_KEY");
  await expect(page.locator(".lea-answer")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Retry question" }),
  ).toBeVisible();
});

