import './style.css';
import { createSpinnerState, updateSpinner, applyFlick, getRPM, SpinnerState } from './spinner';
import { createRenderer, resizeCanvas, render, getCenter, RendererState } from './renderer';
import { designs } from './designs';
import { colorThemes } from './colors';
import { initAudio, updateAudio } from './audio';
import { pulseOnSpin, updateHaptics } from './haptics';
import {
  setupUI, updateRPM, updateBestRPM, setActiveDesign, setActiveTheme,
  updateStatsPanel, setupStatsButton, setupFullscreenButton, hideHint,
} from './ui';
import { loadStats, saveStats, loadPrefs, savePrefs, Stats, MILESTONES } from './stats';
import { fireConfetti, showToast } from './confetti';

// State
let currentDesignIndex = 0;
let currentThemeIndex = 0;
let spinnerState: SpinnerState;
let renderer: RendererState;
let lastTime = 0;
let audioInitialized = false;
let stats: Stats;
let hintHidden = false;

// Spin session tracking
let isSpinning = false;
let currentSpinStart = 0;

// Milestone tracking (per page load to avoid re-firing)
let sessionMilestones = new Set<number>();

// Interaction state
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartTime = 0;
let dragHistory: { x: number; y: number; t: number }[] = [];

// Keyboard hold state
const keysHeld = new Set<string>();

function init() {
  // Load saved preferences
  const prefs = loadPrefs();
  currentDesignIndex = Math.min(prefs.designIndex, designs.length - 1);
  currentThemeIndex = Math.min(prefs.themeIndex, colorThemes.length - 1);
  stats = loadStats();

  spinnerState = createSpinnerState(designs[currentDesignIndex].friction);

  const canvas = document.getElementById('spinner-canvas') as HTMLCanvasElement;
  renderer = createRenderer(canvas);
  resizeCanvas(renderer);

  window.addEventListener('resize', () => resizeCanvas(renderer));

  setupUI(designs, currentDesignIndex, selectDesign, colorThemes, currentThemeIndex, selectTheme);
  setupStatsButton();
  setupFullscreenButton();
  setupInteraction(canvas);

  // Show initial stats
  updateBestRPM(stats.maxRPM, false);
  updateStatsPanel(stats);

  requestAnimationFrame(loop);
}

function selectDesign(index: number) {
  currentDesignIndex = index;
  spinnerState.friction = designs[index].friction;
  setActiveDesign(index);
  savePrefs({ designIndex: currentDesignIndex, themeIndex: currentThemeIndex });
}

function selectTheme(index: number) {
  currentThemeIndex = index;
  setActiveTheme(colorThemes[index]);
  setupUI(designs, currentDesignIndex, selectDesign, colorThemes, currentThemeIndex, selectTheme);
  savePrefs({ designIndex: currentDesignIndex, themeIndex: currentThemeIndex });
}

function ensureAudio() {
  if (!audioInitialized) {
    initAudio();
    audioInitialized = true;
  }
}

function onFlick() {
  if (!hintHidden) {
    hideHint();
    hintHidden = true;
  }
  stats.totalSpins++;
  pulseOnSpin();
}

// Calculate tangential velocity from a swipe gesture
function calcFlickVelocity(
  startX: number, startY: number,
  endX: number, endY: number,
  duration: number
): number {
  const { cx, cy } = getCenter();

  const r1x = startX - cx;
  const r1y = startY - cy;
  const cross = r1x * (endY - startY) - r1y * (endX - startX);

  const dx = endX - startX;
  const dy = endY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const centerDist = Math.sqrt(r1x * r1x + r1y * r1y);
  const leverage = Math.min(centerDist / 100, 2);

  const speed = dist / Math.max(duration, 10);

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
  if (dragHistory.length > 10) dragHistory.shift();
}

