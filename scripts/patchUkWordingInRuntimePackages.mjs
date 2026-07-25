// Applies the same UK-wording replacement map used on the source JSON files
// to already-generated runtime packages (batches 5-8, authored by a
// different generator this session doesn't own), so the already-imported
// database content matches the corrected source files without needing to
// reverse-engineer the original generator.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { REPLACEMENTS } from "./fixUkWordingCatalog.mjs";

const FILES = [
  "docs/protocol-review/catalog/open-source/runtime/batch-01.runtime.json",
  "docs/protocol-review/catalog/open-source/batch-05/runtime/batch-05.runtime.json",
  "docs/protocol-review/catalog/open-source/batch-06/runtime/batch-06.runtime.json",
  "docs/protocol-review/catalog/open-source/batch-07/runtime/batch-07.runtime.json",
  "docs/protocol-review/catalog/open-source/batch-08/runtime/batch-08.runtime.json"
];

for (const relPath of FILES) {
  const filePath = path.resolve(relPath);
  let text = readFileSync(filePath, "utf8");
  let replacements = 0;
  for (const [oldStr, newStr] of REPLACEMENTS) {
    if (text.includes(oldStr)) {
      text = text.split(oldStr).join(newStr);
      replacements++;
    }
  }
  writeFileSync(filePath, text, "utf8");
  console.log(`${relPath}: ${replacements} replacements applied`);
}
