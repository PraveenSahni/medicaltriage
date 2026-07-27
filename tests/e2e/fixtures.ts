import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const personas = {
  platformAdmin: {
    simulationUserId: "platform-administrator",
    username: "pa@irisstar.tech",
    password: "PlatformAdmin@2026",
    role: "platform_super_administrator",
    redirectTo: "admin"
  },
  nurse: {
    simulationUserId: "remote-triage-nurse",
    username: "layla@irisstar.tech",
    password: "Layla@2026",
    role: "remote_triage_nurse",
    redirectTo: "workspace"
  },
  intake: {
    simulationUserId: "call-intake-coordinator",
    username: "intake@irisstar.tech",
    password: "Intake@2026",
    role: "call_intake_coordinator",
    redirectTo: "workspace"
  },
  integrationAdmin: {
    simulationUserId: "integration-administrator",
    username: "integration@irisstar.tech",
    password: "Integration@2026",
    role: "integration_administrator",
    redirectTo: "admin"
  }
} as const;

export type Persona = (typeof personas)[keyof typeof personas];

export async function apiLogin(request: APIRequestContext, persona: Persona) {
  const response = await request.post("/api/v1/auth/login", {
    data: {
      username: persona.username,
      password: persona.password,
      tenant: "ist-tech",
      language: "en",
      rememberMe: false,
      simulateRole: persona.role
    }
  });
  expect(response.status(), await response.text()).toBe(200);
  const body = await response.json();
  expect(body).toMatchObject({
    authenticated: true,
    redirectTo: persona.redirectTo,
    session: { activeRole: persona.role }
  });
  return body;
}

export async function browserLogin(page: Page, persona: Persona) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Continue" })).toBeVisible();
  await page.locator("#simulation-user").selectOption(persona.simulationUserId);
  await expect(page.locator("#assigned-role")).toHaveValue(persona.role);
  await expect(page.locator("#username")).toHaveValue(persona.username);
  await expect(page.locator("#password")).toHaveValue(persona.password);

  const loginResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/v1/auth/login") && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Simulate user" }).click();
  const response = await loginResponse;
  expect(response.status(), await response.text()).toBe(200);
  const body = await response.json();
  expect(body).toMatchObject({
    authenticated: true,
    redirectTo: persona.redirectTo,
    session: { activeRole: persona.role }
  });
  await expect(page).toHaveURL(new RegExp(`#/${persona.redirectTo}$`));
  return body;
}
