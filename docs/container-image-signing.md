# Container Image Signing (cosign)

_Closes part of NFR-179 ("container images must be cryptographically signed and
verified before deployment")._

## Approach chosen: key-based, not keyless/OIDC

Cosign supports two signing modes. Keyless (Sigstore OIDC) signing requires an
interactive browser login (GitHub/Google/Microsoft) tying the signature to a
personal identity - appropriate for CI pipelines with their own OIDC identity
(e.g. GitHub Actions), but this repo's images are currently built manually via
`gcloud builds submit`, not from a CI pipeline, so there is no CI identity to
sign as, and signing under a *personal* developer identity would tie image
provenance to whichever engineer happened to run the build. Key-based signing
(a dedicated keypair for this project) was used instead - a standard, valid
cosign signing mode, and consistent with the fact that the signing key belongs
to the project/environment rather than an individual.

## What was done

1. Generated a cosign ECDSA keypair (`cosign generate-key-pair`).
2. Signed the real, currently-deployed soc2 image
   (`ist-triage-soc2@sha256:5724f4fb395a872cb9de0ee0e84528c10dc4bbf8051976a85fcfb838e0d573d1`,
   tag `purge-job-20260804`) with the private key.
3. **Verified independently** with `cosign verify --key=security/cosign.pub` -
   confirmed the claim, the transparency-log entry, and the signature all
   validate against the public key, proving the signing step actually worked
   (not just that the command exited 0).
4. Stored the private key and its password in Secret Manager
   (`ist-triage-cosign-private-key`, `ist-triage-cosign-key-password`) -
   never committed to the repo. The public key is committed at
   [`security/cosign.pub`](../security/cosign.pub) for anyone to verify
   signatures against.

## Verifying an image

```bash
cosign verify --key=security/cosign.pub \
  me-central1-docker.pkg.dev/triage-502706/ist-triage-repo/ist-triage-soc2@<digest>
```

## Signing a newly built image

```bash
gcloud secrets versions access latest --secret=ist-triage-cosign-private-key --project=triage-502706 > /tmp/cosign.key
export COSIGN_PASSWORD=$(gcloud secrets versions access latest --secret=ist-triage-cosign-key-password --project=triage-502706)
cosign sign --yes --key=/tmp/cosign.key <image>@<digest>
rm -f /tmp/cosign.key
```

## Honest scope and limitations

- **Only the one image built this session is signed today** - there is no
  CI/CD pipeline step yet that signs every image automatically at build time,
  and no deploy-time enforcement (`gcloud run deploy` does not currently
  verify a cosign signature before accepting an image). This closes "can this
  app's images be signed and verified at all" (yes, demonstrated end-to-end)
  but not "is every deployed image signed, always, automatically."
- **Recommended next step** (not done here, flagged for a future pass): add a
  CI build+sign step and a deploy-time `cosign verify` gate, once image builds
  move into the CI pipeline (`.github/workflows/ci.yml` does not currently
  build/push Docker images at all - builds are manual `gcloud builds submit`
  runs this session).
