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
