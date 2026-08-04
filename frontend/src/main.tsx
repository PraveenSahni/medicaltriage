import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { installBearerTokenFetch } from "./authToken";
import { LocaleProvider } from "./i18n/LocaleContext";
import "./global.css";
import "./rtl.css";

installBearerTokenFetch();

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </StrictMode>
);
