// Library
//@ts-ignore
import settings from "../Assets/settings.svg";
//@ts-ignore
import access from "../Assets/access.svg";
//@ts-ignore
import help from "../Assets/help.svg";
//@ts-ignore
import spinner from "../Assets/spinner.svg";

import { State } from "@peasy-lib/peasy-states";
import { Scene, SceneManager } from "../../_SqueletoECS/Scene";
import { UI } from "@peasy-lib/peasy-ui";
import { Engine } from "@peasy-lib/peasy-engine";
import { Renderer, Camera, Transform, Sphere, Program, Mesh, Orbit, Triangle, AttributeMap } from "ogl";
import { starfieldVertex, starfieldfragment } from "../Shaders/starfield";

const VERSION = "0.0.4";

const login = async (name?: string): Promise<boolean> => {
  console.log(name);

  let user;
  if (name) {
    user = await window.myHathoraClient.login(name);
  } else {
    user = await window.myHathoraClient.login();
  }

  if (user.userdata && user.token && user.token != "" && user.userdata.id != "" && user.userdata.name) {
    window.globalstate.user.id = user.userdata.id;
    window.globalstate.user.nickname = user.userdata.name;
    window.globalstate.user.token = user.token;
    return true;
  }

  return false;
};

export class Login extends Scene {
  showSpinner: boolean = false;
  activeSessionString: string = "";
  showActiveSession: boolean = false;
  elapsedTime: number = 0;
  shaderProgram: undefined | Program;
  shaderRenderer: undefined | Renderer;
  shaderMesh: any;
  version = "";
  resetSession = () => {
    sessionStorage.removeItem("token");
    this.showActiveSession = false;
    let activeSession = window.myHathoraClient.checkForActiveToken();
    if (activeSession) {
      this.showActiveSession = true;
      //@ts-ignore
      if (activeSession.type == "anonymous") {
        this.activeSessionString = `Anonymous Active Session`;
      } else {
        //@ts-ignore
        this.activeSessionString = `Active Session created by ${activeSession.name}`;
      }
    }
  };
  loginEvent = async () => {
    this.showSpinner = true;
    let loginResult;
    loginResult = await login(this.nickname?.value);

    if (loginResult) {
      //change scene

      console.log("changing scenes", window.globalstate.user);

      window.sceneMgr.set("lobby");
    }
  };
  checkEnter = async (e: KeyboardEvent) => {
    if (e.key == "Enter") {
      this.showSpinner = true;
      await waitSomeTime(750); //local testing only

      let loginResult;
      loginResult = await login(this.nickname?.value);

      if (loginResult) {
        //change scene

        console.log("changing scenes", window.globalstate.user);

        window.sceneMgr.set("lobby");
      }
    }
  };
  nickname: undefined | HTMLInputElement;
  name: string = "login";
  entities: any = [];
  entitySystems: any = [];
  sceneSystems: any = [];
  public template = `
      <style>
        canvas{
          position: absolute;
          z-index: -1;
        }

        .layer.hud{
          z-index: 1;
        }

        .title{
          font-family: hero;
          position: fixed;
          left: 50%;
          transform: translate(-50%,50%);
          font-size: 1.8em;
          width: 70%;
          text-align: center;
        }


        .loginButton{
          font-family: subtext;
          position: fixed;
          border: 1px solid whitesmoke;
          border-radius: 5000px;
          width: 30%;
          display: flex;
          justify-content: center;
          align-items: center;
          left: 50%;
          top: 65%;
          transform: translate(-50%,-50%) scale(1);
          padding: 3px;
          cursor: pointer;
          transition: width 0.4s ;
          background-color: transparent;
          color: whitesmoke;
        }

        .loginButton:hover{
          background-color: whitesmoke;
          color: #222222;
          width: 38%;
        }

        .nicknamecontainer{
          
          position: fixed;
          border: 1px solid whitesmoke;
          border-radius: 5px;
          width: 50%;
          display: flex;
          justify-content: space-evenly;
          align-items: center;
          left: 50%;
          top: 50%;
          transform: translate(-50%,-50%);
          padding: 3px;

        }

        .loginNickName{
          font-family: subtext;
          border: 1px solid whitesmoke;
          border-radius: 5px;
          width: 50%;
          font-size: x-small;
          text-align: center;
        }

        .loginNickNameLabel{
          font-family: subtext;
          font-size: xx-small;
        }

        .settings{
          background-color: transparent;
          border: none;
          position: fixed;
          top: 5px;
          left: 3px;
          background-image: url(${settings});
          background-size: contain;
          background-repeat: no-repeat;
          width: 15px;
          aspect-ratio: 1/1;
          color: whitesmoke;
          z-index: 4;
          cursor: pointer;
          transform: scale(1);
          transition: transform 0.4s;
        }

        .settings:hover{
          transform: scale(1.25);
        }

        .accessibility{
          background-color: transparent;
          border: none;
          position: fixed;
          top: 22px;
          left: 3px;
          background-image: url(${access});
          background-size: contain;
          background-repeat: no-repeat;
          width: 15px;
          aspect-ratio: 1/1;
          color: whitesmoke;
          cursor: pointer;
          transform: scale(1);
          transition: transform 0.4s;
        }
        .accessibility:hover{
          transform: scale(1.25);
        }
        .help{
          background-color: transparent;
          border: none;
          position: fixed;
          top: 39px;
          left: 3px;
          background-image: url(${help});
          background-size: contain;
          background-repeat: no-repeat;
          width: 15px;
          aspect-ratio: 1/1;
          color: whitesmoke;
          cursor: pointer;
          transform: scale(1);
          transition: transform 0.4s;
        }
        .help:hover{
          transform: scale(1.25);
        }

        .sessiontext{
          display:flex;
          justify-content: flex-start;
          align-items: center;
          position: fixed;
          bottom: 0px;
          left: 3px;
          width: 60%;
          color: whitesmoke;
          font-size: xx-small;
          flex-wrap: no-wrap;
        }
        .resetButton{
          bottom: 0px;
          color: whitesmoke;
          font-size: xx-small;
          background-color: transparent;
          border: none;
          text-decoration: underline;
          cursor: pointer;
        }

        wait-spinner{
          width: 25px;
          aspect-ratio: 1/1;
          position: fixed;
          z-index: 99999;
          background-image: url(${spinner});
          left: 50%;
          top: 50%;
          transform: translate(-50%,-50%);
        }



      </style>
      <scene-layer>
        <button class="settings" title="SETTINGS"></button>
        <button class="accessibility" title="ACCESSIBILITY"></button>
        <button class="help" title="TUTORIAL"></button>
        <version-text>Version \${version }</version-text>
        <div class="title">ORBIT CONNECT</div>
        
        
        <div class="nicknamecontainer">
          <label class="loginNickNameLabel" title="NICKNAME">Nickname (optional)</label>
          <input \${==>nickname} type='text' class="loginNickName" placeholder="anonymous" title="NICKNAME"\${keydown@=>checkEnter}/>
        </div>
       <button class="loginButton" title="LOGIN" \${click@=>loginEvent}>LOGIN</button>
       <active-session \${===showActiveSession} class="sessiontext">
          \${activeSessionString}
          <button class="resetButton" \${click@=>resetSession}>Reset Session</button>
       </active-session>
       <blur-layer \${===showSpinner}></blur-layer>
       <wait-spinner  \${===showSpinner}></wait-spinner>
      </scene-layer>
  `;
  public enter = async (previous: State | null, ...params: any[]): Promise<void> => {
    this.showSpinner = false;
    this.version = VERSION;
    //load HUD
    let layers = SceneManager.viewport.layers;

    let hud = layers.find(lyr => lyr.name == "hud");
    if (hud) UI.create(hud.element, this, this.template);

    this.initShader(SceneManager.viewport.element.clientWidth, SceneManager.viewport.element.clientHeight);
    //setup shader in background
    //Start GameLoop
    Engine.create({ fps: 60, started: true, callback: this.update });
    let activeSession = window.myHathoraClient.checkForActiveToken();
    if (activeSession) {
      this.showActiveSession = true;
      //@ts-ignore
      if (activeSession.type == "anonymous") {
        this.activeSessionString = `Anonymous Active Session`;
      } else {
        //@ts-ignore
        this.activeSessionString = `Active Session created by ${activeSession.name}`;
      }
    }
  };

