export interface ColorTheme {
  name: string;
  /** Dot shown in the button */
  swatch: string;
  /** 3 gradient stops: light, mid, dark */
  body: [string, string, string];
  /** Stroke / outline color */
  stroke: string;
  /** Highlight / accent */
  highlight: string;
  /** Glow color with alpha */
  glow: string;
}

export const colorThemes: ColorTheme[] = [
  {
    name: 'Silver',
    swatch: '#c0c0c0',
    body: ['#d0d0d0', '#a0a0a0', '#707070'],
    stroke: '#666',
    highlight: '#e8e8e8',
    glow: 'rgba(200, 200, 220, 0.4)',
  },
  {
    name: 'Crimson',
    swatch: '#dc3545',
    body: ['#ff6b6b', '#dc3545', '#a01020'],
    stroke: '#801020',
    highlight: '#ff9999',
    glow: 'rgba(220, 53, 69, 0.4)',
  },
  {
    name: 'Ocean',
    swatch: '#0d6efd',
    body: ['#6cb4ff', '#0d6efd', '#0043a8'],
    stroke: '#003580',
    highlight: '#99ccff',
    glow: 'rgba(13, 110, 253, 0.4)',
  },
  {
    name: 'Emerald',
    swatch: '#198754',
    body: ['#5cd899', '#198754', '#0a5c38'],
    stroke: '#084c2e',
    highlight: '#8aedb8',
    glow: 'rgba(25, 135, 84, 0.4)',
  },
  {
    name: 'Gold',
    swatch: '#ffc107',
    body: ['#ffe066', '#ffc107', '#c49000'],
    stroke: '#9a7200',
    highlight: '#fff0a0',
    glow: 'rgba(255, 193, 7, 0.35)',
  },
  {
    name: 'Purple',
    swatch: '#8b5cf6',
    body: ['#b794f6', '#8b5cf6', '#5b21b6'],
    stroke: '#4a1a99',
    highlight: '#d4bfff',
    glow: 'rgba(139, 92, 246, 0.4)',
  },
  {
    name: 'Neon',
    swatch: '#00ff88',
    body: ['#66ffbb', '#00ff88', '#00cc66'],
    stroke: '#009944',
    highlight: '#aaffdd',
    glow: 'rgba(0, 255, 136, 0.4)',
  },
  {
    name: 'Rose',
    swatch: '#f472b6',
    body: ['#fbb4d4', '#f472b6', '#c0267a'],
    stroke: '#a01a66',
    highlight: '#fdd6e8',
    glow: 'rgba(244, 114, 182, 0.4)',
  },
  {
    name: 'White',
    swatch: '#ffffff',
    body: ['#ffffff', '#e8e8e8', '#cccccc'],
    stroke: '#999999',
    highlight: '#ffffff',
    glow: 'rgba(255, 255, 255, 0.4)',
  },
];
