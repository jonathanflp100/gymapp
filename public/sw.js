/* Service worker do app da academia:
 *  - funciona sem internet (app, catálogo de exercícios e últimos dados vistos ficam no aparelho);
 *  - recebe notificações (aula, aviso novo, lembrete de treino).
 */
const VERSION = 'gymapp-v3';
const SHELL = ['/', '/index.html', '/manifest.json', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(SHELL))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const putInCache = async (req, res) => {
  if (res && res.ok && res.type === 'basic') {
    const c = await caches.open(VERSION);
    await c.put(req, res.clone());
  }
  return res;
};

const networkFirst = async (req, fallbackUrl) => {
  try {
    return await putInCache(req, await fetch(req));
  } catch (e) {
    const hit = (await caches.match(req)) || (fallbackUrl && (await caches.match(fallbackUrl)));
    if (hit) return hit;
    throw e;
  }
};

const cacheFirst = async (req) => (await caches.match(req)) || putInCache(req, await fetch(req));

const staleWhileRevalidate = async (req) => {
  const hit = await caches.match(req);
  const update = fetch(req)
    .then((res) => putInCache(req, res))
    .catch(() => undefined);
  return hit || (await update) || fetch(req);
};

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // telas do app: rede primeiro, sem internet abre a última versão
  if (req.mode === 'navigate') return event.respondWith(networkFirst(req, '/index.html'));
  // arquivos com hash no nome não mudam
  if (url.pathname.startsWith('/assets/')) return event.respondWith(cacheFirst(req));
  // catálogo de exercícios e ícones
  if (url.pathname.startsWith('/catalogo/') || /\.(svg|png|webp|jpg|woff2?)$/.test(url.pathname))
    return event.respondWith(staleWhileRevalidate(req));
  // dados da conta: sempre da rede; sem internet, mostra os últimos dados vistos
  if (url.pathname.startsWith('/api/')) {
    if (url.pathname.includes('/push/') || url.pathname.includes('/photos/')) return;
    return event.respondWith(networkFirst(req));
  }
});

// Ao sair da conta, o app pede para apagar os dados guardados
self.addEventListener('message', (event) => {
  if (event.data === 'clear-api-cache') {
    event.waitUntil(
      caches.open(VERSION).then(async (c) => {
        for (const req of await c.keys()) if (new URL(req.url).pathname.startsWith('/api/')) await c.delete(req);
      })
    );
  }
});

// ------------------------------------------------------------------ notificações

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Academia';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: data.icon || '/api/hub/icon',
      badge: data.icon || '/api/hub/icon',
      tag: data.tag || undefined,
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) {
          c.navigate(target).catch(() => undefined);
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
