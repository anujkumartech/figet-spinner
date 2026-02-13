import { ColorTheme } from './colors';

export interface SoundProfile {
  /** Base filter frequency range [min, max] Hz */
  freqRange: [number, number];
  /** Filter Q factor — higher = more resonant/tonal */
  q: number;
  /** Filter type */
  filterType: BiquadFilterType;
  /** Max volume (0-1) */
  maxVol: number;
  /** Noise type: 'pink' | 'white' | 'brown' */
  noiseType: 'pink' | 'white' | 'brown';
  /** Optional secondary oscillator for tonal character */
  toneFreq?: number;
  /** Tone volume relative to noise (0-1) */
  toneVol?: number;
  /** Tone waveform */
  toneType?: OscillatorType;
}

export interface SpinnerDesign {
  name: string;
  friction: number;
  sound: SoundProfile;
  draw: (ctx: CanvasRenderingContext2D, size: number, rotation: number, theme: ColorTheme) => void;
}

function drawBearing(ctx: CanvasRenderingContext2D, size: number, theme: ColorTheme) {
  const r = size * 0.08;
  const grad = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r);
  grad.addColorStop(0, theme.highlight);
  grad.addColorStop(0.7, theme.body[1]);
  grad.addColorStop(1, theme.stroke);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = theme.stroke;
  ctx.lineWidth = size * 0.005;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = theme.stroke;
  ctx.fill();
}

const classic: SpinnerDesign = {
  name: 'Classic',
  friction: 0.97,
  sound: {
    freqRange: [200, 1800],
    q: 0.5,
    filterType: 'bandpass',
    maxVol: 0.25,
    noiseType: 'pink',
  },
  draw(ctx, size, rotation, theme) {
    ctx.save();
    ctx.rotate(rotation);

    const armLen = size * 0.35;
    const armWidth = size * 0.12;
    const bulbR = size * 0.1;

    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / 3);

      const armGrad = ctx.createLinearGradient(0, -armWidth / 2, 0, armWidth / 2);
      armGrad.addColorStop(0, theme.body[0]);
      armGrad.addColorStop(0.5, theme.body[1]);
      armGrad.addColorStop(1, theme.body[2]);

      ctx.beginPath();
      ctx.roundRect(-armWidth / 2, -armLen, armWidth, armLen, armWidth * 0.3);
      ctx.fillStyle = armGrad;
      ctx.fill();
      ctx.strokeStyle = theme.stroke;
      ctx.lineWidth = size * 0.004;
      ctx.stroke();

      const bulbGrad = ctx.createRadialGradient(0, -armLen, bulbR * 0.2, 0, -armLen, bulbR);
      bulbGrad.addColorStop(0, theme.highlight);
      bulbGrad.addColorStop(0.6, theme.body[1]);
      bulbGrad.addColorStop(1, theme.body[2]);
      ctx.beginPath();
      ctx.arc(0, -armLen, bulbR, 0, Math.PI * 2);
      ctx.fillStyle = bulbGrad;
      ctx.fill();
      ctx.strokeStyle = theme.stroke;
      ctx.lineWidth = size * 0.004;
      ctx.stroke();

      ctx.restore();
    }

    drawBearing(ctx, size, theme);
    ctx.restore();
  },
};

const shuriken: SpinnerDesign = {
  name: 'Shuriken',
  friction: 0.975,
  sound: {
    freqRange: [600, 4000],
    q: 2.0,
    filterType: 'bandpass',
    maxVol: 0.2,
    noiseType: 'white',
    toneFreq: 120,
    toneVol: 0.06,
    toneType: 'sawtooth',
  },
  draw(ctx, size, rotation, theme) {
    ctx.save();
    ctx.rotate(rotation);

    const r = size * 0.4;

    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 2);

      const grad = ctx.createLinearGradient(-size * 0.05, 0, size * 0.05, -r);
      grad.addColorStop(0, theme.body[1]);
      grad.addColorStop(0.5, theme.body[2]);
      grad.addColorStop(1, theme.stroke);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(size * 0.1, -r * 0.3);
      ctx.lineTo(0, -r);
      ctx.lineTo(-size * 0.1, -r * 0.3);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = theme.stroke;
      ctx.lineWidth = size * 0.005;
      ctx.stroke();

      // Edge highlight
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(size * 0.1, -r * 0.3);
      ctx.strokeStyle = theme.highlight + '55';
      ctx.lineWidth = size * 0.008;
      ctx.stroke();

      ctx.restore();
    }

    // Center
    const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.1);
    centerGrad.addColorStop(0, theme.body[1]);
    centerGrad.addColorStop(1, theme.body[2]);
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = centerGrad;
    ctx.fill();
    ctx.strokeStyle = theme.stroke;
    ctx.lineWidth = size * 0.005;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, size * 0.03, 0, Math.PI * 2);
    ctx.fillStyle = theme.highlight;
    ctx.fill();

    ctx.restore();
  },
};

