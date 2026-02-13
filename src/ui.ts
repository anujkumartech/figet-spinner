import { SpinnerDesign } from './designs';
import { ColorTheme } from './colors';
import { Stats, MILESTONES } from './stats';

export function setupUI(
  designs: SpinnerDesign[],
  currentDesignIndex: number,
  onSelectDesign: (index: number) => void,
  themes: ColorTheme[],
  currentThemeIndex: number,
  onSelectTheme: (index: number) => void
): void {
  const picker = document.getElementById('design-picker')!;
  picker.innerHTML = '';

  designs.forEach((design, i) => {
    const btn = document.createElement('button');
    btn.className = 'design-btn' + (i === currentDesignIndex ? ' active' : '');
    btn.textContent = design.name;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onSelectDesign(i);
    });
    btn.addEventListener('touchstart', (e) => e.stopPropagation());
    btn.addEventListener('touchmove', (e) => e.stopPropagation());
    btn.addEventListener('touchend', (e) => e.stopPropagation());
    picker.appendChild(btn);
  });

  const colorBtn = document.createElement('button');
  colorBtn.id = 'color-btn';
  colorBtn.className = 'color-btn';
  updateColorButton(colorBtn, themes[currentThemeIndex]);
  colorBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const next = (currentThemeIndex + 1) % themes.length;
    onSelectTheme(next);
  });
  colorBtn.addEventListener('touchstart', (e) => e.stopPropagation());
  colorBtn.addEventListener('touchmove', (e) => e.stopPropagation());
  colorBtn.addEventListener('touchend', (e) => e.stopPropagation());
  picker.appendChild(colorBtn);
}

function updateColorButton(btn: HTMLElement, theme: ColorTheme) {
  btn.innerHTML = `<span class="color-swatch" style="background:${theme.swatch}"></span>${theme.name}`;
}

let displayedRPM = 0;

export function updateRPM(rpm: number): void {
  // Smooth the displayed number
  displayedRPM += (rpm - displayedRPM) * 0.15;
  const shown = Math.round(displayedRPM);

  const el = document.getElementById('rpm-value')!;
  el.textContent = shown.toString();

  // Color tiers
  el.classList.remove('fast', 'blazing');
  if (shown > 500) {
    el.classList.add('blazing');
  } else if (shown > 200) {
    el.classList.add('fast');
  }
}

export function updateBestRPM(best: number, isNewRecord: boolean): void {
  const el = document.getElementById('best-rpm-value')!;
  el.textContent = Math.round(best).toString();
  if (isNewRecord) {
    el.classList.remove('new-record');
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add('new-record');
  }
}

export function setActiveDesign(index: number): void {
  const buttons = document.querySelectorAll('.design-btn');
  buttons.forEach((btn, i) => {
    btn.classList.toggle('active', i === index);
  });
}

export function setActiveTheme(theme: ColorTheme): void {
  const btn = document.getElementById('color-btn');
  if (btn) updateColorButton(btn, theme);
}

function formatTime(seconds: number): string {
  if (seconds < 60) return Math.round(seconds) + 's';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ' + Math.round(seconds % 60) + 's';
  return Math.floor(seconds / 3600) + 'h ' + Math.floor((seconds % 3600) / 60) + 'm';
}

export function updateStatsPanel(stats: Stats): void {
  const spins = document.getElementById('stat-spins');
  const time = document.getElementById('stat-time');
  const longest = document.getElementById('stat-longest');
  const milestones = document.getElementById('stat-milestones');

  if (spins) spins.textContent = stats.totalSpins.toString();
  if (time) time.textContent = formatTime(stats.totalSpinTime);
  if (longest) longest.textContent = formatTime(stats.longestSpin);
  if (milestones) milestones.textContent = stats.milestonesHit.length + '/' + MILESTONES.length;
}

export function setupStatsButton(): void {
  const btn = document.getElementById('stats-btn')!;
  const panel = document.getElementById('stats-panel')!;

  const handler = (e: Event) => {
    e.stopPropagation();
    panel.classList.toggle('hidden');
    btn.classList.toggle('active');
  };
  btn.addEventListener('click', handler);
  btn.addEventListener('touchstart', (e) => e.stopPropagation());
  btn.addEventListener('touchmove', (e) => e.stopPropagation());
  btn.addEventListener('touchend', (e) => e.stopPropagation());
}

export function setupFullscreenButton(): void {
  const btn = document.getElementById('fullscreen-btn')!;

  const handler = (e: Event) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };
  btn.addEventListener('click', handler);
  btn.addEventListener('touchstart', (e) => e.stopPropagation());
  btn.addEventListener('touchmove', (e) => e.stopPropagation());
  btn.addEventListener('touchend', (e) => e.stopPropagation());
}

export function hideHint(): void {
  const hint = document.getElementById('hint');
  if (hint) hint.classList.add('hidden');
}
