# Cost Visibility Setup

_Closes part of NFR-134 ("comprehensive data on usage/cost, proactive alerts
on consumption thresholds")._

## What's done (2026-08-04)

A BigQuery dataset (`billing_export`, region `me-central1`) has been created
via Terraform (`terraform/main.tf`) as the destination for GCP's standard
billing export - this is the real infrastructure piece, API/Terraform-able
and verified.

## What's NOT done, and why - a real GCP platform limitation

**Linking a BigQuery dataset as a billing account's actual export
destination cannot be done via gcloud CLI, the Terraform Google provider,
or any public API.** GCP only exposes this one step through the Cloud
Billing Console UI (`Billing` → `Billing export` → configure the BigQuery
export), and it requires Billing Account Administrator permission - a
higher privilege than the project-level access used for every other piece
of this remediation pass.

**One remaining manual step, for whoever holds Billing Account Administrator
access:**
1. Go to [Cloud Billing Console](https://console.cloud.google.com/billing) →
   select billing account `01A334-FBBE46-8FE527` → **Billing export**.
2. Under "Standard usage cost" (or "Detailed usage cost" for per-resource
   granularity), click **Edit settings**.
3. Select project `triage-502706`, dataset `billing_export`.
4. Save. Data begins appearing within a few hours; historical backfill is
   not automatic (export starts from the activation date forward).

## Once export is active: a starter cost-by-service query

```sql
SELECT
  service.description AS service,
  SUM(cost) AS total_cost,
  currency
FROM `triage-502706.billing_export.gcp_billing_export_v1_*`
WHERE usage_start_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY service, currency
ORDER BY total_cost DESC;
```

(Table name has a project-billing-account-ID suffix GCP assigns at export
creation time - confirm the exact table name in the BigQuery console once
export is live, then wire this into a Looker Studio dashboard or a
scheduled query with an alert threshold for the "proactive alerts on
consumption cost" half of NFR-134.)

## Explicitly out of scope for this pass

- The Console UI step above (needs Billing Account Administrator access,
  which this remediation pass's GCP credentials do not have).
- Building the actual dashboard/alerting on top of the exported data - that
  can only be built and tested once real export data exists.
