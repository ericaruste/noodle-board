import { LogoButton } from "./LogoButton";
import { SaveIndicator } from "./SaveIndicator";
import { TitleInput } from "./TitleInput";

type ProjectToolbarProps = {
  title?: string;
  defaultTitle?: string;
  onTitleChange?: (title: string) => void;
  /** Success plays the ring while saving. */
  saving?: boolean;
};

export function ProjectToolbar({
  title,
  defaultTitle = "Project Title",
  onTitleChange,
  saving = false,
}: ProjectToolbarProps) {
  return (
    <div
      data-project-toolbar
      role="toolbar"
      aria-label="Project"
      className="inline-flex items-center gap-brand-scale-8 rounded-alias-border-radius-xl border border-alias-border-width-xsm border-mapped-border-default bg-mapped-surface-default p-brand-scale-4 shadow-lg" // TODO token mismatch: Figma 10px
    >
      <LogoButton />
      <TitleInput value={title} defaultValue={defaultTitle} onValueChange={onTitleChange} />
      <SaveIndicator size="lg" saving={saving} />
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
    </main>
  );
}
