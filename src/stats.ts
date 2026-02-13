const STORAGE_KEY = 'fidget-spinner-stats';
const PREFS_KEY = 'fidget-spinner-prefs';

export interface Stats {
  maxRPM: number;
  totalSpins: number;
  totalSpinTime: number; // seconds
  longestSpin: number; // seconds
  milestonesHit: number[];
}

export interface Prefs {
  designIndex: number;
  themeIndex: number;
}

const defaultStats: Stats = {
  maxRPM: 0,
  totalSpins: 0,
  totalSpinTime: 0,
  longestSpin: 0,
  milestonesHit: [],
};

const defaultPrefs: Prefs = {
  designIndex: 0,
  themeIndex: 0,
};

export function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultStats, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...defaultStats };
}

export function saveStats(stats: Stats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch { /* ignore */ }
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...defaultPrefs };
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch { /* ignore */ }
}

// Milestones in RPM
export const MILESTONES = [100, 250, 500, 750, 1000];
