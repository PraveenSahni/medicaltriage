/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/frontend/src/**/*.test.ts", "<rootDir>/frontend/src/**/*.test.tsx"],
  setupFilesAfterEnv: ["<rootDir>/frontend/test/jest.setup.ts"],
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "\\.css$": "<rootDir>/frontend/test/styleMock.cjs"
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.frontend.test.json",
        useESM: true
      }
    ]
  }
};
