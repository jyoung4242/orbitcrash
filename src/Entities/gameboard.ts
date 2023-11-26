import { v4 as uuidv4 } from "uuid";
import { Entity } from "../../_SqueletoECS/entity";
import { Vector } from "../../_SqueletoECS/Vector";
import { Assets } from "@peasy-lib/peasy-assets";
import { SceneManager } from "../../_SqueletoECS/Scene";

export class GameBoard {
  static create() {
    return Entity.create({
      id: uuidv4(),
      components: {
        render: true,
        sprites: {
          data: [
            {
              src: Assets.image("gameboard").src,
              offset: new Vector(0, 0),
              size: new Vector(150, 150),
            },
          ],
        },
        position: { x: SceneManager.viewport.half.x - 75, y: SceneManager.viewport.half.y - 55 },
        zindex: 0,
        size: { data: [150, 150] },
        opacity: 1,
      },
    });
  }
}

/*
src: string;
  offset: Vector;
  size: Vector;

*/
