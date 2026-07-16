import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const scriptArgs = process.argv.slice(2);

if (scriptArgs.length === 0) {
  console.error("Usage: node scripts/runPython.mjs <python-script> [args...]");
  process.exit(2);
}

const bundledPython = join(
  homedir(),
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "python",
  process.platform === "win32" ? "python.exe" : "bin/python"
);

const candidates = [
  process.env.PYTHON_BIN,
  process.env.PYTHON,
  bundledPython,
  "python",
  "python3",
  "py"
].filter(Boolean);

function canRunPython(command) {
  if ((command.includes("\\") || command.includes("/")) && !existsSync(command)) {
    return false;
  }
  const result = spawnSync(command, ["--version"], {
    encoding: "utf8",
    shell: false
  });
  return result.status === 0;
}

const pythonCommand = candidates.find((candidate) => canRunPython(candidate));

if (!pythonCommand) {
  console.error("Python executable not found. Set PYTHON_BIN to a Python 3 executable.");
  process.exit(1);
}

const result = spawnSync(pythonCommand, scriptArgs, {
  cwd: process.cwd(),
  encoding: "utf8",
  shell: false
});

if (result.stdout) {
  process.stdout.write(result.stdout);
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}

process.exit(result.status ?? 1);
