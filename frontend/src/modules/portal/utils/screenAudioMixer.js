/**
 * ScreenAudioMixer
 * 
 * Mixes the presenter's microphone track with the captured screen/tab audio track
 * using Web Audio API MediaStreamAudioDestinationNode (48kHz high-fidelity stereo).
 * 
 * This ensures that when presenting video, music, or drawings with audio,
 * the presenter's voice is NOT muted and the system audio is crystal clear.
 */
export class ScreenAudioMixer {
  constructor(micTrack, screenAudioTrack) {
    this.micTrack = micTrack;
    this.screenAudioTrack = screenAudioTrack;
    this.audioCtx = null;
    this.destination = null;
    this.mixedTrack = null;
    this.isActive = false;
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

      // 1. Presenter Microphone Source
      if (this.micTrack && this.micTrack.readyState === "live") {
        try {
          const micStream = new MediaStream([this.micTrack]);
          const micSource = this.audioCtx.createMediaStreamSource(micStream);
          const micGain = this.audioCtx.createGain();
          micGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
          micSource.connect(micGain);
          micGain.connect(this.destination);
          this.micGain = micGain;
        } catch (e) {
          console.warn("[SCREEN AUDIO MIXER] Could not attach mic to mixer:", e);
        }
      }

      // 2. High-Fidelity Screen / Tab Audio Source
      if (this.screenAudioTrack && this.screenAudioTrack.readyState === "live") {
        try {
          const screenStream = new MediaStream([this.screenAudioTrack]);
          const screenSource = this.audioCtx.createMediaStreamSource(screenStream);
          const screenGain = this.audioCtx.createGain();
          // Balanced gain to prevent digital clipping when combined with voice
          screenGain.gain.setValueAtTime(0.95, this.audioCtx.currentTime);
          screenSource.connect(screenGain);
          screenGain.connect(this.destination);
          this.screenGain = screenGain;
        } catch (e) {
          console.warn("[SCREEN AUDIO MIXER] Could not attach screen audio to mixer:", e);
        }
      }

      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume().catch(() => {});
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
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      try {
        this.audioCtx.close();
      } catch (e) {}
    }
    this.audioCtx = null;
    this.destination = null;
    this.mixedTrack = null;
    console.log("[SCREEN AUDIO MIXER] Stopped audio mixer and restored original audio routing.");
  }
}
