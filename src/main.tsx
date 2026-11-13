import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ContextualButtonPreview } from "./ContextualButton";
import { IconButtonPreview } from "./IconButton";
import { MenuItemPreview } from "./MenuItem";
import "./styles/tokens.css";
import "./index.css";

const trial = new URLSearchParams(window.location.search).get("trial");
const showIconButtonTrial = window.location.hash === "#icon-button" || trial === "icon-button";
const showMenuItemTrial = window.location.hash === "#menu-item" || trial === "menu-item";
const showContextualButtonTrial =
  window.location.hash === "#contextual-button" || trial === "contextual-button";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {showIconButtonTrial ? (
      <IconButtonPreview />
    ) : showMenuItemTrial ? (
      <MenuItemPreview />
    ) : showContextualButtonTrial ? (
      <ContextualButtonPreview />
    ) : (
      <App />
    )}
  </StrictMode>,
);
