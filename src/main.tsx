import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ColorSwatchPreview } from "./ColorSwatch";
import { ColorPickerToolbarPreview } from "./ColorPickerToolbar";
import { ContextualButtonPreview } from "./ContextualButton";
import { FillOpacitySliderPreview } from "./FillOpacitySlider";
import { HexInputPreview } from "./HexInput";
import { IconFitPreview } from "./IconFitPreview";
import { IconButtonPreview } from "./IconButton";
import { LogoButtonPreview } from "./LogoButton";
import { MainButtonPreview } from "./MainButton";
import { MenuItemPreview } from "./MenuItem";
import { SliderThumbPreview } from "./SliderThumb";
import { SliderTrackPreview } from "./SliderTrack";
import { TitleInputPreview } from "./TitleInput";
import "./styles/tokens.css";
import "./index.css";

const trial = new URLSearchParams(window.location.search).get("trial");
const showFillOpacityTrial = window.location.hash === "#fill-opacity" || trial === "fill-opacity";
const showSliderTrackTrial = window.location.hash === "#slider-track" || trial === "slider-track";
const showSliderThumbTrial = window.location.hash === "#slider-thumb" || trial === "slider-thumb";
const showColorPickerTrial = window.location.hash === "#color-picker" || trial === "color-picker";
const showColorSwatchTrial = window.location.hash === "#color-swatch" || trial === "color-swatch";
const showHexInputTrial = window.location.hash === "#hex-input" || trial === "hex-input";
const showIconFitTrial = window.location.hash === "#icon-fit" || trial === "icon-fit";
const showTitleInputTrial = window.location.hash === "#title-input" || trial === "title-input";
const showIconButtonTrial = window.location.hash === "#icon-button" || trial === "icon-button";
const showLogoButtonTrial = window.location.hash === "#logo-button" || trial === "logo-button";
const showMainButtonTrial = window.location.hash === "#main-button" || trial === "main-button";
const showMenuItemTrial = window.location.hash === "#menu-item" || trial === "menu-item";
const showContextualButtonTrial =
  window.location.hash === "#contextual-button" || trial === "contextual-button";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {showFillOpacityTrial ? (
      <FillOpacitySliderPreview />
    ) : showSliderTrackTrial ? (
      <SliderTrackPreview />
    ) : showSliderThumbTrial ? (
      <SliderThumbPreview />
    ) : showColorPickerTrial ? (
      <ColorPickerToolbarPreview />
    ) : showColorSwatchTrial ? (
      <ColorSwatchPreview />
    ) : showHexInputTrial ? (
      <HexInputPreview />
    ) : showIconFitTrial ? (
      <IconFitPreview />
    ) : showTitleInputTrial ? (
      <TitleInputPreview />
    ) : showIconButtonTrial ? (
      <IconButtonPreview />
    ) : showLogoButtonTrial ? (
      <LogoButtonPreview />
    ) : showMainButtonTrial ? (
      <MainButtonPreview />
    ) : showMenuItemTrial ? (
      <MenuItemPreview />
    ) : showContextualButtonTrial ? (
      <ContextualButtonPreview />
    ) : (
      <App />
    )}
  </StrictMode>,
);
