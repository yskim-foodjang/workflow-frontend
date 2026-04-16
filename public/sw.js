self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'WorkFlow', body: event.data.text() };
  }

  const options = {
    body: payload.body || '',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    data: { url: payload.url || '/' },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'WorkFlow 알림', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
