// Library
import { State } from "@peasy-lib/peasy-states";
import { Scene, SceneManager } from "../../_SqueletoECS/Scene";
import { UI } from "@peasy-lib/peasy-ui";
import { Region, LobbyVisibility } from "@hathora/cloud-sdk-typescript/dist/sdk/models/shared";
import { Regions } from "../../_SqueletoECS/Multiplayer";
import { LobbyStatus } from "../types";

//@ts-ignore
import info from "../Assets/info.svg";

export class Lobby extends Scene {
  lobbyInterval: NodeJS.Timeout | undefined;
  servers: string[] = [];
  serverDropdown: any;
  name: string = "lobby";
  privateGames: any[] = [];

  createPublic = () => {
    if (window.myHathoraClient.getServerScope() == LobbyVisibility.Local) {
      window.myHathoraClient.createRoom(LobbyVisibility.Local, this.serverDropdown.value, { status: LobbyStatus.empty });
      window.localMatches;
    } else {
      console.log("joining public lobby");

      window.myHathoraClient.createRoom(LobbyVisibility.Public, this.serverDropdown.value, { status: LobbyStatus.empty });
    }
  };
  createPrivate = async () => {
    let privateGame = await window.myHathoraClient.createRoom(LobbyVisibility.Private, this.serverDropdown.value, {
      status: LobbyStatus.empty,
    });
    let gameInfo;
    if (privateGame && typeof privateGame == "string") {
      gameInfo = await window.myHathoraClient.getRoomInfo(privateGame);
    }
    let status = JSON.parse(gameInfo.lobbyV3.roomConfig).status;
    let statusString;
    switch (status) {
      case 0:
        statusString = "empty";
        break;
      case 1:
        statusString = "waiting";
        break;
      case 2:
        statusString = "full";
        break;
    }
    this.privateGames.push({
      type: "private",
      status: statusString,
      id: gameInfo.lobbyV3.roomId,
      who: gameInfo.lobbyV3.createdBy,
      when: (gameInfo.lobbyV3.createdAt as Date).toLocaleDateString(),
    });
  };

  joinPublic = async (_e: any, m: any) => {
    let roomToJoin = m.match.id;
    console.log("Joining Room", roomToJoin);
    await window.myHathoraClient.enterRoom(roomToJoin);
    this.exit();
  };
  joinDirectPublic = async (_e: any, m: any) => {
    let roomToJoin = this.directPublicID;
    console.log("Joining Room", roomToJoin);
    await window.myHathoraClient.enterRoom(roomToJoin);
    this.exit();
  };
  directPublicID = "";
  userdata = {
    id: "",
    name: "",
    token: "",
  };
  openMatches: any[] = [];
  entities: any = [];
  entitySystems: any = [];
  sceneSystems: any = [];
  public template = `
    <style>
    
    </style>
    <scene-layer>
        <div class="mygrid">
          <div class="titleblock">
            <div class="lobbytitle">ORBIT CONNECT</div>
            <div class="userdata">
              <div class="userid">
                UserID: \${userdata.id}
              </div>
              <div class="username">
                UserName: \${userdata.name}
              </div>
            </div>
          </div>
          <div class="matchesblock">
            <div class="matchestitle">
              MATCHES
              <div class="infoIcon" title="This section shows all active matches that one can join, if none available, you can create a new match to the right"></div>
            </div>
            <div class="matchesheader">
              <div>TYPE</div>
              <div style="display: flex; justify-content: center; align-items: flex-start; gap: 2px;">
                STATUS
                <div class="infoIcon" title="EMPTY = 0 players in room, WAITING = 1 player in room, FULL=2 players in room (can't be joined), AI=1 person playing single player mode"></div>
              </div>
              <div>ROOMID</div>
              <div>WHO</div>
              <div>DETAILS</div>
              <div>JOIN</div>
            </div>
            <div class="openMatches" >
              <div class="openMatch" \${match <=* openMatches:id}>
                <div class="matches_type">\${match.type}</div>
                <div class="matches_status">\${match.status}</div>
                <div class="matches_rid">\${match.id}</div>
                <div class="matches_creator">\${match.who}</div>
                <div class="matches_deets">\${match.when}</div>
                <button class="matches_join_button" \${click@=>joinPublic}>JOIN</button>
              </div>
            </div>
          </div>
          <div class="createblock">
            <div class="create_title">
              CREATE NEW MATCH
              <div class="infoIcon" title="This section lets you create a new match, all you need is to find the nearest server, and select PRIVATE or PUBLIC game"></div>
            </div>
            <div class="servers">
              <div class="create_title">Servers</div>
              <select class="serverdropdown" \${==>serverDropdown}>
                <option  class="serverdropdownOptions" \${serv<=*servers}>\${serv}</option>
              </select>
            </div>
            <div class="buttoncontainer">
              <button class="public matches_join_button" \${click@=>createPublic}>
                PUBLIC
                
              </button>
              <button class="private matches_join_button" \${click@=>createPrivate}>
                PRIVATE
                <div class="infoIcon" title="A Private Match only shows up for you in your client, you must share the roomID with a friend"></div>
              </button>
            </div>
            
          </div>
          <div class="joinblock">
            <div class="lobby_join_title">
              JOIN MATCH
              <div class="infoIcon" title="If you receive a private roomID from friend, you enter it here to join the match directly"></div>
            </div>
            <div class="matchInput_container">
              <input type="text" max="13" class="matchInput"/ \${value<=>directPublicID}>
              <button class="matchJoinButton matches_join_button" \${click@=>joinDirectPublic}>JOIN</button>
            </div>
          </div>

        </div>
    </scene-layer>
  `;