  update = (dt: number) => {
    this.elapsedTime += dt;

    if (this.shaderProgram) this.shaderProgram.uniforms.U_time.value = this.elapsedTime * 0.001;
    this.shaderRenderer?.render({ scene: this.shaderMesh });
  };

  initShader = (wWidth: number, wHeight: number) => {
    this.shaderRenderer = new Renderer({ alpha: true });
    const gl = this.shaderRenderer.gl;
    this.shaderRenderer.setSize(wWidth, wHeight);
    gl.clearColor(0, 0, 0, 1);
    SceneManager.viewport.element.appendChild(gl.canvas);

    const uniforms = {
      U_resolution: { value: [wWidth, wHeight] },
      U_time: { value: 0.0 },
    };

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendEquation(gl.FUNC_ADD);

    const geometry = new Triangle(gl, {});

    let vertex = starfieldVertex;
    let fragment = starfieldfragment;
    this.shaderProgram = new Program(gl, { vertex, fragment, uniforms, transparent: true });
    this.shaderMesh = new Mesh(gl, { geometry, program: this.shaderProgram });
    this.shaderRenderer.render({ scene: this.shaderMesh });
  };
}

const waitSomeTime = async (ms: number): Promise<void> => {
  return new Promise(r => setTimeout(r, ms));
};
