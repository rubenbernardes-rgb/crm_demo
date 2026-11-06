/* Phase C browser walkthrough — drives the running CRM at localhost:5174 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const BASE = "http://localhost:5174";
const OUT = "/w/wt/.tmp-screens";

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(`[console.error] ${m.text()}`);
  });
  page.on("pageerror", (e) => consoleErrors.push(`[pageerror] ${e.message}`));

  const steps = [];
  async function shot(name) {
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
    steps.push(`shot: ${name}`);
  }
  async function step(name, fn) {
    try {
      await fn();
      steps.push(`ok: ${name}`);
    } catch (e) {
      steps.push(`FAIL: ${name} — ${e.message.split("\n")[0]}`);
    }
  }
  const dialogRoot = page.locator('[role="dialog"]');

  // ---------- Dashboard ----------
  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.getByText("Open deals", { exact: true }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(700);
  await shot("01-dashboard");

  // toggle a task then restore (net-zero data change). The dashboard API only lists
  // not-done tasks, so a completed task leaves the list — verify that, then restore.
  await step("dashboard: toggle first task done (leaves list) + restore", async () => {
    const dash = await (await fetch(`${BASE}/api/dashboard`)).json();
    const task = dash.overdueTasks[0] ?? dash.upcomingTasks[0];
    if (task) {
      const row = page.locator("div", { hasText: task.description }).locator('[role="checkbox"]').first();
      await row.click();
      await page.waitForTimeout(900);
      await shot("02-dashboard-task-toggled");
      // restore the task to not-done via the same toggle endpoint the UI uses
      await fetch(`${BASE}/api/activities/${task.id}/toggle`, { method: "POST" });
      await page.waitForTimeout(700);
    }
  });

  // ---------- Organizations ----------
  await page.goto(BASE + "/organizations", { waitUntil: "load" });
  await page.getByText("Adventure Works").first().waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  await shot("03-organizations");

  await step("organizations: search narrows", async () => {
    await page.getByPlaceholder("Search organizations by name, website or industry…").fill("Coho");
    await page.waitForTimeout(700);
    await shot("04-organizations-search-coho");
    await page.getByPlaceholder("Search organizations by name, website or industry…").fill("");
    await page.waitForTimeout(700);
  });

  await step("organizations: Add organization dialog", async () => {
    await page.getByRole("button", { name: "Add organization" }).click();
    await dialogRoot.waitFor({ timeout: 5000 });
    await shot("05-org-add-dialog");
    await page.keyboard.press("Escape");
    await dialogRoot.waitFor({ state: "detached", timeout: 5000 });
  });

  await step("organizations: open org detail (click row)", async () => {
    await page.getByText("Adventure Works").first().click();
    await page.getByText("Overview").waitFor({ timeout: 10000 });
    await page.waitForTimeout(300);
    await shot("06-organization-detail");
  });

  await step("organization detail: Edit dialog", async () => {
    await page.getByRole("button", { name: "Edit" }).click();
    await dialogRoot.waitFor({ timeout: 5000 });
    await shot("07-org-edit-dialog");
    await page.keyboard.press("Escape");
    await dialogRoot.waitFor({ state: "detached", timeout: 5000 });
  });

  await step("organization detail: ConfirmDialog (delete) — cancel", async () => {
    await page.getByRole("button", { name: "Delete" }).click();
    await dialogRoot.waitFor({ timeout: 5000 });
    await shot("08-org-delete-confirm");
    await dialogRoot.getByRole("button", { name: "Cancel" }).click();
    await dialogRoot.waitFor({ state: "detached", timeout: 5000 });
  });

  // ---------- Contacts ----------
  await page.goto(BASE + "/contacts", { waitUntil: "load" });
  await page.getByText("Aisha Khan").first().waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  await shot("09-contacts");

  await step("contacts: filter tab Leads", async () => {
    await page.getByRole("tab", { name: "Leads" }).click();
    await page.waitForTimeout(700);
    await shot("10-contacts-filter-leads");
    await page.getByRole("tab", { name: "All" }).click();
    await page.waitForTimeout(700);
  });

  await step("contacts: Add contact dialog", async () => {
    await page.getByRole("button", { name: "Add contact" }).click();
    await dialogRoot.waitFor({ timeout: 5000 });
    await shot("11-contact-add-dialog");
    await page.keyboard.press("Escape");
    await dialogRoot.waitFor({ state: "detached", timeout: 5000 });
  });

  await step("contacts: open contact detail (click row)", async () => {
    await page.getByText("Aisha Khan").first().click();
    await page.getByText("Details").waitFor({ timeout: 10000 });
    await page.waitForTimeout(300);
    await shot("12-contact-detail");
  });

  await step("contact detail: Log activity dialog", async () => {
    await page.getByRole("button", { name: "Log activity" }).click();
    await dialogRoot.waitFor({ timeout: 5000 });
    await shot("13-activity-dialog");
    await page.keyboard.press("Escape");
    await dialogRoot.waitFor({ state: "detached", timeout: 5000 });
  });

  await step("contact detail: timeline task toggle flips in place + restore", async () => {
    const cb = page.locator('[role="checkbox"][aria-label="Mark done"]');
    if (await cb.count()) {
      await cb.first().click();
      await page.waitForTimeout(700);
      const flipped = await page.locator('[role="checkbox"][aria-label="Mark not done"]').count();
      if (!flipped) throw new Error("timeline checkbox did not flip to done in place");
      await shot("13b-contact-timeline-toggled");
      await page.locator('[role="checkbox"][aria-label="Mark not done"]').first().click();
      await page.waitForTimeout(700);
      if (!(await page.locator('[role="checkbox"][aria-label="Mark done"]').count()))
        throw new Error("timeline checkbox did not flip back");
    }
  });

  // ---------- Deals ----------
  await page.goto(BASE + "/deals", { waitUntil: "load" });
  await page.getByText("Pilot program").first().waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  await shot("14-deals");

  await step("deals: stage filter Select → Proposal", async () => {
    await page.getByRole("combobox").click();
    await page.waitForTimeout(300);
    await page.getByRole("option", { name: "Proposal" }).click();
    await page.waitForTimeout(700);
    await shot("15-deals-filter-proposal");
    await page.getByRole("combobox").click();
    await page.waitForTimeout(300);
    await page.getByRole("option", { name: "All stages" }).click();
    await page.waitForTimeout(700);
  });

  await step("deals: Add deal dialog", async () => {
    await page.getByRole("button", { name: "Add deal" }).click();
    await dialogRoot.waitFor({ timeout: 5000 });
    await shot("16-deal-add-dialog");
    await page.keyboard.press("Escape");
    await dialogRoot.waitFor({ state: "detached", timeout: 5000 });
  });

  await step("deals: open deal detail (click row)", async () => {
    await page.getByText("Pilot program").first().click();
    await page.getByText("Deal details").waitFor({ timeout: 10000 });
    await page.waitForTimeout(300);
    await shot("17-deal-detail");
  });

  await step("deal detail: Log activity dialog", async () => {
    await page.getByRole("button", { name: "Log activity" }).click();
    await dialogRoot.waitFor({ timeout: 5000 });
    await shot("18-deal-activity-dialog");
    await page.keyboard.press("Escape");
    await dialogRoot.waitFor({ state: "detached", timeout: 5000 });
  });

  // ---------- Pipeline ----------
  await page.goto(BASE + "/pipeline", { waitUntil: "load" });
  await page.getByText("Pilot program").waitFor({ timeout: 15000 });
  await page.waitForTimeout(500);
  await shot("19-pipeline");

  // drag "Pilot program" New → Qualified, then back New. Columns carry min-h-[120px].
  // Recipe: position pointer, down, small 3px move (dnd-kit distance-5 activation),
  // then travel to target in steps and drop.
  async function dragCard(cardText, colIndex) {
    const cols = await page.locator('div[class*="min-h-[120px]"]').all();
    if (cols.length !== 6) throw new Error(`expected 6 columns, got ${cols.length}`);
    const card = page.locator('div[aria-roledescription="draggable"]', { hasText: cardText });
    const cardBox = await card.boundingBox();
    const target = await cols[colIndex].boundingBox();
    await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(cardBox.x + cardBox.width / 2 + 3, cardBox.y + cardBox.height / 2);
    await page.mouse.move(target.x + target.width / 2, target.y + 200, { steps: 15 });
    await page.waitForTimeout(250);
    await page.mouse.up();
    await page.waitForTimeout(900);
  }

  await step("pipeline: drag Pilot program New → Qualified", async () => {
    await dragCard("Pilot program", 1);
    const cols = await page.locator('div[class*="min-h-[120px]"]').all();
    const inQualified = await cols[1].textContent();
    if (!inQualified.includes("Pilot program")) throw new Error("card did not land in Qualified");
    await shot("20-pipeline-dragging-done");
    await shot("21-pipeline-after-drag");
  });

  await step("pipeline: drag Pilot program Qualified → New (restore)", async () => {
    await dragCard("Pilot program", 0);
    const cols = await page.locator('div[class*="min-h-[120px]"]').all();
    const inNew = await cols[0].textContent();
    if (!inNew.includes("Pilot program")) throw new Error("card did not land back in New");
    if ((await cols[1].textContent()).includes("Pilot program")) throw new Error("card left Qualified twice");
    await shot("22-pipeline-restored");
  });

  fs.writeFileSync(path.join(OUT, "console-errors.log"), consoleErrors.join("\n") || "(no console errors)");
  fs.writeFileSync(path.join(OUT, "walkthrough.log"), steps.join("\n"));
  console.log(steps.join("\n"));
  console.log("---");
  console.log("console errors:", consoleErrors.length ? consoleErrors : "(none)");
  await browser.close();
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
