import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { mapCanonicalExtractToPackage, type CanonicalExtract } from "../../services/stccMdbMapper.js";

/**
 * Loads real, licensed Schmitt-Thompson Clinical Content (STCC) - After-Hours
 * Telehealth Triage Guidelines - from the canonical JSON produced by
 * `scripts/extractStccMdb.ps1`, which reads the vendor's actual Access
 * database via ODBC (verified against a real sample .mdb this session; see
 * the STCC realignment plan). The actual mapping to this app's
 * ClinicalContentPackageInput shape lives in `src/services/stccMdbMapper.ts`,
 * shared with the Mdb*-Prisma-table-backed loader used for
 * CLINICAL_CONTENT_SOURCE=database (see clinicalContent.ts) so both sources
 * produce identical protocol shapes.
 */

function loadExtract(): CanonicalExtract {
  const filePath = path.resolve(process.cwd(), "docs", "protocol-review", "data", "stcc-sample-extract.json");
  if (!existsSync(filePath)) {
    throw new Error(
      `Real STCC extract not found: ${filePath}. Run scripts/extractStccMdb.ps1 against a delivered .mdb first.`
    );
  }
  return JSON.parse(readFileSync(filePath, "utf8")) as CanonicalExtract;
}

export const stccLicensedContent: ClinicalContentPackageInput = mapCanonicalExtractToPackage(loadExtract());
