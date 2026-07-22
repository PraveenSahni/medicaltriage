import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { installBearerTokenFetch } from "./authToken";
import "./global.css";

installBearerTokenFetch();

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