function onDragEnd(x: number, y: number) {
  if (!isDragging) return;
  isDragging = false;

  const now = performance.now();
  dragHistory.push({ x, y, t: now });

  let startPoint = dragHistory[0];
  for (let i = dragHistory.length - 2; i >= 0; i--) {
    if (now - dragHistory[i].t > 30) {
      startPoint = dragHistory[i];
      break;
    }
  }

  const duration = now - startPoint.t;
  const fullDuration = now - dragStartTime;

  let velocity: number;
  if (fullDuration < 200) {
    velocity = calcFlickVelocity(dragStartX, dragStartY, x, y, fullDuration);
  } else {
    velocity = calcFlickVelocity(startPoint.x, startPoint.y, x, y, duration);
  }

  if (Math.abs(velocity) > 0.3) {
    applyFlick(spinnerState, velocity);
    onFlick();
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

  // Mouse events
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

  // Click on center = flick
  canvas.addEventListener('click', (e) => {
    const { cx, cy } = getCenter();
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 40) {
      ensureAudio();
      applyFlick(spinnerState, 15 + Math.random() * 10);
      onFlick();
    }
  });

  // Keyboard: arrow keys + space
  window.addEventListener('keydown', (e) => {
    if (e.repeat && keysHeld.has(e.key)) return; // let the hold loop handle repeats
    keysHeld.add(e.key);

    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      ensureAudio();
      applyFlick(spinnerState, 15 + Math.random() * 10);
      onFlick();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      ensureAudio();
      applyFlick(spinnerState, -(15 + Math.random() * 10));
      onFlick();
    } else if (e.key === ' ') {
      e.preventDefault();
      ensureAudio();
      const dir = spinnerState.angularVelocity >= 0 ? 1 : -1;
      applyFlick(spinnerState, dir * (20 + Math.random() * 15));
      onFlick();
    }
  });

  window.addEventListener('keyup', (e) => {
    keysHeld.delete(e.key);
  });
}

// Held key acceleration (called in game loop)
function processHeldKeys() {
  if (keysHeld.has('ArrowRight') || keysHeld.has('ArrowUp')) {
    applyFlick(spinnerState, 1.5);
  }
  if (keysHeld.has('ArrowLeft') || keysHeld.has('ArrowDown')) {
    applyFlick(spinnerState, -1.5);
  }
  if (keysHeld.has(' ')) {
    const dir = spinnerState.angularVelocity >= 0 ? 1 : -1;
    applyFlick(spinnerState, dir * 2);
  }
}

function checkMilestones(rpm: number) {
  for (const milestone of MILESTONES) {
    if (rpm >= milestone && !sessionMilestones.has(milestone)) {
      sessionMilestones.add(milestone);
      if (!stats.milestonesHit.includes(milestone)) {
        stats.milestonesHit.push(milestone);
      }
      const intensity = milestone / 500;
      fireConfetti(Math.min(intensity, 2));
      showToast(`${milestone} RPM!`);
    }
  }
}

let saveCounter = 0;

function loop(time: number) {
  if (!lastTime) lastTime = time;
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  // Process held keys for continuous acceleration
  processHeldKeys();

  updateSpinner(spinnerState, dt);

  const rpm = getRPM(spinnerState);
  const design = designs[currentDesignIndex];
  const theme = colorThemes[currentThemeIndex];

  render(renderer, spinnerState, design, theme, dt);

  // Update UI
  updateRPM(rpm);

  // Track spinning state
  const wasSpinning = isSpinning;
  isSpinning = Math.abs(spinnerState.angularVelocity) > 0.1;

  if (isSpinning && !wasSpinning) {
    currentSpinStart = time;
  }
  if (!isSpinning && wasSpinning) {
    const spinDuration = (time - currentSpinStart) / 1000;
    if (spinDuration > stats.longestSpin) {
      stats.longestSpin = spinDuration;
    }
  }
  if (isSpinning) {
    stats.totalSpinTime += dt;
  }

  // Check records
  let isNewRecord = false;
  if (rpm > stats.maxRPM) {
    stats.maxRPM = rpm;
    isNewRecord = true;
  }
  updateBestRPM(stats.maxRPM, isNewRecord);

  // Check milestones
  checkMilestones(rpm);

  // Update audio (pass current design's sound profile)
  updateAudio(spinnerState.angularVelocity, design.sound);

  // Update haptics
  updateHaptics(spinnerState.angularVelocity, time);

  // Periodic save (every ~2 seconds)
  saveCounter++;
  if (saveCounter % 120 === 0) {
    saveStats(stats);
    updateStatsPanel(stats);
  }

  requestAnimationFrame(loop);
}

// Boot
init();
