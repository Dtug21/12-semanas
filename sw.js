// Service Worker — 12 Semanas Piso Pélvico
const SCOPE = '/12-semanas-/';
let pendingTimeouts = [];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('message', event => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'SCHEDULE') {
    // Cancelar los anteriores
    pendingTimeouts.forEach(clearTimeout);
    pendingTimeouts = [];

    (data.slots || []).forEach(slot => {
      if (!slot.delay || slot.delay <= 0 || slot.delay > 86400000) return;
      pendingTimeouts.push(setTimeout(async () => {
        // Verificar si el cliente está abierto y activo
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const active = clients.find(c => c.visibilityState === 'visible');
        // Si está en pantalla, no mostrar notificación del sistema
        if (active) return;
        self.registration.showNotification(slot.title, {
          body: slot.body,
          icon: SCOPE + 'icon-192.png',
          badge: SCOPE + 'icon-192.png',
          tag: slot.tag || 'rutina',
          data: { url: SCOPE },
          requireInteraction: false,
          silent: false,
        });
      }, slot.delay));
    });
  }

  if (data.type === 'NOTIFY_NOW') {
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: SCOPE + 'icon-192.png',
      tag: data.tag || 'now',
      data: { url: SCOPE },
    });
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data?.url || SCOPE;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url.includes('/12-semanas-') && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
