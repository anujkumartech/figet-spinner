export interface SpinnerState {
  rotation: number;
  angularVelocity: number;
  friction: number;
}

const MAX_VELOCITY = 80; // rad/s
const MIN_VELOCITY = 0.05; // threshold to stop

export function createSpinnerState(friction = 0.97): SpinnerState {
  return {
    rotation: 0,
    angularVelocity: 0,
    friction,
  };
}

export function updateSpinner(state: SpinnerState, dt: number): void {
  state.rotation += state.angularVelocity * dt;
  state.rotation %= Math.PI * 2;

  // Apply friction as exponential decay
  state.angularVelocity *= Math.pow(state.friction, dt * 60);

  // Stop if below threshold
  if (Math.abs(state.angularVelocity) < MIN_VELOCITY) {
    state.angularVelocity = 0;
  }
}

export function applyFlick(state: SpinnerState, velocity: number): void {
  state.angularVelocity += velocity;
  // Clamp
  if (state.angularVelocity > MAX_VELOCITY) state.angularVelocity = MAX_VELOCITY;
  if (state.angularVelocity < -MAX_VELOCITY) state.angularVelocity = -MAX_VELOCITY;
}

export function getRPM(state: SpinnerState): number {
  return Math.abs(state.angularVelocity) * 60 / (2 * Math.PI);
}
