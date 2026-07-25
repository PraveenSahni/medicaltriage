import fs from "node:fs";
import path from "node:path";

const repo = process.cwd();
const catalog = path.join(repo, "docs/protocol-review/catalog/open-source");
const registry = JSON.parse(
  fs.readFileSync(path.join(catalog, "redirect-alias-registry.json"), "utf8"),
);
const aliases = new Map(registry.aliases.map((entry) => [entry.alias, entry]));
const sourceDir = path.join(repo, "src/data/openSourceGuidelines");
const runtimeTitles = new Set();
for (const file of fs.readdirSync(sourceDir).filter((name) => /^batch\d+.*\.ts$/.test(name))) {
  const text = fs.readFileSync(path.join(sourceDir, file), "utf8");
  for (const match of text.matchAll(/titleEn:\s*"([^"]+)"/g)) runtimeTitles.add(match[1]);
}
const batchSpecs = [
  [catalog, "manifests/batch-01-manifest.json"],
  [path.join(catalog, "batch-02"), "manifests/batch-02-manifest.json"],
  [path.join(catalog, "batch-03"), "manifests/batch-03-manifest.json"],
  [path.join(catalog, "batch-04"), "manifests/batch-04-manifest.json"],
  [path.join(catalog, "batch-05"), "manifests/batch-05-manifest.json"],
  [path.join(catalog, "batch-06"), "manifests/batch-06-manifest.json"],
  [path.join(catalog, "batch-07"), "manifests/batch-07-manifest.json"],
  [path.join(catalog, "batch-08"), "manifests/batch-08-manifest.json"],
  [path.join(catalog, "batch-09"), "manifests/batch-09-manifest.json"],
  [path.join(catalog, "batch-10"), "manifests/batch-10-manifest.json"],
  [path.join(catalog, "batch-11"), "manifests/batch-11-manifest.json"],
  [path.join(catalog, "batch-12"), "manifests/batch-12-manifest.json"],
  [path.join(catalog, "batch-13"), "manifests/batch-13-manifest.json"],
  [path.join(catalog, "batch-14"), "manifests/batch-14-manifest.json"],
  [path.join(catalog, "batch-15"), "manifests/batch-15-manifest.json"],
  [path.join(catalog, "batch-16"), "manifests/batch-16-manifest.json"],
  [path.join(catalog, "batch-17"), "manifests/batch-17-manifest.json"],
  [path.join(catalog, "batch-18"), "manifests/batch-18-manifest.json"],
  [path.join(catalog, "batch-19"), "manifests/batch-19-manifest.json"],
  [path.join(catalog, "batch-20"), "manifests/batch-20-manifest.json"],
  [path.join(catalog, "batch-21"), "manifests/batch-21-manifest.json"],
  [path.join(catalog, "batch-22"), "manifests/batch-22-manifest.json"],
  [path.join(catalog, "batch-23"), "manifests/batch-23-manifest.json"],
];
const errors = [];
const used = new Set();
let redirectCount = 0;
for (const [root, manifestFile] of batchSpecs) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, manifestFile), "utf8"));
  for (const entry of manifest.entries) {
    const doc = JSON.parse(fs.readFileSync(path.join(root, entry.file), "utf8"));
    for (const question of doc.questions.filter((q) => q.DispositionLevel === null)) {
      redirectCount++;
      used.add(question.GotoGuideline);
      if (!aliases.has(question.GotoGuideline)) {
        errors.push(`${entry.file}: redirect alias is not registered: ${question.GotoGuideline}`);
      }
    }
  }
}
for (const alias of used) {
  const entry = aliases.get(alias);
  if (
    entry?.canonicalTitle &&
    !runtimeTitles.has(entry.canonicalTitle)
  ) {
    errors.push(`${alias}: canonical runtime title does not exist: ${entry.canonicalTitle}`);
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
const usedEntries = [...used].map((alias) => aliases.get(alias));
console.log(
  JSON.stringify(
    {
      redirects: redirectCount,
      aliasesUsed: used.size,
      resolved: usedEntries.filter((entry) => entry.status === "resolved").length,
      conditional: usedEntries.filter((entry) => entry.status.startsWith("conditional")).length,
      blocked: usedEntries.filter((entry) => entry.status.startsWith("blocked")).length,
      unregistered: 0,
      invalidCanonicalTitles: 0,
      status: "PASS_WITH_BLOCKED_REDIRECTS_DOCUMENTED",
    },
    null,
    2,
  ),
);
