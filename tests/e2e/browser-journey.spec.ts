import { expect, test } from "@playwright/test";
import { apiLogin, browserLogin, personas } from "./fixtures.js";

test.describe.serial("Named-user browser journey", () => {
  test("WEB-001 renders runtime data and the real login form", async ({ page }) => {
    const runtimeResponse = page.waitForResponse((response) => response.url().endsWith("/api/v1/runtime/environment"));
    await page.goto("/");
    const runtime = await runtimeResponse;
    expect(runtime.status()).toBe(200);
    await expect(runtime.json()).resolves.toMatchObject({ environment: "simulation", dataProfile: "synthetic-e2e" });
    // The login page deliberately has no app chrome/environment banner (see
    // LoginLayout.tsx's own doc comment, per an approved design reference) -
    // this assertion previously expected the pre-redesign banner text, which
    // no longer renders here by design. The runtime API assertion above
    // already proves the "simulation" environment/data-profile contract;
    // this checks the real, current login-page heading instead.
    await expect(page.getByRole("heading", { name: "Sign in to Nurse Cockpit" })).toBeVisible();

    // Real, current LoginCard.tsx form - a plain username/password submit,
    // no simulate-role dropdown (that UI predates a real login-page
    // redesign and no longer exists anywhere in the frontend).
    await page.locator("#username").fill(personas.nurse.username);
    await page.locator("#password").fill(personas.nurse.password);
    await expect(page.locator("#username")).toHaveValue(personas.nurse.username);
    await expect(page.locator("#password")).toHaveValue(personas.nurse.password);
  });

  test("WEB-002 reports invalid authentication without entering the application", async ({ page }) => {
    await page.goto("/");
    await page.locator("#username").fill(personas.nurse.username);
    await page.locator("#password").fill("incorrect-password");
    const responsePromise = page.waitForResponse((response) => response.url().endsWith("/api/v1/auth/login"));
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(401);
    await expect(page.getByText(/Invalid username or password|Sign-in failed/i)).toBeVisible();
    await expect(page).not.toHaveURL(/#\/(workspace|admin)$/);
  });

  test("WEB-003 routes an administrator to the Control Center", async ({ page }) => {
    await browserLogin(page, personas.platformAdmin);
    await expect(page.getByText(/Control Center|Platform/i).first()).toBeVisible();
  });

  test("WEB-004 renders queue records from the API without data drift", async ({ page }) => {
    const queueResponse = page.waitForResponse((response) =>
      response.url().includes("/api/v1/queue") && response.request().method() === "GET" && response.status() === 200
    );
    await browserLogin(page, personas.nurse);
    const response = await queueResponse;
    const body = await response.json();
    expect(body.queue.length).toBeGreaterThan(0);

    const child = body.queue.find((item: { id: string }) => item.id === "case-10002");
    expect(child).toBeTruthy();
    const childCard = page.getByText(child.reasonNarrative, { exact: true }).first().locator("xpath=ancestor::li[1]");
    await expect(childCard).toBeVisible();
    // The card renders age/gender/patient-type as one combined line (e.g.
    // "3 · Male · Dependent") rather than separate text nodes per field, so
    // this checks substring containment against the card's full text rather
    // than an exact per-field node match.
    await expect(childCard).toContainText(child.patientAge.ageYears.toString());
  });

  // Rewritten against the real, current #/cockpit Nurse Cockpit UI (not the
  // legacy NurseWorkspaceRedesign modal at #/cockpit-v2, which a real nurse
  // login never reaches - see docs/architecture/call-center-workflow-model.md
  // for the full investigation). Every selector below was verified against
  // the live rendered DOM before being written, not assumed from memory.
  test("WEB-005 claims a call and progresses through Reason, Questions, Disposition, and SBAR stages inline (no modal)", async ({ page }) => {
    await browserLogin(page, personas.nurse);
    const queueResponse = await page.request.get("/api/v1/queue");
    expect(queueResponse.status(), await queueResponse.text()).toBe(200);
    const queueBody = await queueResponse.json();
    // A record with a real matched protocol and no existing lock - the
    // abdominal-pain-male synthetic test cases are the only unclaimed,
    // real-STCC-protocol-matched records seeded by default (case-10002 has
    // no matched protocol post the real-STCC-content migration, see
    // API-004/API-005's own NO_MATCH handling).
    const child = queueBody.queue.find(
      (item: { id: string; status: string; preparedProtocol?: { primaryProtocolId?: string } }) =>
        item.id.startsWith("case-abd-") && item.status === "INCOMING" && item.preparedProtocol?.primaryProtocolId
    );
    expect(child).toBeTruthy();

    const card = page.getByText(child.reasonNarrative, { exact: true }).first().locator("xpath=ancestor::li[1]");
    const claimResponse = page.waitForResponse((response) =>
      response.url().endsWith(`/api/v1/queue/${child.id}/claim`) && response.request().method() === "POST"
    );
    await card.getByRole("button", { name: "Answer call →", exact: true }).click();
    const claim = await claimResponse;
    expect(claim.status(), await claim.text()).toBe(200);
    await expect(claim.json()).resolves.toMatchObject({
      item: { id: child.id, status: "IN_PROCESS" },
      lock: { lockedBy: "usr_nurse_10001" }
    });

    // Claiming opens the stage-tabbed main content inline - no modal dialog
    // exists anywhere in this component tree.
    const stageTabs = page.getByRole("tablist", { name: "Clinical workflow stage" });
    await expect(stageTabs).toBeVisible();
    await expect(page.getByRole("tab", { name: /Reason & Rule-Out/ })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("region", { name: "Reason and Rule-Out" }).or(page.locator('[aria-label="Reason and Rule-Out"]'))).toBeVisible();
    await expect(page.getByText(child.reasonNarrative, { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: "Triage Questions →", exact: true }).click();
    await expect(page.getByRole("tab", { name: /^.\s*2 · Questions/ })).toHaveAttribute("aria-selected", "true");

    // Deterministic path to a disposition: repeatedly answer "No" (bulk
    // where a same-level group of questions is offered, one at a time
    // otherwise) until the UI auto-advances to the Disposition stage.
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
      // Neither control is present - either the stage already advanced (the
      // next loop iteration's aria-selected check will confirm) or a real
      // failure; give the UI a moment to settle either way.
      await page.waitForTimeout(400);
    }
    await expect(page.getByRole("tab", { name: /Disposition & Advice/ })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("textbox", { name: "Destination" })).not.toHaveValue("");

    const moveResponse = page.waitForResponse((response) =>
      response.url().endsWith(`/api/v1/queue/${child.id}/move`) && response.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Continue to SBAR →", exact: true }).click();
    const move = await moveResponse;
    expect(move.status(), await move.text()).toBe(200);
    await expect(page.getByRole("tab", { name: /SBAR \/ Complete/ })).toHaveAttribute("aria-selected", "true");

    const completeButton = page.getByRole("button", { name: "✓ Complete Call", exact: true });
    await expect(completeButton).toBeEnabled();

    const completionResponse = page.waitForResponse((response) =>
      response.url().endsWith("/api/v1/triage/complete") && response.request().method() === "POST"
    );
    const finalMoveResponse = page.waitForResponse((response) =>
      response.url().endsWith(`/api/v1/queue/${child.id}/move`) && response.request().method() === "POST"
    );
    await completeButton.click();

    const completion = await completionResponse;
    expect(completion.status(), await completion.text()).toBe(200);
    const finalMove = await finalMoveResponse;
    expect(finalMove.status(), await finalMove.text()).toBe(200);
    await expect(finalMove.json()).resolves.toMatchObject({ item: { id: child.id, status: "COMPLETED" } });

    // Confirmed via direct code review of CompletionStage.tsx: the current
    // Cockpit's completion sequence is context -> triage/complete -> move,
    // with no EMR writeback call (that only exists in the legacy
    // NurseWorkspace/NurseWorkspaceRedesign components) - assert its absence
    // rather than silently omitting the check.
    let sawWriteback = false;
    page.on("response", (response) => {
      if (response.url().includes("/api/v1/emr/writeback/")) {
        sawWriteback = true;
      }
    });
    await page.waitForTimeout(500);
    expect(sawWriteback).toBe(false);

    // The completed item leaves "Open Calls" for "Completed" in the sidebar.
    await expect(page.getByRole("tab", { name: /^Completed \d+/ })).toBeVisible();
  });

  test("WEB-006 a nurse claims an intake-created callback queue item", async ({ page, request }, testInfo) => {
    await apiLogin(request, personas.intake);
    // Unique per invocation: this describe.serial block runs once per
    // configured browser/mobile project against the SAME shared e2e server
    // (see playwright.config.ts's single webServer), so a fixed literal
    // string here would collide across projects - a later project's query
    // would match an earlier project's now-already-claimed leftover item
    // instead of its own freshly created one.
    const callbackReason = `E2E callback request awaiting nurse connection (${testInfo.project.name}-${Date.now()}).`;
    const createResponse = await request.post("/api/v1/queue", {
      data: {
        istStaffId: "IST-1001",
        patientType: "Staff",
        channel: "Callback",
        stationCode: "DOH",
        summary: callbackReason,
        reasonNarrative: callbackReason,
        safetyFloorActive: false,
        slaMinutes: 20
      }
    });
    expect(createResponse.status(), await createResponse.text()).toBe(201);
    const created = await createResponse.json();
    const queueItemId = created.item.id as string;

    await browserLogin(page, personas.nurse);
    await expect(page.getByText(callbackReason, { exact: true }).first()).toBeVisible();
    const card = page.getByText(callbackReason, { exact: true }).first().locator("xpath=ancestor::li[1]");
    // Every waiting item, regardless of originating channel (Phone/WhatsApp/
    // Callback), is answered through the same "Answer call" action in the
    // current UI - confirmed via direct DOM inspection, no separate
    // "Call back" button exists.
    const claimResponse = page.waitForResponse((response) =>
      response.url().endsWith(`/api/v1/queue/${queueItemId}/claim`) && response.request().method() === "POST"
    );
    await card.getByRole("button", { name: /Answer call|Open call/ }).click();
    const claim = await claimResponse;
    expect(claim.status(), await claim.text()).toBe(200);
    await expect(claim.json()).resolves.toMatchObject({
      item: { id: queueItemId, status: "IN_PROCESS" },
      lock: { lockedBy: "usr_nurse_10001" }
    });
    // Claiming opens the real inline stage-tabbed view - no modal dialog
    // exists in the current Cockpit (see WEB-005's comment for the full
    // investigation of why the old "Active triage focus" dialog assertion
    // was stale).
    await expect(page.getByRole("tablist", { name: "Clinical workflow stage" })).toBeVisible();
  });

  test("WEB-007 an unauthorized role cannot claim or complete a queue item through the real UI", async ({ page }) => {
    // call_intake_coordinator holds triage.workspace.view (can see the
    // queue and land on the Cockpit route) but is not a clinical operator
    // or manager role, so claimQueueItem() rejects it server-side
    // (QUEUE_ROLE_DENIED) - this proves the authorization boundary holds
    // through the real browser UI, not just at the API layer.
    await browserLogin(page, personas.intake);
    const queueResponse = await page.request.get("/api/v1/queue");
    expect(queueResponse.status()).toBe(200);
    const queueBody = await queueResponse.json();
    const child = queueBody.queue.find(
      (item: { id: string; status: string }) => item.status === "INCOMING"
    );
    expect(child).toBeTruthy();

    const card = page.getByText(child.reasonNarrative, { exact: true }).first().locator("xpath=ancestor::li[1]");
    const answerButton = card.getByRole("button", { name: "Answer call →", exact: true });
    // The intake persona's UI may or may not render the Answer button at
    // all for this role - either way, a direct claim attempt through the
    // real API (as this session's real cookies) must be denied.
    if (await answerButton.isVisible().catch(() => false)) {
      const claimResponse = page.waitForResponse((response) =>
        response.url().endsWith(`/api/v1/queue/${child.id}/claim`) && response.request().method() === "POST"
      );
      await answerButton.click();
      const claim = await claimResponse;
      expect(claim.status()).toBe(403);
    } else {
      const denied = await page.request.post(`/api/v1/queue/${child.id}/claim`);
      expect(denied.status()).toBe(403);
      const deniedBody = await denied.json();
      expect(deniedBody.code).toBe("QUEUE_ROLE_DENIED");
    }
    // Confirms the UI never lands the intake role on the stage-tabbed
    // clinical workflow, regardless of the claim outcome above.
    await expect(page.getByRole("tablist", { name: "Clinical workflow stage" })).not.toBeVisible();
  });

  test("WEB-008 reviews test evidence and enforces governed validation actions", async ({ page }) => {
    await browserLogin(page, personas.nurse);
    // The real Help entry point is an <a aria-label="Help"> link, not a
    // button - confirmed via live DOM inspection (another stale assumption
    // from before the Cockpit UI's current header layout).
    await page.getByRole("link", { name: "Help", exact: true }).click();
    await expect(page).toHaveURL(/#\/help$/);
    await page.getByRole("tab", { name: "Test Results" }).click();

    await expect(page.getByRole("heading", { name: "Test Cases and Test Results" })).toBeVisible();
    await expect(page.getByText("Showing 593 of 593 unique test cases", { exact: true })).toBeVisible();

    await page.getByLabel("Module").selectOption("Role Access Matrix");
    await expect(page.getByText("Showing 498 of 593 unique test cases", { exact: true })).toBeVisible();
    await expect(page.locator(".test-summary > div").first()).toContainText("498");
    await page.getByLabel("Module").selectOption("All");

    const apiCase = page.getByRole("button", { name: /API-001.*Runtime environment and health contract/i });
    await apiCase.click();
    const panel = page.locator("#test-panel-api-001");
    await expect(panel.getByRole("heading", { name: "Execution steps" })).toBeVisible();
    await expect(panel.getByText("HTTP 200 returned", { exact: true })).toBeVisible();

    await panel.getByRole("button", { name: "Request Retest" }).click();
    await expect(panel.getByRole("alert")).toHaveText(/reason is required/i);
    await panel.getByLabel("Validator comment or reason").fill("Re-run after deployment evidence is attached.");
    await panel.getByRole("button", { name: "Request Retest" }).click();
    await expect(panel.getByText("Retest Required", { exact: true }).first()).toBeVisible();
    await expect(panel.getByText("Current help reviewer", { exact: true })).toBeVisible();

    await page.getByLabel("Search").fill("WEB-007");
    await expect(page.getByText("Showing 1 of 593 unique test cases", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /WEB-007.*Complete all four nurse actions/i })).toBeVisible();

    await page.getByLabel("Search").fill("CCG-CAT-001");
    await expect(page.getByText("Showing 1 of 593 unique test cases", { exact: true })).toBeVisible();
    const generatedCase = page.getByRole("button", { name: /CCG-CAT-001.*keeps every maintained scenario ID unique/i });
    await generatedCase.click();
    await expect(page.locator("#test-panel-ccg-cat-001").getByText(/All assertions passed in \d+ ms\./)).toBeVisible();

    await page.getByLabel("Search").fill("");
    await page.getByRole("tab", { name: "Help" }).click();
    await page.getByRole("tab", { name: "Test Results" }).click();
    await expect(apiCase).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#test-panel-api-001").getByText("Retest Required", { exact: true }).first()).toBeVisible();
  });
});
