import { v4 as uuidv4 } from "uuid";
import { Entity } from "../../_SqueletoECS/entity";
import { Vector } from "../../_SqueletoECS/Vector";
import { Assets } from "@peasy-lib/peasy-assets";

export class TokenHolder {
  static create(playernum: number) {
    let myPos: Vector;
    if (playernum == 1) {
      myPos = new Vector(50, 50);
    } else myPos = new Vector(300, 50);
    return Entity.create({
      id: uuidv4(),
      components: {
        sprites: {
          data: [
            {
              src: Assets.image("tokenHolder").src,
              offset: new Vector(0, 0),
              size: new Vector(50, 150),
            },
          ],
        },
        name: "somename",
        render: true,
        position: myPos,
        zindex: 0,
        size: { data: [50, 150] },
        opacity: 1,
      },
    });
  }
}
