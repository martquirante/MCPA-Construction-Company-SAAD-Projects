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
 * and initiates device vibration patterns on mobile phones.
 */
export function playIncomingCallRingtone() {
  if (typeof window === "undefined") return;

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
        console.warn("[DEVICE NOTIFICATION] Audio autoplay policy required user gesture:", err);
      });
    }
  } catch (e) {
    console.warn("[DEVICE NOTIFICATION] Error playing ringtone audio:", e);
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
  if (ringtoneAudio) {
    try {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
    } catch (e) {}
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
