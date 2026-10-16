/**
 * Zero-dependency Web Audio API notification sound utility.
 * Generates a polished, harmonious two-tone notification chime (D5 -> A5).
 */

let sharedAudioContext: AudioContext | null = null;
let lastPlayedAt = 0;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioContext || sharedAudioContext.state === "closed") {
    try {
      sharedAudioContext = new AudioCtx();
    } catch {
      return null;
    }
  }

  if (sharedAudioContext.state === "suspended") {
    sharedAudioContext.resume().catch(() => {});
  }

  return sharedAudioContext;
}

/**
 * Prime audio context on user gesture so that subsequent sounds play without policy blocking.
 */
export function unlockAudioContext(): void {
  try {
    const ctx = getSharedAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  } catch {
    // Ignore error
  }
}

/**
 * Play gentle notification chime
 */
export function playNotificationSound(): void {
  const now = Date.now();
  // Throttle: avoid blasting audio if multiple messages arrive within 400ms
  if (now - lastPlayedAt < 400) {
    return;
  }
  lastPlayedAt = now;

  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Pleasant melodic rise: 587.33 Hz (D5) -> 880 Hz (A5)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    // Smooth envelope with fast attack and gentle decay
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Autoplay restrictions or audio device issues silently handled
  }
}
