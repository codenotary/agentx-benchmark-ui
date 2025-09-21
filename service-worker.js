/**
 * JSONIC Service Worker
 * Provides offline-first caching with progressive loading
 */

const CACHE_VERSION = 'jsonic-v1.0.0';
const CORE_CACHE = `${CACHE_VERSION}-core`;
const FEATURE_CACHE = `${CACHE_VERSION}-features`;
const DATA_CACHE = `${CACHE_VERSION}-data`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;

// Core files that should always be cached
const CORE_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

// Feature chunks that can be cached on-demand
const FEATURE_PATTERNS = [
  /\/static\/js\/jsonic-.*\.chunk\.js$/,
  /\/static\/js\/\d+\.\w+\.chunk\.js$/,
];

// API endpoints to cache
const API_PATTERNS = [
  /\/api\/benchmarks\//,
  /\/api\/config\//,
];

// Install event - pre-cache core files
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => {
      console.log('[Service Worker] Pre-caching core files');
      return cache.addAll(CORE_FILES.filter(file => {
        // Only cache files that exist
        return fetch(file, { method: 'HEAD' })
          .then(() => true)
          .catch(() => false);
      }));
    }).then(() => {
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old version caches
          if (cacheName.startsWith('jsonic-') && 
              !cacheName.startsWith(CACHE_VERSION)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) protocols
  if (!request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(handleFetch(request, url));
});

/**
 * Handle fetch requests with appropriate caching strategy
 */
async function handleFetch(request, url) {
  // Check if it's a core file
  if (CORE_FILES.includes(url.pathname)) {
    return cacheFirst(request, CORE_CACHE);
  }
  
  // Check if it's a feature chunk
  if (FEATURE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return cacheFirst(request, FEATURE_CACHE);
  }
  
  // Check if it's an API endpoint
  if (API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return networkFirst(request, DATA_CACHE);
  }
  
  // Check if it's a static asset
  if (url.pathname.startsWith('/static/') || 
      url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/)) {
    return cacheFirst(request, STATIC_CACHE);
  }
  
  // Default: network first for HTML and other content
  return networkFirst(request, STATIC_CACHE);
}

/**
 * Cache-first strategy
 * Try cache first, fallback to network
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  // Try to get from cache
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    // Update cache in background
    fetchAndCache(request, cache);
    return cachedResponse;
  }
  
  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    
    // Return offline page if available
    const offlineResponse = await cache.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    throw error;
  }
}

/**
 * Network-first strategy
 * Try network first, fallback to cache
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[Service Worker] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // No cache available
    console.error('[Service Worker] Network and cache failed:', error);
    throw error;
  }
}

/**
 * Fetch and update cache in background
 */
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response);
    }
  } catch (error) {
    // Silent fail - we already returned from cache
  }
}

// Message handling for feature pre-caching
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'PRE_CACHE_FEATURE':
      preCacheFeature(data.feature);
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
      
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
  }
});

/**
 * Pre-cache a feature module
 */
async function preCacheFeature(feature) {
  const cache = await caches.open(FEATURE_CACHE);
  const featureUrl = `/static/js/jsonic-${feature}.chunk.js`;
  
  try {
    const response = await fetch(featureUrl);
    if (response.ok) {
      await cache.put(featureUrl, response);
      console.log(`[Service Worker] Pre-cached feature: ${feature}`);
    }
  } catch (error) {
    console.error(`[Service Worker] Failed to pre-cache feature ${feature}:`, error);
  }
}

/**
 * Get cache statistics
 */
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const requests = await cache.keys();
    
    status[name] = {
      count: requests.length,
      size: 0, // Size calculation would require iteration
      urls: requests.map(r => r.url)
    };
  }
  
  return {
    version: CACHE_VERSION,
    caches: status,
    totalCaches: cacheNames.length
  };
}

/**
 * Clear all caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  
  await Promise.all(
    cacheNames.map(name => caches.delete(name))
  );
  
  console.log('[Service Worker] All caches cleared');
}

// Periodic cache cleanup (every hour)
setInterval(() => {
  cleanupOldCaches();
}, 60 * 60 * 1000);

/**
 * Clean up old cache entries
 */
async function cleanupOldCaches() {
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  const now = Date.now();
  
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    if (cacheName === CORE_CACHE) {
      continue; // Don't clean core cache
    }
    
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const responseTime = new Date(dateHeader).getTime();
          if (now - responseTime > maxAge) {
            await cache.delete(request);
            console.log('[Service Worker] Deleted old cache entry:', request.url);
          }
        }
      }
    }
  }
}

console.log('[Service Worker] Loaded successfully');