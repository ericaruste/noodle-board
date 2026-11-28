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
import { ProjectManagementToolbarPreview } from "./ProjectManagementToolbar";
import { ProjectMenuPreview } from "./ProjectMenu";
import { ProjectToolbarPreview } from "./ProjectToolbar";
import { SaveIndicatorPreview } from "./SaveIndicator";
import { MainButtonPreview } from "./MainButton";
import { MenuItemPreview } from "./MenuItem";
import { PillRowPreview } from "./PillRow";
import { SliderThumbPreview } from "./SliderThumb";
import { SliderTrackPreview } from "./SliderTrack";
import { TitleInputPreview } from "./TitleInput";
import "./styles/tokens.css";
import "./index.css";
import "./styles/motion.css";

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
const showSaveIndicatorTrial =
  window.location.hash === "#save-indicator" || trial === "save-indicator";
const showProjectToolbarTrial =
  window.location.hash === "#project-toolbar" || trial === "project-toolbar";
const showProjectMenuTrial = window.location.hash === "#project-menu" || trial === "project-menu";
const showProjectManagementToolbarTrial =
  window.location.hash === "#project-management-toolbar" || trial === "project-management-toolbar";
const showMainButtonTrial = window.location.hash === "#main-button" || trial === "main-button";
const showMenuItemTrial = window.location.hash === "#menu-item" || trial === "menu-item";
const showContextualButtonTrial =
  window.location.hash === "#contextual-button" || trial === "contextual-button";
const showPillRowTrial = window.location.hash === "#pill-row" || trial === "pill-row";

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
    ) : showSaveIndicatorTrial ? (
      <SaveIndicatorPreview />
    ) : showProjectToolbarTrial ? (
      <ProjectToolbarPreview />
    ) : showProjectMenuTrial ? (
      <ProjectMenuPreview />
    ) : showProjectManagementToolbarTrial ? (
      <ProjectManagementToolbarPreview />
    ) : showMainButtonTrial ? (
      <MainButtonPreview />
    ) : showMenuItemTrial ? (
      <MenuItemPreview />
    ) : showContextualButtonTrial ? (
      <ContextualButtonPreview />
    ) : showPillRowTrial ? (
      <PillRowPreview />
    ) : (
      <App />
    )}
  </StrictMode>,
);
