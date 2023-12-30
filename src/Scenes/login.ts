// Library
import { State } from "@peasy-lib/peasy-states";
import { Scene, SceneManager } from "../../_SqueletoECS/Scene";
import { UI } from "@peasy-lib/peasy-ui";

const VERSION = "0.0.3";

const login = async (): Promise<boolean> => {
  let user = await window.myHathoraClient.login();

  if (user.userdata && user.token && user.token != "" && user.userdata.id != "" && user.userdata.name) {
    window.globalstate.user.id = user.userdata.id;
    window.globalstate.user.nickname = user.userdata.name;
    window.globalstate.user.token = user.token;
    return true;
  }

  return false;
};

export class Login extends Scene {
  version = "";
  loginEvent = async () => {
    let loginResult = await login();
    if (loginResult) {
      //change scene
      console.log("changing scenes", window.globalstate.user);

      window.sceneMgr.set("lobby");
    }
  };
  name: string = "login";
  entities: any = [];
  entitySystems: any = [];
  sceneSystems: any = [];
  public template = `
      <style>

        .title{
          position: fixed;
          left: 50%;
          transform: translate(-50%,50%);
          font-size: 1.5em;
        }


        .loginButton{
          position: fixed;
          border: 1px solid whitesmoke;
          border-radius: 5000px;
          width: 30%;
          display: flex;
          justify-content: center;
          align-items: center;
          left: 50%;
          top: 50%;
          transform: translate(-50%,-50%);
          padding: 3px;
          cursor: pointer;
        }

        .loginButton:hover{
          background-color: whitesmoke;
          color: #222222;
        }
      </style>
      <scene-layer>
      <version-text>Version \${version }</version-text>
       <div class="title">Orbit Connect</div>
       <div class="loginButton" \${click@=>loginEvent}>Login to Server</div>
      </scene-layer>
  `;
  public enter = async (previous: State | null, ...params: any[]): Promise<void> => {
    this.version = VERSION;
    //load HUD
    let layers = SceneManager.viewport.layers;
    let hud = layers.find(lyr => lyr.name == "hud");
    if (hud) UI.create(hud.element, this, this.template);
  };
}
