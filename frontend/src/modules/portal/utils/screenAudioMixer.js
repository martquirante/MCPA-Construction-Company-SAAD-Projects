/**
 * ScreenAudioMixer
 * 
 * Mixes the presenter's microphone track with the captured screen/tab audio track
 * using Web Audio API MediaStreamAudioDestinationNode (48kHz high-fidelity).
 * 
 * Architecture:
 * - Persistent node references on `this` to prevent Google Chrome V8 garbage collection
 *   from silently killing the microphone input during active calls.
 * - Dedicated voice path: Presenter's microphone connects DIRECTLY to output at boosted gain
 *   so human speech is NEVER ducked, compressed, or muted by loud YouTube videos / music.
 * - Dedicated media path: Screen/tab audio runs through a dedicated gain control and peak limiter
 *   to ensure crisp audio playback without overpowering the presenter.
 */
export class ScreenAudioMixer {
  constructor(micTrack, screenAudioTrack) {
    this.micTrack = micTrack || null;
    this.screenAudioTrack = screenAudioTrack || null;
    this.audioCtx = null;
    this.destination = null;
    this.mixedTrack = null;
    this.isActive = false;

    // Explicitly retain all audio node references on `this` to prevent V8 GC drops
    this.micStream = null;
    this.micSource = null;
    this.micGain = null;
    this.screenStream = null;
    this.screenSource = null;
    this.screenGain = null;
    this.screenLimiter = null;
  }

  start() {
    if (typeof window === "undefined") return null;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        return this.screenAudioTrack || this.micTrack;
      }

      this.audioCtx = new AudioCtx({ sampleRate: 48000 });
      this.destination = this.audioCtx.createMediaStreamDestination();

      // 1. Presenter Microphone Source (DIRECT PRIORITY PATH)
      // Connected directly to destination without going through music compressor
      // to guarantee human voice is 100% audible and never squashed by YouTube sound.
      if (this.micTrack && this.micTrack.readyState === "live") {
        try {
          this.micStream = new MediaStream([this.micTrack]);
          this.micSource = this.audioCtx.createMediaStreamSource(this.micStream);
          this.micGain = this.audioCtx.createGain();
          this.micGain.gain.setValueAtTime(1.3, this.audioCtx.currentTime);
          this.micSource.connect(this.micGain);
          this.micGain.connect(this.destination);
          console.log("[SCREEN AUDIO MIXER] Presenter mic attached with direct priority path.");
        } catch (e) {
          console.warn("[SCREEN AUDIO MIXER] Could not attach mic to mixer:", e);
        }
      }

      // 2. High-Fidelity Screen / Tab Audio Source (YouTube, presentations, system sound)
      // Runs through a separate limiter to prevent clipping, balanced at comfortable volume.
      if (this.screenAudioTrack && this.screenAudioTrack.readyState === "live") {
        try {
          this.screenStream = new MediaStream([this.screenAudioTrack]);
          this.screenSource = this.audioCtx.createMediaStreamSource(this.screenStream);
          this.screenGain = this.audioCtx.createGain();
          // Balanced gain (0.85x) so video sound is clear without overpowering the speaker
          this.screenGain.gain.setValueAtTime(0.85, this.audioCtx.currentTime);

          // Dedicated limiter for screen audio only
          this.screenLimiter = this.audioCtx.createDynamicsCompressor();
          this.screenLimiter.threshold.setValueAtTime(-12, this.audioCtx.currentTime);
          this.screenLimiter.knee.setValueAtTime(12, this.audioCtx.currentTime);
          this.screenLimiter.ratio.setValueAtTime(6, this.audioCtx.currentTime);
          this.screenLimiter.attack.setValueAtTime(0.005, this.audioCtx.currentTime);
          this.screenLimiter.release.setValueAtTime(0.1, this.audioCtx.currentTime);

          this.screenSource.connect(this.screenGain);
          this.screenGain.connect(this.screenLimiter);
          this.screenLimiter.connect(this.destination);
          console.log("[SCREEN AUDIO MIXER] Screen tab audio attached with dedicated limiter.");
        } catch (e) {
          console.warn("[SCREEN AUDIO MIXER] Could not attach screen audio to mixer:", e);
        }
      }

      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume().catch((err) => {
          console.warn("[SCREEN AUDIO MIXER] AudioContext resume failed:", err);
        });
      }

      this.mixedTrack = this.destination.stream.getAudioTracks()[0] || null;
      this.isActive = true;
      console.log("[SCREEN AUDIO MIXER] Successfully mixed microphone and screen audio.");
      return this.mixedTrack || this.screenAudioTrack || this.micTrack;
    } catch (err) {
      console.warn("[SCREEN AUDIO MIXER] Web Audio mixing failed, falling back to direct track:", err);
      return this.screenAudioTrack || this.micTrack;
    }
  }

  stop() {
    this.isActive = false;

    // Disconnect and release audio nodes
    try {
      if (this.micSource) this.micSource.disconnect();
      if (this.micGain) this.micGain.disconnect();
      if (this.screenSource) this.screenSource.disconnect();
      if (this.screenGain) this.screenGain.disconnect();
      if (this.screenLimiter) this.screenLimiter.disconnect();
    } catch (e) {}

    this.micStream = null;
    this.micSource = null;
    this.micGain = null;
    this.screenStream = null;
    this.screenSource = null;
    this.screenGain = null;
    this.screenLimiter = null;

    if (this.audioCtx && this.audioCtx.state !== "closed") {
      try {
        this.audioCtx.close();
      } catch (e) {}
    }
    this.audioCtx = null;
    this.destination = null;
    this.mixedTrack = null;
    console.log("[SCREEN AUDIO MIXER] Stopped audio mixer and restored clean routing.");
  }
}
