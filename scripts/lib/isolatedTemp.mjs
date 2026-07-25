import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const MARKER = ".codex-isolated-test-root.json";

export function verifiedOsTempRoot() {
  const root = fs.realpathSync.native(os.tmpdir());
  if (!path.isAbsolute(root) || !fs.statSync(root).isDirectory()) {
    throw new Error(`OS temp root is not an absolute directory: ${root}`);
  }
  const probe = path.join(root, `.aimltriage-write-probe-${process.pid}-${crypto.randomUUID()}`);
  try {
    fs.writeFileSync(probe, "probe", { flag: "wx" });
  } catch (error) {
    throw new Error(`OS temp root is not writable: ${root}`, { cause: error });
  } finally {
    fs.rmSync(probe, { force: true });
  }
  return root;
}

export function createIsolatedTemp(prefix, { tempRoot = verifiedOsTempRoot() } = {}) {
  const resolvedTemp = fs.realpathSync.native(tempRoot);
  if (!fs.statSync(resolvedTemp).isDirectory()) throw new Error(`Temp root is not a directory: ${resolvedTemp}`);
  let root;
  try {
    root = fs.mkdtempSync(path.join(resolvedTemp, prefix));
    fs.writeFileSync(
      path.join(root, MARKER),
      JSON.stringify({ purpose: "AiMlTriage isolated generation test", pid: process.pid }),
      { flag: "wx" },
    );
    return root;
  } catch (error) {
    if (root) fs.rmSync(root, { recursive: true, force: true });
    throw new Error(`Failed to create isolated temp root below ${resolvedTemp}`, { cause: error });
  }
}

export function assertIsolatedCwd(cwd, root) {
  const resolvedCwd = fs.realpathSync.native(cwd);
  const resolvedRoot = fs.realpathSync.native(root);
  if (resolvedCwd !== resolvedRoot) throw new Error(`Generator cwd mismatch: ${resolvedCwd} !== ${resolvedRoot}`);
  if (!fs.existsSync(path.join(resolvedRoot, MARKER))) {
    throw new Error(`Isolated temp marker is missing: ${resolvedRoot}`);
  }
  const temp = verifiedOsTempRoot();
  const relative = path.relative(temp, resolvedRoot);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Isolated root is outside the verified OS temp directory: ${resolvedRoot}`);
  }
}

export function cleanupIsolatedTemp(root) {
  assertIsolatedCwd(root, root);
  fs.rmSync(root, { recursive: true, force: true });
}

export function fingerprintTree(root) {
  const hash = crypto.createHash("sha256");
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const fullPath = path.join(directory, entry.name);
      const relative = path.relative(root, fullPath);
      hash.update(relative);
      if (entry.isDirectory()) visit(fullPath);
      else if (entry.isFile()) hash.update(fs.readFileSync(fullPath));
      else throw new Error(`Unsupported live-catalog entry during fingerprint: ${fullPath}`);
    }
  }
  visit(root);
  return hash.digest("hex");
}
