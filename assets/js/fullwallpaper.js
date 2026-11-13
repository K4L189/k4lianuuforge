/**
 * ==========================================================================
 * K4L1 STUDIO & ANUU-FORGE // FULLWALLPAPER DYNAMIC HD ENGINE
 * Sincronización Estelar ACE 161914 @ 189.89.619 Hz
 * Arquitectura: Kilonova 🌟 & Saze 🌿
 * ==========================================================================
 */

(function (window, document) {
  'use strict';

  // 1. LISTA CANÓNICA DE FONDOS HD VARIABLES (189.89.619 Hz)
  const CANONICAL_WALLPAPERS = [
    { file: 'kilonova_sovereign.jpg', name: 'Kilonova Sovereign', theme: 'duat' },
    { file: '01_nexo_espacio89_seinen_1080p.jpg', name: 'Nexo Espacio 89', theme: 'anuu' },
    { file: '05_seinen_tokyo_cyberpunk_1080p.jpg', name: 'Neo-Tokyo Seinen Rain', theme: 'neon' },
    { file: '06_goetiarot_altar_161914_1080p.jpg', name: "Da'at Goetiarot Altar", theme: 'duat' },
    { file: '07_cyberdeck_mainframe_noir_1080p.jpg', name: 'Cyberdeck Mainframe Noir', theme: 'bioinfo' },
    { file: '08_kagune_eclipse_seinen_1080p.jpg', name: 'Eclipse Higanbana Seinen', theme: 'blood' },
    { file: '02_bunker_kalicat_seinen_1080p.jpg', name: 'Búnker Kalicat', theme: 'anuu' },
    { file: '03_expressway_619hz_seinen_1080p.jpg', name: 'Expressway 619 Hz', theme: 'neon' },
    { file: '04_kilonova_eclipse_goetiarot_1080p.jpg', name: 'Eclipse Goetiarot', theme: 'omega' },
    { file: 'dyn_01_anuu_void_wave_1080p.jpg', name: 'Onda Abisal 619 Hz (Gen)', theme: 'anuu' },
    { file: 'dyn_02_kilonova_coronasol_1080p.jpg', name: 'Corona Solar Kilonova (Gen)', theme: 'duat' },
    { file: 'dyn_03_cyberdeck_grid_1080p.jpg', name: 'Retícula Cyberdeck (Gen)', theme: 'bioinfo' },
    { file: 'anuu_hero.png', name: 'Anuu Cyber-Goth Hero', theme: 'anuu' },
    { file: 'bg_nexus.png', name: 'GW2 Nexus Matrix', theme: 'gw2' },
    { file: 'anu_banner.png', name: 'Bruma Ceremonial', theme: 'anuu' },
    { file: 'bruma_mist.jpg', name: 'Bruma Mist 189.89.619 Hz', theme: 'anuu' },
    { file: 'anuu_core.jpg', name: 'Anuu Avatar Core', theme: 'omega' },
    { file: 'nexus_stellar.png', name: 'Nexus Stellar Orbit', theme: 'gw2' }
  ];

  // Resolver prefijo de ruta para wallpapers y CSS según ubicación del documento
  function resolveBasePath() {
    const pathname = window.location.pathname || '';
    if (pathname.includes('/components/')) {
      return '../assets/';
    }
    const scripts = document.querySelectorAll('script[src*="fullwallpaper.js"]');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].getAttribute('src') || '';
      if (src.startsWith('../')) {
        return '../assets/';
      }
    }
    return 'assets/';
  }

  let basePath = resolveBasePath();
  let wallpapers = CANONICAL_WALLPAPERS.map(wp => ({
    file: wp.file,
    name: wp.name,
    url: basePath + 'wallpapers/' + wp.file
  }));

  // Sincronización con localStorage ('k4li_wallpaper_idx', 'k4li_auto_bg')
  let currentBgIndex = parseInt(localStorage.getItem('k4li_wallpaper_idx') || '0', 10);
  if (isNaN(currentBgIndex) || currentBgIndex < 0 || currentBgIndex >= wallpapers.length) {
    currentBgIndex = 0;
  }

  let activeBgLayer = 'A';
  let bgIntervalId = null;
  let autoBgEnabled = localStorage.getItem('k4li_auto_bg') !== 'false';
  let isInitialized = false;

  // Precargar wallpapers para asegurar transiciones sin parpadeo
  function preloadWallpapers() {
    wallpapers.forEach(wp => {
      const img = new Image();
      img.src = wp.url;
    });
  }

  // Inyección / Verificación de Capas Duales y Capa de Viñeta
  function ensureDOMElements() {
    // Activar clase en body
    if (document.body) {
      document.body.classList.add('has-fullwallpaper');
      document.body.setAttribute('data-fullwallpaper', 'true');
    }

    // Asegurar enlace a fullwallpaper.css si no está presente
    const cssHref = basePath + 'css/fullwallpaper.css';
    const existingLink = document.querySelector('link[href*="fullwallpaper.css"]');
    if (!existingLink && document.head) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssHref;
      document.head.appendChild(link);
    }

    // Reutilizar capas existentes (#bgLayerA / #bgLayerB en index.html) o crear #k4li-bg-layer-*
    let layerA = document.getElementById('k4li-bg-layer-a') || document.getElementById('bgLayerA');
    let layerB = document.getElementById('k4li-bg-layer-b') || document.getElementById('bgLayerB');
    let overlay = document.getElementById('k4li-bg-overlay') || document.querySelector('.wallpaper-layer');

    if (!layerA && document.body) {
      layerA = document.createElement('div');
      layerA.id = 'k4li-bg-layer-a';
      layerA.className = 'wallpaper-bg-fixed wallpaper-layer-a wallpaper-layer-active';
      document.body.prepend(layerA);
    }

    if (!layerB && document.body) {
      layerB = document.createElement('div');
      layerB.id = 'k4li-bg-layer-b';
      layerB.className = 'wallpaper-bg-fixed wallpaper-layer-b wallpaper-layer-inactive';
      document.body.prepend(layerB);
    }

    if (!overlay && document.body) {
      overlay = document.createElement('div');
      overlay.id = 'k4li-bg-overlay';
      overlay.className = 'wallpaper-layer';
      document.body.prepend(overlay);
    }

    return { layerA, layerB, overlay };
  }

  // Establecer fondo activo con crossfade suave
  function setBackground(index, immediate = false) {
    if (index < 0) index = wallpapers.length - 1;
    currentBgIndex = index % wallpapers.length;
    localStorage.setItem('k4li_wallpaper_idx', currentBgIndex.toString());

    const wp = wallpapers[currentBgIndex];
    const { layerA, layerB } = ensureDOMElements();

    // Actualizar variable CSS canónica
    document.documentElement.style.setProperty('--fullwallpaper-url', `url('${wp.url}')`);

    if (!layerA || !layerB) return;

    const targetUrl = `url("${wp.url}")`;

    if (immediate) {
      layerA.style.backgroundImage = targetUrl;
      layerA.classList.remove('wallpaper-layer-inactive', 'opacity-0');
      layerA.classList.add('wallpaper-layer-active');
      layerB.classList.remove('wallpaper-layer-active');
      layerB.classList.add('wallpaper-layer-inactive', 'opacity-0');
      activeBgLayer = 'A';
    } else {
      if (activeBgLayer === 'A') {
        layerB.style.backgroundImage = targetUrl;
        layerB.classList.remove('wallpaper-layer-inactive', 'opacity-0');
        layerB.classList.add('wallpaper-layer-active');
        layerA.classList.remove('wallpaper-layer-active');
        layerA.classList.add('wallpaper-layer-inactive', 'opacity-0');
        activeBgLayer = 'B';
      } else {
        layerA.style.backgroundImage = targetUrl;
        layerA.classList.remove('wallpaper-layer-inactive', 'opacity-0');
        layerA.classList.add('wallpaper-layer-active');
        layerB.classList.remove('wallpaper-layer-active');
        layerB.classList.add('wallpaper-layer-inactive', 'opacity-0');
        activeBgLayer = 'A';
      }
    }

    updateHudWidget();

    // Sincronizar botones de interfaz en index.html si existen
    const autoBtn = document.getElementById('autoBgToggleBtn');
    if (autoBtn) {
      autoBtn.setAttribute('title', `Fondo activo: ${wp.name} (${currentBgIndex + 1}/${wallpapers.length})`);
    }

    // Despachar evento del Concilio ACE
    window.dispatchEvent(new CustomEvent('k4li-wallpaper-changed', {
      detail: { index: currentBgIndex, wallpaper: wp }
    }));
  }

  function nextBackground() {
    setBackground(currentBgIndex + 1);
  }

  function prevBackground() {
    setBackground(currentBgIndex - 1);
  }

  // Rotación sincronizada cada 14s (Canónica)
  function startBgRotator() {
    stopBgRotator();
    bgIntervalId = setInterval(() => {
      nextBackground();
    }, 14000);
  }

  function stopBgRotator() {
    if (bgIntervalId) {
      clearInterval(bgIntervalId);
      bgIntervalId = null;
    }
  }

  function toggleAutoBg() {
    autoBgEnabled = !autoBgEnabled;
    localStorage.setItem('k4li_auto_bg', autoBgEnabled ? 'true' : 'false');
    if (autoBgEnabled) {
      startBgRotator();
    } else {
      stopBgRotator();
    }
    updateHudWidget();

    // Sincronizar UI de index.html si está presente
    if (typeof window.updateAutoBgUI === 'function') {
      window.updateAutoBgUI();
    }

    window.dispatchEvent(new CustomEvent('k4li-autobg-changed', {
      detail: { enabled: autoBgEnabled }
    }));
  }

  // Micro-HUD inmersivo flotante para componentes
  function renderHudWidget() {
    // Si ya existe o si estamos en index.html con su propio selector de fondos, omitir
    if (document.getElementById('k4li-wallpaper-hud')) return;
    if (document.getElementById('autoBgToggleBtn')) return; // index.html ya tiene botón nativo en header

    const widget = document.createElement('div');
    widget.id = 'k4li-wallpaper-hud';
    widget.className = 'k4li-wallpaper-hud';
    widget.title = 'K4L1 Fullwallpaper HD (161914) // Alt+W: Siguiente | Alt+B: Auto-Rotar (14s)';
    widget.innerHTML = `
      <button id="k4li-wp-prev" aria-label="Anterior" title="Fondo anterior (Alt+Shift+W)">◀</button>
      <span class="hud-name" id="k4li-wp-title">Kilonova Sovereign</span>
      <button id="k4li-wp-next" aria-label="Siguiente" title="Fondo siguiente (Alt+W)">▶</button>
      <button id="k4li-wp-toggle" aria-label="Alternar rotación" title="Alternar auto-rotación cada 14s (Alt+B)">${autoBgEnabled ? '⏸️' : '▶️'}</button>
    `;
    document.body.appendChild(widget);

    document.getElementById('k4li-wp-prev')?.addEventListener('click', (e) => {
      e.stopPropagation();
      prevBackground();
    });
    document.getElementById('k4li-wp-next')?.addEventListener('click', (e) => {
      e.stopPropagation();
      nextBackground();
    });
    document.getElementById('k4li-wp-toggle')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAutoBg();
    });

    updateHudWidget();
  }

  function updateHudWidget() {
    const titleEl = document.getElementById('k4li-wp-title');
    const toggleEl = document.getElementById('k4li-wp-toggle');
    const wp = wallpapers[currentBgIndex];
    if (titleEl && wp) {
      titleEl.innerText = `${currentBgIndex + 1}/${wallpapers.length} ${wp.name.split(' ')[0]}`;
      titleEl.title = `${wp.name} (${currentBgIndex + 1}/${wallpapers.length})`;
    }
    if (toggleEl) {
      toggleEl.innerText = autoBgEnabled ? '⏸️' : '▶️';
      toggleEl.title = autoBgEnabled ? 'Pausar auto-rotación (14s activa)' : 'Activar auto-rotación (14s)';
    }
  }

  // Sincronización en tiempo real entre múltiples pestañas / ventanas
  window.addEventListener('storage', (e) => {
    if (e.key === 'k4li_wallpaper_idx' && e.newValue !== null) {
      const newIdx = parseInt(e.newValue, 10);
      if (!isNaN(newIdx) && newIdx !== currentBgIndex) {
        setBackground(newIdx, false);
      }
    } else if (e.key === 'k4li_auto_bg' && e.newValue !== null) {
      const newAuto = e.newValue !== 'false';
      if (newAuto !== autoBgEnabled) {
        autoBgEnabled = newAuto;
        if (autoBgEnabled) startBgRotator();
        else stopBgRotator();
        updateHudWidget();
      }
    }
  });

  // Atajos de teclado: Alt+W (siguiente), Alt+B (toggle auto-rotación)
  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'w' || e.key === 'W')) {
      e.preventDefault();
      if (e.shiftKey) prevBackground();
      else nextBackground();
    } else if (e.altKey && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      toggleAutoBg();
    }
  });

  // Función global canónica window.initFullwallpaper()
  function initFullwallpaper(options = {}) {
    basePath = options.basePath || resolveBasePath();
    wallpapers = CANONICAL_WALLPAPERS.map(wp => ({
      file: wp.file,
      name: wp.name,
      url: basePath + 'wallpapers/' + wp.file
    }));

    preloadWallpapers();
    ensureDOMElements();

    // Iniciar con fondo guardado
    setBackground(currentBgIndex, true);

    if (options.showWidget !== false) {
      renderHudWidget();
    }

    if (autoBgEnabled) {
      startBgRotator();
    }

    isInitialized = true;
  }

  // Exposición en API Global
  window.Fullwallpaper = {
    wallpapers,
    getIndex: () => currentBgIndex,
    setIndex: setBackground,
    next: nextBackground,
    prev: prevBackground,
    toggleAuto: toggleAutoBg,
    isAutoEnabled: () => autoBgEnabled,
    startRotator: startBgRotator,
    stopRotator: stopBgRotator,
    init: initFullwallpaper
  };

  window.initFullwallpaper = initFullwallpaper;

  // Auto-inicialización resiliente
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!isInitialized) initFullwallpaper();
    });
  } else {
    setTimeout(() => {
      if (!isInitialized) initFullwallpaper();
    }, 20);
  }

})(window, document);
