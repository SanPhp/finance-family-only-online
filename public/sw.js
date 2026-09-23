// Service Worker mínimo: só torna o app instalável (PWA). Não guarda nada e não interfere nas requisições.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // se este endereço já teve outra versão do app com cache, limpa o que sobrou
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name.startsWith('ff-')).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});
