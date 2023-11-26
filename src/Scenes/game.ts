// Library
import { Scene, SceneManager } from "../../_SqueletoECS/Scene";
import { Engine } from "@peasy-lib/peasy-engine";
import { UI } from "@peasy-lib/peasy-ui";
import { State } from "@peasy-lib/peasy-states";
import { TokenHolder } from "../Entities/tokenHolder";
import { GameBoard } from "../Entities/gameboard";
import { Assets } from "@peasy-lib/peasy-assets";
import { Token } from "../Entities/token";
import { Vector } from "../../_SqueletoECS/Vector";

// Entities

let positionLookup = [
  {
    left: new Vector(62.5, 56),
    right: new Vector(312.5, 56),
  },
  {
    left: new Vector(62.5, 73),
    right: new Vector(312.5, 73),
  },
  {
    left: new Vector(62.5, 90),
    right: new Vector(312.5, 90),
  },
  {
    left: new Vector(62.5, 108),
    right: new Vector(312.5, 108),
  },
  {
    left: new Vector(62.5, 126),
    right: new Vector(312.5, 126),
  },
  {
    left: new Vector(62.5, 144),
    right: new Vector(312.5, 144),
  },
  {
    left: new Vector(62.5, 162),
    right: new Vector(312.5, 162),
  },
  {
    left: new Vector(62.5, 179),
    right: new Vector(312.5, 179),
  },
];

let spaceCoords = [
  new Vector(138, 70),
  new Vector(174, 70),
  new Vector(210, 70),
  new Vector(247, 70),
  new Vector(138, 106),
  new Vector(174, 106),
  new Vector(210, 106),
  new Vector(247, 106),
  new Vector(138, 142),
  new Vector(174, 142),
  new Vector(210, 142),
  new Vector(247, 142),
  new Vector(138, 179),
  new Vector(174, 179),
  new Vector(210, 179),
  new Vector(247, 179),
];

export class Game extends Scene {
  name: string = "game";
  entities: any = [];
  entitySystems: any = [];
  sceneSystems: any = [];
  hud: any;
  game: any;
  showBlur = false;
  get blur() {
    if (this.showBlur) {
      /*  if (!this.hud.element.classList.contains("blur")) {
        this.hud.element.classList.add("blur");
      } */
      if (!this.game.element.classList.contains("blur")) {
        this.game.element.classList.add("blur");
      }
      return "blur";
    } else {
      if (this.hud.element.classList.contains("blur")) this.hud.element.classList.remove("blur");
      if (this.game.element.classList.contains("blur")) this.game.element.classList.remove("blur");
      return "";
    }
  }
  showWaiting = false;
  showConfirm = false;
  showReplay = false;

  public hudTemplate = `
    <waiting-modal \${===showWaiting}>
      <div class="waiting_primary">WAITING ON PLAYER TO JOIN</div>
      <div class="waiting_secondary">PLEASE STAND BYE....</div>
    </waiting-modal>
    <confirm-modal \${===showConfirm}>
      <div class="confirm_title">READY TO START</div>
      <div class="confirm_outerflex">
        <div class="confirm_innerflex">
          <div class="confirm_id">Player 1</div>
          <div class="confirm_name">Player Nickname</div>
          <div class="confirm_icon waiting"></div>
          <div class="confirm_ready">READY</div>
        </div>
        <div class="confirm_innerflex">
          <div class="confirm_id">Player 2</div>
          <div class="confirm_name">Player Nickname</div>
          <div class="confirm_icon ready"></div>
          <div class="confirm_ready">READY</div>
        </div>
      </div>
    </confirm-modal>
    <hud-layer class="gameHudTitle \${blur}" >Orbit Connect</hud-layer>
    <replay-modal \${===showReplay}>
      <div class="confirm_innerflex no-wrap">
        <div class="">Orbit Connect</div>
        <div class="">PLAY AGAIN?</div>
        <div class="confirm_outerflex">
          <div class="confirm_ready">YES</div>
          <div class="confirm_ready">NO</div>
        </div>
      </div>
    </replay-modal>
    <blur-layer \${===showBlur}></blur-layer>
  

  `;

  public template = `
    <scene-layer>
        < \${ entity === } \${ entity <=* entities }>
        < \${ sceneSystem === } \${ sceneSystem <=* sceneSystems }
    </scene-layer>
  `;
  public enter = async (previous: State | null, ...params: any[]): Promise<void> => {
    Assets.initialize({ src: "./src/Assets/" });
    await Assets.load(["gameboard.png", "tokenHolder.png"]);

    //add UI template to Viewport Layer
    let layers = SceneManager.viewport.layers;
    this.game = layers.find(lyr => lyr.name == "game");
    if (this.game) UI.create(this.game.element, this, this.template);

    this.hud = layers.find(lyr => lyr.name == "hud");
    if (this.hud) UI.create(this.hud.element, this, this.hudTemplate);

    // add default entities to the array
    let player1Holder = TokenHolder.create(1);
    let player2Holder = TokenHolder.create(2);
    let gameBoard = GameBoard.create();

    this.entities.push(gameBoard, player1Holder, player2Holder);

    for (let index = 0; index < 8; index++) {
      this.entities.push(
        Token.create(index, "#87CEFA", positionLookup[index].left),
        Token.create(index, "#FFD700", positionLookup[index].right)
      );
    }

    //Systems being added for Scene to own
    this.sceneSystems.push();

    //Start GameLoop
    Engine.create({ fps: 60, started: true, callback: this.update });
  };

  //GameLoop update method
  update = (deltaTime: number): void | Promise<void> => {
    this.sceneSystems.forEach((system: any) => {
      system.update(deltaTime / 1000, 0, this.entities);
    });
  };
}
