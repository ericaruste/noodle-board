import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ColorSwatchPreview } from "./ColorSwatch";
import { ColorPickerToolbarPreview } from "./ColorPickerToolbar";
import { ContextualButtonPreview } from "./ContextualButton";
import { HexInputPreview } from "./HexInput";
import { IconButtonPreview } from "./IconButton";
import { MenuItemPreview } from "./MenuItem";
import "./styles/tokens.css";
import "./index.css";

const trial = new URLSearchParams(window.location.search).get("trial");
const showColorPickerTrial = window.location.hash === "#color-picker" || trial === "color-picker";
const showColorSwatchTrial = window.location.hash === "#color-swatch" || trial === "color-swatch";
const showHexInputTrial = window.location.hash === "#hex-input" || trial === "hex-input";
const showIconButtonTrial = window.location.hash === "#icon-button" || trial === "icon-button";
const showMenuItemTrial = window.location.hash === "#menu-item" || trial === "menu-item";
const showContextualButtonTrial =
  window.location.hash === "#contextual-button" || trial === "contextual-button";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {showColorPickerTrial ? (
      <ColorPickerToolbarPreview />
    ) : showColorSwatchTrial ? (
      <ColorSwatchPreview />
    ) : showHexInputTrial ? (
      <HexInputPreview />
    ) : showIconButtonTrial ? (
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
