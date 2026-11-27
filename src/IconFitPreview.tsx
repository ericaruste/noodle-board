import { useState, type ComponentType } from "react";
import { Circle, Diamond, Shapes, Square, Triangle, type LucideIcon } from "lucide-react";
import lineWeightMenu from "./assets/icons/line-weight-menu.svg?raw";
import shapeCircle from "./assets/icons/shape-circle.svg?raw";
import shapeDiamond from "./assets/icons/shape-diamond.svg?raw";
import shapeRoundRectangle from "./assets/icons/shape-round-rectangle.svg?raw";
import shapeSquare from "./assets/icons/shape-square.svg?raw";
import shapeTriangle from "./assets/icons/shape-triangle.svg?raw";
import { ContextualButton } from "./ContextualButton";
import { FloatingLayer } from "./FloatingPanel";
import NoodleToolbar from "./NoodleToolbar";
import { defaultNoodleData, type NoodleData } from "./noodleData";
import {
  DEFAULT_SHAPE_FILL,
  DEFAULT_SHAPE_STROKE,
  type ShapeKind,
  type ShapeLineStyle,
  type ShapeThickness,
} from "./shapeData";
import ShapeSwatch from "./ShapeSwatch";
import ShapeToolbar from "./ShapeToolbar";

type SlotIcon = ComponentType<{ className?: string }>;

/**
 * Cropped view boxes. Each one pads the stroked ink by the Lucide margin,
 * 2 units for every 20 units of artwork, so the glyph fills a 16px slot the
 * way a Lucide icon does. The live icons use these same boxes.
 */
const FIT_VIEW_BOX = {
  square: "5.9 5.9 16.2 16.2",
  roundRect: "5.6 5.9 19.8 16.2",
  triangle: "5.59 5.77 17.82 16.35",
  diamond: "5.82 5.82 16.37 16.37",
  lineWeight: "2.8 3.52 14.4 12.96",
} as const;

/** Shape's 1.5 stroke, scaled so a smaller view box paints the same weight. */
const LINE_DRAWN_STROKE = 1.07;
const LINE_FIT_STROKE = 1.33;

