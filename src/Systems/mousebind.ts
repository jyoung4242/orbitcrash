import { SceneManager } from "../../_SqueletoECS/Scene";
import { Entity } from "../../_SqueletoECS/entity";
import { System } from "../../_SqueletoECS/system";
import { MouseBoundComponent } from "../Components/mousebound";
import { PositionComponent } from "../Components/positionComponent";

export type MouseBoundEntity = Entity & MouseBoundComponent & PositionComponent;

export class MouseBindSystem extends System {
  mouseX: number = 0;
  mouseY: number = 0;
  throttleHandle: NodeJS.Timeout;
  timerCheck: boolean = false;
  scale: number = 3;
  viewportXoffset;
  viewportYoffset;
  tokenSize: number;

  public constructor(throttle: number, scaling: number, tokensize: number) {
    super("mousebound");
    this.scale = scaling;
    this.tokenSize = tokensize;
    document.addEventListener("mousemove", this.mousemovehandler);
    this.throttleHandle = setInterval(() => {
      this.timerCheck = true;
    }, throttle);
    //get game layer
    //let gameLayer = SceneManager.viewport.getLayer("game");

    let rect = SceneManager.viewport.element.getBoundingClientRect();
    this.viewportXoffset = rect.left;
    this.viewportYoffset = rect.top;

    document.addEventListener("resize", this.resizeHandler);
  }

  resizeHandler = () => {};

  mousemovehandler = (e: MouseEvent) => {
    if (this.timerCheck) {
      this.mouseX = (e.clientX - this.viewportXoffset - (this.tokenSize * this.scale) / 2) / this.scale;
      this.mouseY = (e.clientY - this.viewportYoffset - (this.tokenSize * this.scale) / 2) / this.scale;
      this.timerCheck = false;
    }
  };

  public processEntity(entity: MouseBoundEntity): boolean {
    return entity.mousebind != null;
  }

  // update routine that is called by the gameloop engine
  public update(deltaTime: number, now: number, entities: MouseBoundEntity[]): void {
    entities.forEach(entity => {
      // This is the screening for skipping entities that aren't impacted by this system
      // if you want to impact ALL entities, you can remove this
      if (!this.processEntity(entity)) {
        return;
      }

      if (entity.mousebind) {
        entity.position.x = this.mouseX;
        entity.position.y = this.mouseY;
      }
    });
  }
}
