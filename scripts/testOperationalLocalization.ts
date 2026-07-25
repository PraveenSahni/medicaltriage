import assert from "node:assert/strict";
import { localizeOperationalText } from "../docs/protocol-review/catalog/open-source/scripts/shared-demographic-generator.js";
import { batch01Protocols } from "../src/data/openSourceGuidelines/batch01.js";
import { batch02FormalRulesProtocols } from "../src/data/openSourceGuidelines/batch02FormalRules.js";
import { batch03Protocols } from "../src/data/openSourceGuidelines/batch03.js";
import { batch04Protocols } from "../src/data/openSourceGuidelines/batch04.js";
import { batch05Protocols } from "../src/data/openSourceGuidelines/batch05.js";
import { batch06Protocols } from "../src/data/openSourceGuidelines/batch06.js";
import { batch07Protocols } from "../src/data/openSourceGuidelines/batch07.js";
import { batch08Protocols } from "../src/data/openSourceGuidelines/batch08.js";
import { batch09Protocols } from "../src/data/openSourceGuidelines/batch09.js";
import { batch10Protocols } from "../src/data/openSourceGuidelines/batch10.js";
import { batch11Protocols } from "../src/data/openSourceGuidelines/batch11.js";
import { batch12Protocols } from "../src/data/openSourceGuidelines/batch12.js";

const prohibited =
  /\bGP\b|\b(?:NHS\s*)?111\b|\bA&E\b|\bcall-999\b|\bchemist\b|\bwalk-in centre\b|\bminor injuries unit\b/i;
const samples = [
  "Seek urgent GP/111 contact.",
  "Call NHS 111.",
  "Go to A&E.",
  "Drive to A&E.",
  "Book a GP appointment.",
  "Ask a chemist.",
  "Attend a walk-in centre.",
  "Use a minor injuries unit.",
];

for (const sample of samples) {
  const localized = localizeOperationalText(sample);
  assert.doesNotMatch(localized, prohibited, sample);
  assert.match(localized, /GOVERNANCE_REQUIRED|Qatar 999/, sample);
}

const batches = [
  batch01Protocols,
  batch02FormalRulesProtocols,
  batch03Protocols,
  batch04Protocols,
  batch05Protocols,
  batch06Protocols,
  batch07Protocols,
  batch08Protocols,
  batch09Protocols,
  batch10Protocols,
  batch11Protocols,
  batch12Protocols,
];
let renderedStringsChecked = 0;
const checkRenderedStrings = (value: unknown, location: string): void => {
  if (typeof value === "string") {
    const localized = localizeOperationalText(value);
    assert.doesNotMatch(localized, prohibited, location);
    renderedStringsChecked += 1;
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => checkRenderedStrings(item, `${location}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) =>
      checkRenderedStrings(item, `${location}.${key}`),
    );
  }
};

batches.forEach((batch, index) => checkRenderedStrings(batch, `batch${String(index + 1).padStart(2, "0")}`));

console.log(JSON.stringify({
  status: "PASS",
  samples: samples.length,
  batches: batches.length,
  renderedStringsChecked,
  assertions: samples.length * 2 + renderedStringsChecked,
}, null, 2));
