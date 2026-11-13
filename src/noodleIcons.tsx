import lineWeightMenu from "./assets/icons/line-weight-menu.svg?raw";
import typeCurve from "./assets/icons/type-curve.svg?raw";
import typeDashed from "./assets/icons/type-dashed.svg?raw";
import typeElbow from "./assets/icons/type-elbow.svg?raw";
import typeMedium from "./assets/icons/type-medium.svg?raw";
import typeStraight from "./assets/icons/type-straight.svg?raw";
import typeThick from "./assets/icons/type-thick.svg?raw";
import typeThin from "./assets/icons/type-thin.svg?raw";

type IconProps = { className?: string };

function assetIcon(raw: string) {
  return function AssetIcon({ className }: IconProps) {
    const svg = raw
      .replace(/\s(?:width|height)="[^"]*"/g, "")
      .replace(/#303132/g, "currentColor")
      .replace("<svg", `<svg class="${className ?? ""}" aria-hidden="true"`);
    return <span className="contents" dangerouslySetInnerHTML={{ __html: svg }} />;
  };
}

export const LineWeightMenuIcon = assetIcon(lineWeightMenu);
export const TypeStraightIcon = assetIcon(typeStraight);
export const TypeDashedIcon = assetIcon(typeDashed);
export const TypeElbowIcon = assetIcon(typeElbow);
export const TypeCurveIcon = assetIcon(typeCurve);
export const TypeThinIcon = assetIcon(typeThin);
export const TypeMediumIcon = assetIcon(typeMedium);
export const TypeThickIcon = assetIcon(typeThick);
