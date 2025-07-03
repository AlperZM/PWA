const CACHE_NAME = 'my-muse-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/assets/icons/icon-48x48.png',
  '/assets/icons/icon-72x72.png',
  '/assets/icons/icon-96x96.png',
  '/assets/icons/icon-128x128.png',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  '/assets/icons/icon-maskable-192x192.png',
  '/assets/icons/icon-maskable-512x512.png',
  '/assets/screenshots/screenshot-wide.png',
  '/assets/screenshots/screenshot-square.png'
];

// Kurulum (Install) Olayı: Service Worker'ı kaydettiğimizde çalışır
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Önbelleğe alma işlemi başladı:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('SW: Önbelleğe alma hatası:', error);
      })
  );
});

// Etkinleştirme (Activate) Olayı: Eski önbellekleri temizler
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Eski önbellek siliniyor:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => { // EKLENDİ: Etkinleştikten sonra mevcut önbellekleri listele
      console.log('SW: Service Worker etkinleştirildi.');
      caches.open(CACHE_NAME).then(cache => {
        cache.keys().then(requests => {
          console.log('SW: Önbellekteki mevcut kaynaklar:');
          requests.forEach(request => {
            console.log('   -', request.url); // Önbellekteki her kaynağın URL'ini yazdır
          });
        });
      });
    })
  );
});

// Getirme (Fetch) Olayı: Ağ isteklerini yakalar ve önbellekten veya ağdan yanıt verir
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('SW: Önbellekten çekildi:', event.request.url); // EKLENDİ
          return response;
        }
        
        console.log('SW: Ağı kullanarak çekiliyor:', event.request.url); // EKLENDİ
        return fetch(event.request).then(
          response => {
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log('SW: Önbelleğe alındı:', event.request.url); // EKLENDİ
              });

            return response;
          }
        );
      })
  );
});
