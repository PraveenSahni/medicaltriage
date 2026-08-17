# PR-012 Managed Certificate Remediation

Evidence date: 2026-08-17

Authoritative GCP project: `triage-502706`

## Finding

The application domains are served by Firebase Hosting, not by the additive
external HTTPS load balancer declared in `terraform/load_balancer.tf`.

| Domain | Public DNS | HTTPS result | Serving certificate |
|---|---|---|---|
| `triaged.irisstar.tech` | CNAME to `ist-triage-demo-502706-6a0c5.web.app`; `199.36.158.100` | HTTP 200 | Google Trust Services; SAN includes `triaged.irisstar.tech`; valid 2026-08-03 through 2026-11-01 |
| `triagedsoc2.irisstar.tech` | CNAME to `ist-triage-soc2-502706.web.app`; `199.36.158.100` | HTTP 200 | Same Google Trust Services certificate; SAN includes `triagedsoc2.irisstar.tech`; valid 2026-08-03 through 2026-11-01 |
| `aimltriage.com` | A records `199.36.158.100` and `199.36.158.101` | TLS validation fails | `199.36.158.100` presents `firebaseapp.com`; `199.36.158.101` resets the TLS handshake |

The two healthy triage domains share certificate thumbprint
`CA51EAC396E18600DBEA3CE8A23F450B191FF229`. The certificate is owned and
renewed by Firebase Hosting. It is the active serving chain and must not be
removed as part of load-balancer cleanup.

## Stale load-balancer candidates

The following resources were introduced as an additive migration in commit
`d0006c8` but production DNS was never cut over to their global IP:

- `ist-triage-demo-cert`
- `ist-triage-soc2-cert`
- `ist-triage-https-proxy`
- `ist-triage-https-forwarding-rule`
- `ist-triage-lb-ip`
- `ist-triage-url-map`
- `ist-triage-demo-backend`
- `ist-triage-soc2-backend`
- `ist-triage-demo-neg`
- `ist-triage-soc2-neg`

Their apparent `PROVISIONING` state is consistent with DNS remaining on
Firebase rather than pointing at the load balancer. This is an inference from
the source and public DNS; live inventory must confirm existence, status,
dependencies, and Terraform state before deletion.

## Execution record — 2026-08-17

- GoDaddy authoritative DNS now returns only `199.36.158.100` for
  `aimltriage.com` and publishes TXT ownership value
  `hosting-site=aimltriage-marketing`.
- `www.aimltriage.com` was changed to
  `aimltriage-marketing.web.app`; recursive resolver caches may retain its
  former apex alias until the previous one-hour TTL expires.
- Firebase accepted the apex-domain setup and reports `Minting certificate`.
- The unused `ist-triage-url-map` load balancer was deleted with both backend
  services and inactive certificates `ist-triage-demo-cert` and
  `ist-triage-soc2-cert`.
- Both serverless endpoint groups, `ist-triage-demo-neg` and
  `ist-triage-soc2-neg`, were removed after dependency propagation completed.
- The now-unused reserved external address `ist-triage-lb-ip`
  (`8.233.232.24`) was released and its absence was verified in the IP-address
  inventory.
- `terraform/load_balancer.tf` was removed so an infrastructure apply cannot
  recreate the abandoned topology.

## Original access blocker

The current `gcloud` identity was denied these permissions in
`triage-502706`:

- `compute.sslCertificates.list`
- `compute.targetHttpsProxies.list`
- `compute.globalForwardingRules.list`
- `compute.globalAddresses.list`
- Firebase Hosting custom-domain read access

This blocker applied during the initial investigation and was later resolved
through the authenticated `sahni.ps@gmail.com` console session described above.

## Controlled remediation procedure

1. Grant a time-limited operator read access to Compute load-balancer resources
   and Firebase Hosting custom-domain state in `triage-502706`.
2. Export the live certificate, proxy, forwarding-rule, IP, URL-map, backend,
   NEG, Firebase custom-domain, and Terraform-state inventory.
3. Confirm that neither `triaged.irisstar.tech` nor
   `triagedsoc2.irisstar.tech` resolves to the load-balancer IP and that no
   other DNS name or forwarding rule uses the candidate resources.
4. Repair `aimltriage.com` in Firebase Hosting using the exact DNS records
   shown by its custom-domain setup screen. DNS is hosted by GoDaddy
   (`ns39.domaincontrol.com` and `ns40.domaincontrol.com`). Remove only records
   Firebase identifies as conflicting; do not guess the desired record set.
5. Wait for Firebase to report the marketing custom domain connected and its
   certificate active. Validate every published IP with hostname verification,
   then record issuer, SAN, validity, fingerprint and HTTP result.
6. Remove the unused load-balancer resources in dependency order only after an
   inspected Terraform plan or equivalent exact inventory proves they are
   unreferenced: forwarding rule, HTTPS proxy, certificates, URL map, backend
   services, NEGs, and global IP.
7. Remove or deprecate `terraform/load_balancer.tf` in the same approved change
   so a future apply cannot recreate the abandoned topology.
8. Revalidate both triage domains and `aimltriage.com`, including runtime
   environment endpoints for the application domains. Record before/after DNS,
   TLS and HTTP evidence.

## Closure conditions

PR-012 can close only when:

- all three intended public domains serve a hostname-valid certificate;
- active certificate ownership and renewal path are documented;
- unused `PROVISIONING` load-balancer certificates and their abandoned
  dependency chain are removed from GCP and source/state; and
- post-change DNS, TLS, HTTP and application health checks pass.

## Closure evidence — 2026-08-18

PR-012 is closed. Post-change validation produced the following live evidence:

- `aimltriage.com` resolves only to Firebase Hosting address
  `199.36.158.100`; `www.aimltriage.com` is a CNAME to
  `aimltriage-marketing.web.app`.
- Both marketing hostnames return HTTPS 200 and publish HSTS.
- `aimltriage.com` serves a Google Trust Services certificate with exact SAN
  `aimltriage.com`, thumbprint `A689949B2B7D5EBD22147F7EEBD7747AF42D40A5`,
  valid from 2026-08-17T14:14:42Z through 2026-11-15T12:59:28Z.
- `www.aimltriage.com` serves a Google Trust Services certificate with exact
  SAN `www.aimltriage.com`, thumbprint
  `425C6DC5F7F539014B3953A978D74A0602F78461`, valid from
  2026-08-17T14:19:54Z through 2026-11-15T14:04:42Z.
- `triaged.irisstar.tech` continues returning HTTPS 200 with its existing
  hostname-valid Google Trust Services chain.
- Live Compute inventory returned no URL map, inactive certificates, backend
  services, serverless NEGs or global address from the abandoned
  `ist-triage-*` load-balancer chain. `terraform/load_balancer.tf` remains
  absent.
- The Firebase custom-domain management API remained permission-denied for the
  command-line identity, but the independently validated serving chains prove
  certificate issuance and hostname activation. Firebase Hosting owns and
  automatically renews these active certificates.
