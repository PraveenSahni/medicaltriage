import { expect, type APIRequestContext, type Page } from "@playwright/test";

// `redirectTo` is the raw backend field (asserted by apiLogin() against the
// real /api/v1/auth/login JSON response). `landingView` is the real final
// URL hash a *browser* session lands on (asserted by browserLogin()) -
// App.tsx's post-login handler overrides the backend's `redirectTo`
// client-side for any role on the Nurse Cockpit allow-list
// (frontend/src/cockpit/roles.ts's NURSE_COCKPIT_ALLOWED_ROLES, which
// includes both remote_triage_nurse and call_intake_coordinator) - those
// roles land on "cockpit" in a real browser, even though the backend's own
// field still literally says "workspace".
export const personas = {
  platformAdmin: {
    simulationUserId: "platform-administrator",
    username: "pa@irisstar.tech",
    password: "PlatformAdmin@2026",
    role: "platform_super_administrator",
    redirectTo: "admin",
    landingView: "admin"
  },
  nurse: {
    simulationUserId: "remote-triage-nurse",
    username: "layla@irisstar.tech",
    password: "Layla@2026",
    role: "remote_triage_nurse",
    redirectTo: "workspace",
    landingView: "cockpit"
  },
  intake: {
    simulationUserId: "call-intake-coordinator",
    username: "intake@irisstar.tech",
    password: "Intake@2026",
    role: "call_intake_coordinator",
    redirectTo: "workspace",
    landingView: "cockpit"
  },
  integrationAdmin: {
    simulationUserId: "integration-administrator",
    username: "integration@irisstar.tech",
    password: "Integration@2026",
    role: "integration_administrator",
    redirectTo: "admin",
    landingView: "admin"
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
  // Real, current LoginCard.tsx form - a plain username/password submit, no
  // simulate-role picker (that UI predates a real login-page redesign; this
  // helper previously drove a `#simulation-user` dropdown that no longer
  // exists anywhere in the frontend, confirmed via a repo-wide search).
  await expect(page.getByRole("heading", { name: "Sign in to Nurse Cockpit" })).toBeVisible();
  await page.locator("#username").fill(persona.username);
  await page.locator("#password").fill(persona.password);

  const loginResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/v1/auth/login") && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  const response = await loginResponse;
  expect(response.status(), await response.text()).toBe(200);
  const body = await response.json();
  expect(body).toMatchObject({
    authenticated: true,
    redirectTo: persona.redirectTo,
    session: { activeRole: persona.role }
  });
  await expect(page).toHaveURL(new RegExp(`#/${persona.landingView}$`));
  return body;
}
