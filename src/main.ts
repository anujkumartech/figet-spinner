import './style.css';
import { createSpinnerState, updateSpinner, applyFlick, getRPM, SpinnerState } from './spinner';
import { createRenderer, resizeCanvas, render, getCenter, RendererState } from './renderer';
import { designs } from './designs';
import { colorThemes } from './colors';
import { initAudio, updateAudio } from './audio';
import { pulseOnSpin, updateHaptics } from './haptics';
import { setupUI, updateRPM, setActiveDesign, setActiveTheme } from './ui';

// State
let currentDesignIndex = 0;
let currentThemeIndex = 0;
let spinnerState: SpinnerState = createSpinnerState(designs[0].friction);
let renderer: RendererState;
let lastTime = 0;
let audioInitialized = false;

// Interaction state
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartTime = 0;
// Track last few positions for reliable velocity calculation
let dragHistory: { x: number; y: number; t: number }[] = [];

function init() {
  const canvas = document.getElementById('spinner-canvas') as HTMLCanvasElement;
  renderer = createRenderer(canvas);
  resizeCanvas(renderer);

  window.addEventListener('resize', () => resizeCanvas(renderer));

  setupUI(designs, currentDesignIndex, selectDesign, colorThemes, currentThemeIndex, selectTheme);
  setupInteraction(canvas);

  requestAnimationFrame(loop);
}

function selectDesign(index: number) {
  currentDesignIndex = index;
  spinnerState.friction = designs[index].friction;
  setActiveDesign(index);
}

function selectTheme(index: number) {
  currentThemeIndex = index;
  setActiveTheme(colorThemes[index]);
  // Re-setup UI so the click handler has the updated index for cycling
  setupUI(designs, currentDesignIndex, selectDesign, colorThemes, currentThemeIndex, selectTheme);
}

function ensureAudio() {
  if (!audioInitialized) {
    initAudio();
    audioInitialized = true;
  }
}

// Calculate tangential velocity from a swipe gesture
function calcFlickVelocity(
  startX: number, startY: number,
  endX: number, endY: number,
  duration: number
): number {
  const { cx, cy } = getCenter(renderer);

  // Vector from center to start
  const r1x = startX - cx;
  const r1y = startY - cy;
  // Cross product gives rotation direction and magnitude
  const cross = r1x * (endY - startY) - r1y * (endX - startX);

  // Swipe distance
  const dx = endX - startX;
  const dy = endY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Distance from center (affects leverage)
  const centerDist = Math.sqrt(r1x * r1x + r1y * r1y);
  const leverage = Math.min(centerDist / 100, 2);

  // Speed in pixels/ms
  const speed = dist / Math.max(duration, 10);

  // Convert to angular velocity (rad/s)
  const sign = cross > 0 ? 1 : -1;
  return sign * speed * leverage * 15;
}

function onDragStart(x: number, y: number) {
  isDragging = true;
  dragStartX = x;
  dragStartY = y;
  dragStartTime = performance.now();
  dragHistory = [{ x, y, t: dragStartTime }];
  ensureAudio();
}

function onDragMove(x: number, y: number) {
  if (!isDragging) return;
  const now = performance.now();
  dragHistory.push({ x, y, t: now });
  // Keep only last 10 points
  if (dragHistory.length > 10) dragHistory.shift();
}

function onDragEnd(x: number, y: number) {
  if (!isDragging) return;
  isDragging = false;

  const now = performance.now();
  dragHistory.push({ x, y, t: now });

  // Find a point from ~50-150ms ago to calculate velocity from
  // This avoids the "mouse stopped before release" problem
  let startPoint = dragHistory[0];
  for (let i = dragHistory.length - 2; i >= 0; i--) {
    if (now - dragHistory[i].t > 30) {
      startPoint = dragHistory[i];
      break;
    }
  }

  const duration = now - startPoint.t;

  // Also try using the full drag if it was a very quick flick
  const fullDuration = now - dragStartTime;

  let velocity: number;
  if (fullDuration < 200) {
    // Quick flick — use full drag distance
    velocity = calcFlickVelocity(dragStartX, dragStartY, x, y, fullDuration);
  } else {
    // Longer drag — use recent segment for velocity
    velocity = calcFlickVelocity(startPoint.x, startPoint.y, x, y, duration);
  }

  if (Math.abs(velocity) > 0.3) {
    applyFlick(spinnerState, velocity);
    pulseOnSpin();
  }
}

function setupInteraction(canvas: HTMLCanvasElement) {
  // Touch events
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    onDragStart(t.clientX, t.clientY);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    onDragMove(t.clientX, t.clientY);
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    onDragEnd(t.clientX, t.clientY);
  }, { passive: false });

  // Mouse events — mousedown on canvas, but move/up on window
  // so we don't lose the drag if cursor leaves the canvas
  canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    onDragStart(e.clientX, e.clientY);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    onDragMove(e.clientX, e.clientY);
  });

  window.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    onDragEnd(e.clientX, e.clientY);
  });

  // Quick tap/click on center = flick
  canvas.addEventListener('click', (e) => {
    const { cx, cy } = getCenter(renderer);
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If click is near center bearing
    if (dist < 40) {
      ensureAudio();
      applyFlick(spinnerState, 15 + Math.random() * 10);
      pulseOnSpin();
    }
  });

  // Arrow keys to flick: Right/Up = clockwise, Left/Down = counter-clockwise
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      ensureAudio();
      applyFlick(spinnerState, 15 + Math.random() * 10);
      pulseOnSpin();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      ensureAudio();
      applyFlick(spinnerState, -(15 + Math.random() * 10));
      pulseOnSpin();
    }
  });
}

function loop(time: number) {
  if (!lastTime) lastTime = time;
  const dt = Math.min((time - lastTime) / 1000, 0.05); // cap delta
  lastTime = time;

  updateSpinner(spinnerState, dt);

  const design = designs[currentDesignIndex];
  const theme = colorThemes[currentThemeIndex];
  render(renderer, spinnerState, design, theme, dt);

  // Update UI
  const rpm = getRPM(spinnerState);
  updateRPM(rpm);

  // Update audio
  updateAudio(spinnerState.angularVelocity);

  // Update haptics
  updateHaptics(spinnerState.angularVelocity, time);

  requestAnimationFrame(loop);
}

// Boot
init();
