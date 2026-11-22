// Tiny WebAudio sound effects for Ember Court: no audio files, every sound is
// synthesized. Created lazily on the first user gesture so autoplay rules never block it.
let audioCtx = null;
let muted = false;

export function isMuted() { return muted; }
export function toggleMuted() { muted = !muted; return muted; }

function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(freq, startAt, dur, type = 'sine', gain = 0.12) {
  if (muted) return;
  try {
    const ac = ctx();
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, ac.currentTime + startAt);
    amp.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startAt + dur);
    osc.connect(amp).connect(ac.destination);
    osc.start(ac.currentTime + startAt);
    osc.stop(ac.currentTime + startAt + dur);
  } catch { /* sound is decoration; a failure never breaks the game */ }
}

/** A soft click when a card is selected. */
export function sfxSelect() { tone(660, 0, 0.07, 'triangle', 0.06); }
/** A wooden snap when a card is played. */
export function sfxPlay() { tone(392, 0, 0.09, 'square', 0.08); tone(523, 0.07, 0.12, 'triangle', 0.08); }
/** A low thud when damage lands. */
export function sfxHit() { tone(140, 0, 0.18, 'sawtooth', 0.12); tone(90, 0.05, 0.2, 'sine', 0.14); }
/** A bright chime when block or healing lands. */
export function sfxGuard() { tone(520, 0, 0.1, 'sine', 0.09); tone(780, 0.08, 0.14, 'sine', 0.07); }
/** A rising arpeggio for a win. */
export function sfxWin() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25, 'triangle', 0.1)); }
/** A falling line for a loss. */
export function sfxLose() { [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.14, 0.28, 'sine', 0.1)); }
