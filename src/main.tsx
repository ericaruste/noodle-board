import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ContextualButtonPreview } from "./ContextualButton";
import "./styles/tokens.css";
import "./index.css";

const showContextualButtonTrial =
  window.location.hash === "#contextual-button" ||
  new URLSearchParams(window.location.search).get("trial") === "contextual-button";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {showContextualButtonTrial ? <ContextualButtonPreview /> : <App />}
  </StrictMode>,
);
