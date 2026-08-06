#!/usr/bin/env node
// Repeatable log-privacy audit scan (NFR-078 / NFR-004 AI-tab).
//
// Flags CANDIDATES for manual review - it does not claim every match is a
// defect. A raw `console.error(..., error)` call is often fine once the
// error itself has been sanitized; this script exists so a future logging
// call site can be checked against the same patterns the original manual
// audit used, not to replace human review.
//
// Usage: node scripts/logPrivacyAudit.mjs

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "scripts", "frontend/src"];
const SKIP_DIR_NAMES = new Set(["node_modules", "dist", "dist-web", ".git", "test-results", "playwright-report"]);

const PATTERNS = [
  { name: "console.log/error/warn/debug/info", regex: /console\.(log|error|warn|debug|info)\s*\(/g },
  { name: "JSON.stringify inside a console.* call (same line)", regex: /console\.\w+\([^)]*JSON\.stringify/g },
  { name: "raw error object logged without sanitizeForLog", regex: /console\.(log|error|warn)\([^)]*,\s*error\)/g },
  { name: "request/response body referenced near a log call", regex: /console\.\w+\([^)]*\b(req\.body|res\.body|requestBody|responseBody)\b/g }
];

function walk(dir, files = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (SKIP_DIR_NAMES.has(entry)) continue;
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      walk(full, files);
    } else if ([".ts", ".tsx", ".mjs", ".js"].includes(extname(full))) {
      files.push(full);
    }
  }
  return files;
}

function scanFile(path) {
  const content = readFileSync(path, "utf8");
  const lines = content.split("\n");
  const findings = [];
  lines.forEach((line, index) => {
    for (const pattern of PATTERNS) {
      pattern.regex.lastIndex = 0;
      if (pattern.regex.test(line)) {
        findings.push({ line: index + 1, pattern: pattern.name, text: line.trim().slice(0, 160) });
      }
    }
  });
  return findings;
}

const files = SCAN_DIRS.flatMap((dir) => walk(join(ROOT, dir)));
let totalFindings = 0;
const report = [];

for (const file of files) {
  const findings = scanFile(file);
  if (findings.length > 0) {
    totalFindings += findings.length;
    report.push({ file: file.replace(`${ROOT}\\`, "").replace(`${ROOT}/`, ""), findings });
  }
}

console.log(`Log-privacy audit scan - ${files.length} files scanned, ${totalFindings} candidate line(s) flagged for review.`);
console.log("These are CANDIDATES, not confirmed defects - see docs/security/log-data-protection-audit.md for the reviewed findings.\n");
for (const entry of report) {
  console.log(`${entry.file}:`);
  for (const finding of entry.findings) {
    console.log(`  line ${finding.line} [${finding.pattern}]: ${finding.text}`);
  }
}
