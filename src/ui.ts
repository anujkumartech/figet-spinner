import { SpinnerDesign } from './designs';
import { ColorTheme } from './colors';

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

  // Design buttons
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

  // Color button
  const colorBtn = document.createElement('button');
  colorBtn.id = 'color-btn';
  colorBtn.className = 'color-btn';
  updateColorButton(colorBtn, themes[currentThemeIndex]);
  colorBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Cycle to next theme
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

export function updateRPM(rpm: number): void {
  const el = document.getElementById('rpm-value')!;
  el.textContent = Math.round(rpm).toString();
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
