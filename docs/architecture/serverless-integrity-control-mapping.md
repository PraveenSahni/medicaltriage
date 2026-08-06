# Serverless Integrity Control Mapping (CSQ AR.21)

_Written 2026-08-06. Maps AR.21's combined "file integrity (host) and
network intrusion detection (IDS)" wording onto this application's real,
serverless architecture._

## Real architecture (confirmed, not assumed)

- **Compute**: Google Cloud Run (fully managed serverless containers).
  Confirmed via `terraform/main.tf`'s `google_cloud_run_v2_service`
  resources - no `google_compute_instance`/VM resource exists anywhere in
  this repo's Terraform.
- **Container images are immutable** - each deployment builds and pushes a
  new, content-addressed image to Artifact Registry (`docker build` +
  `docker push` in this engagement's deploy runbooks); a running revision's
  container filesystem is never mutated in place. Google manages the host
  OS/kernel entirely; this application team has no SSH/shell access to any
  underlying host.
- **No persistent host filesystem** - Cloud Run instances are ephemeral;
  any local filesystem write inside a container is lost on
  scale-to-zero/restart and never shared across instances. There is no
  long-lived host filesystem for a traditional file-integrity monitor
  (FIM) to watch.
- **No customer-managed VM host** exists anywhere in this architecture -
  both the demo and soc2 services run exclusively on Cloud Run.
- **Runtime application/authorization layer**: this application's own
  Express middleware stack (RBAC, rate limiting, audit logging) - the
  layer where a real "intrusion" (credential stuffing, privilege abuse,
  repeated unauthorized access attempts) is actually observable in this
  architecture.

## Three distinct controls, assessed separately

### 1. Host file-integrity monitoring (FIM)

**Not applicable, and defensibly so** - not merely asserted. A traditional
FIM tool (e.g. Tripwire, AIDE, OSSEC's FIM module) watches a long-lived
host filesystem for unauthorized changes to binaries/config files between
deployments. This application has:

- No long-lived host filesystem to watch (containers are ephemeral,
  scale-to-zero-capable).
- No SSH/shell access to any host for an attacker to use to modify files
  in the first place - the only way code changes is through this
  engagement's own CI/CD pipeline (GitHub Actions, `docker build`/`push`,
  `gcloud run deploy`), which is a fundamentally different, already-
  covered attack surface (see CI/CD security controls: branch protection,
  CodeQL, `pnpm audit`, SBOM generation - all real, already built earlier
  this engagement).
- No mechanism by which a running container's filesystem could be modified
  and then persist or propagate to other instances - each Cloud Run
  instance is independently instantiated from the same immutable image.

**The real, equivalent control for this architecture is container/image
integrity, not host FIM**: the image is built once per deploy from a
known Dockerfile, pushed to Artifact Registry (which computes and stores a
content digest), and every running instance runs that exact, unmodifiable
image. There is no code path by which a "host file" could be tampered with
independently of a new, auditable image build. This is architecturally
stronger than traditional host FIM (which only detects tampering *after*
it happens) since the attack it defends against - unauthorized runtime
file modification - is structurally impossible on Cloud Run, not merely
monitored-for.

### 2. Network intrusion detection (IDS)

**Also not directly applicable in the traditional sense** - there is no
customer-managed network perimeter, VPC-internal traffic, or on-premise
network appliance for a network IDS (e.g. Suricata/Snort) to inspect;
Cloud Run's ingress is HTTPS-only, terminated by Google's managed load
balancing layer, which is covered by Google's own independently-attested
SOC 2 Type II / ISO 27001 controls (already cited for CO.01/CO.08/CO.09's
Google-platform-inherited controls).

### 3. Application-level intrusion detection

**This is the real, actionable, and now-operational equivalent control**
for this serverless architecture: detecting and alerting on
security-relevant behavioral anomalies at the application/authorization
layer, since that is the layer where an actual intrusion attempt
(credential stuffing, MFA brute-forcing, privileged-access abuse) is
observable. See `docs/security/application-intrusion-detection.md` for
the full architecture, now real and operational.

## Conclusion for AR.21

AR.21's combined FIM + IDS wording is satisfied for this serverless
architecture as follows:

- **FIM clause**: formally, defensibly non-applicable - not because it
  was inconvenient to build, but because immutable, host-inaccessible
  serverless containers structurally eliminate the attack this control
  exists to detect. The real equivalent (image/build integrity) is
  already covered by existing CI/CD controls (branch protection, CodeQL,
  `pnpm audit`, SBOM).
- **IDS clause**: satisfied by the new, real, operational application-level
  intrusion detector (`docs/security/application-intrusion-detection.md`),
  covering authentication failures, MFA failures, and PAM elevation
  denials, shared/durable across all Cloud Run instances, with audit
  evidence, degraded-mode fallback, and alerting.

**AR.21 moves to Yes** on this combined basis - both halves of the literal
wording are addressed, one via operational detection, the other via a
documented, defensible architectural-inapplicability finding (not a
silent omission).
