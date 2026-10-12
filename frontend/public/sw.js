// MCPA Construction & Supply - Enterprise Service Worker for Background Call Notifications
const CACHE_NAME = "mcpa-cache-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push notifications (even when tab is closed)
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Incoming Call", body: event.data ? event.data.text() : "Incoming instant consultation" };
  }

  const title = data.title || "📞 Incoming Instant Video Consultation!";
  const options = {
    body: data.body || "A valued client is requesting an instant architectural video consultation.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "mcpa-instant-call",
    renotify: true,
    requireInteraction: true,
    vibrate: [500, 250, 500, 250, 500, 250, 500],
    data: {
      url: data.url || "/admin?tab=meetings",
      roomCode: data.roomCode,
    },
    actions: [
      { action: "answer", title: "Answer Call" },
      { action: "decline", title: "Decline" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle user clicking the native notification on device / browser
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/admin?tab=meetings";

  if (event.action === "decline") {
    // User declined from device notification
    return;
  }

  // Focus existing admin window or open new one
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes("/admin") && "focus" in client) {
          client.postMessage({
            type: "ANSWER_INSTANT_CALL",
            roomCode: event.notification.data?.roomCode,
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
