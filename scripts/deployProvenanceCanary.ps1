param(
  [Parameter(Mandatory = $true)][string]$GitSha,
  [Parameter(Mandatory = $true)][string]$BuildId,
  [Parameter(Mandatory = $true)][string]$Release,
  [string]$Project = "triage-502706",
  [string]$Region = "me-central1",
  [string]$Service = "ist-triage-demo",
  [string]$ImageUri = "me-central1-docker.pkg.dev/triage-502706/ist-triage-repo/ist-triage-release",
  [string]$Tag = "provenance-canary",
  [string]$Account = "sahni.ps@gmail.com"
)

$ErrorActionPreference = "Stop"

if ($GitSha -notmatch "^[0-9a-f]{40}$") {
  throw "GitSha must be a full lowercase 40-character Git SHA."
}
if ($BuildId -notmatch "^[0-9a-f-]{36}$") {
  throw "BuildId must be a Cloud Build UUID."
}
if ($Release -notmatch "^[a-z0-9-]{1,63}$") {
  throw "Release must be a lowercase Cloud Run label value."
}
if ($Tag -notmatch "^[a-z][a-z0-9-]{0,62}$") {
  throw "Tag must be a valid lowercase Cloud Run tag."
}

$dirty = @(git status --porcelain)
if ($LASTEXITCODE -ne 0) {
  throw "Unable to inspect the Git working tree."
}
if ($dirty.Count -gt 0) {
  throw "Provenance deployment requires a clean committed working tree."
}

$headSha = (git rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $headSha -ne $GitSha) {
  throw "GitSha does not match the clean checkout HEAD."
}

$gcloud = "C:\Users\PraveenSAHNI\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.ps1"
if (-not (Test-Path -LiteralPath $gcloud)) {
  throw "Google Cloud CLI was not found at the configured operator path."
}

$digest = (& $gcloud artifacts docker images describe "$ImageUri`:$GitSha" `
  --project $Project `
  --account $Account `
  --format "value(image_summary.digest)").Trim()
if ($LASTEXITCODE -ne 0 -or $digest -notmatch "^sha256:[0-9a-f]{64}$") {
  throw "The immutable Artifact Registry digest could not be resolved."
}

$shortSha = $GitSha.Substring(0, 7)
$immutableImage = "$ImageUri@$digest"

& $gcloud run deploy $Service `
  --project $Project `
  --account $Account `
  --region $Region `
  --image $immutableImage `
  --no-traffic `
  --tag $Tag `
  --update-labels "git-sha=$shortSha,release=$Release" `
  --update-env-vars "APP_GIT_SHA=$GitSha,APP_BUILD_ID=$BuildId" `
  --quiet
if ($LASTEXITCODE -ne 0) {
  throw "Cloud Run zero-traffic deployment failed."
}

$serviceJson = & $gcloud run services describe $Service `
  --project $Project `
  --account $Account `
  --region $Region `
  --format json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) {
  throw "Unable to inspect the deployed Cloud Run service."
}

$revision = [string]$serviceJson.status.latestReadyRevisionName
if ([string]::IsNullOrWhiteSpace($revision)) {
  throw "Unable to resolve the deployed Cloud Run revision."
}

$revisionJson = & $gcloud run revisions describe $revision `
  --project $Project `
  --account $Account `
  --region $Region `
  --format json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) {
  throw "Unable to inspect the deployed Cloud Run revision."
}

$revisionImage = [string]$revisionJson.spec.containers[0].image
$revisionGitLabel = [string]$revisionJson.metadata.labels.'git-sha'
$revisionReleaseLabel = [string]$revisionJson.metadata.labels.release
if ($revisionImage -ne $immutableImage) {
  throw "Revision image does not match the approved immutable digest."
}
if ($revisionGitLabel -ne $shortSha -or $revisionReleaseLabel -ne $Release) {
  throw "Revision labels do not match the approved Git SHA and release."
}

$tagTraffic = @($serviceJson.status.traffic | Where-Object { $_.tag -eq $Tag })
if ($tagTraffic.Count -ne 1) {
  throw "Expected exactly one tagged canary traffic entry."
}
$tagUrl = [string]$tagTraffic[0].url
if ($tagUrl -notmatch "^https://") {
  throw "Unable to resolve the tagged canary URL."
}

$runtime = Invoke-RestMethod -Uri "$tagUrl/api/v1/runtime/environment" -TimeoutSec 30
if (
  $runtime.provenance.gitSha -ne $GitSha -or
  $runtime.provenance.buildId -ne $BuildId -or
  $runtime.provenance.cloudRunRevision -ne $revision
) {
  throw "Live runtime provenance does not match the approved commit, build and revision."
}

$health = Invoke-WebRequest -Uri "$tagUrl/healthz/" -UseBasicParsing -TimeoutSec 30
if ($health.StatusCode -ne 200) {
  throw "Tagged canary health verification failed."
}

[pscustomobject]@{
  project = $Project
  service = $Service
  gitSha = $GitSha
  buildId = $BuildId
  image = $immutableImage
  revision = $revision
  gitLabel = $revisionGitLabel
  releaseLabel = $revisionReleaseLabel
  tag = $Tag
  runtimeMatched = $true
  healthStatus = $health.StatusCode
} | ConvertTo-Json
