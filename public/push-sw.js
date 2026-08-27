/* HkeeemAI — Web Push handlers.
   Imported by the generated Workbox service worker (/sw.js) via importScripts.
   Handles incoming push messages and notification clicks. */

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "حكيم AI", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "حكيم AI";
  const options = {
    body: payload.body || "وصلك عرض جديد — افتح التطبيق لتشوف التفاصيل.",
    icon: payload.icon || "/hkeeem_192.png",
    badge: payload.badge || "/hkeeem_192.png",
    image: payload.image,
    dir: "rtl",
    lang: "ar",
    tag: payload.tag || "hkeeem-deal",
    renotify: Boolean(payload.tag),
    requireInteraction: Boolean(payload.requireInteraction),
    data: { url: payload.url || "/", ...(payload.data || {}) },
    actions: Array.isArray(payload.actions) ? payload.actions.slice(0, 2) : [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const url = new URL(target, self.location.origin).href;
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      for (const client of clientList) {
        if ("navigate" in client && "focus" in client) {
          await client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
      return undefined;
    })(),
  );
});
