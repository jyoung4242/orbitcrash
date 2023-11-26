// Library Modules
import { Viewport } from "@peasy-lib/peasy-viewport";
import { SceneManager } from "../_SqueletoECS/Scene";
import { HathoraConnection } from "@hathora/client-sdk";
import { AuthenticationType, MultiPlayerInterface } from "../_SqueletoECS/Multiplayer";
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from "./types";
import "./style.css";

// Content Modules
import { LoadComponents } from "./Components/_components";

declare global {
  interface Window {
    globalstate: {
      user: {
        token: string;
        id: string;
        nickname: string;
      };
      players: any[];
      gamestate: string;
      spots: any[];
    };
    appID: string;
    sceneMgr: any;
    myHathoraConnection: HathoraConnection | undefined;
    myHathoraClient: MultiPlayerInterface;
    stateUpdate: (param: any) => void;
  }
}

window.appID = "app-52044e66-ed56-4479-b2cb-4997622a9472";

window.globalstate = {
  user: {
    token: "",
    id: "",
    nickname: "",
  },

  players: [],
  gamestate: "idle",
  spots: [],
};

window.myHathoraClient = new MultiPlayerInterface(
  "app-52044e66-ed56-4479-b2cb-4997622a9472",
  (msg: any) => {
    if (msg.type == "stateupdate") {
      window.stateUpdate(msg.state);
    } else if (msg.type == "ERROR") {
      console.error("Server Error: ", msg.msg);
    } else if (msg.type == "event") {
    }
  },
  9000,
  [AuthenticationType.anonymous],
  false
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
