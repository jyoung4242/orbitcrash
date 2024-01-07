import { HathoraClient, HathoraConnection, ConnectionDetails } from "@hathora/client-sdk";
import { HathoraCloud } from "@hathora/cloud-sdk-typescript";
import {
  AppConfig,
  AuthConfiguration,
  LobbyVisibility,
  LoginNicknameRequest,
  Region,
} from "@hathora/cloud-sdk-typescript/dist/sdk/models/shared";
import { GetConnectionInfoResponse } from "@hathora/cloud-sdk-typescript/dist/sdk/models/operations";
import { log } from "console";
import { LobbyStatus } from "../src/types";

let hathoraSdk: HathoraCloud;

export const LOCAL_CONNECTION_DETAILS: ConnectionDetails = {
  host: "localhost",
  port: 9000,
  transportType: "tcp" as const,
};

export type Regions = Region;

export type User = {
  token?: string;
  userdata?: UserData;
};

export type UserData = object & {
  id: string;
  type?: string;
  name?: string;
  iat?: number;
};

export enum AuthenticationType {
  anonymous = "anon",
  nickname = "nickname",
}

export class MultiPlayerInterface {
  lobbyClient;
  authClient;
  roomClient;
  token: string | null = null;
  connection: HathoraConnection | undefined;
  appID: string;
  roomID: string | undefined;
  currentRoom: string = "";
  authTypes: Array<AuthenticationType>;
  //portnum: number;
  public updateCallback: Function | undefined | null;
  matchScope: LobbyVisibility;

  userdata: UserData = {
    id: "",
  };

  constructor(
    app_id: string,
    stateUpdateCallback: Function,
    portNum?: number | undefined | null,
    AuthTypes?: Array<AuthenticationType>,
    local?: boolean
  ) {
    hathoraSdk = new HathoraCloud({ appId: window.appID });
    this.lobbyClient = hathoraSdk.lobbyV3;
    this.authClient = hathoraSdk.authV1;
    this.roomClient = hathoraSdk.roomV2;
    console.log(window.appID);
    console.log(hathoraSdk);

    this.authTypes = AuthTypes as Array<AuthenticationType>;
    this.appID = app_id;
    this.connection = undefined;
    this.updateCallback = stateUpdateCallback;
    if (local) this.matchScope = LobbyVisibility.Local;
    else this.matchScope = LobbyVisibility.Public;
    console.log("mulitplayer interface: ***********************************************************");
    console.log("auth client: ", this.authClient);
    console.log("room client: ", this.roomClient);
    console.log("lobby client: ", this.lobbyClient);
  }

  changeServerScope(scope: LobbyVisibility) {
    this.matchScope = scope;
  }

  getServerScope() {
    return this.matchScope;
  }

  async login(nickname?: string) {
    console.log(nickname);

    this.token = sessionStorage.getItem("token");
    if (!this.token) {
      let loginResponse;
      if (nickname == undefined) loginResponse = await this.authClient.loginAnonymous(this.appID);
      else {
        console.log("nickname login", nickname);

        let nicknamerequest: LoginNicknameRequest = {
          nickname,
        };
        loginResponse = await this.authClient.loginNickname(nicknamerequest, this.appID);
      }

      if (loginResponse.loginResponse?.token) this.token = loginResponse.loginResponse?.token;
      sessionStorage.setItem("token", this.token as string);
      if (this.token) this.userdata = HathoraClient.getUserFromToken(this.token);
    } else {
      if (this.token) this.userdata = HathoraClient.getUserFromToken(this.token);
    }

    let rslt: User = {
      token: this.token as string,
      userdata: this.userdata,
    };
    console.log(this.userdata);

    console.log("User Login: ***********************************************************************");
    console.log("User Token: ", this.token);
    console.log("UserID: ", this.userdata.id);
    console.log("User type: ", this.userdata.type);
    console.log("Username: ", this.userdata.name);

    return rslt;
  }

  checkForActiveToken() {
    let pretoken = sessionStorage.getItem("token");
    if (pretoken) {
      let preuserdata = HathoraClient.getUserFromToken(pretoken);
      console.log(pretoken, preuserdata);

      if (preuserdata) {
        //return userdata
        console.log("Token Data: ***********************************************************************");
        console.log("User Token: ", pretoken);
        console.log("UserID: ", preuserdata.id);
        console.log("User type: ", preuserdata.type);
        console.log("Username: ", preuserdata.name);
        return preuserdata;
      }
    } else undefined;
  }

