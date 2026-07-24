import { createApp } from "./app.js";
import { contentPackageReady } from "./services/clinicalContent.js";
import { startIncomingCallSimulator } from "./services/callSimulator.js";

const port = Number(process.env.PORT ?? 8080);

await contentPackageReady;
const app = createApp();

app.listen(port, () => {
  console.log(`IST Tech tele-triage MVP API listening on port ${port}`);
  // Tied to this server process's own lifecycle (starts/stops with it) -
  // see callSimulator.ts for why a standalone script was the wrong shape.
  startIncomingCallSimulator(`http://localhost:${port}`);
});
