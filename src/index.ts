import { createApp } from "./app.js";
import { contentPackageReady } from "./services/clinicalContent.js";
import { startIncomingCallSimulator } from "./services/callSimulator.js";
import { hydrateRolePermissionOverridesFromDatabase, startRoleCatalogRefresh } from "./services/securityAdmin.js";

const port = Number(process.env.PORT ?? 8080);

await contentPackageReady;
// Closes a real multi-instance authorization gap found during the
// persistence-gating sweep: a role-permission grant/revoke persisted by
// one instance was never loaded by any other instance's in-memory
// permission-resolution cache. This makes every fresh instance start from
// the current durable state rather than an empty override set - a grant/
// revoke made while an instance is already running still requires that
// instance to restart (or a future periodic refresh) to see it, a
// disclosed residual limitation, not a full fix.
await hydrateRolePermissionOverridesFromDatabase();
startRoleCatalogRefresh();
const app = createApp();

app.listen(port, () => {
  console.log(`IST Tech tele-triage MVP API listening on port ${port}`);
  // Tied to this server process's own lifecycle (starts/stops with it) -
  // see callSimulator.ts for why a standalone script was the wrong shape.
  startIncomingCallSimulator(`http://localhost:${port}`);
});
