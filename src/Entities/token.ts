import { v4 as uuidv4 } from "uuid";
import { Entity } from "../../_SqueletoECS/entity";
import { Vector } from "../../_SqueletoECS/Vector";

export class Token {
  static create(id: number, color: string, playerDes: string, position: Vector) {
    return Entity.create({
      id: uuidv4(),
      components: {
        css: "",
        type: "token",
        index: id,
        color,
        highlight: {
          data: {
            enabled: false,
            color: "#ffffff",
            opacity: "44",
          },
        },
        position,
        zindex: 0,
        size: { data: [16, 16] },
        opacity: 1,
        render: true,
        mousebind: false,
        playerdesignator: playerDes,
      },
    });
  }
}
