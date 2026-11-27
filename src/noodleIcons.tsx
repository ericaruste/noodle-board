import lineWeightMenu from "./assets/icons/line-weight-menu.svg?raw";
import noodleMain from "./assets/icons/noodle-main.svg?raw";
import typeCurve from "./assets/icons/type-curve.svg?raw";
import typeDashed from "./assets/icons/type-dashed.svg?raw";
import typeElbow from "./assets/icons/type-elbow.svg?raw";
import typeMedium from "./assets/icons/type-medium.svg?raw";
import typeStraight from "./assets/icons/type-straight.svg?raw";
import typeThick from "./assets/icons/type-thick.svg?raw";
import typeThin from "./assets/icons/type-thin.svg?raw";

type IconProps = { className?: string; "aria-hidden"?: boolean };

function assetIcon(raw: string, options?: { viewBox?: string; strokeWidth?: number }) {
  return function AssetIcon({ className }: IconProps) {
    let svg = raw.replace(/\s(?:width|height)="[^"]*"/g, "").replace(/#303132/g, "currentColor");
    if (options?.viewBox) svg = svg.replace(/viewBox="[^"]*"/, `viewBox="${options.viewBox}"`);
    if (options?.strokeWidth != null) {
      const width = `stroke-width="${options.strokeWidth}"`;
      svg = svg.includes("stroke-width=") ? svg.replace(/stroke-width="[^"]*"/, width) : svg.replace("<path", `<path ${width}`);
    }
    svg = svg.replace("<svg", `<svg class="${className ?? ""}" aria-hidden="true"`);
    return <span className="contents" dangerouslySetInnerHTML={{ __html: svg }} />;
  };
}

/** Cropped like the shape icons, with the stroke scaled so it paints at the same weight. */
export const LineWeightMenuIcon = assetIcon(lineWeightMenu, {
  viewBox: "2.8 3.52 14.4 12.96",
  strokeWidth: 1.33,
});
export const NoodleMainIcon = assetIcon(noodleMain);
export const TypeStraightIcon = assetIcon(typeStraight);
export const TypeDashedIcon = assetIcon(typeDashed);
export const TypeElbowIcon = assetIcon(typeElbow);
export const TypeCurveIcon = assetIcon(typeCurve);
export const TypeThinIcon = assetIcon(typeThin);
export const TypeMediumIcon = assetIcon(typeMedium);
export const TypeThickIcon = assetIcon(typeThick);
