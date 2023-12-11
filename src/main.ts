// Library Modules
import { Viewport } from "@peasy-lib/peasy-viewport";
import { SceneManager } from "../_SqueletoECS/Scene";
import { HathoraConnection } from "@hathora/client-sdk";
import { AuthenticationType, MultiPlayerInterface } from "../_SqueletoECS/Multiplayer";
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, gameVictoryStates } from "./types";
import { Signal } from "../_SqueletoECS/Signals";

import "./style.css";

// Content Modules
import { LoadComponents } from "./Components/_components";

//define UI signals
const UISignal = new Signal("uiEvent");

declare global {
  interface Window {
    localMatches: any[];
    globalstate: {
      victoryState: gameVictoryStates;
      p1state: boolean;
      p2state: boolean;
      p1Holder: any[];
      p2Holder: any[];
      user: {
        token: string;
        id: string;
        nickname: string;
      };
      players: any[];
      gamestate: string;
      turnstate: string;
      spots: any[];
      turn: "player1" | "player2";
    };
    appID: string;
    sceneMgr: any;
    myHathoraConnection: HathoraConnection | undefined;
    myHathoraClient: MultiPlayerInterface;
    stateUpdate: (param: any) => void;
  }
}
window.localMatches = [];
window.appID = "app-52044e66-ed56-4479-b2cb-4997622a9472";
window.stateUpdate = (state: any) => {
  console.log("state updated:", state);
  window.globalstate.victoryState = state.victoryState;
  window.globalstate.players = [...state.players];
  window.globalstate.p1state = state.p1State;
  window.globalstate.p2state = state.p2State;
  window.globalstate.spots = [...state.spots];
  window.globalstate.gamestate = state.state;
  window.globalstate.turnstate = state.turnstate;
  window.globalstate.turn = state.turn;
  window.globalstate.p1Holder = state.p1holder;
  window.globalstate.p2Holder = state.p2holder;
  UISignal.send(["stateupdate"]);
};
window.globalstate = {
  user: {
    token: "",
    id: "",
    nickname: "",
  },
  p1Holder: [],
  p2Holder: [],
  turn: "player1",
  p1state: false,
  p2state: false,
  players: [],
  gamestate: "idle",
  turnstate: "start",
  spots: [],
  victoryState: gameVictoryStates.unknown,
};

window.myHathoraClient = new MultiPlayerInterface(
  "app-52044e66-ed56-4479-b2cb-4997622a9472",
  (msg: any) => {
    if (msg.type == "stateupdate") {
      window.stateUpdate(msg);
    } else if (msg.type == "CONFIRM_CONNECTION") {
      window.sceneMgr.set("game");
    } else if (msg.type == "ERROR") {
      console.error("Server Error: ", msg.msg);
    } else if (msg.type == "event") {
      UISignal.send([msg.event]);
    } else if (msg.type == "showToast") {
      UISignal.send([msg.type, msg.message]);
    }
  },
  9000,
  [AuthenticationType.anonymous],
  true
);

// Scenes
import { Login } from "./Scenes/login";
import { Lobby } from "./Scenes/lobby";
import { Game } from "./Scenes/game";

let viewport = Viewport.create({ size: { x: VIEWPORT_WIDTH, y: VIEWPORT_HEIGHT } });
viewport.addLayers([{ name: "game", parallax: 0 }, { name: "hud" }]);
SceneManager.viewport = viewport;

// Components
LoadComponents();

//Load Scenes
let sceneMgr = new SceneManager();
window.sceneMgr = sceneMgr;
sceneMgr.register(Login, Lobby, Game);
sceneMgr.set("login");
