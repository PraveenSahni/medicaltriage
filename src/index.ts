import { createApp } from "./app.js";
import { contentPackageReady } from "./services/clinicalContent.js";

const port = Number(process.env.PORT ?? 8080);

await contentPackageReady;
const app = createApp();

app.listen(port, () => {
  console.log(`IST Tech tele-triage MVP API listening on port ${port}`);
});
