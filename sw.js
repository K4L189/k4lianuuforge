// Service Worker - K4L1 Studio & Anuu-Forge (ACE Concilium 161914)
// Frecuencia Operativa: 189.89.619 Hz
const CACHE_NAME = 'k4li-anuu-forge-v2.8';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './README.md',
  './manifest.json',
  './vendor/tailwind.min.js',
  './assets/css/anuu_gate.css',
  './assets/js/anuu_gate.js',
  './assets/css/fullwallpaper.css',
  './assets/js/fullwallpaper.js',
  './assets/js/bunker_vault.js',
  './omega/index.html',
  './omega/omega_stage.css',
  './omega/omega_bridge.js',
  './omega/codex_144.json',
  './api/README_API.md',
  './docs/QLLM_NEURAL_SURGERY_ARCHITECTURE.md',
  './assets/vault_payload.json',
  './assets/relics_manifest.json',
  './assets/carver_status.json',
  './assets/js/vendor/three.min.js',
  './assets/js/vendor/GLTFLoader.js',
  './assets/js/vendor/OrbitControls.js',
  './assets/js/vendor/three-vrm.js',
  './components/internal_crm.html',
  './components/contract_generator.html',
  './components/terminal_hud.html',
  './components/relics_explorer.html',
  './components/ai_benchmark_calculator.html',
  './components/roi_calculator.html',
  './components/security_audit_tool.html',
  './components/market_arbitrage_engine.html',
  './components/sovereign_sanctuary.html',
  './components/vrm_avatar_studio.html',
  './components/resonance_synthesizer.html',
  './components/forensic_carver_service.html',
  './components/os_deployment_forge.html',
  './components/network_diagnostic_studio.html',
  './components/local_ai_studio.html',
  './components/hardware_arsenal_deck.html',
  './components/focusrite_dsp_studio.html',
  './components/stego_dna_lab.html',
  './components/whisper_subtitle_studio.html',
  './assets/css/hud_core.css',
  './assets/js/hud_core.js',
  './assets/css/k4li_markdown.css',
  './assets/js/k4li_markdown.js',
  './assets/css/forge_cards.css',
  './assets/js/forge_cards.js',
  './assets/icons/sprite.svg',
  './assets/brand/favicon.ico',
  './assets/wallpapers/anu_banner.png',
  './assets/wallpapers/anuu_core.jpg',
  './assets/wallpapers/anuu_hero.png',
  './assets/wallpapers/bg_nexus.png',
  './assets/wallpapers/bruma_mist.jpg',
  './assets/wallpapers/kilonova_sovereign.jpg',
  './assets/wallpapers/nexus_stellar.png',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Anuu SW 161914] Pre-caching core shell assets');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[Anuu SW] Warning caching non-critical resource:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Anuu SW] Purging obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Solo interceptar peticiones GET
  if (e.request.method !== 'GET') return;
  
  // Ignorar endpoints de API dinámica o Signal externo
  if (e.request.url.includes('/api/') || e.request.url.includes('signal.me')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Retornar caché y actualizar en background (Stale-while-revalidate)
        fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
        return networkResponse;
      });
    }).catch(() => {
      // Fallback offline básico
      if (e.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
