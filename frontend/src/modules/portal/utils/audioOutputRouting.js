/**
 * Centralized remote-audio output routing for MCPA Meet.
 *
 * Platform reality (do not pretend otherwise in the UI):
 * - Desktop Chromium / Edge / Firefox expose HTMLMediaElement.setSinkId(), so a
 *   specific output device can really be selected.
 * - Android Chrome and iOS Safari do NOT expose a way for a web page to choose
 *   loudspeaker vs. earpiece vs. Bluetooth. The OS picks the route
 *   automatically (it follows wired / Bluetooth headsets when connected).
 *
 * This module therefore only reports what is *actually* supported (feature
 * detection, not user-agent sniffing) and only claims success after
 * setSinkId() has resolved.
 */

const registeredElements = new Set();
let activeSinkId = "";
let diagnosticsLogged = false;

const HEADSET_LABEL_PATTERN =
  /(headset|headphone|earphone|airpod|earbud|buds|bluetooth|hands-free|wireless)/i;

/** Feature-detect real routing capability of the current browser. */
export function getAudioRoutingCapabilities() {
  if (typeof document === "undefined") {
    return { canSelectOutput: false, canEnumerate: false, isMobile: false };
  }
  const isMobile = Boolean(
    typeof navigator !== "undefined" &&
      (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (typeof window !== "undefined" && window.innerWidth < 768 && "ontouchstart" in window))
  );

  let canSelectOutput = false;
  try {
    canSelectOutput =
      !isMobile &&
      typeof HTMLMediaElement !== "undefined" &&
      typeof HTMLMediaElement.prototype.setSinkId === "function";
  } catch (e) {
    canSelectOutput = false;
  }
  const canEnumerate = Boolean(
    typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices
  );
  return { canSelectOutput, canEnumerate, isMobile };
}

/**
 * Real, selectable output devices. Empty when the browser cannot route output
 * (the "default" pseudo-entry alone is not a choice).
 */
export function getSelectableOutputs(devices = []) {
  const { canSelectOutput } = getAudioRoutingCapabilities();
  if (!canSelectOutput) return [];
  return devices.filter((d) => d.kind === "audiooutput");
}

/**
 * Informational only: a headset/Bluetooth device whose label is visible.
 * Labels are empty until the user grants a media permission, so absence of a
 * match never proves that nothing is connected.
 */
export function findLabeledAccessory(devices = []) {
  return devices.find((d) => d.label && HEADSET_LABEL_PATTERN.test(d.label)) || null;
}

/** One-time, non-sensitive diagnostics (no device IDs or labels). */
export function logAudioRoutingDiagnostics(devices = []) {
  if (diagnosticsLogged || typeof window === "undefined") return;
  diagnosticsLogged = true;
  const caps = getAudioRoutingCapabilities();
  console.info("[AUDIO ROUTING] capabilities", {
    setSinkId: caps.canSelectOutput,
    enumerateDevices: caps.canEnumerate,
    audioOutputs: devices.filter((d) => d.kind === "audiooutput").length,
    audioInputs: devices.filter((d) => d.kind === "audioinput").length,
    touchDevice: "ontouchstart" in window,
  });
}

async function applySink(el, sinkId) {
  if (typeof el.setSinkId !== "function") return false;
  await el.setSinkId(sinkId || "");
  return true;
}

/** Register a remote-audio element so route changes apply to every peer. */
export function registerRemoteAudioElement(el) {
  registeredElements.add(el);
  if (activeSinkId) {
    applySink(el, activeSinkId).catch((err) =>
      console.warn("[AUDIO ROUTING] Could not apply sink to new element:", err?.name)
    );
  }
  return () => registeredElements.delete(el);
}

/**
 * The single entry point for changing output. Resolves { ok, reason }.
 * UI state must only change when ok === true.
 */
export async function setRemoteAudioOutput(sinkId) {
  const { canSelectOutput } = getAudioRoutingCapabilities();
  if (!canSelectOutput) return { ok: false, reason: "unsupported" };

  const previous = activeSinkId;
  try {
    const targets = Array.from(registeredElements);
    await Promise.all(targets.map((el) => applySink(el, sinkId)));
    activeSinkId = sinkId || "";
    return { ok: true };
  } catch (err) {
    // Roll back so every element keeps playing from the same device
    await Promise.all(
      Array.from(registeredElements).map((el) => applySink(el, previous).catch(() => {}))
    );
    console.warn("[AUDIO ROUTING] setSinkId failed:", err?.name);
    return { ok: false, reason: err?.name || "error" };
  }
}

/**
 * Try to (re)start playback on every remote element. Returns true if at least
 * one element is still blocked by the autoplay policy.
 */
export async function resumeRemoteAudio() {
  let blocked = false;
  await Promise.all(
    Array.from(registeredElements).map(async (el) => {
      if (!el.srcObject || !el.paused) return;
      try {
        await el.play();
      } catch (err) {
        if (err?.name === "NotAllowedError") blocked = true;
      }
    })
  );
  return blocked;
}

export function getActiveAudioOutput() {
  return activeSinkId;
}

export function resetAudioOutputState() {
  activeSinkId = "";
}
