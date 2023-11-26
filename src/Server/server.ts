import { Application, RoomId, startServer, UserId, verifyJwt } from "@hathora/server-sdk";
import * as dotenv from "dotenv";
import { gameStates } from "../types";

import { HathoraCloud } from "@hathora/cloud-sdk-typescript";

dotenv.config();

const hathoraSdk = new HathoraCloud({
  appId: process.env.HATHORA_APP_ID!,
  security: { hathoraDevToken: process.env.DEVELOPER_TOKEN! },
});

console.log("appid: ", process.env.HATHORA_APP_ID);

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

type InternalState = {
  players: any[];
  spots: any[];
  gamestate: gameStates;
};

const roomMap: Map<RoomId, InternalState> = new Map();

const app: Application = {
  verifyToken: (token: string, roomId: string): Promise<UserId | undefined> => {
    return new Promise((resolve, reject) => {
      const result = verifyJwt(token, process.env.HATHORA_APP_SECRET as string);
      if (result) resolve(result);
      else reject();
    });
  },
  subscribeUser: (roomId: RoomId, userId: UserId): Promise<void> => {
    return new Promise((resolve, reject) => {
      //create room in map
      if (!roomMap.has(roomId)) {
        const gameState: InternalState = {
          players: [],
          spots: [],
          gamestate: gameStates.IDLE,
        };
        roomMap.set(roomId, gameState);
      }

      //check to make sure user not in room
      const findResult = roomMap.get(roomId)?.players.findIndex(user => user === userId);

      if (findResult != -1) {
        server.sendMessage(
          roomId,
          userId,
          encoder.encode(
            JSON.stringify({
              type: "ERROR",
              message: `user: ${userId} is already in room ${roomId}`,
            })
          )
        );
        reject();
      }

      roomMap.get(roomId)?.players.push(userId);

      server.broadcastMessage(
        roomId,
        encoder.encode(
          JSON.stringify({
            type: "USERLIST",
            roomID: roomId,
            //@ts-ignore
            users: [...roomMap.get(roomId).players],
          })
        )
      );
      resolve();
    });
  },
  unsubscribeUser: (roomId: RoomId, userId: UserId): Promise<void> => {
    return new Promise((resolve, reject) => {
      const room = roomMap.get(roomId);
      if (!room) {
        reject();
        return;
      }
      const userIndex = room.players.findIndex(i => i == userId);

      if (!userIndex || userIndex == -1) {
        reject();
        return;
      }

      room.players.splice(userIndex, 1);

      server.broadcastMessage(
        roomId,
        encoder.encode(
          JSON.stringify({
            type: "USERLIST",
            roomID: roomId,
            users: [...room.players],
          })
        )
      );
      resolve();
    });
  },

  /*
    The onMessage is the callback that manages all the clients messages to the server, this is where a bulk of your server code goes regarding
    responding to the client's messages
  */

  onMessage: (roomId: RoomId, userId: UserId, data: ArrayBuffer): Promise<void> => {
    return new Promise(resolve => {
      const msg = JSON.parse(decoder.decode(data));
      console.log(`message from ${userId}, in ${roomId}: `, msg);
      server.sendMessage(
        roomId,
        userId,
        encoder.encode(
          JSON.stringify({
            type: "SERVERMESSAGE",
            msg: "HELLO FROM SERVER",
          })
        )
      );
      resolve();
    });
  },
};

const port = 9000;
const server = await startServer(app, port);
console.log(`Hathora Server listening on port ${port}`);
