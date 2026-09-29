# CD pipeline setup — ist-triage-qatar-new

One-time setup so `.github/workflows/deploy-qatar-new.yml` can deploy to
`ist-triage-qatar-new` without a stored JSON service account key. Run these
once from a terminal authenticated as an owner/editor of the project
(`sohail@irisstar.tech`).

## 1. Create the Workload Identity Pool and Provider

```bash
gcloud iam workload-identity-pools create github-actions \
  --project=ist-triage-qatar-new \
  --location=global \
  --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc github-actions-deploy \
  --project=ist-triage-qatar-new \
  --location=global \
  --workload-identity-pool=github-actions \
  --display-name="GitHub Actions deploy" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="attribute.repository=='sohail807/AIML_Triage'" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

## 2. Create the deploy service account (least privilege)

```bash
gcloud iam service-accounts create ci-deployer \
  --project=ist-triage-qatar-new \
  --display-name="CI/CD deploy identity (GitHub Actions)"
```

Grant only what the workflow actually needs — build/push images, run the
migration job, deploy the three known Cloud Run services, and act as the
runtime service account (required to deploy a service that itself runs as
`ist-triage-cloudrun-sa`):

```bash
PROJECT=ist-triage-qatar-new
DEPLOYER="serviceAccount:ci-deployer@${PROJECT}.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT --member="$DEPLOYER" --role="roles/artifactregistry.writer" --condition=None
gcloud projects add-iam-policy-binding $PROJECT --member="$DEPLOYER" --role="roles/run.developer" --condition=None
gcloud projects add-iam-policy-binding $PROJECT --member="$DEPLOYER" --role="roles/cloudsql.client" --condition=None
gcloud iam service-accounts add-iam-policy-binding \
  ist-triage-cloudrun-sa@${PROJECT}.iam.gserviceaccount.com \
  --member="$DEPLOYER" \
  --role="roles/iam.serviceAccountUser" \
  --project=$PROJECT
```

## 3. Allow the GitHub repo to impersonate it

```bash
PROJECT_NUMBER=$(gcloud projects describe ist-triage-qatar-new --format="value(projectNumber)")

gcloud iam service-accounts add-iam-policy-binding \
  ci-deployer@ist-triage-qatar-new.iam.gserviceaccount.com \
  --project=ist-triage-qatar-new \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-actions/attribute.repository/sohail807/AIML_Triage"
```

## 4. Set the GitHub repository variable

Get the full provider resource name:

```bash
gcloud iam workload-identity-pools providers describe github-actions-deploy \
  --project=ist-triage-qatar-new \
  --location=global \
  --workload-identity-pool=github-actions \
  --format="value(name)"
```

In the GitHub repo (`sohail807/AIML_Triage`) → Settings → Secrets and
variables → Actions → Variables, add:

- `GCP_WORKLOAD_IDENTITY_PROVIDER` = the value printed above

No secrets (JSON keys) are needed — the workflow authenticates via short-lived
OIDC-exchanged tokens only.

## 5. Verify

Push to `main`, or run the workflow manually (Actions → Deploy
(ist-triage-qatar-new) → Run workflow). It should: run the full test suite,
build and push the image, apply Prisma migrations via a one-off Cloud Run Job,
deploy all three services, then smoke-check each one's
`/api/v1/runtime/environment` endpoint.

## Why this wasn't done automatically

Every command above grants or scopes an IAM permission — the same category of
action (IAM policy bindings, workload identity federation trust
relationships) that this project's assistant session is deliberately blocked
from executing directly, to prevent an agent from silently expanding its own
or another identity's access. That restriction is a feature, not a gap:
review each command above before running it, same as you would for any
other production IAM change.
