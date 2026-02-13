import { SpinnerState } from './spinner';
import { SpinnerDesign } from './designs';
import { ColorTheme } from './colors';

export interface Particle {
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
}

export function createRenderer(canvas: HTMLCanvasElement): RendererState {
  const ctx = canvas.getContext('2d')!;
  return {
    canvas,
    ctx,
    particles: [],
    glowIntensity: 0,
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

export function getSpinnerSize(_r: RendererState): number {
  return Math.min(window.innerWidth, window.innerHeight) * 0.7;
}

export function getCenter(_r: RendererState): { cx: number; cy: number } {
  return {
    cx: window.innerWidth / 2,
    cy: window.innerHeight * 0.42,
  };
}

function spawnParticles(r: RendererState, state: SpinnerState, design: SpinnerDesign, theme: ColorTheme) {
  const speed = Math.abs(state.angularVelocity);
  if (speed < 8) return;

  const { cx, cy } = getCenter(r);
  const size = getSpinnerSize(r);
  const armCount = design.name === 'Shuriken' ? 4 : design.name === 'Flower' ? 6 : 3;
  const armLen = size * 0.35;

  // Spawn rate scales with speed
  const count = Math.min(Math.floor(speed / 10), 3);

  for (let i = 0; i < count; i++) {
    const armIdx = Math.floor(Math.random() * armCount);
    const angle = state.rotation + (armIdx * Math.PI * 2) / armCount - Math.PI / 2;
    const dist = armLen * (0.6 + Math.random() * 0.4);

    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;

    // Tangential velocity (perpendicular to radius)
    const tangentAngle = angle + (state.angularVelocity > 0 ? Math.PI / 2 : -Math.PI / 2);
    const v = speed * dist * 0.003;

    r.particles.push({
      x: px,
      y: py,
      vx: Math.cos(tangentAngle) * v + (Math.random() - 0.5) * 2,
      vy: Math.sin(tangentAngle) * v + (Math.random() - 0.5) * 2,
      life: 1,
      maxLife: 0.4 + Math.random() * 0.3,
      size: 2 + Math.random() * 3,
      color: theme.glow,
    });
  }
}

function updateParticles(r: RendererState, dt: number) {
  for (let i = r.particles.length - 1; i >= 0; i--) {
    const p = r.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.98;
    p.vy *= 0.98;
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
    ctx.globalAlpha = p.life * 0.6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
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

  // Clear
  ctx.clearRect(0, 0, w, h);

  // Background
  const bgGrad = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, h * 0.8);
  bgGrad.addColorStop(0, '#1e1e3a');
  bgGrad.addColorStop(1, '#0a0a15');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  const { cx, cy } = getCenter(r);
  const size = getSpinnerSize(r);
  const speed = Math.abs(state.angularVelocity);

  // Background glow that intensifies with speed
  const targetGlow = Math.min(speed / 40, 1);
  r.glowIntensity += (targetGlow - r.glowIntensity) * 0.05;

  if (r.glowIntensity > 0.01) {
    const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.8);
    glowGrad.addColorStop(0, theme.glow.replace(/[\d.]+\)$/, (r.glowIntensity * 0.5) + ')'));
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, w, h);
  }

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

  design.draw(ctx, size, state.rotation, theme);

  ctx.restore();
}
