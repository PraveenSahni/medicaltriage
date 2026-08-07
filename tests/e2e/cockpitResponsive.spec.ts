import { expect, test } from "@playwright/test";
import { browserLogin, personas } from "./fixtures.js";

// Real, live regression coverage for the NFR-015 Nurse Cockpit
// responsive-accessibility fix - the Cockpit's fixed 3-column desktop
// layout (300px sidebar + flex:1 main workspace) had no breakpoint at
// all, confirmed via a real browser measurement (document.documentElement
// .scrollWidth exceeding clientWidth at a 320px viewport). CSS media
// queries cannot be evaluated in jsdom, so this is a real Playwright/
// browser test, not a unit test - matching how the SMB reflow fix was
// verified in the prior NFR-015 batches.
test.describe.serial("Nurse Cockpit responsive layout", () => {
  test("WEB-010 no page-level horizontal overflow at a 320px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await browserLogin(page, personas.nurse);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });

  test("WEB-011 sidebar and workspace stack in a single column and remain reachable at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await browserLogin(page, personas.nurse);

    const sidebar = page.locator(".cockpit-sidebar");
    const main = page.locator(".cockpit-main");
    await expect(sidebar).toBeVisible();
    await expect(main).toBeVisible();

    const sidebarBox = await sidebar.boundingBox();
    const mainBox = await main.boundingBox();
    expect(sidebarBox).not.toBeNull();
    expect(mainBox).not.toBeNull();
    // Single-column stack: the workspace renders below the sidebar, not
    // beside it, once the 900px breakpoint collapses the flex row to a
    // column - confirmed by the main workspace starting at or after the
    // sidebar's bottom edge, not overlapping it side by side.
    expect(mainBox!.y).toBeGreaterThanOrEqual(sidebarBox!.y + sidebarBox!.height - 1);
    expect(sidebarBox!.width).toBeLessThanOrEqual(320);
    expect(mainBox!.width).toBeLessThanOrEqual(320);
  });

  // Closes the UX/NFR-001 (Mobile Responsiveness) gap: WEB-010/WEB-011
  // above only ever checked overflow before a call was claimed. This runs
  // before WEB-012 (which claims a call and deliberately leaves it open,
  // uncompleted, to test the tablist in isolation) - WEB-012's leftover
  // held call would otherwise conflict with this test's own claim under
  // this app's real one-held-call-at-a-time UI cap, so ordering matters
  // here and this test must stay ahead of WEB-012 in this serial suite.
  test("WEB-015 no horizontal overflow at any stage of a full claim-to-completion journey at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await browserLogin(page, personas.nurse);

    const overflowNow = () =>
      page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }));
    const expectNoOverflow = async (label: string) => {
      const overflow = await overflowNow();
      expect(overflow.scrollWidth, `${label}: scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`).toBeLessThanOrEqual(
        overflow.clientWidth
      );
    };

    await expectNoOverflow("before claiming a call");

    // Uses a freshly generated synthetic call (POST /queue/simulate) rather
    // than scanning the shared case-abd- seed fixtures - those rows are
    // reused across many other tests/manual runs in this same dev database
    // and repeated claim/reset cycles left them in a contended, sometimes
    // stuck-open state that produced flaky failures unrelated to this
    // test's actual purpose. A freshly created item is guaranteed
    // unclaimed and not depended on by anything else.
    let child: { id: string; reasonNarrative: string; preparedProtocol?: { primaryProtocolId?: string } } | undefined;
    for (let attempt = 0; attempt < 10 && !child?.preparedProtocol?.primaryProtocolId; attempt += 1) {
      const simulateResponse = await page.request.post("/api/v1/queue/simulate");
      expect(simulateResponse.status(), await simulateResponse.text()).toBe(201);
      child = (await simulateResponse.json()).item;
    }
    expect(child?.preparedProtocol?.primaryProtocolId).toBeTruthy();

    await page.reload();
    const card = page.getByText(child!.reasonNarrative, { exact: true }).first().locator("xpath=ancestor::li[1]");
    const claimResponse = page.waitForResponse((response) =>
      response.url().endsWith(`/api/v1/queue/${child!.id}/claim`) && response.request().method() === "POST"
    );
    await card.getByRole("button", { name: "Answer call →", exact: true }).click();
    const claim = await claimResponse;
    expect(claim.status(), await claim.text()).toBe(200);

    await expect(page.getByRole("tab", { name: /Reason & Rule-Out/ })).toHaveAttribute("aria-selected", "true");
    await expectNoOverflow("Reason & Rule-Out stage");

    await page.getByRole("button", { name: "Triage Questions →", exact: true }).click();
    await expect(page.getByRole("tab", { name: /^.\s*2 · Questions/ })).toHaveAttribute("aria-selected", "true");
    await expectNoOverflow("Questions stage (initial)");

    const dispositionTab = page.getByRole("tab", { name: /Disposition & Advice/ });
    for (let attempt = 0; attempt < 20; attempt += 1) {
      if ((await dispositionTab.getAttribute("aria-selected")) === "true") {
        break;
      }
      const bulkNo = page.getByRole("button", { name: /No to all at this level/ });
      if (await bulkNo.isVisible().catch(() => false)) {
        await bulkNo.click();
        await page.waitForTimeout(400);
        continue;
      }
      const singleNo = page.locator(".choice").filter({ hasText: "No" }).first();
      if (await singleNo.isVisible().catch(() => false)) {
        await singleNo.click();
        await page.waitForTimeout(400);
        continue;
      }
      await page.waitForTimeout(400);
    }
    await expect(dispositionTab).toHaveAttribute("aria-selected", "true");
    await expectNoOverflow("Disposition & Advice stage");

    const moveResponse = page.waitForResponse((response) =>
      response.url().endsWith(`/api/v1/queue/${child!.id}/move`) && response.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Continue to SBAR →", exact: true }).click();
    await moveResponse;
    await expect(page.getByRole("tab", { name: /SBAR \/ Complete/ })).toHaveAttribute("aria-selected", "true");
    await expectNoOverflow("SBAR / Complete stage");

    const completeButton = page.getByRole("button", { name: "✓ Complete Call", exact: true });
    await expect(completeButton).toBeEnabled();
    const completionResponse = page.waitForResponse((response) =>
      response.url().endsWith("/api/v1/triage/complete") && response.request().method() === "POST"
    );
    await completeButton.click();
    const completion = await completionResponse;
    expect(completion.status(), await completion.text()).toBe(200);

    await expect(page.getByRole("tab", { name: /^Completed \d+/ })).toBeVisible();
    await expectNoOverflow("after call completion (Completed tab)");
  });

  test("WEB-012 stage tabs expose real tablist semantics and remain operable at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await browserLogin(page, personas.nurse);
    // Stage tabs only render once a call is active - answer the first
    // reachable call so this test exercises the real workflow, not just
    // the empty "no active call" state.
    await page.getByRole("button", { name: /Answer call/ }).first().click();

    const tablist = page.getByRole("tablist", { name: "Clinical workflow stage" });
    await expect(tablist).toBeVisible();
    const tabs = page.getByRole("tab");
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThan(0);
    await expect(tabs.first()).toHaveAttribute("aria-selected", /true|false/);
  });

  test("WEB-013 no horizontal overflow at a 768px tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await browserLogin(page, personas.nurse);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });

  test("WEB-014 no horizontal overflow at the existing desktop viewport", async ({ page }) => {
    await browserLogin(page, personas.nurse);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });

});