  async getPublicLobbies() {
    let lobbies;

    if (this.token) {
      lobbies = await this.lobbyClient.listActivePublicLobbies(this.appID);

      return lobbies;
    }
  }

  /*
  const { lobbyV3 } = await hathoraSdk.lobbyV3.createLobby(
                    {
                      createLobbyV3Params: {
                        region,
                        visibility: visibility as LobbyVisibility,
                        roomConfig: JSON.stringify(roomConfig),
                      },
                    },
                    { playerAuth: playerToken.value }
                  );
  */

  async createRoom(visibility: LobbyVisibility, region: Region, config: object) {
    if (this.matchScope != LobbyVisibility.Local) this.matchScope = LobbyVisibility.Public;
    if (this.token) {
      console.log(this.token);
      console.log(this.lobbyClient);

      console.log(region, visibility);

      let { lobbyV3 } = await this.lobbyClient.createLobby(
        { createLobbyV3Params: { region, visibility, roomConfig: JSON.stringify(config) } },
        { playerAuth: this.token }
      );
      console.log(lobbyV3);

      /* let { roomId } = await this.lobbyClient.createLobby(
        this.appID, // your Hathora application id
        this.token, // signed player token (see "Authenticate Players" section)
        {
          visibility: this.matchScope,
          region: region,
          initialConfig: config,
        }
      ); */
      if (lobbyV3) this.roomID = lobbyV3.roomId;
      const currentDate = new Date();
      const shortDateTimeFormat = currentDate.toLocaleString("en-US"); // Adjust the locale as needed

      console.log(shortDateTimeFormat);
      if (this.matchScope == LobbyVisibility.Local) {
        window.localMatches.push({
          id: this.roomID,
          type: "local",
          status: "empty",
          who: window.globalstate.user.id,
          when: shortDateTimeFormat,
        });
        console.log(this.roomID, window.globalstate.user.id, shortDateTimeFormat);
      }
    }
    console.log("Rooom SETUP ***********************************************************");
    console.log("roomid: ", this.roomID);

    return this.roomID;
  }

  async sendMessage(type: string, data: string) {
    this.connection?.writeJson({
      type: type,
      msg: data,
    });
  }

  onClose = (e: any) => {
    console.log("HATHORA CONNECTION FAILURE");
    console.log(`error:`, e);
  };

  getJSONmsg = (msg: any) => {
    if (this.updateCallback != undefined) this.updateCallback(msg);
  };

  async enterRoom(roomId: string) {
    console.log("Rooom change ***********************************************************");
    console.log("Entering: ", roomId);

    let connectionInfo;
    console.log(this.matchScope);

    if (this.matchScope == LobbyVisibility.Local) {
      connectionInfo = LOCAL_CONNECTION_DETAILS;
    } else {
      let ConnectionDetails: GetConnectionInfoResponse = await this.roomClient.getConnectionInfo(roomId, this.appID);
      //await this.roomClient.getConnectionInfo(
      connectionInfo = ConnectionDetails.connectionInfoV2?.exposedPort;
    }
    console.log("connection info", connectionInfo);
    if (connectionInfo) {
      this.connection = new HathoraConnection(roomId, connectionInfo);
      this.currentRoom = roomId;
      this.connection.onMessageJson(this.getJSONmsg);
      this.connection.onClose(this.onClose);
      console.log("starting connection");

      await this.connection.connect(this.token as string);
      console.log("returned from connect command");
    }
  }

  async leaveRoom() {
    if (this.connection) {
      this.connection.disconnect();
      this.currentRoom = "";
    }
  }

  async getRoomInfo(room: string) {
    let roomdetails: any;
    if (room) {
      roomdetails = await this.lobbyClient.getLobbyInfoByRoomId(room, this.appID);
    } //getLobbyInfo(this.appID, this.roomID);
    return roomdetails;
  }

  setRoomID(room: string) {
    if (this.roomID == undefined) this.roomID = room;
  }
}
