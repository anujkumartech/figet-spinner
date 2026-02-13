interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  width: number;
  height: number;
  color: string;
  life: number;
  gravity: number;
}

const COLORS = [
  '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
  '#ff9ff3', '#feca57', '#54a0ff', '#5f27cd',
  '#01a3a4', '#ee5a24', '#c7ecee', '#f8c291',
];

let pieces: ConfettiPiece[] = [];
let toastMessage = '';
let toastLife = 0;

export function fireConfetti(intensity: number = 1): void {
  const count = Math.floor(60 * intensity);
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight * 0.35;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 8 * intensity;
    pieces.push({
      x: cx + (Math.random() - 0.5) * 100,
      y: cy + (Math.random() - 0.5) * 50,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      width: 6 + Math.random() * 6,
      height: 4 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 1,
      gravity: 0.12 + Math.random() * 0.06,
    });
  }
}

export function showToast(message: string): void {
  toastMessage = message;
  toastLife = 1;
}

export function updateConfetti(dt: number): void {
  for (let i = pieces.length - 1; i >= 0; i--) {
    const p = pieces[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.99;
    p.rotation += p.rotationSpeed;
    p.life -= dt * 0.4;
    if (p.life <= 0 || p.y > window.innerHeight + 20) {
      pieces.splice(i, 1);
    }
  }
  if (toastLife > 0) {
    toastLife -= dt * 0.35;
    if (toastLife < 0) toastLife = 0;
  }
}

export function drawConfetti(ctx: CanvasRenderingContext2D): void {
  for (const p of pieces) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = Math.min(p.life, 1);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
    ctx.restore();
  }

  // Toast
  if (toastLife > 0) {
    const alpha = toastLife > 0.7 ? 1 : toastLife / 0.7;
    const scale = toastLife > 0.85 ? 0.8 + (1 - toastLife) / 0.15 * 0.2 : 1;
    const cy = window.innerHeight * 0.22;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(window.innerWidth / 2, cy);
    ctx.scale(scale, scale);

    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Background pill
    const metrics = ctx.measureText(toastMessage);
    const pw = metrics.width + 40;
    const ph = 44;
    ctx.beginPath();
    ctx.roundRect(-pw / 2, -ph / 2, pw, ph, ph / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Text
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = 10;
    ctx.fillText(toastMessage, 0, 1);

    ctx.restore();
  }
}

export function hasConfetti(): boolean {
  return pieces.length > 0 || toastLife > 0;
}
