import { Application, RoomId, startServer, UserId, verifyJwt } from "@hathora/server-sdk";
import * as dotenv from "dotenv";
import { gameStates, gameVictoryStates, turnStates } from "../types.ts";
import { Chance } from "chance";
import { HathoraCloud } from "@hathora/cloud-sdk-typescript";

dotenv.config();

const chance = new Chance();
console.log(process.env.DEVELOPER_TOKEN);

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
  player1holder: any[];
  player2holder: any[];
  gamestate: gameStates;
  turnstate: turnStates;
  player1state: boolean;
  player2state: boolean;
  p1Tran: boolean;
  p2Tran: boolean;
  turn: "player1" | "player2";
  transitionLatch: boolean;
  gameVictoryState: gameVictoryStates;
  drawCycleCount: number;
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
    return new Promise(async (resolve, reject) => {
      console.log("new user: ", roomId, userId);

      //create room in map
      if (!roomMap.has(roomId)) {
        const gameState: InternalState = {
          p1Tran: false,
          p2Tran: false,
          players: [],
          spots: [],
          player1holder: [],
          player2holder: [],
          gamestate: gameStates.IDLE,
          turnstate: turnStates.start,
          player1state: false,
          player2state: false,
          turn: "player1",
          transitionLatch: false,
          gameVictoryState: gameVictoryStates.unknown,
          drawCycleCount: 0,
        };
        for (let index = 0; index < 8; index++) {
          gameState.player1holder.push({ status: -1, highlight: "transparent" });
          gameState.player2holder.push({ status: -1, highlight: "transparent" });
        }
        gameState.spots = resetSpots();

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

      //test to make sure cap isn't exceeded (2 players)
      if (roomMap.get(roomId)?.players.length == 2) {
        server.sendMessage(
          roomId,
          userId,
          encoder.encode(
            JSON.stringify({
              type: "ERROR",
              message: `room ${roomId} is at max capacity`,
            })
          )
        );
        reject();
      }

      roomMap.get(roomId)?.players.push(userId);

      server.sendMessage(
        roomId,
        userId,
        encoder.encode(
          JSON.stringify({
            type: "CONFIRM_CONNECTION",
            roomId,
          })
        )
      );

      //updateing LobbyService
      let numPlayers = roomMap.get(roomId)?.players.length;
      console.log(`updating config: ${roomId}, with num players: ${numPlayers}`);
      let configResult;
      if (numPlayers) configResult = await updateRoomConfig(roomId, numPlayers);
      console.log("configresults: ", configResult);

      if (roomMap.get(roomId)?.players.length == 1) {
        server.broadcastMessage(
          roomId,
          encoder.encode(
            JSON.stringify({
              type: "event",
              event: "showWaiting",
            })
          )
        );
      } else if (roomMap.get(roomId)?.players.length == 2) {
        server.broadcastMessage(
          roomId,
          encoder.encode(
            JSON.stringify({
              type: "event",
              event: "hideWaiting",
            })
          )
        );
        updateState(roomId);
        server.broadcastMessage(
          roomId,
          encoder.encode(
            JSON.stringify({
              type: "event",
              event: "showConfirm",
            })
          )
        );
      }

      resolve();
    });
  },
  unsubscribeUser: (roomId: RoomId, userId: UserId): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      console.info("leaving room");

      const room = roomMap.get(roomId);

      if (!room) {
        reject();
        return;
      }
      const userIndex = room.players.findIndex(i => i == userId);

      if (userIndex == -1) {
        reject();
        return;
      }

      room.players.splice(userIndex, 1);
      room.gamestate = gameStates.WAITING;
      room.turnstate = turnStates.idle;
      room.spots = resetSpots();

      //update room config
      //updateing LobbyService
      let numPlayers = room.players.length;
      console.log(`updating config: ${roomId}, with num players: ${numPlayers}`);
      let configResult;
      console.log("debug", numPlayers, roomId, room);

      if (numPlayers) configResult = await updateRoomConfig(roomId, numPlayers);
      console.log("configresults: ", configResult);

      updateState(roomId);
      server.broadcastMessage(
        roomId,
        encoder.encode(
          JSON.stringify({
            type: "event",
            event: "playerLeft",
          })
        )
      );
      resolve();
    });
  },

  onMessage: (roomId: RoomId, userId: UserId, data: ArrayBuffer): Promise<void> => {
    return new Promise(resolve => {
      const msg = JSON.parse(decoder.decode(data));

      const room = roomMap.get(roomId);
      if (!room) return;
      switch (msg.type) {
        case "backToWaiting":
          room.player1state = false;
          room.player2state = false;

          if (msg.msg == "Player 1") room.player1state = true;
          else if (msg.msg == "Player 2") room.player2state = true;
          room.player1holder = [];
          room.player2holder = [];

          for (let index = 0; index < 8; index++) {
            room.player1holder.push({ status: -1, highlight: "transparent" });
            room.player2holder.push({ status: -1, highlight: "transparent" });
          }

          room.gamestate = gameStates.WAITING;
          room.turnstate = turnStates.idle;
          //pick starting person
          if (chance.bool()) {
            room.turn = "player1";
          } else room.turn = "player2";

          room.spots = resetSpots();
          resetHighlights(roomId);

          server.broadcastMessage(
            roomId,
            encoder.encode(
              JSON.stringify({
                type: "event",
                event: "resetUI",
              })
            )
          );
          server.broadcastMessage(
            roomId,
            encoder.encode(
              JSON.stringify({
                type: "event",
                event: "showWaiting",
              })
            )
          );
          break;
        case "resetGame":
          if (msg.msg == "Player 1") room.player1state = true;
          else if (msg.msg == "Player 2") room.player2state = true;

          if (room.player1state && room.player2state) {
            //reset game

            room.player1holder = [];
            room.player2holder = [];
            room.gamestate = gameStates.ACTIVE;
            room.turnstate = turnStates.selectToken;
            //pick starting person
            if (chance.bool()) {
              room.turn = "player1";
            } else room.turn = "player2";

            room.spots = resetSpots();
            for (let index = 0; index < 8; index++) {
              room.player1holder.push({ status: -1, highlight: "transparent" });
              room.player2holder.push({ status: -1, highlight: "transparent" });
            }
            server.broadcastMessage(
              roomId,
              encoder.encode(
                JSON.stringify({
                  type: "event",
                  event: "resetUI",
                })
              )
            );
            sendToast(roomId, `It is ${room.turn}'s turn to start`, 1000);
            showAvailableMoves(roomId);
            setTimeout(() => {
              room.turnstate = turnStates.selectToken;
              updateState(roomId);
            }, 2000);
          }

          break;
        case "endTurn1":
          console.log("receive end turn p1");

          room.turn = "player2";
          room.turnstate = turnStates.selectToken;
          server.broadcastMessage(
            roomId,
            encoder.encode(
              JSON.stringify({
                type: "event",
                event: "newTurn",
              })
            )
          );
          sendToast(roomId, `It is ${room.turn}'s turn to start`, 1000);
          showAvailableMoves(roomId);
          break;
        case "endTurn2":
          console.log("receive end turn p2");
          room.turn = "player1";
          room.turnstate = turnStates.selectToken;
          showAvailableMoves(roomId);
          server.broadcastMessage(
            roomId,
            encoder.encode(
              JSON.stringify({
                type: "event",
                event: "newTurn",
              })
            )
          );
          sendToast(roomId, `It is ${room.turn}'s turn to start`, 1000);
          break;
        case "readyToTransition":
          if (msg.msg == "Player 1") {
            room.p1Tran = true;
          } else {
            room.p2Tran = true;
          }
          //if both players haven't acknowledged
          if (!room.p1Tran || !room.p2Tran) return;

          console.log("starting transition");
          room.p1Tran = room.p2Tran = false;
          sendToast(roomId, "Transitioning", 1000);
          room.turnstate = turnStates.transition;
          setTimeout(() => {
            //run transition logic
            transitionTokens(roomId);
          }, 500);

          break;
        case "transitionComplete":
          /*next update, managing both players responses */

          if (msg.msg == "Player 1") {
            room.p1Tran = true;
          } else {
            room.p2Tran = true;
          }

          //if both players haven't acknowledged
          if (!room.p1Tran || !room.p2Tran) return;
          //reset transition flags
          room.p1Tran = room.p2Tran = false;
          /*
              This is the end game process here as it can end on the completion of the last play
          */
          {
            console.log("**************************************");
            console.log("TRANSITION COMPLETE");
            console.log("**************************************");

            //check Victory condition
            room.turnstate = turnStates.checkingVictory;
            console.log("checking victory");
            let vicStatus = checkVictory(roomId);

            if (vicStatus.status) {
              // ************************ */
              // GAME OVER, SET WINNER
              // ************************ */

              //set victory conditions and close out game
              console.log("game won");
              room.gamestate = gameStates.FINISHED;
              room.turnstate = turnStates.idle;
              room.player1state = false;
              room.player2state = false;
              updateState(roomId);
              //send UI event to show victory
              server.broadcastMessage(
                roomId,
                encoder.encode(
                  JSON.stringify({
                    type: "event",
                    event: "showReplay",
                  })
                )
              );
            } else {
              // ************************ */
              // NO WINNER, CHECK FOR DRAW
              // OR NEXT TURN
              // ************************ */
              //is last piece played

              console.log("NO VICTORY");
              console.log("CHECKING LAST PIECE");

              let isLastPiece = lastPiecePlayed(roomId);

              if (isLastPiece) {
                console.log("LAST PIECE PLAYED!");
                //check rotation count
                if (room.drawCycleCount >= 4) {
                  console.log("NO MORE DRAW COUNTS");
                  // ************************ */
                  // GAME OVER, SET DRAW
                  // ************************ */

                  //set victory conditions and close out game
                  console.log("game ended with draw");
                  room.gamestate = gameStates.FINISHED;
                  room.turnstate = turnStates.idle;
                  room.gameVictoryState = gameVictoryStates.draw;
                  room.player1state = false;
                  room.player2state = false;
                  updateState(roomId);
                  //send UI event to show victory
                  console.log("sending clients show replay broadcast");
                  server.broadcastMessage(
                    roomId,
                    encoder.encode(
                      JSON.stringify({
                        type: "event",
                        event: "showReplay",
                      })
                    )
                  );
                } else {
                  console.log("INC DRAW COUNTS");

                  // ************************ */
                  // ROTATE AND TEST AGAIN
                  // ************************ */
                  room.drawCycleCount++;
                  //rotate pieces again
                  room.gamestate = gameStates.DRAWCYCLE;
                  console.log("SENDING TRANSITION TO CLIENTS");
                  sendToast(roomId, "Transitioning", 1000);
                  room.turnstate = turnStates.transition;
                  setTimeout(() => {
                    //run transition logic
                    transitionTokens(roomId);
                  }, 500);
                }
              } else {
                // ************************ */
                // NEXT TURN
                // ************************ */
                console.log("CHANGING TURN");

                room.turnstate = turnStates.nextTurn;
                server.broadcastMessage(
                  roomId,
                  encoder.encode(
                    JSON.stringify({
                      type: "event",
                      event: "nextTurn",
                    })
                  )
                );
              }
            }
          }
          break;
        case "playerTokenSelected":
          {
            let { playerDes, tokenIndex } = JSON.parse(msg.msg);
            if (playerDes == "player1") room.player1holder[tokenIndex].status = -2;
            else room.player2holder[tokenIndex].status = -2;
            room.turnstate = turnStates.playerSelected;
            showAvailableSpotsOnBoard(roomId);
          }
          break;
        case "opponentTokenSelected":
          {
            let { playerDes, tokenIndex, boardIndex } = JSON.parse(msg.msg);

            if (playerDes == "player1") room.player1holder[tokenIndex].status = -2;
            else room.player2holder[tokenIndex].status = -2;
            room.turnstate = turnStates.opponentSelected;
            //which spot is tokenIndex in?

            room.spots[boardIndex].status = false;
            room.spots[boardIndex].player = "";
            room.spots[boardIndex].index = null;

            showAvailableOpponentSpotsOnBoard(roomId, boardIndex);
          }
          break;
        case "assignPlayerTokenToBoard":
          {
            console.log("received token assignament");

            let { playerDes, tokenIndex, spotSelected } = JSON.parse(msg.msg);
            //set token status in holder
            console.log("request from:", playerDes, tokenIndex, spotSelected);

            if (playerDes == "player1") room.player1holder[tokenIndex].status = tokenIndex;
            else room.player2holder[tokenIndex].status = tokenIndex;

            //set boardspot state
            room.spots[spotSelected].status = true;
            room.spots[spotSelected].player = playerDes;
            room.spots[spotSelected].index = tokenIndex;

            updateState(roomId);
            server.broadcastMessage(
              roomId,
              encoder.encode(
                JSON.stringify({
                  type: "event",
                  event: "snapToken",
                })
              )
            );

            resetHighlights(roomId);
          }
          break;
        case "assignOpponentTokenToBoard":
          {
            let { playerDes, tokenIndex, spotSelected } = JSON.parse(msg.msg);

            //set token status in holder
            if (playerDes == "player1") room.player1holder[tokenIndex].status = tokenIndex;
            else room.player2holder[tokenIndex].status = tokenIndex;

            //set boardspot state
            room.spots[spotSelected].status = true;
            room.spots[spotSelected].player = playerDes;
            room.spots[spotSelected].index = tokenIndex;

            room.turnstate = turnStates.selectTokenPlayerOnly;
            updateState(roomId);
            server.broadcastMessage(
              roomId,
              encoder.encode(
                JSON.stringify({
                  type: "event",
                  event: "snapToken",
                })
              )
            );

            resetHighlights(roomId);
            showHighlightsForPlayerOnly(roomId);
          }
          break;
        case "readyAck1":
          room.player1state = true;
          //check for both players
          if (room.player1state && room.player2state) {
            room.gamestate = gameStates.ACTIVE;
            setTimeout(() => {
              server.broadcastMessage(
                roomId,
                encoder.encode(
                  JSON.stringify({
                    type: "event",
                    event: "hideConfirm",
                  })
                )
              );
              sendToast(roomId, `It is ${room.turn}'s turn to start`, 1000);
              showAvailableMoves(roomId);
              setTimeout(() => {
                room.turnstate = turnStates.selectToken;
                updateState(roomId);
              }, 2000);
            }, 2000);
          }

          //pick starting person
          if (chance.bool()) {
            room.turn = "player1";
          } else room.turn = "player2";
          updateState(roomId);
          break;
        case "readyAck2":
          room.player2state = true;
          if (room.player1state && room.player2state) {
            room.gamestate = gameStates.ACTIVE;
            setTimeout(() => {
              server.broadcastMessage(
                roomId,
                encoder.encode(
                  JSON.stringify({
                    type: "event",
                    event: "hideConfirm",
                  })
                )
              );
              sendToast(roomId, `It is ${room.turn}'s turn to start`, 1000);
              showAvailableMoves(roomId);
              setTimeout(() => {
                room.turnstate = turnStates.selectToken;
                updateState(roomId);
              }, 2000);
            }, 2000);
          }
          //pick starting person
          if (chance.bool()) {
            room.turn = "player1";
          } else room.turn = "player2";
          updateState(roomId);
          break;
      }

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

const updateState = (roomId: string) => {
  const room = roomMap.get(roomId);
  if (!room) return;
  console.log("state update");

  server.broadcastMessage(
    roomId,
    encoder.encode(
      JSON.stringify({
        type: "stateupdate",
        roomID: roomId,
        players: room.players,
        state: room.gamestate,
        turnstate: room.turnstate,
        spots: room.spots,
        p1holder: room.player1holder,
        p2holder: room.player2holder,
        p1State: room.player1state,
        p2State: room.player2state,
        turn: room.turn,
        victoryState: room.gameVictoryState,
      })
    )
  );
};

const sendToast = (roomId: string, message: string, duration: number) => {
  server.broadcastMessage(
    roomId,
    encoder.encode(
      JSON.stringify({
        type: "showToast",
        message,
        duration,
      })
    )
  );
};

const showAvailableSpotsOnBoard = (roomId: string) => {
  const room = roomMap.get(roomId);

  //first, turn off all highlights
  room?.player1holder.forEach(tok => (tok.highlight = "transparent"));
  room?.player2holder.forEach(tok => (tok.highlight = "transparent"));

  // turn on highlights of spots on board with no tokens
  room?.spots.forEach(spot => {
    if (spot.status) spot.highlight = "transparent";
    else spot.highlight = "whitesmoke";
  });

  updateState(roomId);
};

const showAvailableMoves = (roomId: string) => {
  const room = roomMap.get(roomId);
  if (!room) return;
  //highlight first ball
  resetHighlights(roomId);
  if (room.turn == "player1") {
    //find first index starting at zero that has status true
    for (let index = 0; index < room.player1holder.length; index++) {
      if (room.player1holder[index].status == -1) {
        room.player1holder[index].highlight = "whitesmoke";
        break;
      }
    }
  } else if (room.turn == "player2") {
    for (let index = 0; index < room.player2holder.length; index++) {
      if (room.player2holder[index].status == -1) {
        room.player2holder[index].highlight = "whitesmoke";

        break;
      }
    }
  }

  //highlight enemy units on board
  if (room.turn == "player1") {
    for (let index = 0; index < room.player2holder.length; index++) {
      if (room.player2holder[index].status != -1) {
        room.spots[room.player2holder[index].status].highlight = "whitesmoke";
      }
    }
  } else if (room.turn == "player2") {
    for (let index = 0; index < room.player1holder.length; index++) {
      if (room.player1holder[index].status != -1) {
        room.spots[room.player1holder[index].status].highlight = "whitesmoke";
      }
    }
  }
  updateState(roomId);
};

const showAvailableOpponentSpotsOnBoard = (roomId: string, boardIndex: number) => {
  const room = roomMap.get(roomId);
  //console.log(boardIndex);

  //using index, find available spots on board that are unoccumpied by a token
  const neighbors = getNeighborIndices(boardIndex);
  //console.log("neighbors ", neighbors);

  neighbors.forEach(nbr => {
    if (room?.spots[nbr].player == "") {
      room.spots[nbr].highlight = "whitesmoke";
    }
  });

  //test if there were no available spots
  if (neighbors.length == 0) {
    sendToast(roomId, `Please select another token, this has no available moves`, 1000);
  }

  updateState(roomId);
};

function getNeighborIndices(index: number): number[] {
  const numRows = 4;
  const numCols = 4;

  // Calculate row and column of the given index
  const row = Math.floor(index / numCols);
  const col = index % numCols;

  // Define the relative positions of neighbors (up, down, left, right)
  const neighborsRelativePositions = [
    { row: -1, col: 0 }, // Up
    { row: 1, col: 0 }, // Down
    { row: 0, col: -1 }, // Left
    { row: 0, col: 1 }, // Right
  ];

  const neighborIndices: number[] = [];

  // Check each relative position
  for (const relativePos of neighborsRelativePositions) {
    const newRow = row + relativePos.row;
    const newCol = col + relativePos.col;

    // Check if the new position is within bounds
    if (newRow >= 0 && newRow < numRows && newCol >= 0 && newCol < numCols) {
      // Convert row and column back to the flat array index
      const neighborIndex = newRow * numCols + newCol;
      neighborIndices.push(neighborIndex);
    }
  }

  return neighborIndices;
}

const resetHighlights = (roomId: string) => {
  const room = roomMap.get(roomId);
  room?.player1holder.forEach(tok => (tok.highlight = "transparent"));
  room?.player2holder.forEach(tok => (tok.highlight = "transparent"));
  room?.spots.forEach(spot => (spot.highlight = "transparent"));
  updateState(roomId);
};

const showHighlightsForPlayerOnly = (roomId: string) => {
  const room = roomMap.get(roomId);
  //highlight first ball
  if (room?.turn == "player1") {
    //find first index starting at zero that has status true
    for (let index = 0; index < room.player1holder.length; index++) {
      if (room.player1holder[index].status == -1) {
        room.player1holder[index].highlight = "whitesmoke";

        break;
      }
    }
  } else if (room?.turn == "player2") {
    for (let index = 0; index < room.player2holder.length; index++) {
      if (room.player2holder[index].status == -1) {
        room.player2holder[index].highlight = "whitesmoke";

        break;
      }
    }
  }
  updateState(roomId);
};

const transitionTokens = (roomId: string) => {
  const room = roomMap.get(roomId);
  if (!room) return;

  //copy room.spots
  let origSpots = room.spots.map(obj => ({ ...obj }));

  //reset room.spots
  room.spots = resetSpots();

  //create copy of spots for reference
  //loop through all the spots on board, and move tokens from current index to 'next' index
  origSpots.forEach(spot => {
    // spot has token
    if (spot.status) {
      room.spots[spot.nextIndex].status = spot.status;
      room.spots[spot.nextIndex].index = spot.index;
      room.spots[spot.nextIndex].highlight = spot.highlight;
      room.spots[spot.nextIndex].player = spot.player;
    }
  });

  //loop through spots and assign token positions
  room.spots.forEach((spot, spotIndex) => {
    if (spot.status) {
      if (spot.player == "player1") room.player1holder[spot.index].status = spotIndex;
      else room.player2holder[spot.index].status = spotIndex;
    }
  });

  updateState(roomId);
  server.broadcastMessage(
    roomId,
    encoder.encode(
      JSON.stringify({
        type: "event",
        event: "updateBoardPositions",
      })
    )
  );
};

const resetSpots = (): any[] => {
  let spots = [];
  for (let index = 0; index < 16; index++) {
    spots.push({ status: false, player: "", highlight: "transparent", index: null, nextIndex: 0 });
  }
  //setup next index for transitions
  spots[0].nextIndex = 4;
  spots[1].nextIndex = 0;
  spots[2].nextIndex = 1;
  spots[3].nextIndex = 2;
  spots[4].nextIndex = 8;
  spots[5].nextIndex = 9;
  spots[6].nextIndex = 5;
  spots[7].nextIndex = 3;
  spots[8].nextIndex = 12;
  spots[9].nextIndex = 10;
  spots[10].nextIndex = 6;
  spots[11].nextIndex = 7;
  spots[12].nextIndex = 13;
  spots[13].nextIndex = 14;
  spots[14].nextIndex = 15;
  spots[15].nextIndex = 11;

  return spots;
};

const checkVictory = (roomId: string): { status: boolean; player: string } => {
  const room = roomMap.get(roomId);
  if (!room) return { status: false, player: "" };
  const victoryConditions = [];
  //across
  victoryConditions.push([0, 1, 2, 3]);
  victoryConditions.push([4, 5, 6, 7]);
  victoryConditions.push([8, 9, 10, 11]);
  victoryConditions.push([12, 13, 14, 15]);
  //vertical
  victoryConditions.push([0, 4, 8, 12]);
  victoryConditions.push([1, 5, 9, 13]);
  victoryConditions.push([2, 6, 10, 14]);
  victoryConditions.push([3, 7, 11, 15]);
  //Diagnal
  victoryConditions.push([0, 5, 10, 15]);
  victoryConditions.push([12, 9, 6, 3]);

  for (const condition of victoryConditions) {
    const spotUndertest1 = room.spots[condition[0]];
    const spotUndertest2 = room.spots[condition[1]];
    const spotUndertest3 = room.spots[condition[2]];
    const spotUndertest4 = room.spots[condition[3]];
    if (
      spotUndertest1.player == "player1" &&
      spotUndertest2.player == "player1" &&
      spotUndertest3.player == "player1" &&
      spotUndertest4.player == "player1"
    ) {
      console.log("player1 vic condition: ", condition);

      room.gameVictoryState = gameVictoryStates.player1won;
      return { status: true, player: "player1" };
    } else if (
      spotUndertest1.player == "player2" &&
      spotUndertest2.player == "player2" &&
      spotUndertest3.player == "player2" &&
      spotUndertest4.player == "player2"
    ) {
      console.log("player2 vic condition: ", condition);
      room.gameVictoryState = gameVictoryStates.player2won;
      return { status: true, player: "player2" };
    }
  }
  return { status: false, player: "" };
};

const checkDraw = (roomId: string) => {
  const room = roomMap.get(roomId);
  if (!room) return;

  //a draw condition starts with using ALL the pieces
  //namely all the holder status are >=0
  const p1test = room.player1holder.some(tok => tok.status < 0);
  const p2test = room.player2holder.some(tok => tok.status < 0);
  if (p1test || p2test) return;

  //change gamestate and manage turn states to perform the 5 iterations of
  //cycling tokens and testing victory condition
  room.gamestate = gameStates.DRAWCYCLE;
  room.turnstate = turnStates.idle;

  sendToast(roomId, "CHECKING FOR DRAW", 1000);
  updateState(roomId);
};

const lastPiecePlayed = (roomId: string): boolean => {
  const room = roomMap.get(roomId);
  if (!room) return false;

  //a draw condition starts with using ALL the pieces
  //namely all the holder status are >=0
  const p1test = room.player1holder.some(tok => tok.status < 0);
  const p2test = room.player2holder.some(tok => tok.status < 0);
  if (p1test || p2test) return false;

  //change gamestate and manage turn states to perform the 5 iterations of
  //cycling tokens and testing victory condition
  room.gamestate = gameStates.DRAWCYCLE;
  room.turnstate = turnStates.idle;
  return true;
};

const updateRoomConfig = async (roomId: string, data: number) => {
  const roomConfig = { status: data };
  return await hathoraSdk.roomV2.updateRoomConfig({ roomConfig: JSON.stringify(roomConfig) }, roomId);
};
