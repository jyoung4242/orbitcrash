import { v4 as uuidv4 } from "uuid";
import { Entity } from "../../_SqueletoECS/entity";

export class TemplateEntity {
  static create() {
    return Entity.create({
      id: uuidv4(),
      components: {
        position: { x: 0, y: 0 },
        zindex: 0,
        size: { data: [16, 16] },
        opacity: 1,
      },
    });
  }
}

/*
entities must have size, position, opacity, and zindex components as they are baked in properties in-line
*/
