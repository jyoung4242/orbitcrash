// initialize all your system components here
// simply import then and create a new instance in the array
// for example
// import { Name } from "./nameComp";
// export function LoadComponents(){
//  [new Name(),... and all your other components follow]
// }

import { Position } from "./positionComponent";
import { ZindexComp } from "./zindexComponent";
import { SizeComp } from "./sizeComponent";
import { OpacityComp } from "./opacityComponent";
import { SpriteComp } from "./sprite";
import { NameComp } from "./name";
import { ColorComp } from "./color";
import { RenderComp } from "./render";
import { HighlightComp } from "./highlight";
import { IndexComp } from ".";
import { MouseBoundComp } from "./mousebound";
import { PlayerDesignatorComp } from "./playerdesignator";
import { TypeComp } from "./type";
import { CSSComp } from "./classList";

// The template component is demonstrated by default, you'll probably
// want to replace it

export function LoadComponents() {
  [
    new Position(),
    new ZindexComp(),
    new SizeComp(),
    new OpacityComp(),
    new SpriteComp(),
    new NameComp(),
    new ColorComp(),
    new RenderComp(),
    new HighlightComp(),
    new IndexComp(),
    new MouseBoundComp(),
    new PlayerDesignatorComp(),
    new TypeComp(),
    new CSSComp(),
  ];
}
