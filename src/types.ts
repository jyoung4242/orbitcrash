export enum gameStates {
  IDLE = "idle",
  WAITING = "waiting",
  ACTIVE = "active",
  FINISHED = "finished",
}

// Setting up Viewport with a HUD layer and the Game layer
export const VIEWPORT_WIDTH = 400;
export const ASPECT_RATIO = 16 / 9;
export const VIEWPORT_HEIGHT = VIEWPORT_WIDTH / ASPECT_RATIO;

export enum turnStates {
  idle = "idle",
  start = "start",
  selectToken = "select",
  selectTokenPlayerOnly = "selectPlayer",
  playerSelected = "player",
  opponentSelected = "opponent",
  transition = "transition",
  checkingVictory = "victorycheck",
  nextTurn = "next",
}

export enum gameVictoryStates {
  unknown = "u",
  player1won = "Player 1",
  player2won = "Player 2",
  draw = "Draw",
}
