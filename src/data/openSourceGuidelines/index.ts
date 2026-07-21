import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { openSourceClinicalRulesContent } from "../openSourceClinicalRulesContent.js";
import { batch01Protocols } from "./batch01.js";
import { batch02FormalRulesProtocols } from "./batch02FormalRules.js";
import { batch03Protocols } from "./batch03.js";
import { batch04Protocols } from "./batch04.js";
import { batch05Protocols } from "./batch05.js";
import { batch06Protocols } from "./batch06.js";
import { batch07Protocols } from "./batch07.js";
import { batch08Protocols } from "./batch08.js";
import { batch09Protocols } from "./batch09.js";
import { batch10Protocols } from "./batch10.js";
import { batch11Protocols } from "./batch11.js";
import { batch12Protocols } from "./batch12.js";
import { batch13Protocols } from "./batch13.js";
import { batch14Protocols } from "./batch14.js";
import { batch15Protocols } from "./batch15.js";
import { batch16Protocols } from "./batch16.js";
import { batch17Protocols } from "./batch17.js";
import { batch18Protocols } from "./batch18.js";
import { batch19Protocols } from "./batch19.js";
import { batch20Protocols } from "./batch20.js";
import { batch21Protocols } from "./batch21.js";
import { batch22Protocols } from "./batch22.js";
import { batch23Protocols } from "./batch23.js";
import { attachDictionarySynonymsToAll } from "./shared/synonymDictionary.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Assembles the full open-source-sourced content package: the original 4
 * formal-rule protocols (Ottawa Ankle, Centor/McIsaac, CURB-65, Wells DVT)
 * plus every subsequent batch file. Batch files each export a plain
 * `ProtocolInput[]` (see `./shared/builders.ts` for reusable authoring
 * helpers) and get added to `batchProtocols` below - no other file needs to
 * change as batches are added.
 */
const batchProtocols: ProtocolInput[] = [
  ...batch01Protocols,
  ...batch02FormalRulesProtocols,
  ...batch03Protocols,
  ...batch04Protocols,
  ...batch05Protocols,
  ...batch06Protocols,
  ...batch07Protocols,
  ...batch08Protocols,
  ...batch09Protocols,
  ...batch10Protocols,
  ...batch11Protocols,
  ...batch12Protocols,
  ...batch13Protocols,
  ...batch14Protocols,
  ...batch15Protocols,
  ...batch16Protocols,
  ...batch17Protocols,
  ...batch18Protocols,
  ...batch19Protocols,
  ...batch20Protocols,
  ...batch21Protocols,
  ...batch22Protocols,
  ...batch23Protocols
];

export const openSourceGuidelinesContent: ClinicalContentPackageInput = {
  release: openSourceClinicalRulesContent.release,
  localizedDispositions: openSourceClinicalRulesContent.localizedDispositions,
  protocols: attachDictionarySynonymsToAll([...openSourceClinicalRulesContent.protocols, ...batchProtocols])
};
