import { LogoButton } from "../components/LogoButton";
import { SaveIndicator } from "../components/SaveIndicator";
import { TitleInput } from "../components/TitleInput";

export type ProjectToolbarSize = "lg" | "md";

type ProjectToolbarProps = {
  /** Passed to the logo, title input, and save indicator. Unset is `lg`, 40px parts. */
  size?: ProjectToolbarSize;
  title?: string;
  defaultTitle?: string;
  onTitleChange?: (title: string) => void;
  /** Enter or blur. Unset leaves the field as a draft that updates while typing. */
  onTitleCommit?: (title: string) => void;
  /** Success plays the ring while saving. */
  saving?: boolean;
  onSavePulseIteration?: () => void;
  onLogoClick?: () => void;
  logoSelected?: boolean;
};

export function ProjectToolbar({
  size = "lg",
  title,
  defaultTitle = "Project Title",
  onTitleChange,
  onTitleCommit,
  saving = false,
  onSavePulseIteration,
  onLogoClick,
  logoSelected,
}: ProjectToolbarProps) {
  return (
    <div
      data-project-toolbar
      data-size={size}
      role="toolbar"
      aria-label="Project"
      className="inline-flex items-center gap-brand-scale-8 rounded-alias-border-radius-xl border border-alias-border-width-xsm border-mapped-border-default bg-mapped-surface-default p-brand-scale-4 shadow-lg backdrop-blur-xl" // TODO token mismatch: Figma 10px
    >
      <LogoButton size={size} onClick={onLogoClick} selected={logoSelected} />
      <TitleInput
        size={size}
        value={title}
        defaultValue={defaultTitle}
        onValueChange={onTitleChange}
        onCommit={onTitleCommit}
      />
      <SaveIndicator size={size} saving={saving} onSavePulseIteration={onSavePulseIteration} />
    </div>
  );
}

const longTitle =
  "Noodle Board project title that is long enough to pass the three hundred twenty pixel cap";

const caption =
  "font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight text-mapped-text-caption";

export function ProjectToolbarPreview() {
  return (
    <main className="flex min-h-screen flex-col items-start gap-brand-scale-24 bg-mapped-surface-page p-brand-scale-24">
      <p className={caption}>Project toolbar</p>
      <section className="flex flex-col items-start gap-brand-scale-8">
        <p className={caption}>Resting</p>
        <ProjectToolbar defaultTitle="Project Title" />
      </section>
      <section className="flex flex-col items-start gap-brand-scale-8">
        <p className={caption}>Long title</p>
        <div className="pt-brand-scale-48">
          <ProjectToolbar defaultTitle={longTitle} />
        </div>
      </section>
      <section className="flex flex-col items-start gap-brand-scale-8">
        <p className={caption}>Saving</p>
        <ProjectToolbar defaultTitle="Project Title" saving />
      </section>
      <section className="flex flex-col items-start gap-brand-scale-8">
        <p className={caption}>md</p>
        <ProjectToolbar size="md" defaultTitle="Project Title" />
      </section>
    </main>
  );
}
