# Security Policy

## Reporting a vulnerability

If you believe you've found a security vulnerability in this project, please
report it privately rather than opening a public GitHub issue.

- **Email:** security@irisstar.tech
- **What to include:** a description of the issue, steps to reproduce, and
  the potential impact. If you have a proof-of-concept, include it.

We aim to acknowledge reports within 3 business days.

## Scope

This covers the IST Health Tele-Triage application and its supporting
infrastructure (`triaged.irisstar.tech`, `triagedsoc2.irisstar.tech`, and
their backing GCP services). It does not cover third-party dependencies
directly - please report those upstream, though we'd appreciate being
copied so we can track and patch accordingly (see the automated dependency
scanning below).

## What we consider in scope

- Authentication/authorization bypass
- Cross-tenant data access
- Injection vulnerabilities (SQL, XSS, etc.)
- Exposure of secrets or credentials
- Any way to access, modify, or delete data belonging to a user or
  organization other than your own

## Automated security tooling already in place

- Dependency vulnerability scanning (`pnpm audit`) and Dependabot run in CI
  on every push; the build fails on any new high/critical finding.
- A Software Bill of Materials (SBOM, CycloneDX format) is generated on
  every push and retained as a build artifact.
- No formal bug-bounty program exists at this time.

## Response process

Once a report is received, we will:
1. Confirm receipt and begin triage.
2. Work to reproduce and assess severity.
3. Develop and test a fix, prioritizing by severity (critical/high issues
   are treated as the highest priority).
4. Notify the reporter once the fix is deployed.

We ask that you give us a reasonable opportunity to fix an issue before any
public disclosure.
