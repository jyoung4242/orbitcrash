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