function assetSlot(raw: string, viewBox?: string, strokeWidth?: number): SlotIcon {
  return function AssetSlot({ className }: { className?: string }) {
    const safeClass = (className ?? "").replace(/"/g, "");
    let svg = raw.replace(/\s(?:width|height)="[^"]*"/g, "").replace(/#303132/g, "currentColor");
    if (viewBox) svg = svg.replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`);
    if (strokeWidth != null) {
      const width = `stroke-width="${strokeWidth}"`;
      svg = svg.includes("stroke-width=")
        ? svg.replace(/stroke-width="[^"]*"/, width)
        : svg.replace("<path", `<path ${width}`);
    }
    svg = svg.replace(
      "<svg",
      `<svg class="${safeClass}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"`,
    );
    return <span className="contents" dangerouslySetInnerHTML={{ __html: svg }} />;
  };
}

function lucideSlot(Icon: LucideIcon): SlotIcon {
  return function LucideSlot({ className }: { className?: string }) {
    return <Icon className={className} aria-hidden />;
  };
}

const captionClass =
  "font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight text-mapped-text-caption";

function Glyph({ icon: Icon }: { icon: SlotIcon }) {
  return (
    <span className="inline-flex size-brand-scale-16 items-center justify-center bg-mapped-surface-action-selected">
      <Icon className="size-brand-scale-16 text-mapped-icon-action" />
    </span>
  );
}

function Sample({ label, icon }: { label: string; icon: SlotIcon }) {
  return (
    <div className="flex flex-col items-center gap-brand-scale-8">
      <Glyph icon={icon} />
      <ContextualButton
        ariaLabel={label}
        title={label}
        showLeftIcon={false}
        showLabel={false}
        showDropdownIcon={false}
        showRightIcon
        icon={icon}
      />
      <span className={`${captionClass} text-center`}>{label}</span>
    </div>
  );
}

function Row({ title, note, samples }: { title: string; note: string; samples: { label: string; icon: SlotIcon }[] }) {
  return (
    <section className="flex flex-col gap-brand-scale-8">
      <h2 className={captionClass}>{title}</h2>
      <p className={captionClass}>{note}</p>
      <div className="flex flex-wrap items-start gap-brand-scale-16">
        {samples.map((sample) => (
          <Sample key={sample.label} label={sample.label} icon={sample.icon} />
        ))}
      </div>
    </section>
  );
}

const drawnShapes = [
  { label: "Rectangle", icon: assetSlot(shapeSquare) },
  { label: "Ellipse", icon: assetSlot(shapeCircle) },
  { label: "Rounded rectangle", icon: assetSlot(shapeRoundRectangle) },
  { label: "Triangle", icon: assetSlot(shapeTriangle) },
  { label: "Diamond", icon: assetSlot(shapeDiamond) },
];

const fittedShapes = [
  { label: "Rectangle", icon: assetSlot(shapeSquare, FIT_VIEW_BOX.square) },
  { label: "Ellipse", icon: assetSlot(shapeCircle, FIT_VIEW_BOX.square) },
  { label: "Rounded rectangle", icon: assetSlot(shapeRoundRectangle, FIT_VIEW_BOX.roundRect) },
  { label: "Triangle", icon: assetSlot(shapeTriangle, FIT_VIEW_BOX.triangle) },
  { label: "Diamond", icon: assetSlot(shapeDiamond, FIT_VIEW_BOX.diamond) },
];

const drawnKindIcons: Record<ShapeKind, SlotIcon> = {
  rect: assetSlot(shapeSquare),
  ellipse: assetSlot(shapeCircle),
  "round-rect": assetSlot(shapeRoundRectangle),
  triangle: assetSlot(shapeTriangle),
  diamond: assetSlot(shapeDiamond),
};

const fittedKindIcons: Record<ShapeKind, SlotIcon> = {
  rect: assetSlot(shapeSquare, FIT_VIEW_BOX.square),
  ellipse: assetSlot(shapeCircle, FIT_VIEW_BOX.square),
  "round-rect": assetSlot(shapeRoundRectangle, FIT_VIEW_BOX.roundRect),
  triangle: assetSlot(shapeTriangle, FIT_VIEW_BOX.triangle),
  diamond: assetSlot(shapeDiamond, FIT_VIEW_BOX.diamond),
};

const drawnLineWeight = assetSlot(lineWeightMenu, undefined, LINE_DRAWN_STROKE);
const fittedLineWeight = assetSlot(lineWeightMenu, FIT_VIEW_BOX.lineWeight, LINE_FIT_STROKE);

function kindIcons(icons: Record<ShapeKind, SlotIcon>) {
  return (kind: ShapeKind) => icons[kind];
}

function ToolbarCheck({
  title,
  note,
  icons,
  lineWeightIcon,
}: {
  title: string;
  note: string;
  icons: (kind: ShapeKind) => SlotIcon;
  lineWeightIcon: SlotIcon;
}) {
  const [kind, setKind] = useState<ShapeKind>("rect");
  const [fill, setFill] = useState<string | null>(DEFAULT_SHAPE_FILL);
  const [stroke, setStroke] = useState<string | null>(DEFAULT_SHAPE_STROKE);
  const [fillOpacity, setFillOpacity] = useState(100);
  const [thickness, setThickness] = useState<ShapeThickness>("medium");
  const [lineStyle, setLineStyle] = useState<ShapeLineStyle>("solid");
  const [noodle, setNoodle] = useState<NoodleData>(defaultNoodleData);

  return (
    <div className="flex flex-col items-start gap-brand-scale-16">
      <div className="flex flex-col gap-brand-scale-4">
        <h3 className={captionClass}>{title}</h3>
        <p className={captionClass}>{note}</p>
      </div>
      <ShapeSwatch kind={kind} onKind={setKind} icons={icons} />
      <ShapeToolbar
        kind={kind}
        fill={fill}
        stroke={stroke}
        fillOpacity={fillOpacity}
        thickness={thickness}
        lineStyle={lineStyle}
        kindIcons={icons}
        lineWeightIcon={lineWeightIcon}
        onKind={setKind}
        onFill={setFill}
        onStroke={setStroke}
        onFillOpacity={setFillOpacity}
        onThickness={setThickness}
        onLineStyle={setLineStyle}
      />
      <NoodleToolbar
        edgeId={`icon-fit-${title}`}
        data={noodle}
        lineWeightIcon={lineWeightIcon}
        onWrite={(patch) => setNoodle((current) => ({ ...current, ...patch }))}
      />
    </div>
  );
}

const lucideShapes = [
  { label: "Square", icon: lucideSlot(Square) },
  { label: "Circle", icon: lucideSlot(Circle) },
  { label: "Triangle", icon: lucideSlot(Triangle) },
  { label: "Diamond", icon: lucideSlot(Diamond) },
  { label: "Shapes", icon: lucideSlot(Shapes) },
];

export function IconFitPreview() {
  return (
    <main className="relative flex min-h-screen flex-col gap-brand-scale-24 bg-mapped-surface-page p-brand-scale-24">
      <h1 className={captionClass}>Icon fit</h1>
      <p className={captionClass}>
        The blue square is the 16px slot, brand.scale.16. The button under it is the contextual button. Lucide draws in
        the inner 20 of a 24 box. The rows below show each file as drawn and cropped. The live board uses the cropped
        icons.
      </p>
      <Row
        title="Lucide"
        note="The size to match. Square, circle, triangle, and diamond are the Lucide glyphs. Shapes is the main toolbar icon."
        samples={lucideShapes}
      />
      <Row
        title="Shape icons, as drawn"
        note="Square and circle are 28 by 28, with the path from 8 to 20. The triangle is 29 by 28 and the rounded rectangle is 31 by 28. In the 16px slot the ink is about 7px."
        samples={drawnShapes}
      />
      <Row
        title="Shape icons, Lucide box"
        note="The view box is cropped to the stroked path plus the Lucide margin. Wider files stay wider. The stroke stays 1.5, which lands near Lucide’s weight once the canvas is this size."
        samples={fittedShapes}
      />
      <Row
        title="Line weight menu"
        note="The shape stroke is 1.5. The line weight file is a smaller view box, so the same number would paint heavier. These two use 1.07 in the 20 box and 1.33 in the cropped box, which is that 1.5 stroke at the same painted weight. The rectangle is the cropped shape."
        samples={[
          { label: "As drawn", icon: assetSlot(lineWeightMenu, undefined, LINE_DRAWN_STROKE) },
          { label: "Lucide box", icon: assetSlot(lineWeightMenu, FIT_VIEW_BOX.lineWeight, LINE_FIT_STROKE) },
          { label: "Rectangle", icon: assetSlot(shapeSquare, FIT_VIEW_BOX.square) },
        ]}
      />
      <section className="flex flex-col gap-brand-scale-16">
        <h2 className={captionClass}>On the toolbars</h2>
        <p className={captionClass}>
          The shape swatch, then the shape toolbar, then the noodle toolbar. Open a menu to see the glyph on the button
          and in the row. As drawn is the old view box. Lucide box is what the live board uses.
        </p>
        <div className="flex flex-col gap-brand-scale-24">
          <ToolbarCheck
            title="As drawn"
            note="The file view boxes. The line-weight stroke is 1.07 so it paints like the shape stroke of 1.5."
            icons={kindIcons(drawnKindIcons)}
            lineWeightIcon={drawnLineWeight}
          />
          <ToolbarCheck
            title="Lucide box"
            note="The cropped view boxes. The line-weight stroke is 1.33, the same painted weight as the cropped shapes."
            icons={kindIcons(fittedKindIcons)}
            lineWeightIcon={fittedLineWeight}
          />
        </div>
      </section>
      <FloatingLayer />
    </main>
  );
}
