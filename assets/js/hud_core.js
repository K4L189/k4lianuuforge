/* K4L1 HUD CORE & COMMAND PALETTE (Ctrl+K) v2.8 — Telemetry Strip + Dual-Silicon Probe + Bus + Shader (189.89.619 Hz)
   Uso: <link rel="stylesheet" href=".../assets/css/hud_core.css">
        <script src=".../assets/js/hud_core.js" data-mount="header|float" data-shader="1"></script>
   Honestidad de datos: el VU-meter solo muestra señal REAL si el usuario lo arma (clic) y concede el micro;
   el estado del Carver se lee de assets/carver_status.json (checkpoint), no es telemetría en vivo del disco. */
(function () {
  'use strict';
  if (window.K4HUD) return;

  var SCRIPT = document.currentScript || document.querySelector('script[src*="hud_core.js"]');
  var MOUNT = (SCRIPT && SCRIPT.dataset.mount) || 'float';
  var WANT_SHADER = !!(SCRIPT && SCRIPT.dataset.shader === '1');
  var LS = { lat: 'k4li_adaptive_latency_ms', scan: 'k4li_scanlines', shader: 'k4li_shader' };

  /* ---------------- SMART RELATIVE PATH RESOLUTION ---------------- */
  function detectPrefix() {
    var path = (window.location && window.location.pathname) || '';
    if (/\/(components|omega)(\/|$)/.test(path)) return '../';
    if (SCRIPT) {
      var raw = SCRIPT.getAttribute('src') || '';
      var m = raw.match(/^(.*?)assets\/js\/hud_core\.js/);
      if (m) {
        var p = m[1];
        if (p === './') return '';
        if (/^(\.\.\/)+$/.test(p)) return p;
      }
    }
    return '';
  }
  var PREFIX = detectPrefix();
  function resolvePath(rel) {
    if (!rel) return PREFIX + 'index.html';
    if (/^(https?:|mailto:|tel:|#)/i.test(rel)) return rel;
    return PREFIX + rel.replace(/^\.\//, '');
  }

  /* ---------------- CATALOG (19 STUDIOS + OMEGA + DOCS GFM + SIGNAL E2EE) ---------------- */
  var STUDIOS = [
    ['Local AI Studio', 'components/local_ai_studio.html', '🧠', 'local_ai_studio llm gguf inferencia ia local'],
    ['AI Benchmark Calculator', 'components/ai_benchmark_calculator.html', '📊', 'ai_benchmark_calculator vram tokens tps arm64 gpu'],
    ['Security Audit Tool', 'components/security_audit_tool.html', '🛡️', 'security_audit_tool auditoria pentest hardening opsec'],
    ['Forensic Carver Service', 'components/forensic_carver_service.html', '🔬', 'forensic_carver_service recuperacion forense disco'],
    ['Stego & DNA Lab', 'components/stego_dna_lab.html', '🕵️', 'stego_dna_lab esteganografia adn entropia binario'],
    ['OS Deployment Forge', 'components/os_deployment_forge.html', '💿', 'os_deployment_forge iso linux kali kernel despliegue'],
    ['Network Diagnostic Studio', 'components/network_diagnostic_studio.html', '🌐', 'network_diagnostic_studio red latencia dns diagnostico'],
    ['Focusrite DSP Studio', 'components/focusrite_dsp_studio.html', '🎛️', 'focusrite_dsp_studio scarlett audio dsp trng'],
    ['Arsenal Hardware / Akai MPC', 'components/hardware_arsenal_deck.html', '🎹', 'hardware_arsenal_deck hardware arsenal deck akai mpc midi'],
    ['Resonance Synthesizer 189.89 Hz', 'components/resonance_synthesizer.html', '🔊', 'resonance_synthesizer sintetizador frecuencia 189.89.619'],
    ['Whisper Subtitle Studio', 'components/whisper_subtitle_studio.html', '🎙️', 'whisper_subtitle_studio subtitulos srt voz transcripcion'],
    ['VRM Avatar Studio', 'components/vrm_avatar_studio.html', '💃', 'vrm_avatar_studio 3d webgl avatar rigging'],
    ['Market Arbitrage Engine', 'components/market_arbitrage_engine.html', '📈', 'market_arbitrage_engine arbitraje cuantitativo mercado'],
    ['Terminal Táctico', 'components/terminal_hud.html', '⚡', 'terminal_hud consola cli comandos shell'],
    ['Contract Generator', 'components/contract_generator.html', '📜', 'contract_generator contratos nda legal'],
    ['ROI Calculator', 'components/roi_calculator.html', '💶', 'roi_calculator retorno inversion costes ahorro'],
    ['Búnker CRM', 'components/internal_crm.html', '💼', 'internal_crm clientes proyectos pipeline crm'],
    ['Relics Explorer', 'components/relics_explorer.html', '🐾', 'relics_explorer reliquias artefactos archivo'],
    ['Sovereign Sanctuary', 'components/sovereign_sanctuary.html', '🏛️', 'sovereign_sanctuary santuario soberano concilio']
  ];

  var DOC_TOPICS = [
    ['Docs: Wiki & Lore (Espacio 89)', 'espacio89'],
    ['Docs: Tarifario de Servicios', 'tarifario'],
    ['Docs: Contrato NDA E2EE', 'nda'],
    ['Docs: Atlas de Estilos (6 Temas)', 'atlas']
  ];

  var COMMANDS = [
    ['Carver: Menú TUI Interactivo Gum', 'anuu-carver'],
    ['Carver: SOLO carpeta Fotos en raíz', 'sudo nice -n 19 python3 /home/kali/hearthstone-linux/ISOS/anuu_photo_carver.py /dev/sdc2 --folder Fotos --only-folder --dest /home/kali/Fotos_recuperadas --legacy-os'],
    ['Carver: reanudar (fotos + ADN + estego)', 'sudo nice -n 19 python3 /home/kali/hearthstone-linux/ISOS/anuu_photo_carver.py /dev/sdc2 --dest /home/kali/Fotos_recuperadas'],
    ['Carver: completo (+vídeo +Whisper)', 'sudo nice -n 19 python3 /home/kali/hearthstone-linux/ISOS/anuu_photo_carver.py /dev/sdc2 --dest /home/kali/Fotos_recuperadas --carve-videos --whisper-subs'],
    ['Carver: barrer brecha 1.21 GB virgen', 'sudo nice -n 19 python3 /home/kali/hearthstone-linux/ISOS/anuu_photo_carver.py /dev/sdc2 --dest /home/kali/Fotos_recuperadas --scan-gap-from-1gb --legacy-os --regenerate-broken'],
    ['Focusrite: cosechar TRNG', 'python3 /home/kali/hearthstone-linux/ISOS/anuu_focusrite_dsp.py --trng-harvest'],
    ['Focusrite: estado', 'python3 /home/kali/hearthstone-linux/ISOS/anuu_focusrite_dsp.py --status'],
    ['Hardware: escanear bus', 'python3 /home/kali/k4li-anuu-forge/scripts/anuu_hardware_bridge.py --scan'],
    ['Cuotas: estado del enjambre', 'python3 /home/kali/k4li-anuu-forge/scripts/quota_arbiter.py --swarm-status'],
    ['Whisper: extraer subtítulos', 'python3 /home/kali/hearthstone-linux/ISOS/anuu_whisper_extractor.py']
  ];

  var PRESETS = [['Turbo (35 ms)', 35], ['Sigilo (850 ms)', 850], ['Tar Pit (4200 ms)', 4200], ['Fortaleza (6000 ms)', 6000]];

  /* ---------------- BUS (BroadcastChannel + fallback storage) ---------------- */
  var listeners = {};
  var chan = ('BroadcastChannel' in window) ? new BroadcastChannel('k4l1-hud') : null;
  function onBus(type, fn) { (listeners[type] = listeners[type] || []).push(fn); }
  function fire(msg) { (listeners[msg.type] || []).forEach(function (f) { try { f(msg); } catch (e) {} }); }
  function emit(type, data) {
    var msg = Object.assign({ type: type, t: Date.now() }, data || {});
    if (chan) chan.postMessage(msg);
    else { try { localStorage.setItem('k4_bus', JSON.stringify(msg)); } catch (e) {} }
    fire(msg);
  }
  if (chan) chan.onmessage = function (e) { fire(e.data); };
  else window.addEventListener('storage', function (e) {
    if (e.key === 'k4_bus' && e.newValue) { try { fire(JSON.parse(e.newValue)); } catch (x) {} }
  });

  function getLatency() { return parseInt(localStorage.getItem(LS.lat) || '4200', 10); }
  function setLatency(ms, silent) {
    try { localStorage.setItem(LS.lat, String(ms)); } catch (e) {}
    emit('latency', { ms: ms });
    if (!silent) toast('Latencia → ' + ms + ' ms');
  }

  /* ---------------- UTIL ---------------- */
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = el('div', { id: 'k4-toast', class: 'k4-bevel' }); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }
  function copy(text, label) {
    var done = function () { toast('Copiado: ' + label); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    else { fallbackCopy(text); done(); }
  }
  function fallbackCopy(text) {
    var t = el('textarea'); t.value = text; t.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) {} t.remove();
  }

  /* ---------------- AUDIO IN (VU real, opt-in) ---------------- */
  var audio = { ctx: null, an: null, stream: null, buf: null, label: '', armed: false };
  function armAudio() {
    if (audio.armed) return Promise.resolve(audio);
    var c = { audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false, channelCount: 2 } };
    return navigator.mediaDevices.getUserMedia(c).then(function (s0) {
      return navigator.mediaDevices.enumerateDevices().then(function (devs) {
        var pick = devs.filter(function (d) { return d.kind === 'audioinput' && /focusrite|scarlett/i.test(d.label); })[0];
        if (!pick) return s0;
        s0.getTracks().forEach(function (t) { t.stop(); });
        return navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: pick.deviceId }, echoCancellation: false, autoGainControl: false, noiseSuppression: false, channelCount: 2 } });
      });
    }).then(function (stream) {
      var AC = window.AudioContext || window.webkitAudioContext;
      audio.ctx = new AC();
      var src = audio.ctx.createMediaStreamSource(stream);
      audio.an = audio.ctx.createAnalyser(); audio.an.fftSize = 1024; audio.an.smoothingTimeConstant = 0.7;
      src.connect(audio.an); /* sin conectar a destination: evita realimentación */
      audio.buf = new Uint8Array(audio.an.fftSize);
      audio.stream = stream; audio.armed = true;
      audio.label = (stream.getAudioTracks()[0] || {}).label || 'entrada por defecto';
      emit('audio', { armed: true, label: audio.label, rate: audio.ctx.sampleRate });
      toast('Entrada armada: ' + audio.label);
      return audio;
    }).catch(function (e) { toast('Audio no disponible: ' + (e && e.name || e)); throw e; });
  }
  function audioLevel() {
    if (!audio.armed) return 0;
    audio.an.getByteTimeDomainData(audio.buf);
    var peak = 0; for (var i = 0; i < audio.buf.length; i++) { var v = Math.abs(audio.buf[i] - 128) / 128; if (v > peak) peak = v; }
    return peak;
  }

  /* ---------------- MIDI (opt-in) ---------------- */
  var midi = { access: null, names: [] };
  function refreshMidi() {
    midi.names = [];
    midi.access.inputs.forEach(function (inp) {
      midi.names.push(inp.name);
      /* addEventListener (no onmidimessage) para convivir con el handler propio de cada página */
      if (!inp.__k4) {
        inp.__k4 = true;
        inp.addEventListener('midimessage', function (m) {
          var d = m.data, st = d[0] & 0xf0;
          if (st === 0x90 && d[2] > 0) emit('midi-note', { note: d[1], vel: d[2], on: true });
          else if (st === 0x80 || (st === 0x90 && d[2] === 0)) emit('midi-note', { note: d[1], vel: 0, on: false });
          else if (st === 0xb0) emit('midi-cc', { cc: d[1], val: d[2] });
        });
      }
    });
    emit('midi', { connected: midi.names.length > 0, names: midi.names });
  }
  function connectMidi() {
    if (!navigator.requestMIDIAccess) { toast('Este navegador no soporta WebMIDI'); return; }
    navigator.requestMIDIAccess({ sysex: false }).then(function (a) {
      midi.access = a; a.addEventListener('statechange', refreshMidi); refreshMidi();
      toast(midi.names.length ? 'MIDI: ' + midi.names.join(', ') : 'MIDI concedido, sin dispositivos');
    }, function () { toast('Permiso MIDI denegado'); });
  }

  /* ---------------- CARVER STATUS (checkpoint, no live) ---------------- */
  var carver = null;
  function loadCarver(cb) {
    fetch(resolvePath('assets/carver_status.json'), { cache: 'no-store' }).then(function (r) { return r.json(); })
      .then(function (j) { carver = j.scan_progress || null; cb && cb(); }).catch(function () { carver = null; cb && cb(); });
  }

  /* ---------------- DUAL-SILICON SILENT PROBE (:18989) ---------------- */
  var AIRGAP_PILL = '🛡️ ZERO-CLOUD AIRGAP · 189.89.619 Hz';
  var silicon = { online: false, temp: '--', cores: navigator.hardwareConcurrency || 8, ctrl: null };

  function pickVal(obj, keys) {
    if (!obj || typeof obj !== 'object') return null;
    for (var i = 0; i < keys.length; i++) {
      var v = obj[keys[i]];
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return null;
  }

  function parseSilicon(d) {
    var fallbackCores = navigator.hardwareConcurrency || 8;
    if (!d || typeof d !== 'object') return { temp: '--', cores: fallbackCores };
    var sub = d.cpu || d.silicon || d.arm64 || d.metrics || d.telemetry || d.system || d.node || {};
    var rawT = pickVal(d, ['temp', 'temp_c', 'temperature', 'temperature_c', 'cpu_temp', 'cpu_temp_c', 'soc_temp', 'thermal_c', 'thermal']);
    if (rawT === null) rawT = pickVal(sub, ['temp', 'temp_c', 'temperature', 'temperature_c', 'cpu_temp', 'soc_temp']);
    var tempOut = '--';
    if (rawT !== null) {
      var nT = typeof rawT === 'number' ? rawT : parseFloat(String(rawT).replace(/[^0-9.-]/g, ''));
      if (!isNaN(nT)) {
        if (nT > 200) nT = nT / 1000;
        tempOut = String(Math.round(nT * 10) / 10);
      }
    }
    var rawC = pickVal(d, ['cores', 'cpu_cores', 'num_cores', 'nproc', 'cpus', 'threads']);
    if (rawC === null) rawC = pickVal(sub, ['cores', 'cpu_cores', 'count', 'cpus', 'threads']);
    var nC = rawC !== null ? parseInt(rawC, 10) : fallbackCores;
    if (isNaN(nC) || nC <= 0) nC = fallbackCores;
    return { temp: tempOut, cores: nC };
  }

  function paintSiliconPill() {
    if (!palPill) return;
    if (silicon.online) {
      palPill.textContent = '🟢 HYBRID ARM64 ONLINE · ' + silicon.temp + '°C · ' + silicon.cores + ' Cores (189.89.619 Hz)';
      palPill.className = 'k4-silicon-pill is-online';
    } else {
      palPill.textContent = AIRGAP_PILL;
      palPill.className = 'k4-silicon-pill is-airgap';
    }
  }

  function probeSilicon() {
    if (silicon.ctrl) {
      try { silicon.ctrl.abort(); } catch (e) {}
      silicon.ctrl = null;
    }
    paintSiliconPill();
    if (typeof fetch !== 'function') return;
    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    silicon.ctrl = ctrl;
    var timer = setTimeout(function () {
      if (ctrl) { try { ctrl.abort(); } catch (e) {} }
    }, 900);
    fetch('http://127.0.0.1:18989/telemetry', {
      method: 'GET',
      cache: 'no-store',
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      if (!r || !r.ok) throw new Error('airgap');
      return r.json();
    }).then(function (json) {
      clearTimeout(timer);
      if (silicon.ctrl === ctrl) silicon.ctrl = null;
      var info = parseSilicon(json);
      silicon.online = true;
      silicon.temp = info.temp;
      silicon.cores = info.cores;
      paintSiliconPill();
      emit('silicon', { online: true, temp: silicon.temp, cores: silicon.cores });
    }).catch(function () {
      clearTimeout(timer);
      if (silicon.ctrl === ctrl) silicon.ctrl = null;
      silicon.online = false;
      paintSiliconPill();
    });
  }

  /* ---------------- GFM DOCS READER BRIDGE (Ctrl+M) ---------------- */
  function openMarkdownReader(docId) {
    var md = window.K4liMarkdown;
    if (md) {
      if (typeof md === 'function') { docId ? md(docId) : md(); return; }
      var methods = ['open', 'openDoc', 'openReader', 'openModal', 'show', 'toggle', 'load'];
      for (var i = 0; i < methods.length; i++) {
        if (typeof md[methods[i]] === 'function') {
          docId ? md[methods[i]](docId) : md[methods[i]]();
          return;
        }
      }
      var ev = new KeyboardEvent('keydown', { key: 'm', code: 'KeyM', ctrlKey: true, bubbles: true, cancelable: true });
      window.dispatchEvent(ev);
      document.dispatchEvent(ev);
      return;
    }
    if (typeof window.openK4L1Doc === 'function') {
      window.openK4L1Doc(docId || 'espacio89');
      return;
    }
    location.href = resolvePath('index.html');
  }

  /* ---------------- STRIP ---------------- */
  var stripEl, vuCanvas, refs = {};
  function buildStrip() {
    stripEl = el('div', { id: 'k4-strip', class: 'k4-bevel ' + (MOUNT === 'header' ? 'k4-inline' : 'k4-float') });
    stripEl.innerHTML =
      '<button class="k4-chip" data-a="audio" title="Armar entrada de audio (pide permiso de micrófono)"><span class="k4-dot" id="k4-dot-a"></span>' +
      '<canvas id="k4-vu" width="44" height="14"></canvas><span id="k4-audio-t">VU · armar</span></button>' +
      '<button class="k4-chip" data-a="midi" title="Conectar WebMIDI"><span class="k4-dot" id="k4-dot-m"></span><span id="k4-midi-t">MIDI · conectar</span></button>' +
      '<span class="k4-chip" id="k4-carver" title="Checkpoint de assets/carver_status.json"><span class="k4-dot warn"></span><span id="k4-carver-t">Carver…</span><span class="k4-bar"><i id="k4-carver-b" style="width:0"></i></span></span>' +
      '<button class="k4-chip" data-a="lat" title="Latencia adaptativa"><span id="k4-lat-t">⏱ ' + getLatency() + ' ms</span></button>' +
      '<button class="k4-chip" data-a="palette" title="Paleta de comandos"><kbd>Ctrl</kbd>+<kbd>K</kbd></button>';
    if (MOUNT === 'header' && document.querySelector('header')) document.querySelector('header').appendChild(stripEl);
    else { stripEl.className = 'k4-bevel k4-float'; document.body.appendChild(stripEl); }

    vuCanvas = stripEl.querySelector('#k4-vu');
    refs.dotA = stripEl.querySelector('#k4-dot-a'); refs.audioT = stripEl.querySelector('#k4-audio-t');
    refs.dotM = stripEl.querySelector('#k4-dot-m'); refs.midiT = stripEl.querySelector('#k4-midi-t');
    refs.carverT = stripEl.querySelector('#k4-carver-t'); refs.carverB = stripEl.querySelector('#k4-carver-b');
    refs.latT = stripEl.querySelector('#k4-lat-t');

    stripEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      var a = b.dataset.a;
      if (a === 'audio') armAudio().catch(function () {});
      else if (a === 'midi') connectMidi();
      else if (a === 'palette') openPalette();
      else if (a === 'lat') { var i = PRESETS.findIndex(function (p) { return p[1] === getLatency(); }); setLatency(PRESETS[(i + 1) % PRESETS.length][1]); }
    });

    onBus('latency', function (m) { refs.latT.textContent = '⏱ ' + m.ms + ' ms'; });
    onBus('audio', function (m) {
      refs.dotA.className = 'k4-dot on';
      refs.audioT.textContent = 'LIVE ' + (m.rate / 1000).toFixed(m.rate % 1000 ? 1 : 0) + ' kHz';
      refs.audioT.title = m.label;
    });
    onBus('midi', function (m) {
      refs.dotM.className = 'k4-dot ' + (m.connected ? 'on' : 'warn');
      refs.midiT.textContent = m.connected ? 'MIDI · ' + m.names[0] + (m.names.length > 1 ? ' +' + (m.names.length - 1) : '') : 'MIDI · sin dispositivos';
    });
    onBus('midi-note', function (m) { if (m.on) { refs.dotM.style.transform = 'scale(1.8)'; setTimeout(function () { refs.dotM.style.transform = ''; }, 90); } });

    function paintCarver() {
      if (!carver) { refs.carverT.textContent = 'Carver · sin datos'; return; }
      refs.carverT.textContent = 'Carver ' + carver.gb_scanned + ' GB · ' + carver.progress_pct_allocated_bitmap + '% · ' + String(carver.daemon_status || '').toLowerCase().replace(/_/g, ' ');
      refs.carverB.style.width = Math.min(100, carver.progress_pct_allocated_bitmap) + '%';
    }
    loadCarver(paintCarver); setInterval(function () { loadCarver(paintCarver); }, 30000);

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'midi' }).then(function (p) { if (p.state === 'granted') connectMidi(); }).catch(function () {});
    }

    var vctx = vuCanvas.getContext('2d'), hold = 0;
    (function loop() {
      requestAnimationFrame(loop);
      if (document.hidden) return;
      var w = vuCanvas.width, h = vuCanvas.height; vctx.clearRect(0, 0, w, h);
      var lv = audioLevel(); hold = Math.max(lv, hold - 0.02);
      var segs = 11, on = Math.round(lv * segs), pk = Math.round(hold * segs);
      for (var i = 0; i < segs; i++) {
        vctx.fillStyle = i < on ? (i > 8 ? '#ef4444' : i > 6 ? '#f59e0b' : '#10b981') : (i === pk - 1 && audio.armed ? '#a1a1aa' : 'rgba(255,255,255,.07)');
        vctx.fillRect(i * 4, 2, 3, h - 4);
      }
    })();
  }

  /* ---------------- PALETTE (Ctrl+K v2.8) ---------------- */
  var palEl, palInput, palList, palPill, palCount, items = [], filtered = [], sel = 0;

  function isCurrentPage(rel) {
    var p = (window.location && window.location.pathname) || '';
    if (rel === 'index.html') {
      return !/\/(components|omega)(\/|$)/.test(p) && (p === '' || /\/($|index\.html$)/.test(p));
    }
    if (rel === 'omega/index.html') {
      return /\/omega(\/index\.html|\/)?$/.test(p);
    }
    return p.length >= rel.length && p.slice(-rel.length) === rel;
  }

  function buildItems() {
    items = [];
    items.push({
      label: '🌌 Hub Maestro · Portal Principal',
      group: 'Portal',
      keywords: 'index.html home inicio hub maestro portal principal raiz',
      here: isCurrentPage('index.html'),
      run: function () { location.href = resolvePath('index.html'); }
    });
    items.push({
      label: '🎮 ANUSET 189 OMEGA · Argon Engine Stage',
      group: 'Omega',
      keywords: 'omega/index.html videojuego argon engine stage anuset 189 omega 3d game',
      here: isCurrentPage('omega/index.html'),
      run: function () { location.href = resolvePath('omega/index.html'); }
    });
    items.push({
      label: '📖 Lector de Documentación GFM (Ctrl+M)' + (window.K4liMarkdown ? '' : ' · Ir al Portal'),
      group: 'Docs GFM',
      keywords: 'k4limarkdown ctrl+m gfm markdown lector documentacion wiki lore manuales',
      run: function () { openMarkdownReader(); }
    });
    items.push({
      label: '💬 Contacto Directo Signal E2EE (@k4li.89)',
      group: 'Signal E2EE',
      keywords: 'signal.me @k4li.89 contacto directo cifrado e2ee canal seguro',
      run: function () {
        var url = 'https://signal.me/#u/k4li.89';
        var w = window.open(url, '_blank', 'noopener,noreferrer');
        if (!w) location.href = url;
      }
    });

    STUDIOS.forEach(function (t) {
      items.push({
        label: t[2] + '  ' + t[0],
        group: 'Estudio',
        keywords: t[1] + ' ' + (t[3] || ''),
        here: isCurrentPage(t[1]),
        run: function () { location.href = resolvePath(t[1]); }
      });
    });

    if (typeof window.switchView === 'function') {
      [['studio', '💼 Vista: K4L1 Studio'], ['forge', '🌌 Vista: Anuu-Forge'], ['bunker', '🔐 Vista: Búnker']].forEach(function (v) {
        items.push({ label: v[1], group: 'Vista', keywords: 'vista switchview ' + v[0], run: function () { window.switchView(v[0]); } });
      });
    }

    DOC_TOPICS.forEach(function (d) {
      items.push({
        label: '📚  ' + d[0],
        group: 'Docs GFM',
        keywords: 'docs gfm markdown ctrl+m ' + d[1],
        run: function () { openMarkdownReader(d[1]); }
      });
    });

    PRESETS.forEach(function (p) {
      items.push({ label: '⏱  Latencia: ' + p[0], group: 'Tar Pit', keywords: 'latencia tarpit ms', run: function () { setLatency(p[1]); } });
    });
    COMMANDS.forEach(function (c) {
      items.push({ label: '📋  ' + c[0], group: 'Copiar', keywords: 'copiar cli comando ' + c[1], run: function () { copy(c[1], c[0]); } });
    });
    items.push({ label: '🎚  Armar entrada de audio (Focusrite si existe)', group: 'Hardware', keywords: 'audio vu micro focusrite scarlett', run: function () { armAudio().catch(function () {}); } });
    items.push({ label: '🎹  Conectar WebMIDI', group: 'Hardware', keywords: 'midi akai controlador', run: connectMidi });
    items.push({ label: '📺  Alternar scanlines CRT', group: 'Visual', keywords: 'crt scanlines pantalla', run: function () { toggleScan(); } });
    items.push({ label: '🌊  Alternar shader de fondo', group: 'Visual', keywords: 'webgl shader fondo niebla', run: function () { toggleShader(); } });
  }

  function fuzzy(q, s) {
    if (!q) return { score: 0, idx: [] };
    var qc = Array.from(q.toLowerCase()), sc = Array.from(s.toLowerCase());
    var qi = 0, score = 0, last = -2, idx = [];
    for (var i = 0; i < sc.length && qi < qc.length; i++) {
      if (sc[i] === qc[qi]) {
        score += (i === last + 1) ? 5 : 1;
        if (i === 0 || sc[i - 1] === ' ' || sc[i - 1] === '·' || sc[i - 1] === '_' || sc[i - 1] === '/') score += 3;
        idx.push(i);
        last = i;
        qi++;
      }
    }
    return qi === qc.length ? { score: score, idx: idx } : null;
  }

  function matchItem(q, it) {
    if (!q) return { score: 0, idx: [] };
    var mL = fuzzy(q, it.label);
    var mK = it.keywords ? fuzzy(q, it.keywords) : null;
    if (mL && mK) {
      return (mL.score + 8 >= mK.score)
        ? { score: mL.score + 8, idx: mL.idx }
        : { score: mK.score, idx: mL.idx };
    }
    if (mL) return { score: mL.score + 8, idx: mL.idx };
    if (mK) return { score: mK.score, idx: [] };
    return null;
  }

  function highlight(s, idx) {
    var set = {};
    idx.forEach(function (i) { set[i] = 1; });
    return Array.from(s).map(function (ch, i) {
      return set[i] ? '<mark>' + esc(ch) + '</mark>' : esc(ch);
    }).join('');
  }

  function render() {
    var q = palInput.value.trim();
    var list = items.map(function (it) { var m = matchItem(q, it); return m && { it: it, m: m }; }).filter(Boolean);
    if (q) list.sort(function (a, b) { return b.m.score - a.m.score; });
    filtered = list.slice(0, 80);
    sel = Math.min(sel, Math.max(0, filtered.length - 1));
    if (palCount) palCount.textContent = filtered.length + (q ? ' coincidencias' : ' acciones');
    palList.innerHTML = filtered.length ? filtered.map(function (f, i) {
      return '<li data-i="' + i + '" class="' + (i === sel ? 'sel' : '') + '">' +
        '<span class="k4-lbl">' + highlight(f.it.label, f.m.idx) + '</span>' +
        (f.it.here ? '<span class="k4-here">ACTIVO</span>' : '') +
        '<span class="k4-grp">' + esc(f.it.group) + '</span></li>';
    }).join('') : '<li><span class="k4-lbl">Sin resultados</span></li>';
  }

  function buildPalette() {
    palEl = el('div', { id: 'k4-palette', role: 'dialog', 'aria-label': 'Paleta de comandos K4L1 v2.8' });
    palEl.innerHTML =
      '<div class="k4-box k4-bevel">' +
        '<div class="k4-pal-head">' +
          '<span class="k4-pal-brand">⚡ K4L1 HUD CORE v2.8</span>' +
          '<span id="k4-silicon-pill" class="k4-silicon-pill is-airgap">' + esc(AIRGAP_PILL) + '</span>' +
        '</div>' +
        '<input type="text" placeholder="Buscar 19 estudios, OMEGA, Docs GFM (Ctrl+M), Signal E2EE o comandos…" autocomplete="off" spellcheck="false">' +
        '<ul></ul>' +
        '<div class="k4-foot">' +
          '<span>↑↓ mover</span><span>↵ ejecutar</span><span>ctrl+m docs gfm</span><span>esc cerrar</span>' +
          '<span class="k4-foot-count" id="k4-pal-count"></span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(palEl);
    palInput = palEl.querySelector('input');
    palList = palEl.querySelector('ul');
    palPill = palEl.querySelector('#k4-silicon-pill');
    palCount = palEl.querySelector('#k4-pal-count');
    palInput.addEventListener('input', function () { sel = 0; render(); });
    palEl.addEventListener('mousedown', function (e) {
      if (e.target === palEl) { closePalette(); return; }
      var li = e.target.closest('li[data-i]'); if (li) { runSel(+li.dataset.i); }
    });
    palInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, filtered.length - 1); render(); e.preventDefault(); scrollSel(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); render(); e.preventDefault(); scrollSel(); }
      else if (e.key === 'Enter') { runSel(sel); e.preventDefault(); }
      else if (e.key === 'Escape') closePalette();
    });
  }
  function scrollSel() { var li = palList.querySelector('li.sel'); if (li) li.scrollIntoView({ block: 'nearest' }); }
  function runSel(i) { var f = filtered[i]; if (!f) return; closePalette(); f.it.run(); }
  function openPalette() {
    buildItems();
    palEl.classList.add('open');
    palInput.value = '';
    sel = 0;
    render();
    probeSilicon();
    setTimeout(function () { palInput.focus(); }, 0);
  }
  function closePalette() {
    if (silicon.ctrl) { try { silicon.ctrl.abort(); } catch (e) {} silicon.ctrl = null; }
    palEl.classList.remove('open');
  }

  /* ---------------- SCANLINES ---------------- */
  function toggleScan(force) {
    var on = typeof force === 'boolean' ? force : !document.body.classList.contains('k4-scanlines');
    document.body.classList.toggle('k4-scanlines', on);
    try { localStorage.setItem(LS.scan, on ? '1' : '0'); } catch (e) {}
    toast('Scanlines ' + (on ? 'ON' : 'OFF'));
  }

  /* ---------------- SHADER (WebGL, 1/3 res, 30 fps, pausa al ocultar) ---------------- */
  var shader = { canvas: null, on: false, raf: 0 };
  function startShader() {
    if (shader.on) return;
    var cv = el('canvas', { id: 'k4-shader' }); document.body.appendChild(cv);
    var gl = cv.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
    if (!gl) { cv.remove(); return; }
    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = 'precision mediump float;uniform vec2 r;uniform float t;' +
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}' +
      'void main(){vec2 u=gl_FragCoord.xy/r;float a=n(u*3.+vec2(t*.05,t*.03))+.5*n(u*7.-vec2(t*.04,0.));' +
      'vec3 c=mix(vec3(.58,.2,.92),vec3(.06,.72,.5),smoothstep(.3,1.,a));c=mix(c,vec3(.96,.62,.04),smoothstep(1.1,1.5,a)*.5);' +
      'gl_FragColor=vec4(c*smoothstep(.45,1.2,a)*.9,1.);}';
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.remove(); return; }
    gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uR = gl.getUniformLocation(pr, 'r'), uT = gl.getUniformLocation(pr, 't');
    function size() { cv.width = Math.max(2, Math.floor(innerWidth / 3)); cv.height = Math.max(2, Math.floor(innerHeight / 3)); gl.viewport(0, 0, cv.width, cv.height); }
    size(); addEventListener('resize', size);
    var last = 0, t0 = performance.now();
    (function frame(now) {
      shader.raf = requestAnimationFrame(frame);
      if (document.hidden || now - last < 33) return; last = now;
      gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uT, (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    })(0);
    shader.canvas = cv; shader.on = true;
  }
  function stopShader() { if (!shader.on) return; cancelAnimationFrame(shader.raf); shader.canvas.remove(); shader.on = false; }
  function toggleShader() {
    var want = !shader.on; if (want) startShader(); else stopShader();
    try { localStorage.setItem(LS.shader, shader.on ? '1' : '0'); } catch (e) {}
    toast('Shader ' + (shader.on ? 'ON' : 'OFF'));
  }

  /* ---------------- INIT ---------------- */
  function init() {
    buildStrip(); buildPalette();
    if (localStorage.getItem(LS.scan) === '1') document.body.classList.add('k4-scanlines');
    var s = localStorage.getItem(LS.shader);
    if ((s === '1') || (s === null && WANT_SHADER)) startShader();
    addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palEl.classList.contains('open') ? closePalette() : openPalette(); }
    });
    window.addEventListener('storage', function (e) { if (e.key === LS.lat && e.newValue) emit('latency', { ms: +e.newValue }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.K4HUD = {
    version: '2.8', prefix: PREFIX, resolvePath: resolvePath,
    on: onBus, emit: emit, toast: toast, copy: copy,
    armAudio: armAudio, audioLevel: audioLevel, audio: audio,
    getLatency: getLatency, setLatency: setLatency,
    openPalette: openPalette, closePalette: closePalette,
    openMarkdownReader: openMarkdownReader, probeSilicon: probeSilicon
  };
})();
