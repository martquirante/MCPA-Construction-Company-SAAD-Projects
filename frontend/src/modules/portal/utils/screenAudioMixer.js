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

      // Master dynamics compressor to eliminate clipping while maintaining rich, punchy volume
      const masterCompressor = this.audioCtx.createDynamicsCompressor();
      masterCompressor.threshold.setValueAtTime(-20, this.audioCtx.currentTime);
      masterCompressor.knee.setValueAtTime(25, this.audioCtx.currentTime);
      masterCompressor.ratio.setValueAtTime(10, this.audioCtx.currentTime);
      masterCompressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
      masterCompressor.release.setValueAtTime(0.25, this.audioCtx.currentTime);
      masterCompressor.connect(this.destination);

      // 1. Presenter Microphone Source
      if (this.micTrack && this.micTrack.readyState === "live") {
        try {
          const micStream = new MediaStream([this.micTrack]);
          const micSource = this.audioCtx.createMediaStreamSource(micStream);
          const micGain = this.audioCtx.createGain();
          micGain.gain.setValueAtTime(1.1, this.audioCtx.currentTime);
          micSource.connect(micGain);
          micGain.connect(masterCompressor);
          this.micGain = micGain;
        } catch (e) {
          console.warn("[SCREEN AUDIO MIXER] Could not attach mic to mixer:", e);
        }
      }

      // 2. High-Fidelity Screen / Tab Audio Source (YouTube, presentations, system sound)
      if (this.screenAudioTrack && this.screenAudioTrack.readyState === "live") {
        try {
          const screenStream = new MediaStream([this.screenAudioTrack]);
          const screenSource = this.audioCtx.createMediaStreamSource(screenStream);
          const screenGain = this.audioCtx.createGain();
          // Boosted gain (1.6x) so shared video audio is loud and punchy on mobile listeners
          screenGain.gain.setValueAtTime(1.6, this.audioCtx.currentTime);
          screenSource.connect(screenGain);
          screenGain.connect(masterCompressor);
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
      console.log("[SCREEN AUDIO MIXER] Successfully mixed microphone and screen audio with master compressor.");
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
