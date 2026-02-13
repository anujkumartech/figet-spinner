let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let sourceNode: AudioBufferSourceNode | null = null;
let gainNode: GainNode | null = null;
let filterNode: BiquadFilterNode | null = null;
let isPlaying = false;

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * 2; // 2 seconds of noise
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  // Pink-ish noise for whoosh sound
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
    b6 = white * 0.115926;
  }

  return buffer;
}

function startWhoosh() {
  const ctx = getContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  if (!noiseBuffer) {
    noiseBuffer = createNoiseBuffer(ctx);
  }

  // Clean up previous
  stopWhoosh();

  sourceNode = ctx.createBufferSource();
  sourceNode.buffer = noiseBuffer;
  sourceNode.loop = true;

  gainNode = ctx.createGain();
  gainNode.gain.value = 0;

  filterNode = ctx.createBiquadFilter();
  filterNode.type = 'bandpass';
  filterNode.frequency.value = 400;
  filterNode.Q.value = 0.5;

  sourceNode.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(ctx.destination);
  sourceNode.start();
  isPlaying = true;
}

function stopWhoosh() {
  if (sourceNode) {
    try { sourceNode.stop(); } catch (_) { /* ignore */ }
    sourceNode.disconnect();
    sourceNode = null;
  }
  if (gainNode) {
    gainNode.disconnect();
    gainNode = null;
  }
  if (filterNode) {
    filterNode.disconnect();
    filterNode = null;
  }
  isPlaying = false;
}

export function updateAudio(angularVelocity: number): void {
  const speed = Math.abs(angularVelocity);

  if (speed < 0.5) {
    if (isPlaying) stopWhoosh();
    return;
  }

  if (!isPlaying) {
    startWhoosh();
  }

  if (!gainNode || !filterNode || !audioCtx) return;

  // Volume scales with speed (0 to 0.3)
  const vol = Math.min(speed / 50, 1) * 0.3;
  gainNode.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.1);

  // Filter frequency rises with speed (200 to 2000 Hz)
  const freq = 200 + (Math.min(speed / 60, 1) * 1800);
  filterNode.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.1);
}

export function initAudio(): void {
  // Pre-init on first user gesture (called from interaction handlers)
  getContext();
}
