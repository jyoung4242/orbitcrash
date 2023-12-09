// Library
import { State } from "@peasy-lib/peasy-states";
import { Scene, SceneManager } from "../../_SqueletoECS/Scene";
import { UI } from "@peasy-lib/peasy-ui";
import { Region, LobbyVisibility } from "@hathora/cloud-sdk-typescript/dist/sdk/models/shared";

export class Lobby extends Scene {
  lobbyInterval: NodeJS.Timeout | undefined;
  name: string = "lobby";
  createPublic = () => {
    window.myHathoraClient.createRoom(LobbyVisibility.Local, Region.Chicago, {});
  };
  joinPublic = (_e: any, m: any) => {
    let roomToJoin = m.match.id;
    console.log("Joining Room", roomToJoin);
    window.myHathoraClient.enterRoom(roomToJoin);
    this.exit();
  };
  joinDirectPublic = (_e: any, m: any) => {
    let roomToJoin = this.directPublicID;
    console.log("Joining Room", roomToJoin);
    window.myHathoraClient.enterRoom(roomToJoin);
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
    <scene-layer>
        <div class="mygrid">
          <div class="titleblock">
            <div class="lobbytitle">Orbit Connect</div>
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
            <div class="matchestitle">Public Matches</div>
            <div class="matchesheader">
              <div>RoomID</div>
              <div>Creator</div>
              <div>Details</div>
              <div>Join</div>
            </div>
            <div class="openMatches" >
              <div class="openMatch" \${match <=* openMatches:id}>
                <div class="matches_rid">\${match.id}</div>
                <div class="matches_creator">\${match.who}</div>
                <div class="matches_deets">\${match.when}</div>
                <div class="matches_join_button" \${click@=>joinPublic}>JOIN</div>
              </div>
            </div>
          </div>
          <div class="createblock">
            <div>Create New Match</div>
            <div class="servers">
              <div>Servers</div>
              <select>
                <option>Chicago</option>
              </select>
            </div>
            <div class="buttoncontainer">
              <div class="public matches_join_button" \${click@=>createPublic}>Public</div>
              <div class="private matches_join_button">Private</div>
            </div>
            
          </div>
          <div class="joinblock">
            <div class="lobby_join_title">Join Match</div>
            <div class="matchInput_container">
              <input type="text" max="13" class="matchInput"/ \${value<=>directPublicID}>
              <div class="matchJoinButton matches_join_button" \${click@=>joinDirectPublic}>JOIN</div>
            </div>
          </div>

        </div>
    </scene-layer>
  `;

  updateLobby = () => {
    //while local, just use window.localmatches
    console.log(window.localMatches);

    this.openMatches = [...window.localMatches];
    console.log(this.openMatches);
  };

  public enter = async (previous: State | null, ...params: any[]): Promise<void> => {
    //load HUD
    SceneManager.viewport.addLayers([{ name: "game", parallax: 0 }, { name: "hud" }]);
    console.log("in lobby", window.globalstate.user);

    this.userdata.id = window.globalstate.user.id;
    this.userdata.name = window.globalstate.user.nickname;

    let layers = SceneManager.viewport.layers;
    let hud = layers.find(lyr => lyr.name == "hud");
    if (hud) UI.create(hud.element, this, this.template);
    this.lobbyInterval = setInterval(this.updateLobby, 2500);
  };

  public exit(): void {
    clearInterval(this.lobbyInterval);
  }
}
