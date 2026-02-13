import { SoundProfile } from './designs';

let audioCtx: AudioContext | null = null;
let unlocked = false;

// Noise buffers (generated once, reused)
let pinkBuffer: AudioBuffer | null = null;
let whiteBuffer: AudioBuffer | null = null;
let brownBuffer: AudioBuffer | null = null;

// Active audio nodes
let noiseSource: AudioBufferSourceNode | null = null;
let noiseGain: GainNode | null = null;
let noiseFilter: BiquadFilterNode | null = null;
let toneOsc: OscillatorNode | null = null;
let toneGain: GainNode | null = null;
let toneFilter: BiquadFilterNode | null = null;
let isPlaying = false;
let currentProfile: SoundProfile | null = null;

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * iOS/Safari requires AudioContext to be resumed inside a user gesture,
 * AND a buffer source must be played to fully unlock audio output.
 */
async function unlockAudio(): Promise<void> {
  if (unlocked) return;
  const ctx = getContext();

  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  // Play a silent buffer to fully unlock on iOS
  const silentBuffer = ctx.createBuffer(1, 1, ctx.sampleRate);
  const source = ctx.createBufferSource();
  source.buffer = silentBuffer;
  source.connect(ctx.destination);
  source.start(0);

  unlocked = true;
}

function generatePinkNoise(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = sr * 2;
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.08;
    b6 = w * 0.115926;
  }
  return buf;
}

function generateWhiteNoise(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = sr * 2;
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }
  return buf;
}

function generateBrownNoise(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = sr * 2;
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + (0.02 * w)) / 1.02;
    data[i] = last * 3.5;
  }
  return buf;
}

function getNoiseBuffer(ctx: AudioContext, type: 'pink' | 'white' | 'brown'): AudioBuffer {
  switch (type) {
    case 'pink':
      if (!pinkBuffer) pinkBuffer = generatePinkNoise(ctx);
      return pinkBuffer;
    case 'white':
      if (!whiteBuffer) whiteBuffer = generateWhiteNoise(ctx);
      return whiteBuffer;
    case 'brown':
      if (!brownBuffer) brownBuffer = generateBrownNoise(ctx);
      return brownBuffer;
  }
}

function stopAll() {
  if (noiseSource) {
    try { noiseSource.stop(); } catch { /* ignore */ }
    noiseSource.disconnect();
    noiseSource = null;
  }
  if (noiseGain) { noiseGain.disconnect(); noiseGain = null; }
  if (noiseFilter) { noiseFilter.disconnect(); noiseFilter = null; }
  if (toneOsc) {
    try { toneOsc.stop(); } catch { /* ignore */ }
    toneOsc.disconnect();
    toneOsc = null;
  }
  if (toneGain) { toneGain.disconnect(); toneGain = null; }
  if (toneFilter) { toneFilter.disconnect(); toneFilter = null; }
  isPlaying = false;
  currentProfile = null;
}

function startSound(profile: SoundProfile) {
  const ctx = getContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  stopAll();
  currentProfile = profile;

  // Noise chain: source -> filter -> gain -> destination
  const buffer = getNoiseBuffer(ctx, profile.noiseType);
  noiseSource = ctx.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = profile.filterType;
  noiseFilter.frequency.value = profile.freqRange[0];
  noiseFilter.Q.value = profile.q;

  noiseGain = ctx.createGain();
  noiseGain.gain.value = 0;

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noiseSource.start();

  // Optional tone oscillator for character
  if (profile.toneFreq && profile.toneVol && profile.toneType) {
    toneOsc = ctx.createOscillator();
    toneOsc.type = profile.toneType;
    toneOsc.frequency.value = profile.toneFreq;

    toneFilter = ctx.createBiquadFilter();
    toneFilter.type = 'lowpass';
    toneFilter.frequency.value = profile.toneFreq * 3;

    toneGain = ctx.createGain();
    toneGain.gain.value = 0;

    toneOsc.connect(toneFilter);
    toneFilter.connect(toneGain);
    toneGain.connect(ctx.destination);
    toneOsc.start();
  }

  isPlaying = true;
}

export function updateAudio(angularVelocity: number, profile: SoundProfile): void {
  if (!unlocked) return;

  const speed = Math.abs(angularVelocity);

  if (speed < 0.5) {
    if (isPlaying) stopAll();
    return;
  }

  // Start or switch sound profile if design changed
  if (!isPlaying || currentProfile !== profile) {
    startSound(profile);
  }

  if (!noiseGain || !noiseFilter || !audioCtx) return;

  const t = Math.min(speed / 60, 1);

  // Noise volume
  const vol = t * profile.maxVol;
  noiseGain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.1);

  // Filter frequency sweeps from low to high with speed
  const freq = profile.freqRange[0] + t * (profile.freqRange[1] - profile.freqRange[0]);
  noiseFilter.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.1);

  // Tone: pitch bends up slightly with speed, volume fades in
  if (toneOsc && toneGain && toneFilter && profile.toneFreq && profile.toneVol) {
    const toneVol = t * profile.toneVol;
    toneGain.gain.setTargetAtTime(toneVol, audioCtx.currentTime, 0.1);
    // Slight pitch rise with speed
    const pitchMult = 1 + t * 0.5;
    toneOsc.frequency.setTargetAtTime(profile.toneFreq * pitchMult, audioCtx.currentTime, 0.15);
    toneFilter.frequency.setTargetAtTime(profile.toneFreq * pitchMult * 3, audioCtx.currentTime, 0.15);
  }
}

export function initAudio(): void {
  // Must be called from a user gesture (click/touch handler)
  unlockAudio();
}
