const hasVibration = typeof navigator !== 'undefined' && 'vibrate' in navigator;

let lastPulseTime = 0;

export function pulseOnSpin(): void {
  if (!hasVibration) return;
  navigator.vibrate(15);
}

export function updateHaptics(angularVelocity: number, now: number): void {
  if (!hasVibration) return;

  const speed = Math.abs(angularVelocity);
  if (speed < 5) return;

  // Pulse interval decreases with speed (200ms at slow, 50ms at fast)
  const interval = Math.max(50, 200 - speed * 3);

  if (now - lastPulseTime > interval) {
    navigator.vibrate(5);
    lastPulseTime = now;
  }
}
