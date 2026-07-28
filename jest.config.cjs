/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  setupFiles: ["<rootDir>/tests/jest.setup.ts"],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  // htmlparser2 (a transitive dependency of sanitize-html, added for real
  // STCC *_XHTML rich-text rendering) ships ESM-only .js, which Jest's
  // default node_modules exclusion can't parse. Transform just that
  // dependency chain through babel-jest rather than widening the exclusion
  // to all of node_modules.
  // pnpm's node_modules/.pnpm/<pkg>@<version>/node_modules/<pkg>/... layout
  // means the package name isn't the segment immediately after "node_modules/",
  // so the lookahead checks anywhere in the remaining path rather than
  // anchoring to the next path segment.
  transformIgnorePatterns: ["node_modules/(?!.*(htmlparser2|domhandler|domutils|domelementtype|entities|dom-serializer))"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { useESM: true, tsconfig: "tsconfig.test.json" }],
    "^.+\\.jsx?$": "babel-jest"
  },
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.test.json",
      useESM: true
    }
  }
};
