// Tests must be deterministic regardless of a developer's local .env content-source
// choice (used only to switch the dev server/demo between the embedded sample, the
// generated STCC-shaped corpus, and the open-source-rules/guidelines modules). Pin the
// test run to the embedded 6-protocol sample so fixtures like "sample-fever-child" /
// "sample-ankle-foot-injury" always resolve.
// loadLocalEnv() (src/config/env.ts) only fills in keys that are `undefined` in
// process.env, so pinned keys must be explicitly set (even to "") rather than
// deleted - deleting lets a later loadLocalEnv() call refill them from .env.
process.env.CLINICAL_CONTENT_USE_GENERATED_STCC = "false";
process.env.CLINICAL_CONTENT_PACKAGE_PATH = "";
process.env.CLINICAL_CONTENT_SOURCE = "";
// Same reasoning: queue persistence must stay in-memory for tests regardless
// of a developer's local .env choice to run the live app against Cloud SQL.
process.env.QUEUE_DB_PERSISTENCE = "false";