const gear: SpinnerDesign = {
  name: 'Gear',
  friction: 0.965,
  sound: {
    freqRange: [100, 800],
    q: 1.5,
    filterType: 'lowpass',
    maxVol: 0.3,
    noiseType: 'brown',
    toneFreq: 60,
    toneVol: 0.1,
    toneType: 'square',
  },
  draw(ctx, size, rotation, theme) {
    ctx.save();
    ctx.rotate(rotation);

    const outerR = size * 0.4;
    const innerR = size * 0.3;
    const toothH = size * 0.08;
    const teeth = 12;

    const bodyGrad = ctx.createRadialGradient(0, 0, innerR * 0.3, 0, 0, outerR + toothH);
    bodyGrad.addColorStop(0, theme.body[0]);
    bodyGrad.addColorStop(0.5, theme.body[1]);
    bodyGrad.addColorStop(1, theme.body[2]);

    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const angle = (i * Math.PI * 2) / teeth;
      const nextAngle = ((i + 1) * Math.PI * 2) / teeth;
      const toothWidth = (Math.PI * 2) / teeth * 0.35;

      ctx.lineTo(
        Math.cos(angle - toothWidth) * (outerR + toothH),
        Math.sin(angle - toothWidth) * (outerR + toothH)
      );
      ctx.lineTo(
        Math.cos(angle + toothWidth) * (outerR + toothH),
        Math.sin(angle + toothWidth) * (outerR + toothH)
      );
      const midAngle = (angle + nextAngle) / 2;
      ctx.lineTo(
        Math.cos(midAngle - toothWidth) * outerR,
        Math.sin(midAngle - toothWidth) * outerR
      );
      ctx.lineTo(
        Math.cos(midAngle + toothWidth) * outerR,
        Math.sin(midAngle + toothWidth) * outerR
      );
    }
    ctx.closePath();
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = theme.stroke;
    ctx.lineWidth = size * 0.005;
    ctx.stroke();

    // Inner cutouts
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      const hx = Math.cos(a) * innerR * 0.55;
      const hy = Math.sin(a) * innerR * 0.55;
      ctx.beginPath();
      ctx.arc(hx, hy, innerR * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      const hx = Math.cos(a) * innerR * 0.55;
      const hy = Math.sin(a) * innerR * 0.55;
      ctx.beginPath();
      ctx.arc(hx, hy, innerR * 0.25, 0, Math.PI * 2);
      ctx.strokeStyle = theme.stroke;
      ctx.lineWidth = size * 0.004;
      ctx.stroke();
    }

    drawBearing(ctx, size, theme);
    ctx.restore();
  },
};

const flower: SpinnerDesign = {
  name: 'Flower',
  friction: 0.98,
  sound: {
    freqRange: [300, 2500],
    q: 3.0,
    filterType: 'bandpass',
    maxVol: 0.18,
    noiseType: 'pink',
    toneFreq: 220,
    toneVol: 0.08,
    toneType: 'sine',
  },
  draw(ctx, size, rotation, theme) {
    ctx.save();
    ctx.rotate(rotation);

    const petalR = size * 0.22;
    const petalDist = size * 0.22;
    const petals = 6;

    // Parse the theme body color to extract a base hue for petal variation
    // Use the swatch color for hue extraction
    for (let i = 0; i < petals; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / petals);
      ctx.translate(0, -petalDist);

      const grad = ctx.createRadialGradient(0, 0, petalR * 0.1, 0, 0, petalR);
      // Blend between theme colors for each petal
      const t = i / petals;
      grad.addColorStop(0, theme.highlight);
      grad.addColorStop(0.5, lerpColor(theme.body[0], theme.body[1], t));
      grad.addColorStop(1, lerpColor(theme.body[1], theme.body[2], t));

      ctx.beginPath();
      ctx.ellipse(0, 0, petalR * 0.7, petalR, 0, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = theme.stroke + '88';
      ctx.lineWidth = size * 0.003;
      ctx.stroke();

      ctx.restore();
    }

    // Center
    const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.09);
    centerGrad.addColorStop(0, theme.highlight);
    centerGrad.addColorStop(0.6, theme.body[0]);
    centerGrad.addColorStop(1, theme.body[1]);
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.09, 0, Math.PI * 2);
    ctx.fillStyle = centerGrad;
    ctx.fill();
    ctx.strokeStyle = theme.stroke;
    ctx.lineWidth = size * 0.004;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, size * 0.03, 0, Math.PI * 2);
    ctx.fillStyle = theme.stroke;
    ctx.fill();

    ctx.restore();
  },
};

/** Linearly interpolate between two hex colors */
function lerpColor(a: string, b: string, t: number): string {
  const parse = (c: string) => {
    const hex = c.replace('#', '');
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  };
  const ca = parse(a);
  const cb = parse(b);
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

export const designs: SpinnerDesign[] = [classic, shuriken, gear, flower];
