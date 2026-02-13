# Fidget Spinner PWA — Features

## Spinner Designs

Four unique spinner designs, each with distinct visuals and physics:

| Design | Arms | Friction | Character |
|--------|------|----------|-----------|
| **Classic** | 3 rounded arms with metallic gradient bulbs | Medium | Smooth, balanced feel |
| **Shuriken** | 4 sharp pointed blades with steel highlights | Low | Fast, low-drag ninja star |
| **Gear** | 12-tooth mechanical gear with cutout holes | High | Heavy, industrial momentum |
| **Flower** | 6 soft petal shapes with color blending | Very Low | Light, floaty, long spins |

## Color Themes

9 color themes that apply to any spinner design (36 total combinations):

Silver, Crimson, Ocean, Emerald, Gold, Purple, Neon, Rose, White

Each theme defines a full gradient palette (body, stroke, highlight, glow) so the spinner, particles, speed lines, and background glow all shift together.

## Sound Design

Each spinner has its own procedurally generated sound profile — no audio files, everything synthesized via Web Audio API:

| Design | Noise | Tone | Character |
|--------|-------|------|-----------|
| **Classic** | Pink noise, bandpass 200–1800 Hz | None | Smooth airy whoosh |
| **Shuriken** | White noise, bandpass 600–4000 Hz | Sawtooth 120 Hz | Sharp cutting wind |
| **Gear** | Brown noise, lowpass 100–800 Hz | Square wave 60 Hz | Deep mechanical rumble |
| **Flower** | Pink noise, bandpass 300–2500 Hz | Sine 220 Hz | Soft melodic hum |

- Volume and filter frequency sweep upward with speed
- Tone oscillators bend pitch with velocity
- Sound auto-switches when changing designs
- iOS audio unlock: plays silent buffer on first gesture to bypass Safari restrictions

## Physics Engine

- Frame-rate independent delta-time integration
- Exponential friction decay (configurable per design)
- Angular velocity with momentum — flicks add to current speed
- Max velocity cap at 80 rad/s (~760 RPM)
- Minimum velocity threshold auto-stops the spinner

## Controls

### Touch (Mobile)
- **Swipe** anywhere on the spinner to flick — velocity calculated from tangential swipe speed relative to center
- **Tap center bearing** for a quick spin
- **Haptic feedback** — vibration pulse on flick, periodic pulses at high speed

### Mouse (Desktop)
- **Click and drag** to swipe-spin (mouseup on window so drag isn't lost at edges)
- **Click center** for a quick flick

### Keyboard
- **Arrow Right / Arrow Up** — flick clockwise
- **Arrow Left / Arrow Down** — flick counter-clockwise
- **Space** — big flick (follows current spin direction)
- **Hold any key** — continuous acceleration while held

## Visual Effects

- **Particle trails** — glowing particles fly off spinner arms at high speed, tangential to rotation
- **Motion blur** — ghost trail of previous rotations rendered at low opacity behind the spinner
- **Speed lines** — radial lines radiating outward from the spinner, intensity and count scale with RPM
- **Background glow** — radial gradient centered on spinner, color-matched to current theme, pulses with speed
- **Pulsing ring** — outer glow ring appears above 40 rad/s with sine-wave pulse
- **Screen shake** — subtle random offset at extreme speeds (60+ rad/s)
- **Drop shadow** — soft shadow beneath spinner for depth

## RPM Display

- Large monospace counter with smooth animated interpolation (no jittery jumps)
- Color tiers:
  - White: 0–200 RPM
  - Gold: 200–500 RPM
  - Red: 500+ RPM
- Text shadow glow intensifies with speed tier

## Stats & Persistence

All stats saved to `localStorage` and persist across sessions:

| Stat | Description |
|------|-------------|
| **Best RPM** | All-time maximum RPM with golden pulse animation on new records |
| **Total Spins** | Lifetime flick count |
| **Spin Time** | Cumulative seconds the spinner was in motion |
| **Longest Spin** | Duration of the single longest spin session |
| **Milestones** | Count of RPM milestones achieved (out of 5) |

Design and color theme preferences are also saved and restored on reload.

## Speed Milestones

RPM milestones with celebratory feedback:

| Milestone | Confetti Intensity |
|-----------|-------------------|
| 100 RPM | Light burst |
| 250 RPM | Medium burst |
| 500 RPM | Full burst |
| 750 RPM | Heavy burst |
| 1000 RPM | Maximum burst |

Each milestone triggers:
- Confetti particle explosion (colored rectangles with gravity and rotation)
- Toast notification pill that scales in and fades out

Milestones fire once per session to avoid spam.

## UI

- **Full-screen canvas** with dark gradient background
- **Top bar**: RPM counter + Best RPM display
- **Stats panel**: collapsible 2x2 grid toggled via chart icon button
- **Bottom bar** with glassmorphism gradient:
  - Stats toggle button (bar chart icon)
  - Design picker pills (Classic, Shuriken, Gear, Flower)
  - Color cycle button with swatch dot
  - Fullscreen toggle button
- **Onboarding hint**: "Swipe or press arrow keys to spin" — fades after first interaction
- Safe area insets for notched devices
- `backdrop-filter: blur` glassmorphism on all interactive elements

## PWA

- `vite-plugin-pwa` with `registerType: 'autoUpdate'`
- Web app manifest: standalone display, portrait orientation, theme color `#1a1a2e`
- Service worker pre-caches all assets for full offline support
- SVG icons (192x192, 512x512)
- Mobile-native feel: `touch-action: none`, `overscroll-behavior: none`, `user-select: none`

## Tech Stack

- **Vite 6** — build tool
- **Vanilla TypeScript** — zero framework overhead
- **Canvas 2D API** — all rendering
- **Web Audio API** — procedural sound synthesis
- **Vibration API** — haptic feedback
- **localStorage** — persistence
- **vite-plugin-pwa** — service worker + manifest generation

## Build

Total production bundle: ~21 KB JS + ~4 KB CSS (gzipped ~9 KB).
Zero external runtime dependencies.
