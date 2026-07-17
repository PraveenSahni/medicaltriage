import { expect, test } from "@playwright/test";
import { apiLogin, browserLogin, personas } from "./fixtures.js";

test.describe.serial("Named-user browser journey", () => {
  test("WEB-001 renders runtime data and binds a simulated user to its credentials", async ({ page }) => {
    const runtimeResponse = page.waitForResponse((response) => response.url().endsWith("/api/v1/runtime/environment"));
    await page.goto("/");
    const runtime = await runtimeResponse;
    expect(runtime.status()).toBe(200);
    await expect(runtime.json()).resolves.toMatchObject({ environment: "simulation", dataProfile: "synthetic-e2e" });
    await expect(page.getByText("SIMULATION", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "IST Health" })).toBeVisible();

    await page.locator("#simulation-user").selectOption(personas.nurse.simulationUserId);
    await expect(page.locator("#assigned-role")).toHaveValue(personas.nurse.role);
    await expect(page.locator("#username")).toHaveValue(personas.nurse.username);
    await expect(page.locator("#password")).toHaveValue(personas.nurse.password);
  });

  test("WEB-002 reports invalid authentication without entering the application", async ({ page }) => {
    await page.goto("/");
    await page.locator("#simulation-user").selectOption(personas.nurse.simulationUserId);
    await page.locator("#password").fill("incorrect-password");
    const responsePromise = page.waitForResponse((response) => response.url().endsWith("/api/v1/auth/login"));
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
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
    const childCard = page.getByText(child.reasonNarrative, { exact: true }).first().locator("xpath=ancestor::article[1]");
    await expect(childCard).toBeVisible();
    await expect(childCard.getByText(child.patientAge.ageYears.toString(), { exact: true })).toBeVisible();
    await expect(childCard.getByText(child.channel, { exact: true })).toBeVisible();
  });

  test("WEB-005 answers an incoming call and displays fetched HRMS, protocol, RAG, and score evidence", async ({ page }) => {
    await browserLogin(page, personas.nurse);
    const queueResponse = await page.request.get("/api/v1/queue");
    expect(queueResponse.status(), await queueResponse.text()).toBe(200);
    const queueBody = await queueResponse.json();
    const child = queueBody.queue.find((item: { id: string }) => item.id === "case-10002");
    expect(child).toBeTruthy();

    const card = page.getByText(child.reasonNarrative, { exact: true }).first().locator("xpath=ancestor::article[1]");
    const commandResponse = page.waitForResponse((response) =>
      response.url().endsWith("/api/v1/call-center/queue/case-10002/command") && response.request().method() === "POST"
    );
    const scoreResponse = page.waitForResponse((response) =>
      response.url().endsWith("/api/v1/triage/calculate-score") && response.request().method() === "POST"
    );
    await card.getByRole("button", { name: /Open call|Answer call/ }).click();

    const command = await commandResponse;
    expect(command.status(), await command.text()).toBe(200);
    await expect(command.json()).resolves.toMatchObject({
      item: { id: "case-10002", status: "IN_PROCESS" },
      call: { status: "CONNECTED" }
    });

    const score = await scoreResponse;
    expect(score.status(), await score.text()).toBe(200);
    const scoreBody = await score.json();
    expect(scoreBody).toMatchObject({ severity: "EMERGENCY", dispositionCode: "SIDRA_PEDIATRIC_ED", patientAge: { source: "dependent" } });

    const dialog = page.getByRole("dialog", { name: "Active triage focus" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(child.reasonNarrative, { exact: true }).first()).toBeVisible();
    await expect(dialog.getByText("HRMS", { exact: true }).first()).toBeVisible();
    await expect(dialog.getByText("Validated before queue entry", { exact: true })).toBeVisible();
    await expect(dialog.getByText(child.preparedProtocol.primaryProtocolTitle, { exact: true }).first()).toBeVisible();
    await expect(dialog.getByText(/Runs in parallel against approved content only/i)).toBeVisible();
    await expect(page.getByText(scoreBody.destinationName, { exact: true }).first()).toBeVisible();
  });

  test("WEB-006 starts a callback through the provider-neutral gateway", async ({ page, request }) => {
    await apiLogin(request, personas.intake);
    const callbackReason = "E2E callback request awaiting nurse connection.";
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
    const card = page.getByText(callbackReason, { exact: true }).first().locator("xpath=ancestor::article[1]");
    const commandResponse = page.waitForResponse((response) =>
      response.url().endsWith(`/api/v1/call-center/queue/${queueItemId}/command`) && response.request().method() === "POST"
    );
    await card.getByRole("button", { name: "Call back" }).click();
    const command = await commandResponse;
    expect(command.status(), await command.text()).toBe(200);
    await expect(command.json()).resolves.toMatchObject({
      item: { id: queueItemId, lockedBy: "usr_nurse_10001" },
      call: { direction: "OUTBOUND", channel: "Callback", status: "CONNECTED" }
    });
    await expect(page.getByRole("dialog", { name: "Active triage focus" })).toBeVisible();
  });

  test("WEB-007 completes the four nurse actions and proves completion plus writeback calls", async ({ page }) => {
    await browserLogin(page, personas.nurse);
    await expect(page.getByText("Fever with fast breathing reported by parent.", { exact: true }).first()).toBeVisible();
    const card = page.getByText("Fever with fast breathing reported by parent.", { exact: true }).first().locator("xpath=ancestor::article[1]");
    await card.getByRole("button", { name: /Open call|Answer call|Open triage/ }).click();

    const dialog = page.getByRole("dialog", { name: "Active triage focus" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("navigation", { name: "Triage action tabs" })).toBeVisible();

    await dialog.getByRole("button", { name: "Next", exact: true }).click();
    await expect(dialog.getByText(/Action 2.*Questions/i).first()).toBeVisible();
    await expect(dialog.getByRole("button", { name: "No - default" })).toBeVisible();
    await dialog.getByRole("button", { name: /^Yes/ }).click();

    await dialog.getByRole("button", { name: "Next", exact: true }).click();
    await expect(dialog.getByText(/Action 3.*Disposition/i).first()).toBeVisible();
    await expect(dialog.getByText("Where to go", { exact: true })).toBeVisible();
    await expect(dialog.getByText("RESTRICTED", { exact: true }).first()).toBeVisible();

    await dialog.getByRole("button", { name: "Next", exact: true }).click();
    await expect(dialog.getByText(/Action 4.*SBAR/i).first()).toBeVisible();
    await expect(dialog.getByText(/Copy bilingual SBAR/i).first()).toBeVisible();

    const completionResponse = page.waitForResponse((response) =>
      response.url().endsWith("/api/v1/triage/complete") && response.request().method() === "POST"
    );
    const queueCompletion = page.waitForResponse((response) =>
      response.url().endsWith("/api/v1/queue/case-10002/move") && response.request().method() === "POST"
    );
    const writebackResponse = page.waitForResponse((response) =>
      response.url().endsWith("/api/v1/emr/writeback/case-10002") && response.request().method() === "POST"
    );
    await dialog.getByRole("button", { name: "Complete", exact: true }).click();

    const completion = await completionResponse;
    expect(completion.status(), await completion.text()).toBe(200);
    const completionBody = await completion.json();
    expect(completionBody.notePayload).toContain("SBAR");
    expect(completionBody.fitToFlyStatus).toBe("RESTRICTED");

    const queueMove = await queueCompletion;
    expect(queueMove.status(), await queueMove.text()).toBe(200);
    await expect(queueMove.json()).resolves.toMatchObject({ item: { id: "case-10002", status: "COMPLETED", sbarCopied: true } });

    const writeback = await writebackResponse;
    expect(writeback.status(), await writeback.text()).toBe(200);
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText("SBAR copied and encounter completed.", { exact: true })).toBeVisible();
  });

  test("WEB-008 reviews test evidence and enforces governed validation actions", async ({ page }) => {
    await browserLogin(page, personas.nurse);
    await page.getByRole("button", { name: "Open help and library" }).click();
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
