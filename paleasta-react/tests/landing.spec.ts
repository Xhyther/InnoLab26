import { test,expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
test("reference landing sections and local signup work on desktop and mobile",async({page})=>{
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto("/");
 await expect(page.getByRole("heading",{name:/Your hard work has a story/})).toBeVisible();
 await page.evaluate(()=>document.fonts.ready);
 const boxes=await page.locator(".landing-header,.landing-hero,.landing-advice,.landing-audience,.landing-benefits,.landing-cta,.landing-footer").evaluateAll(nodes=>nodes.map(n=>{const b=n.getBoundingClientRect();return {name:n.className,x:b.x,y:b.y,width:b.width,height:b.height};}));
 writeFileSync("test-results/landing-layout.json",JSON.stringify(boxes,null,2));
 await page.screenshot({path:"test-results/landing-desktop.png",fullPage:true,animations:"disabled"});
 await page.getByRole("button",{name:"Get started",exact:true}).click();
 const dialog=page.getByRole("dialog",{name:"Start your local PaLEAsta demo"});
 await expect(dialog).toBeVisible();
 await page.keyboard.press("Escape");await expect(dialog).not.toBeVisible();
 await page.getByRole("button",{name:"How it works",exact:true}).first().click();
 await expect(page.getByRole("heading",{name:"Track every peso",exact:true})).toBeInViewport();
 await page.setViewportSize({width:390,height:844});await page.goto("/");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
 await page.screenshot({path:"test-results/landing-mobile.png",fullPage:true,animations:"disabled"});
 await page.getByRole("button",{name:"Get started",exact:true}).click();
 await expect(dialog).toBeVisible();
 for(const [name,value]of Object.entries({name:"Sample Mabuhay Store",owner:"Mila Cruz",mobile:"09123456789",location:"Pasig City",pin:"1234"}))await dialog.locator("input[name="+name+"]").fill(value);
 await dialog.getByRole("button",{name:/Get started with LEA/}).click();
 await expect(page.getByRole("heading",{name:"Good morning, Mila"})).toBeVisible();
});
test("overview plots all six sample months and transaction history retains loan proceeds",async({page})=>{
 await page.goto("/#/app/overview");
 await expect(page.getByRole("img",{name:"Monthly cash inflows and outflows, 2026-05 to 2026-10"})).toBeVisible();
 await expect(page.locator(".stat-value").first()).toContainText("173,002");
 await page.goto("/#/app/transactions");
 await expect(page.getByText(/of 317 entries/)).toBeVisible();
 await expect(page.getByRole("row").filter({hasText:"Sample working-capital loan"})).toContainText("Cash inflow · financing");
});

