# Disposition-routing business-case pack

This is an isolated black-box API test pack. It does not change application
code, application configuration, clinical content, or database schema, and it
is not included in the production build or container runtime.

The pack submits 13 synthetic routing cases to an explicitly supplied test
environment and validates HTTP status, calculated severity, disposition code,
and matched safety trace. Technical PASS results do not constitute clinical or
governance approval.

## Safety boundaries

- Run only against an approved synthetic Demo, SOC2-staging, or local test URL.
- Never run against a real-patient or production environment.
- Supply a dedicated test account through environment variables.
- Never commit passwords, access tokens, MFA codes, or cookies.
- The runner performs encounter evaluations and therefore requires explicit
  authorization for the target environment.

## Required settings

- `API_BASE`: complete approved test origin, without an API path.
- `TEST_NURSE_USERNAME`: dedicated test nurse username.
- `TEST_NURSE_PASSWORD`: password supplied at execution time from an approved
  secret source.

## Run

PowerShell:

```powershell
$env:API_BASE = "https://approved-test-host"
$env:TEST_NURSE_USERNAME = "test-user@example.invalid"
$env:TEST_NURSE_PASSWORD = "retrieve-from-approved-secret-source"
npx.cmd tsx tests/packs/disposition-routing/dispositionRoutingBusinessCases.ts
```

Clear the process-scoped password after the run:

```powershell
Remove-Item Env:TEST_NURSE_PASSWORD
```

The command exits non-zero when login fails or any business case does not
match the governed expectation.
