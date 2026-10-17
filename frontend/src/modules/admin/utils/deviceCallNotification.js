/**
 * MCPA Construction & Supply - Enterprise Device & Browser Call Notification Service
 * 
 * Manages:
 * 1. Audio Ringtone playback (universfield-ringtone-030-437513.mp3)
 * 2. Mobile vibration patterns (navigator.vibrate)
 * 3. Browser OS-level native Notifications (Desktop / Android Notification Center)
 * 4. Service Worker background registration for PWA call handling
 */

let ringtoneAudio = null;
let vibrationInterval = null;
let webAudioRingerStop = null;
let isCallRingingActive = false;

// Global audio unlocker on user gesture
if (typeof window !== "undefined") {
  const handleUserGesture = () => {
    if (ringtoneAudio && isCallRingingActive && ringtoneAudio.paused) {
      ringtoneAudio.play().catch(() => {});
    }
  };
  window.addEventListener("pointerdown", handleUserGesture, { passive: true });
  window.addEventListener("keydown", handleUserGesture, { passive: true });
  window.addEventListener("click", handleUserGesture, { passive: true });
}

/**
 * Synthesize standard telephone ringer (440Hz + 480Hz dual-frequency chime)
 * as an instant audible fallback if the browser blocks MP3 autoplay.
 */
function playSynthesizedTelephoneRinger() {
  if (typeof window === "undefined") return null;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    const ctx = new AudioCtx();
    let isActive = true;
    let loopTimer = null;

    const cadenceRing = () => {
      if (!isActive || ctx.state === "closed") return;

      const now = ctx.currentTime;
      // Burst 1 (800ms)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain.gain.setValueAtTime(0.15, now + 0.75);
      gain.gain.linearRampToValueAtTime(0, now + 0.80);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.85);
      osc2.stop(now + 0.85);

      // Burst 2 (800ms, starts at now + 1.2s)
      const osc1b = ctx.createOscillator();
      const osc2b = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc1b.type = "sine";
      osc2b.type = "sine";
      osc1b.frequency.setValueAtTime(440, now + 1.2);
      osc2b.frequency.setValueAtTime(480, now + 1.2);

      gain2.gain.setValueAtTime(0, now + 1.2);
      gain2.gain.linearRampToValueAtTime(0.15, now + 1.25);
      gain2.gain.setValueAtTime(0.15, now + 1.95);
      gain2.gain.linearRampToValueAtTime(0, now + 2.0);

      osc1b.connect(gain2);
      osc2b.connect(gain2);
      gain2.connect(ctx.destination);

      osc1b.start(now + 1.2);
      osc2b.start(now + 1.2);
      osc1b.stop(now + 2.05);
      osc2b.stop(now + 2.05);

      // Repeat every 4 seconds
      loopTimer = setTimeout(cadenceRing, 4000);
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(() => cadenceRing()).catch(() => {});
    } else {
      cadenceRing();
    }

    return () => {
      isActive = false;
      if (loopTimer) clearTimeout(loopTimer);
      try {
        ctx.close();
      } catch (e) {}
    };
  } catch (err) {
    return null;
  }
}

/**
 * Register Service Worker for background push and notification click handling
 */
export async function registerCallServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    console.log("[DEVICE NOTIFICATION] Service Worker registered with scope:", registration.scope);
    return registration;
  } catch (err) {
    console.warn("[DEVICE NOTIFICATION] Service Worker registration failed:", err);
    return null;
  }
}

/**
 * Request Browser / OS-level notification permission
 * @returns {Promise<NotificationPermission>} 'granted' | 'denied' | 'default'
 */
export async function requestCallNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") {
    return "granted";
  }
  try {
    const permission = await Notification.requestPermission();
    console.log("[DEVICE NOTIFICATION] Notification permission result:", permission);
    return permission;
  } catch (err) {
    console.warn("[DEVICE NOTIFICATION] Permission request error:", err);
    return "denied";
  }
}

/**
 * Check if browser notifications are currently granted
 */
export function hasCallNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  return Notification.permission === "granted";
}

/**
 * Plays the universfield-ringtone-030-437513.mp3 ringtone in a continuous loop
 * with Web Audio synthesizer fallback and mobile vibration pattern.
 */
export function playIncomingCallRingtone() {
  if (typeof window === "undefined") return;

  isCallRingingActive = true;

  try {
    if (!ringtoneAudio) {
      ringtoneAudio = new Audio("/sounds/universfield-ringtone-030-437513.mp3");
      ringtoneAudio.loop = true;
      ringtoneAudio.volume = 1.0;
      ringtoneAudio.preload = "auto";
    }

    ringtoneAudio.currentTime = 0;
    const playPromise = ringtoneAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("[DEVICE NOTIFICATION] Audio autoplay policy prevented MP3 playback, starting Web Audio fallback:", err);
        // Browser autoplay blocked MP3: Start synthesized dual-frequency ringer as backup
        if (!webAudioRingerStop) {
          webAudioRingerStop = playSynthesizedTelephoneRinger();
        }
      });
    }
  } catch (e) {
    console.warn("[DEVICE NOTIFICATION] Error playing ringtone audio:", e);
    if (!webAudioRingerStop) {
      webAudioRingerStop = playSynthesizedTelephoneRinger();
    }
  }

  // Device Vibration Pattern for mobile phones (500ms vibrate, 250ms pause, loop)
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([500, 250, 500, 250, 500, 250, 500]);
      if (vibrationInterval) clearInterval(vibrationInterval);
      vibrationInterval = setInterval(() => {
        navigator.vibrate([500, 250, 500, 250, 500]);
      }, 3000);
    }
  } catch (e) {}
}

/**
 * Stops ringtone audio and cancels device vibration immediately
 */
export function stopIncomingCallRingtone() {
  isCallRingingActive = false;

  if (ringtoneAudio) {
    try {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
    } catch (e) {}
  }

  if (webAudioRingerStop) {
    try {
      webAudioRingerStop();
    } catch (e) {}
    webAudioRingerStop = null;
  }

  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }

  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(0);
    }
  } catch (e) {}
}

/**
 * Displays an OS-level native device notification in Windows / Mac / Android notification shade
 * @param {object} callPayload 
 * @param {function} onNotificationClick 
 */
export async function showDeviceCallNotification(callPayload, onNotificationClick) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  const clientName = callPayload?.clientName || "Valued Client";
  const projectTitle = callPayload?.projectTitle || "Instant Architectural Consultation";
  const roomCode = callPayload?.roomCode || "";

  const title = `📞 Incoming Call from ${clientName}!`;
  const body = `Instant video consultation requested for ${projectTitle}. Tap to answer now.`;

  try {
    // If Service Worker is ready, use registration.showNotification (recommended for mobile background)
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && "showNotification" in reg) {
        reg.showNotification(title, {
          body,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: "mcpa-instant-call",
          renotify: true,
          requireInteraction: true,
          vibrate: [500, 250, 500, 250, 500],
          data: {
            url: `/admin?tab=meetings&room=${roomCode}`,
            roomCode,
          },
        });
        return;
      }
    }

    // Standard Window Notification fallback
    const notification = new Notification(title, {
      body,
      icon: "/icon-192.png",
      tag: "mcpa-instant-call",
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (typeof onNotificationClick === "function") {
        onNotificationClick();
      }
    };
  } catch (err) {
    console.warn("[DEVICE NOTIFICATION] Error creating native notification:", err);
  }
}
