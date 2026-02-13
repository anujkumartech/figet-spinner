import { SpinnerState } from './spinner';
import { SpinnerDesign } from './designs';
import { ColorTheme } from './colors';
import { updateConfetti, drawConfetti } from './confetti';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface RendererState {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  particles: Particle[];
  glowIntensity: number;
  shakeX: number;
  shakeY: number;
  prevRotations: number[]; // for motion blur trail
}

export function createRenderer(canvas: HTMLCanvasElement): RendererState {
  const ctx = canvas.getContext('2d')!;
  return {
    canvas,
    ctx,
    particles: [],
    glowIntensity: 0,
    shakeX: 0,
    shakeY: 0,
    prevRotations: [],
  };
}

export function resizeCanvas(r: RendererState): void {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  r.canvas.width = w * dpr;
  r.canvas.height = h * dpr;
  r.canvas.style.width = w + 'px';
  r.canvas.style.height = h + 'px';
  r.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function getSpinnerSize(): number {
  return Math.min(window.innerWidth, window.innerHeight) * 0.7;
}

export function getCenter(): { cx: number; cy: number } {
  return {
    cx: window.innerWidth / 2,
    cy: window.innerHeight * 0.42,
  };
}

function spawnParticles(r: RendererState, state: SpinnerState, design: SpinnerDesign, theme: ColorTheme) {
  const speed = Math.abs(state.angularVelocity);
  if (speed < 8) return;

  const { cx, cy } = getCenter();
  const size = getSpinnerSize();
  const armCount = design.name === 'Shuriken' ? 4 : design.name === 'Flower' ? 6 : design.name === 'Gear' ? 12 : 3;
  const armLen = size * 0.35;

  const count = Math.min(Math.floor(speed / 8), 5);

  for (let i = 0; i < count; i++) {
    const armIdx = Math.floor(Math.random() * armCount);
    const angle = state.rotation + (armIdx * Math.PI * 2) / armCount - Math.PI / 2;
    const dist = armLen * (0.5 + Math.random() * 0.5);

    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;

    const tangentAngle = angle + (state.angularVelocity > 0 ? Math.PI / 2 : -Math.PI / 2);
    const v = speed * dist * 0.003;

    r.particles.push({
      x: px,
      y: py,
      vx: Math.cos(tangentAngle) * v + (Math.random() - 0.5) * 2,
      vy: Math.sin(tangentAngle) * v + (Math.random() - 0.5) * 2,
      life: 1,
      maxLife: 0.3 + Math.random() * 0.4,
      size: 2 + Math.random() * 4,
      color: theme.glow,
    });
  }
}

function updateParticles(r: RendererState, dt: number) {
  for (let i = r.particles.length - 1; i >= 0; i--) {
    const p = r.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.97;
    p.vy *= 0.97;
    p.life -= dt / p.maxLife;
    if (p.life <= 0) {
      r.particles.splice(i, 1);
    }
  }
}

function drawParticles(r: RendererState) {
  const ctx = r.ctx;
  for (const p of r.particles) {
    ctx.save();
    ctx.globalAlpha = p.life * 0.7;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
  }
}

function drawSpeedLines(ctx: CanvasRenderingContext2D, cx: number, cy: number, speed: number, theme: ColorTheme) {
  if (speed < 20) return;
  const intensity = Math.min((speed - 20) / 50, 1);
  const lineCount = Math.floor(12 + intensity * 24);
  const innerR = getSpinnerSize() * 0.5;
  const outerR = innerR + 40 + intensity * 120;

  ctx.save();
  for (let i = 0; i < lineCount; i++) {
    const angle = (i / lineCount) * Math.PI * 2 + performance.now() * 0.001;
    const alpha = (0.05 + Math.random() * 0.1) * intensity;
    const lineWidth = 1 + Math.random() * 2;

    ctx.beginPath();
    const startR = innerR + Math.random() * 20;
    const endR = startR + 30 + Math.random() * (outerR - startR);
    ctx.moveTo(cx + Math.cos(angle) * startR, cy + Math.sin(angle) * startR);
    ctx.lineTo(cx + Math.cos(angle) * endR, cy + Math.sin(angle) * endR);
    ctx.strokeStyle = theme.glow.replace(/[\d.]+\)$/, alpha + ')');
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

function drawMotionBlur(
  ctx: CanvasRenderingContext2D,
  design: SpinnerDesign,
  theme: ColorTheme,
  size: number,
  currentRotation: number,
  speed: number
) {
  if (speed < 15) return;
  const trailCount = Math.min(Math.floor(speed / 12), 6);
  const step = (speed * 0.004);

  ctx.save();
  for (let i = 1; i <= trailCount; i++) {
    const alpha = 0.08 * (1 - i / (trailCount + 1));
    ctx.globalAlpha = alpha;
    const trailRotation = currentRotation - step * i * (speed > 0 ? 1 : -1);
    design.draw(ctx, size, trailRotation, theme);
  }
  ctx.restore();
}

function updateShake(r: RendererState, speed: number, dt: number) {
  if (speed > 60) {
    const intensity = Math.min((speed - 60) / 30, 1) * 3;
    r.shakeX = (Math.random() - 0.5) * intensity;
    r.shakeY = (Math.random() - 0.5) * intensity;
  } else {
    r.shakeX += (0 - r.shakeX) * dt * 10;
    r.shakeY += (0 - r.shakeY) * dt * 10;
  }
}

export function render(
  r: RendererState,
  state: SpinnerState,
  design: SpinnerDesign,
  theme: ColorTheme,
  dt: number
): void {
  const ctx = r.ctx;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const speed = Math.abs(state.angularVelocity);

  updateShake(r, speed, dt);

  // Clear
  ctx.clearRect(0, 0, w, h);

  ctx.save();
  ctx.translate(r.shakeX, r.shakeY);

  // Background
  const bgGrad = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, h * 0.8);
  bgGrad.addColorStop(0, '#1e1e3a');
  bgGrad.addColorStop(1, '#0a0a15');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(-5, -5, w + 10, h + 10);

  const { cx, cy } = getCenter();
  const size = getSpinnerSize();

  // Background glow that intensifies with speed
  const targetGlow = Math.min(speed / 40, 1);
  r.glowIntensity += (targetGlow - r.glowIntensity) * 0.08;

  if (r.glowIntensity > 0.01) {
    // Primary glow
    const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.8);
    glowGrad.addColorStop(0, theme.glow.replace(/[\d.]+\)$/, (r.glowIntensity * 0.6) + ')'));
    glowGrad.addColorStop(0.5, theme.glow.replace(/[\d.]+\)$/, (r.glowIntensity * 0.2) + ')'));
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, w, h);

    // Pulsing outer ring at high speed
    if (speed > 40) {
      const pulse = 0.5 + Math.sin(performance.now() * 0.005) * 0.5;
      const ringAlpha = r.glowIntensity * 0.15 * pulse;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.48, 0, Math.PI * 2);
      ctx.strokeStyle = theme.glow.replace(/[\d.]+\)$/, ringAlpha + ')');
      ctx.lineWidth = 2 + r.glowIntensity * 4;
      ctx.stroke();
    }
  }

  // Speed lines
  drawSpeedLines(ctx, cx, cy, speed, theme);

  // Spawn and update particles
  spawnParticles(r, state, design, theme);
  updateParticles(r, dt);
  drawParticles(r);

  // Draw spinner
  ctx.save();
  ctx.translate(cx, cy);

  // Drop shadow
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = size * 0.05;
  ctx.shadowOffsetY = size * 0.02;

  // Motion blur trail
  drawMotionBlur(ctx, design, theme, size, state.rotation, speed);

  // Main spinner
  ctx.globalAlpha = 1;
  design.draw(ctx, size, state.rotation, theme);

  ctx.restore(); // spinner translate

  // Confetti overlay
  updateConfetti(dt);
  drawConfetti(ctx);

  ctx.restore(); // shake translate
}
