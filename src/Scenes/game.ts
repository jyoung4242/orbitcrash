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
import { Signal } from "../../_SqueletoECS/Signals";
import { gameVictoryStates, turnStates } from "../types";
// Systems
import { MouseBindSystem } from "../Systems/mousebind";
import { Entity } from "../../_SqueletoECS/entity";

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
  selectedIndex = 0;
  gameResult = "Draw";
  UISignal = new Signal("uiEvent");
  spotLocations = [
    { position: spaceCoords[0], highlight: "transparent", player: "", playerIndex: null },
    { position: spaceCoords[1], highlight: "transparent", player: "", playerIndex: null },
    { position: spaceCoords[2], highlight: "transparent", player: "", playerIndex: null },
    { position: spaceCoords[3], highlight: "transparent", player: "", playerIndex: null },
    { position: spaceCoords[4], highlight: "transparent", player: "", playerIndex: null },
    { position: spaceCoords[5], highlight: "transparent", player: "", playerIndex: null },
    { position: spaceCoords[6], highlight: "transparent", player: "", playerIndex: null },
    { position: spaceCoords[7], highlight: "transparent", player: "", playerIndex: null },
    { position: spaceCoords[8], highlight: "transparent", player: "", playerIndex: null },
    { position: spaceCoords[9], highlight: "transparent", player: "", playerIndex: null },
    { position: spaceCoords[10], highlight: "transparent", player: "", playerIndex: null },
    { position: spaceCoords[11], highlight: "transparent", player: "", playerIndex: null },
    { position: spaceCoords[12], highlight: "transparent", player: "", playerIndex: null },
    { position: spaceCoords[13], highlight: "transparent", player: "", playerIndex: null },
    { position: spaceCoords[14], highlight: "transparent", player: "", playerIndex: null },
    { position: spaceCoords[15], highlight: "transparent", player: "", playerIndex: null },
  ];
  p1Holderspots = [
    { position: positionLookup[0].left, highlight: "transparent" },
    { position: positionLookup[1].left, highlight: "transparent" },
    { position: positionLookup[2].left, highlight: "transparent" },
    { position: positionLookup[3].left, highlight: "transparent" },
    { position: positionLookup[4].left, highlight: "transparent" },
    { position: positionLookup[5].left, highlight: "transparent" },
    { position: positionLookup[6].left, highlight: "transparent" },
    { position: positionLookup[7].left, highlight: "transparent" },
  ];
  p2Holderspots = [
    { position: positionLookup[0].right, highlight: "transparent" },
    { position: positionLookup[1].right, highlight: "transparent" },
    { position: positionLookup[2].right, highlight: "transparent" },
    { position: positionLookup[3].right, highlight: "transparent" },
    { position: positionLookup[4].right, highlight: "transparent" },
    { position: positionLookup[5].right, highlight: "transparent" },
    { position: positionLookup[6].right, highlight: "transparent" },
    { position: positionLookup[7].right, highlight: "transparent" },
  ];
  startlatch: boolean = false;
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
  toastContent = "";
  showToast = false;
  showWaiting = false;
  showConfirm = false;
  showReplay = false;
  showPlayerLeft = false;
  isEndTurn = false;

  get showEndTurn() {
    const me = window.globalstate.turn == "player1" ? 0 : 1;
    if (this.isEndTurn && this.playerNum == me) return true;
    else return false;
  }

  get playerNum() {
    //find Index
    return window.globalstate.players.findIndex(plyr => plyr == window.globalstate.user.id);
  }
  get playerIdentifier() {
    if (this.playerNum == 0) return "Player 1";
    else return "Player 2";
  }
  get turnIdentifier() {
    if (window.globalstate.turn == "player1") return "Player1";
    else return "Player2";
    return;
  }
  get player1Name() {
    return window.globalstate.players[0];
  }
  get player2Name() {
    return window.globalstate.players[1];
  }
  get isPlayer1() {
    if (this.playerNum == 0 && this.isPlayer1Active != "ready") {
      return "";
    } else return "wrongplayer";
  }
  get isPlayer2() {
    if (this.playerNum == 1 && this.isPlayer2Active != "ready") {
      return "";
    } else return "wrongplayer";
  }

  get isDraw() {
    if (this.gameResult == gameVictoryStates.draw) return true;
    else return false;
  }

  get isPlayer1Active() {
    if (window.globalstate.p1state) return "ready";
    else return "waiting";
  }

  get isPlayer2Active() {
    if (window.globalstate.p2state) return "ready";
    else return "waiting";
  }

  setPlayer1Ready = () => {
    window.myHathoraClient.sendMessage("readyAck1", "");
  };
  setPlayer2Ready = () => {
    window.myHathoraClient.sendMessage("readyAck2", "");
  };

  leaveGame = async () => {
    await window.myHathoraClient.leaveRoom();
    window.sceneMgr.set("lobby");
  };

  resetGame = () => {
    window.myHathoraClient.sendMessage("resetGame", this.playerIdentifier);
    this.showReplay = false;
  };

  backToWaiting = () => {
    window.myHathoraClient.sendMessage("backToWaiting", this.playerIdentifier);
    this.showPlayerLeft = false;
  };

  endTurn = () => {
    if (this.playerNum == 0) window.myHathoraClient.sendMessage("endTurn1", "");
    else window.myHathoraClient.sendMessage("endTurn2", "");
  };

  holderclick = (e: any, m: any, a: any) => {
    //logic to ignore clicks of wrong player
    let playerIndex;
    if (window.globalstate.turn == "player1") playerIndex = 0;
    else if (window.globalstate.turn == "player2") playerIndex = 1;
    if (this.playerNum != playerIndex) return;

    switch (window.globalstate.turnstate as turnStates) {
      case turnStates.start:
      // game starting - don't respond to clicks
      case turnStates.selectToken:
      case turnStates.selectTokenPlayerOnly:
        // selecting available token (player's)

        //test for whitesmoke
        if (m.spot.highlight != "whitesmoke") return;

        let playerDes = playerIndex == 0 ? "player1" : "player2";
        let tokenIndex = m.spot.$index;
        this.selectedIndex = tokenIndex;

        let thisEntity: any = this.entities.find((ent: any) => ent.index == tokenIndex && ent.playerdesignator == playerDes);
        if (thisEntity == undefined) throw new Error("Error in identifying proper token");
        thisEntity.mousebind = true;

        //turn off highlight
        window.myHathoraClient.sendMessage("playerTokenSelected", JSON.stringify({ playerDes, tokenIndex }));
        break;

      case turnStates.playerSelected:
      // ignore clicks
      case turnStates.opponentSelected:
      // ignore clicks
      case turnStates.transition:
      // ignore clicks, transitioning tokens
      case turnStates.nextTurn:
      // ignore clicks
    }

    //highlight available spots
  };
  boardclick = (e: any, m: any, a: any, ev: any, o: any) => {
    //logic to ignore clicks of wrong player
    let playerIndex;
    if (window.globalstate.turn == "player1") playerIndex = 0;
    else if (window.globalstate.turn == "player2") playerIndex = 1;
    if (this.playerNum != playerIndex) return;

    console.log("board clicked", m);

    switch (window.globalstate.turnstate as turnStates) {
      case turnStates.start:
      // game starting - don't respond to clicks

      case turnStates.selectToken:
        // selecting available token (opponents)
        // confirm spot is opponent token - 'highlighted'
        // tell server which token selected
        // bind token to mouse

        //test for whitesmoke
        if (m.spot.highlight != "whitesmoke") return;

        let playerDes = m.spot.player;
        let tokenIndex = m.spot.playerIndex;
        this.selectedIndex = tokenIndex;
        console.log(playerDes, tokenIndex);
        console.log("model ", m.spot);
        console.log("object model ", o);

        console.log("state: ", window.globalstate);
        let thisEntity: any = this.entities.find((ent: any) => ent.index == tokenIndex && ent.playerdesignator == playerDes);

        if (thisEntity == undefined) throw new Error("Error in identifying proper token");
        thisEntity.mousebind = true;
        let boardIndex = m.spot.$index;
        //turn off highlight
        window.myHathoraClient.sendMessage("opponentTokenSelected", JSON.stringify({ playerDes, tokenIndex, boardIndex }));
        break;
      case turnStates.selectTokenPlayerOnly:
        // do nothing for board clicks
        break;
      case turnStates.playerSelected:
        {
          // player's token selected = looking for place to drop token
          // confirm spot clicked is highlighted
          if (m.spot.highlight != "whitesmoke") return;
          let playerDes = playerIndex == 0 ? "player1" : "player2";
          let tokenIndex = this.selectedIndex;
          let spotSelected = m.spot.$index;

          console.log(playerDes, tokenIndex);
          console.log("model ", m.spot);
          console.log("object model ", o);

          // remove mouse binding
          let thisEntity: any = this.entities.find((ent: any) => ent.index == tokenIndex && ent.playerdesignator == playerDes);
          if (thisEntity == undefined) throw new Error("Error in identifying proper token");
          thisEntity.mousebind = false;
          // tell server which spot selected
          window.myHathoraClient.sendMessage("assignPlayerTokenToBoard", JSON.stringify({ playerDes, tokenIndex, spotSelected }));
        }
        break;
      case turnStates.opponentSelected:
        {
          // opponent's token selected - looking for a place to move token
          // confirm spot is highlighted
          if (m.spot.highlight != "whitesmoke") return;
          // tell server which spot selected
          // remove mouse binding

          let playerDes = playerIndex == 0 ? "player2" : "player1";
          let tokenIndex = this.selectedIndex;
          let spotSelected = m.spot.$index;
          console.log("state: ", window.globalstate);
          console.log("token data", playerDes, tokenIndex, spotSelected);

          // remove mouse binding
          let thisEntity: any = this.entities.find((ent: any) => ent.index == tokenIndex && ent.playerdesignator == playerDes);
          if (thisEntity == undefined) throw new Error("Error in identifying proper token");
          thisEntity.mousebind = false;

          // tell server which spot selected
          window.myHathoraClient.sendMessage("assignOpponentTokenToBoard", JSON.stringify({ playerDes, tokenIndex, spotSelected }));
        }
        break;
      case turnStates.transition:
      // ignore clicks, transitioning tokens

      case turnStates.nextTurn:
      // ignore clicks
    }
  };

  public hudTemplate = `
    
    <p1-holderspots>
      <div \${spot<=*p1Holderspots} data-player="1" \${click@=>holderclick} class="holderspot" style="position: fixed; top:0; left:0; transform: translate(\${spot.position.x}px, \${spot.position.y}px); border-radius: 50%; width: 15px; height: 15px; box-shadow: 0px 0px 3px 3px \${spot.highlight};"></div>
    </p1-holderspots>
    <p2-holderspots>
      <div \${spot<=*p2Holderspots} data-player="2" \${click@=>holderclick} class="holderspot" style="position: fixed; top:0; left:0; transform: translate(\${spot.position.x}px, \${spot.position.y}px); border-radius: 50%; width: 15px; height: 15px; box-shadow: 0px 0px 3px 3px \${spot.highlight};"></div>
    </p2-holderspots>
    <board-spots >
      <div \${spot<=*spotLocations} \${click@=>boardclick} class="holderspot" style="position: fixed; top:0; left:0; transform: translate(\${spot.position.x}px, \${spot.position.y}px); border-radius: 50%; width: 15px; height: 15px; box-shadow: 0px 0px 3px 3px \${spot.highlight};"></div>
    </board-spots>
    <toast-layer \${===showToast}>\${toastContent}</toast-layer>
    <waiting-modal \${===showWaiting}>
      <div class="waiting_primary">WAITING ON PLAYER TO JOIN</div>
      <div class="waiting_secondary">PLEASE STAND BYE....</div>
    </waiting-modal>
    <confirm-modal \${===showConfirm}>
      <div class="confirm_title">READY TO START</div>
      <div class="confirm_outerflex">
        <div class="confirm_innerflex">
          <div class="confirm_id">Player 1</div>
          <div class="confirm_name">\${player1Name}</div>
          <div class="confirm_icon \${isPlayer1Active}"></div>
          <div class="confirm_ready \${isPlayer1}" \${click@=>setPlayer1Ready}>READY</div>
        </div>
        <div class="confirm_innerflex">
          <div class="confirm_id">Player 2</div>
          <div class="confirm_name">\${player2Name}</div>
          <div class="confirm_icon \${isPlayer2Active}"></div>
          <div class="confirm_ready \${isPlayer2}" \${click@=>setPlayer2Ready} >READY</div>
        </div>
      </div>
    </confirm-modal>
    <hud-layer class="gameHudTitle \${blur}" >Orbit Connect</hud-layer>
   
    <blur-layer \${===showBlur}></blur-layer>
    <player-identifier>You are \${playerIdentifier}</player-identifier>
    <turn-identifier>It is \${turnIdentifier}'s turn</turn-identifier>
    <end-turn class="endturncontainer" \${===showEndTurn}>
      <div class="endturncontent">Your turn is completed, ready to change turns?</div>
      <div class="confirm_ready" \${click@=>endTurn}>END TURN</div>
    </end-turn>
    <player-left \${===showPlayerLeft}>
        <div>The other player left the match</div>
        <div style="display: flex;  gap: 5px;">
            <div \${click@=>backToWaiting} class="confirm_ready">Reset</div>
            <div \${click@=>leaveGame} class="confirm_ready">Leave</div>
          </div>
    </player-left>
    <replay-modal \${===showReplay}>
        <div \${!==isDraw}>Game Result: \${gameResult} Won!!!</div>
        <div \${===isDraw}>Game Result: Draw!!!</div>
        <div style="display: flex; flex-direction: column; gap: 5px;">
          <div>Would you like to play again? Both players must click rematch</div>
          <div style="display: flex;  gap: 5px;">
            <div \${click@=>resetGame} class="confirm_ready">Rematch?</div>
            <div \${click@=>leaveGame} class="confirm_ready">Leave</div>
          </div>
          
        </div>
    </replay-modal>
  `;

  public template = `
    <scene-layer>
        < \${ entity === } \${ entity <=* entities }>
        < \${ sceneSystem === } \${ sceneSystem <=* sceneSystems }
    </scene-layer>
  `;

  public enter = async (previous: State | null, ...params: any[]): Promise<void> => {
    console.info("entering game scene");

    this.UISignal.listen(this.uieventhandler);

    Assets.initialize({ src: "./src/Assets/" });
    await Assets.load(["gameboard.png", "tokenHolder.png"]);

    //add UI template to Viewport Layer
    SceneManager.viewport.addLayers([{ name: "game", parallax: 0 }, { name: "hud" }]);
    let layers = SceneManager.viewport.layers;
    console.log(layers);

    this.game = layers.find(lyr => lyr.name == "game");
    if (this.game) UI.create(this.game.element, this, this.template);

    this.hud = layers.find(lyr => lyr.name == "hud");
    if (this.hud) UI.create(this.hud.element, this, this.hudTemplate);

    console.log(this.game, this.hud);

    // add default entities to the array
    let player1Holder = TokenHolder.create(1);
    let player2Holder = TokenHolder.create(2);
    let gameBoard = GameBoard.create();

    this.entities.push(gameBoard, player1Holder, player2Holder);

    for (let index = 0; index < 8; index++) {
      this.entities.push(
        Token.create(index, "#87CEFA", "player1", positionLookup[index].left),
        Token.create(index, "#FFD700", "player2", positionLookup[index].right)
      );
    }

    //Systems being added for Scene to own
    //get window size first
    let windowsize = window.innerWidth;
    let scale;
    if (windowsize <= 800) scale = 1;
    else if (windowsize <= 1200) scale = 2;
    else scale = 3;
    this.sceneSystems.push(new MouseBindSystem(75, scale, 16));

    console.log(this.entities);

    //Start GameLoop
    Engine.create({ fps: 60, started: true, callback: this.update });
  };

  uieventhandler = (signalDetails: CustomEvent) => {
    console.log("received ui event", signalDetails.detail.params);
    switch (signalDetails.detail.params[0]) {
      case "playerLeft":
        this.showPlayerLeft = true;
        this.showBlur = true;
        break;
      case "resetUI":
        {
          this.showBlur = false;
          this.showWaiting = false;
          this.showConfirm = false;
          this.showReplay = false;
          let tokens = this.entities.filter((tok: any) => tok.type == "token");
          tokens.forEach((token: any) => {
            if (token.playerdesignator == "player1") {
              token.position.x = positionLookup[token.index].left.x;
              token.position.y = positionLookup[token.index].left.y;
            } else {
              token.position.x = positionLookup[token.index].right.x;
              token.position.y = positionLookup[token.index].right.y;
            }
          });
          this.stateUpdate();
        }
        break;
      case "newTurn":
        console.log("clearing endturn");
        this.isEndTurn = false;
        break;
      case "nextTurn":
        this.isEndTurn = true;
        break;
      case "snapToken":
        window.globalstate.spots.forEach((spot, spotIndex) => {
          if (spot.status) {
            let thisEntity: any = this.entities.find((ent: any) => ent.index == spot.index && ent.playerdesignator == spot.player);
            thisEntity.position.x = this.spotLocations[spotIndex].position.x;
            thisEntity.position.y = this.spotLocations[spotIndex].position.y;
          }
        });

        if (window.globalstate.turnstate == turnStates.playerSelected) {
          window.myHathoraClient.sendMessage("readyToTransition", "");
        } else if (window.globalstate.turnstate == turnStates.opponentSelected) {
        }

        break;
      case "updateBoardPositions":
        //add 'moving' class to each token entity
        let tokens = this.entities.filter((tok: any) => tok.type == "token");

        tokens.forEach((tok: any) => {
          tok.css = " moving";
        });
        console.log("spot data", window.globalstate.spots);

        window.globalstate.spots.forEach((spot, spotIndex) => {
          if (spot.status) {
            let thisEntity: any = this.entities.find((ent: any) => ent.index == spot.index && ent.playerdesignator == spot.player);
            console.log("entity data: ", thisEntity);
            thisEntity.position.x = this.spotLocations[spotIndex].position.x;
            thisEntity.position.y = this.spotLocations[spotIndex].position.y;
          }
        });
        setTimeout(() => {
          //removing moving class
          tokens.forEach((tok: any) => {
            tok.css = "";
          });
          window.myHathoraClient.sendMessage("transitionComplete", "");
        }, 600);

        break;
      case "showWaiting":
        this.showBlur = true;
        this.showWaiting = true;
        this.showConfirm = false;
        this.showReplay = false;
        break;
      case "hideWaiting":
        /*JWX <-------------   removing these Settimeouts periodically creates the failure condition */
        setTimeout(() => {
          this.showBlur = false;
        }, 100);

        this.showWaiting = false;
        this.showConfirm = false;
        this.showReplay = false;
        break;
      case "showReady":
        this.showBlur = true;
        this.showWaiting = false;
        this.showConfirm = false;
        this.showReplay = true;
        break;
      case "hideReady":
        /*JWX <-------------   removing these Settimeouts periodically creates the failure condition */
        setTimeout(() => {
          this.showBlur = false;
        }, 100);

        this.showWaiting = false;
        this.showConfirm = false;
        this.showReplay = false;
        break;
      case "showConfirm":
        this.showBlur = true;
        this.showWaiting = false;
        this.showConfirm = true;
        this.showReplay = false;
        break;
      case "hideConfirm":
        this.showWaiting = false;
        this.showConfirm = false;
        this.showReplay = false;
        /*JWX <-------------   removing these Settimeouts periodically creates the failure condition */
        setTimeout(() => {
          this.showBlur = false;
        }, 100);

        break;
      case "showReplay":
        this.gameResult = window.globalstate.victoryState;
        this.showBlur = true;
        this.showWaiting = false;
        this.showConfirm = false;
        this.showReplay = true;
        break;
      case "hideReplay":
        this.showWaiting = false;
        this.showConfirm = false;
        this.showReplay = false;
        /*JWX <-------------   removing these Settimeouts periodically creates the failure condition */
        setTimeout(() => {
          this.showBlur = false;
        }, 100);

        break;
      case "showToast":
        this.toastContent = signalDetails.detail.params[1];
        this.showToast = true;
        setTimeout(() => {
          this.showToast = false;
        }, 2000);
        break;
      case "stateupdate":
        window.globalstate.p1Holder.forEach((val, index) => (this.p1Holderspots[index].highlight = val.highlight));
        window.globalstate.p2Holder.forEach((val, index) => (this.p2Holderspots[index].highlight = val.highlight));
        window.globalstate.spots.forEach((val, index) => {
          this.spotLocations[index].highlight = val.highlight;
          this.spotLocations[index].player = val.player;
          this.spotLocations[index].playerIndex = val.index;
        });
        break;
    }
  };

  stateUpdate() {
    window.globalstate.p1Holder.forEach((val, index) => (this.p1Holderspots[index].highlight = val.highlight));
    window.globalstate.p2Holder.forEach((val, index) => (this.p2Holderspots[index].highlight = val.highlight));
    window.globalstate.spots.forEach((val, index) => {
      this.spotLocations[index].highlight = val.highlight;
      this.spotLocations[index].player = val.player;
      this.spotLocations[index].playerIndex = val.index;
    });
  }

  //GameLoop update method
  update = (deltaTime: number): void | Promise<void> => {
    this.sceneSystems.forEach((system: any) => {
      system.update(deltaTime / 1000, 0, this.entities);
    });
  };
}