  updateLobby = async () => {
    //while local, just use window.localmatches

    if (window.myHathoraClient.getServerScope() == LobbyVisibility.Local) {
      //update all local match lobby config
      for (const match of window.localMatches) {
        let rstl = await window.myHathoraClient.getRoomInfo(match.id);
        let localRoomConfig = JSON.parse(rstl.lobbyV3.roomConfig);
        let statusString;
        switch (localRoomConfig.status) {
          case 0:
            statusString = "empty";
            break;
          case 1:
            statusString = "waiting";
            break;
          case 2:
            statusString = "full";
            break;
          case 3:
            statusString = "AI";
            break;
        }
        match.status = statusString;
      }

      this.openMatches = [...window.localMatches];
    } else {
      let lobbies = await window.myHathoraClient.getPublicLobbies();
      if (lobbies && lobbies.classes) {
        this.openMatches = [];
        //load privates first
        this.openMatches = [...this.privateGames];

        //load publics
        lobbies.classes.map((match: any) => {
          let status = JSON.parse(match.roomConfig).status;
          console.log(status);

          let statusString;
          switch (status) {
            case 0:
              statusString = "empty";
              break;
            case 1:
              statusString = "waiting";
              break;
            case 2:
              statusString = "full";
              break;
          }
          this.openMatches.push({
            type: "public",
            status: statusString,
            id: match.roomId,
            who: match.createdBy,
            when: (match.createdAt as Date).toLocaleDateString(),
          });
        });
      }
      //console.log(this.openMatches);
    }
  };

  public enter = async (previous: State | null, ...params: any[]): Promise<void> => {
    //load HUD
    SceneManager.viewport.addLayers([{ name: "game", parallax: 0 }, { name: "hud" }]);
    //get servers
    console.log(Region);
    this.servers = [];
    Object.keys(Region).forEach(reg => {
      this.servers.push(reg);
    });

    console.log("servers: ", this.servers);
    setTimeout(() => {
      this.serverDropdown.value = "Chicago";
    }, 25);

    this.userdata.id = window.globalstate.user.id;
    this.userdata.name = window.globalstate.user.nickname;

    let layers = SceneManager.viewport.layers;
    let hud = layers.find(lyr => lyr.name == "hud");
    if (hud) UI.create(hud.element, this, this.template);

    if (window.myHathoraClient.getServerScope() == LobbyVisibility.Local) this.lobbyInterval = setInterval(this.updateLobby, 1000);
    else this.lobbyInterval = setInterval(this.updateLobby, 2000);
  };

  public exit(): Promise<void> {
    return new Promise(resolve => {
      clearInterval(this.lobbyInterval);
      resolve();
    });
  }
}
