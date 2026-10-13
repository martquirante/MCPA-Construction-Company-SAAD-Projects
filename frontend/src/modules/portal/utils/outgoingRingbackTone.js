/**
 * Outgoing Telephone Ringback Tone ("trot-trot" / dial-out tone)
 * 
 * Synthesizes standard dual-frequency telephone ringback tone (400Hz + 450Hz)
 * with the classic double-ring rhythmic cadence:
 * - 0ms - 400ms: Burst 1 ("trot...")
 * - 400ms - 600ms: Pause (200ms)
 * - 600ms - 1000ms: Burst 2 ("...trot")
 * - 1000ms - 3000ms: Silence (2000ms)
 * - Loops every 3 seconds until stopped.
 */

export function playOutgoingRingbackTone() {
  if (typeof window === "undefined") return null;

  try {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtxClass) return null;

    const audioCtx = new AudioCtxClass();
    let isPlaying = true;
    let loopTimeout = null;

    const playDoubleRing = () => {
      if (!isPlaying || audioCtx.state === "closed") return;

      const now = audioCtx.currentTime;

      // Burst 1 (400ms)
      const osc1a = audioCtx.createOscillator();
      const osc2a = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();

      osc1a.type = "sine";
      osc2a.type = "sine";
      osc1a.frequency.setValueAtTime(400, now);
      osc2a.frequency.setValueAtTime(450, now);

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.12, now + 0.03);
      gain1.gain.setValueAtTime(0.12, now + 0.37);
      gain1.gain.linearRampToValueAtTime(0, now + 0.40);

      osc1a.connect(gain1);
      osc2a.connect(gain1);
      gain1.connect(audioCtx.destination);

      osc1a.start(now);
      osc2a.start(now);
      osc1a.stop(now + 0.42);
      osc2a.stop(now + 0.42);

      // Burst 2 (400ms, starts at now + 0.60s)
      const osc1b = audioCtx.createOscillator();
      const osc2b = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();

      osc1b.type = "sine";
      osc2b.type = "sine";
      osc1b.frequency.setValueAtTime(400, now + 0.60);
      osc2b.frequency.setValueAtTime(450, now + 0.60);

      gain2.gain.setValueAtTime(0, now + 0.60);
      gain2.gain.linearRampToValueAtTime(0.12, now + 0.63);
      gain2.gain.setValueAtTime(0.12, now + 0.97);
      gain2.gain.linearRampToValueAtTime(0, now + 1.00);

      osc1b.connect(gain2);
      osc2b.connect(gain2);
      gain2.connect(audioCtx.destination);

      osc1b.start(now + 0.60);
      osc2b.start(now + 0.60);
      osc1b.stop(now + 1.02);
      osc2b.stop(now + 1.02);

      // Next cadence in 3000ms
      loopTimeout = setTimeout(playDoubleRing, 3000);
    };

    if (audioCtx.state === "suspended") {
      audioCtx.resume().then(() => playDoubleRing()).catch(() => {});
    } else {
      playDoubleRing();
    }

    return {
      stop: () => {
        isPlaying = false;
        if (loopTimeout) {
          clearTimeout(loopTimeout);
          loopTimeout = null;
        }
        try {
          audioCtx.close();
        } catch (e) {}
      },
    };
  } catch (err) {
    console.warn("[RINGBACK TONE] Failed to initialize ringback tone:", err);
    return null;
  }
}
