import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

/**
 * Real automated contract/compatibility test (NFR-006/NFR-009): fails the
 * build if a route present in the committed baseline
 * (docs/openapi-baseline.json) disappears from the freshly-generated spec
 * without a version bump. This is the "no accidental breaking change"
 * enforcement the prior remark disclosed as missing - it does not check
 * request/response body shapes (the spec itself is path/method/auth-level
 * only, per scripts/generateOpenApiSpec.ts's own documented scope), but it
 * does genuinely fail a build on a removed or renamed endpoint.
 */

type OpenApiSpec = {
  info?: { version?: string };
  paths?: Record<string, Record<string, unknown>>;
};

function endpointKeys(spec: OpenApiSpec): Set<string> {
  const keys = new Set<string>();
  for (const [routePath, operations] of Object.entries(spec.paths ?? {})) {
    for (const method of Object.keys(operations)) {
      keys.add(`${method.toUpperCase()} ${routePath}`);
    }
  }
  return keys;
}

describe("API backward-compatibility contract", () => {
  const baselinePath = path.resolve(process.cwd(), "docs", "openapi-baseline.json");
  const specPath = path.resolve(process.cwd(), "docs", "openapi.json");

  it("has a committed baseline to compare against", () => {
    expect(existsSync(baselinePath)).toBe(true);
  });

  it("does not remove any endpoint present in the baseline without a major version bump", () => {
    execSync("npx tsx scripts/generateOpenApiSpec.ts", { cwd: process.cwd(), stdio: "pipe" });
    const baseline: OpenApiSpec = JSON.parse(readFileSync(baselinePath, "utf8"));
    const current: OpenApiSpec = JSON.parse(readFileSync(specPath, "utf8"));

    const baselineKeys = endpointKeys(baseline);
    const currentKeys = endpointKeys(current);
    const removed = [...baselineKeys].filter((key) => !currentKeys.has(key));

    if (removed.length > 0) {
      const baselineMajor = (baseline.info?.version ?? "1.0.0").split(".")[0];
      const currentMajor = (current.info?.version ?? "1.0.0").split(".")[0];
      expect({ removed, versionBumped: currentMajor !== baselineMajor }).toEqual({
        removed,
        versionBumped: true
      });
    } else {
      expect(removed).toEqual([]);
    }
  });
});
