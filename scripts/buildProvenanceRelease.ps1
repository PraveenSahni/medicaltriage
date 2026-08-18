param(
  [string]$Project = "triage-502706",
  [string]$ImageUri = "me-central1-docker.pkg.dev/triage-502706/ist-triage-repo/ist-triage-release",
  [string]$Account = "sahni.ps@gmail.com"
)

$ErrorActionPreference = "Stop"

$dirty = @(git status --porcelain)
if ($LASTEXITCODE -ne 0) {
  throw "Unable to inspect the Git working tree."
}
if ($dirty.Count -gt 0) {
  throw "Production builds require a clean committed working tree."
}

$gitSha = (git rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $gitSha -notmatch "^[0-9a-f]{40}$") {
  throw "Unable to resolve a full Git commit SHA."
}

$gcloud = "C:\Users\PraveenSAHNI\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.ps1"
if (-not (Test-Path -LiteralPath $gcloud)) {
  throw "Google Cloud CLI was not found at the configured project-local operator path."
}

& $gcloud builds submit . `
  --config cloudbuild.provenance.yaml `
  --project $Project `
  --account $Account `
  --substitutions "_GIT_SHA=$gitSha,_IMAGE_URI=$ImageUri"
if ($LASTEXITCODE -ne 0) {
  throw "Cloud Build failed."
}

& $gcloud artifacts docker images describe "$ImageUri`:$gitSha" `
  --project $Project `
  --account $Account `
  --format "value(image_summary.digest)"
if ($LASTEXITCODE -ne 0) {
  throw "The immutable Artifact Registry digest could not be resolved."
}
