# Administrator Workstation Hardening Evidence (CSQ IS.66 - workstation half)

_Written 2026-08-06. This document intentionally contains no invented
evidence - every row below reflects what could genuinely be verified (or
not) from this session's available tools (source code, Terraform, GCP
CLI). None of it can substitute for real HR/IT/endpoint-management
confirmation._

| Control | Classification | Basis |
|---|---|---|
| Managed corporate devices | Requires HR/IT evidence | No device-management system (Intune, Jamf, Workspace endpoint management, etc.) is referenced anywhere in this repository or its infrastructure config |
| Full-disk encryption | Requires HR/IT evidence | Not observable from cloud/code |
| Endpoint protection / EDR | Requires HR/IT evidence | Not observable from cloud/code |
| OS patching (workstation) | Requires HR/IT evidence | Not observable from cloud/code |
| Screen lock | Requires HR/IT evidence | Not observable from cloud/code |
| MFA for workstation/device login (distinct from this application's own MFA) | Requires HR/IT evidence | This application's own MFA (AR.13) is real and verified, but is unrelated to OS/device-login MFA on an administrator's laptop |
| Local-administrator restrictions | Requires HR/IT evidence | Not observable from cloud/code |
| Device inventory | Requires HR/IT evidence | Not observable from cloud/code |
| Remote wipe | Requires HR/IT evidence | Not observable from cloud/code |
| USB controls | Requires HR/IT evidence | Not observable from cloud/code |
| Antivirus | Requires HR/IT evidence | Not observable from cloud/code |
| Browser policies | Requires HR/IT evidence | Not observable from cloud/code |
| Security baseline (e.g. CIS benchmark) | Requires HR/IT evidence | Not observable from cloud/code |
| Compliance reporting | Requires HR/IT evidence | Not observable from cloud/code |

## Why this cannot be closed from this engagement

Every row above requires a real, independent source of evidence (an MDM
console export, an IT security policy document, an HR onboarding
checklist) that a codebase/cloud-infrastructure review has no access to
and should not fabricate. This is the same conclusion reached in the
prior IS.66 assessment batch, restated here as its own dedicated
evidence file per this batch's explicit documentation requirement.

## Status

**Unresolved.** IS.66 cannot move to Yes until real evidence for these
14 controls is obtained from IST's HR/IT function, regardless of how
complete the cloud-IAM and application-RBAC halves become.
