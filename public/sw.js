self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 简单的透传，确保满足 PWA 安装的基本要求
  event.respondWith(fetch(event.request));
});
