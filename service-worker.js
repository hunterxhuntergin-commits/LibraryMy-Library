// ============================================
// Service Worker — مكتبتي
// يخزّن هيكل الموقع فقط (index.html, manifest, الأيقونات)
// لا يتدخل أبدًا في طلبات Supabase (بيانات/صور/تحديث لحظي) ولا مكتبات CDN
// ============================================

const CACHE_VERSION = 'maktabati-v1';
const APP_SHELL = [
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // لا تتدخل أبدًا بطلبات خارج نفس الموقع (Supabase، خطوط جوجل، مكتبات CDN، إلخ)
  if (url.origin !== self.location.origin) return;

  // تصفح الصفحة نفسها: شبكة أولاً، ورجوع للنسخة المخزنة لو النت مقطوع
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // أصول ثابتة من نفس الموقع (manifest، أيقونات): مخزّن أولاً ثم الشبكة
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
