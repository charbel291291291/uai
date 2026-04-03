// ============================================================================
// SERVICE WORKER FOR CACHING AND OFFLINE SUPPORT
// SECURITY HARDENED: Never cache sensitive data or authenticated routes
// ============================================================================

const CACHE_NAME = 'uai-cache-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Resources to cache immediately (app shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
];

// ============================================================================
// SECURITY: Routes and URLs that should NEVER be cached
// ============================================================================

const SENSITIVE_ROUTES = [
  '/auth',           // Authentication endpoints
  '/dashboard',      // User dashboard (authenticated)
  '/profile',        // User profile data
  '/admin',          // Admin panel
  '/settings',       // User settings
];

const SENSITIVE_PATTERNS = [
  /\/api\//i,                    // All API calls
  /\/auth\//i,                   // Auth-related endpoints
  /supabase/i,                   // Supabase requests
  /token/i,                      // Token-related requests
  /session/i,                    // Session-related requests
  /user\//i,                     // User data endpoints
];

/**
 * Check if request should NEVER be cached (security-sensitive)
 */
function isSensitiveRequest(request) {
  const url = new URL(request.url);
  
  // Check against sensitive route patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(url.pathname) || pattern.test(url.href)) {
      console.log('[Service Worker] 🔒 Sensitive request detected, skipping cache:', url.pathname);
      return true;
    }
  }
  
  // Check against sensitive routes list
  for (const route of SENSITIVE_ROUTES) {
    if (url.pathname.toLowerCase().startsWith(route.toLowerCase())) {
      console.log('[Service Worker] 🔒 Sensitive route detected, skipping cache:', url.pathname);
      return true;
    }
  }
  
  // Check if request has auth headers (likely contains tokens)
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    console.log('[Service Worker] 🔒 Authenticated request, skipping cache:', url.pathname);
    return true;
  }
  
  // Check if request method is not GET (state-changing)
  if (request.method !== 'GET') {
    console.log('[Service Worker] 🔒 Non-GET request, skipping cache:', url.pathname);
    return true;
  }
  
  return false;
}

// Network timeout for fetch requests
const NETWORK_TIMEOUT = 5000;

// ============================================================================
// INSTALL EVENT - Cache static assets
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete, skipping waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Failed to cache assets:', error);
      })
  );
});

// ============================================================================
// ACTIVATE EVENT - Clean old caches
// ============================================================================

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => !currentCaches.includes(name))
            .map((name) => {
              console.log('[Service Worker] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete, claiming clients');
        return self.clients.claim();
      })
  );
});

// ============================================================================
// FETCH EVENT - Network first with cache fallback strategy
// ============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // SECURITY CHECK: Skip caching for sensitive routes/APIs
  if (isSensitiveRequest(request)) {
    event.respondWith(networkOnly(request));
    return;
  }
  
  // API calls - network only (already checked above, but explicit for clarity)
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) {
    event.respondWith(networkOnly(request));
    return;
  }
  
  // Static assets - cache first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // HTML pages - network first with timeout and cache fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithTimeout(request));
    return;
  }
  
  // Default - stale while revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

/**
 * Cache First - Best for NON-SENSITIVE static assets
 * Includes security check before caching
 */
async function cacheFirst(request) {
  // Security check: Never cache sensitive requests
  if (isSensitiveRequest(request)) {
    return networkOnly(request);
  }
  
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('[Service Worker] Cache hit:', request.url);
    
    // Update cache in background
    fetchAndCache(request).catch(console.error);
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Only cache if response is OK and not sensitive
    if (networkResponse.ok && !isSensitiveRequest(request)) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network First - Best for dynamic content (NON-SENSITIVE)
 * Includes security validation before caching
 */
async function networkFirst(request) {
  // Security check: Never cache sensitive requests
  if (isSensitiveRequest(request)) {
    return networkOnly(request);
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Only cache non-sensitive, successful responses
    if (networkResponse.ok && !isSensitiveRequest(request)) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    
    // Don't use cache for sensitive requests
    if (isSensitiveRequest(request)) {
      throw error;
    }
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

/**
 * Network First with Timeout - For HTML pages (NON-SENSITIVE)
 * Includes security validation
 */
async function networkFirstWithTimeout(request) {
  // Security check: Never cache sensitive requests
  if (isSensitiveRequest(request)) {
    return networkOnly(request);
  }
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), NETWORK_TIMEOUT);
  });
  
  try {
    const networkResponse = await Promise.race([
      fetch(request),
      timeoutPromise,
    ]);
    
    if (networkResponse.ok && !isSensitiveRequest(request)) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network timeout, using cache');
    
    // Don't use cache for sensitive requests
    if (isSensitiveRequest(request)) {
      throw error;
    }
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return caches.match('/offline.html');
  }
}

/**
 * Stale While Revalidate - Best for frequently updated resources (NON-SENSITIVE)
 * Includes security validation
 */
async function staleWhileRevalidate(request) {
  // Security check: Never cache sensitive requests
  if (isSensitiveRequest(request)) {
    return networkOnly(request);
  }
  
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    // Only cache non-sensitive, successful responses
    if (networkResponse.ok && !isSensitiveRequest(request)) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);
  
  return cachedResponse || fetchPromise || new Response('Offline', { status: 503 });
}

/**
 * Network Only - For API calls and sensitive requests
 * NEVER cache these responses
 */
async function networkOnly(request) {
  try {
    const response = await fetch(request);
    
    // Double-check: Don't cache even if response is successful
    // This prevents accidental caching of sensitive data
    return response;
  } catch (error) {
    console.error('[Service Worker] Network request failed:', error);
    
    // Return appropriate error based on request type
    if (request.headers.get('accept')?.includes('application/json')) {
      return new Response(JSON.stringify({ 
        error: 'Network request failed',
        code: 'NETWORK_ERROR'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response('Network error', { status: 503 });
  }
}

/**
 * Helper: Fetch and cache response (WITH SECURITY CHECK)
 */
async function fetchAndCache(request) {
  // Security check: Never cache sensitive requests
  if (isSensitiveRequest(request)) {
    console.log('[Service Worker] 🔒 Background fetch skipped (sensitive):', request.url);
    return;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, response.clone());
    }
  } catch (error) {
    console.warn('[Service Worker] Background fetch failed:', error);
  }
}

/**
 * Helper: Check if URL is for a static asset
 */
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', 
    '.webp', '.ico', '.woff', '.woff2', '.eot', '.ttf', '.otf'
  ];
  
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// ============================================================================
// BACKGROUND SYNC (for offline form submissions)
// ============================================================================

self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sync event:', event.tag);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  // Implement your sync logic here
  console.log('[Service Worker] Syncing messages...');
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  const data = event.data?.json() || {};
  const title = data.title || 'New Notification';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/badge-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ============================================================================
// NOTIFICATION CLICK
// ============================================================================

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(names => Promise.all(names.map(name => caches.delete(name))))
    );
  }
});

console.log('[Service Worker] Service Worker loaded');
