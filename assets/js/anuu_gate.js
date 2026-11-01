/**
 * ANUU SENTINEL GATE v2.8 // K4L1 STUDIO (161914)
 * Frecuencia: 189.89.619 Hz
 * Interceptor criptográfico pre-render Zero-Knowledge (auto-montable en cualquier ruta profunda).
 * Cero exposición de clave en texto claro (WebCrypto SHA-256 + Fallback SHA-256 puro offline/file://).
 */
(function () {
  'use strict';

  const MASTER_HASH = '0ac844655cfc06d2b86732a129f776d6cb0567c06fda55bd2406210d2e2bc6ca';
  const STORAGE_KEY = 'k4li_gate_pass_auth';
  const PRELOCK_ID = 'anuu-sentinel-prelock-style';

  function isSessionUnlocked() {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === MASTER_HASH) return true;
      if (window.parent && window.parent !== window && window.parent.sessionStorage.getItem(STORAGE_KEY) === MASTER_HASH) {
        sessionStorage.setItem(STORAGE_KEY, MASTER_HASH);
        return true;
      }
    } catch (_e) {
      // Cross-origin frame guard
    }
    return false;
  }

  // Bloqueo instantáneo pre-paint contra FOUC si la sesión aún no está autenticada
  if (!isSessionUnlocked() && typeof document !== 'undefined' && document.head) {
    const st = document.createElement('style');
    st.id = PRELOCK_ID;
    st.textContent = 'body > *:not(#anuu-sentinel-gate) { visibility: hidden !important; } body { overflow: hidden !important; background: #050508 !important; }';
    document.head.appendChild(st);
  }

  // SHA-256 puro en JS para contextos file:// donde crypto.subtle no está expuesto
  function sha256Fallback(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let result = '';
    const words = [];
    const bytes = new TextEncoder().encode(ascii);
    const asciiBitLength = bytes.length * 8;

    const hash = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
    const k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    for (let i = 0; i < bytes.length; i++) {
      words[i >> 2] |= bytes[i] << ((3 - (i % 4)) * 8);
    }
    words[bytes.length >> 2] |= 0x80 << ((3 - (bytes.length % 4)) * 8);
    words[(((bytes.length + 8) >> 6) << 4) + 15] = asciiBitLength;

    for (let j = 0; j < words.length; ) {
      const w = words.slice(j, (j += 16));
      const oldHash = hash.slice(0);
      for (let i = 0; i < 64; i++) {
        if (i >= 16) {
          const w15 = w[i - 15] | 0;
          const w2 = w[i - 2] | 0;
          const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
          const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
          w[i] = ((w[i - 16] | 0) + s0 + (w[i - 7] | 0) + s1) | 0;
        }
        const a = hash[0], b = hash[1], c = hash[2], d = hash[3];
        const e = hash[4], f = hash[5], g = hash[6], h = hash[7];
        const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + k[i] + (w[i] | 0)) | 0;
        const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) | 0;

        hash[7] = g;
        hash[6] = f;
        hash[5] = e;
        hash[4] = (d + temp1) | 0;
        hash[3] = c;
        hash[2] = b;
        hash[1] = a;
        hash[0] = (temp1 + temp2) | 0;
      }
      for (let i = 0; i < 8; i++) {
        hash[i] = ((hash[i] + oldHash[i]) | 0) >>> 0;
      }
    }

    for (let i = 0; i < 8; i++) {
      let hex = (hash[i] >>> 0).toString(16);
      while (hex.length < 8) hex = '0' + hex;
      result += hex;
    }
    void maxWord;
    return result;
  }

  async function sha256(str) {
    if (window.crypto && window.crypto.subtle) {
      const buf = new TextEncoder().encode(str);
      const hashBuf = await window.crypto.subtle.digest('SHA-256', buf);
      const hashArr = Array.from(new Uint8Array(hashBuf));
      return hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    return sha256Fallback(str);
  }

  function removePrelockStyle() {
    const st = document.getElementById(PRELOCK_ID);
    if (st) st.remove();
  }

  function ensureGateMounted() {
    let gate = document.getElementById('anuu-sentinel-gate');
    if (gate || !document.body) return gate;

    gate = document.createElement('div');
    gate.id = 'anuu-sentinel-gate';
    gate.innerHTML =
      '<div class="gate-card">' +
      '  <div class="gate-emblem">' +
      '    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">' +
      '      <circle cx="24" cy="24" r="22" stroke="#00f5d4" stroke-width="1.5" stroke-dasharray="4 2" opacity="0.6"/>' +
      '      <circle cx="24" cy="14" r="7" stroke="#00f5d4" stroke-width="2.2"/>' +
      '      <line x1="24" y1="21" x2="24" y2="38" stroke="#00f5d4" stroke-width="2.5" stroke-linecap="round"/>' +
      '      <line x1="14" y1="26" x2="34" y2="26" stroke="#c084fc" stroke-width="2.5" stroke-linecap="round"/>' +
      '      <circle cx="24" cy="26" r="2" fill="#ffffff"/>' +
      '    </svg>' +
      '  </div>' +
      '  <div class="gate-title">K4L1 STUDIO</div>' +
      '  <div class="gate-subtitle">ESPACIO 89 · CONCILIO ACE 161914</div>' +
      '  <form onsubmit="verifySentinelGate(event)">' +
      '    <div class="gate-input-wrap">' +
      '      <input type="password" id="anuu-gate-input" class="gate-input" placeholder="••••••••••••" autocomplete="off" spellcheck="false" required>' +
      '    </div>' +
      '    <button type="submit" class="gate-btn">ACCEDER AL NEXO</button>' +
      '  </form>' +
      '  <div id="anuu-gate-error" class="gate-error"></div>' +
      '  <div class="gate-footer">PROTEGIDO BAJO SHA-256 ZERO-KNOWLEDGE · FRECUENCIA 189.89.619 Hz</div>' +
      '</div>';
    document.body.prepend(gate);
    return gate;
  }

  function unlock() {
    removePrelockStyle();
    const gate = document.getElementById('anuu-sentinel-gate');
    if (gate) {
      gate.style.transition = 'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
      gate.style.opacity = '0';
      gate.style.transform = 'scale(1.03)';
      setTimeout(() => {
        gate.remove();
        if (document.body) document.body.style.overflow = '';
      }, 360);
    } else if (document.body) {
      document.body.style.overflow = '';
    }
  }

  window.verifySentinelGate = async function (e) {
    if (e) e.preventDefault();
    const input = document.getElementById('anuu-gate-input');
    const err = document.getElementById('anuu-gate-error');
    const card = document.querySelector('.gate-card');
    if (!input) return;

    const val = input.value.trim();
    if (!val) return;

    try {
      const hash = await sha256(val);
      if (hash === MASTER_HASH) {
        try {
          sessionStorage.setItem(STORAGE_KEY, MASTER_HASH);
        } catch (_sErr) {}
        unlock();
      } else {
        if (err) err.textContent = 'SEÑAL DENEGADA · FRECUENCIA INCORRECTA';
        if (card) {
          card.classList.remove('gate-shake');
          void card.offsetWidth;
          card.classList.add('gate-shake');
        }
        input.value = '';
        input.focus();
      }
    } catch (ex) {
      console.error(ex);
    }
  };

  async function init() {
    if (isSessionUnlocked()) {
      unlock();
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const hashParam = window.location.hash.replace(/^#/, '').trim();
    const candidates = [urlParams.get('key'), hashParam].filter(Boolean);

    for (const candidate of candidates) {
      const h = await sha256(candidate.trim());
      if (h === MASTER_HASH) {
        try {
          sessionStorage.setItem(STORAGE_KEY, MASTER_HASH);
        } catch (_sErr) {}
        unlock();
        return;
      }
    }

    ensureGateMounted();
    if (document.body) document.body.style.overflow = 'hidden';
    const input = document.getElementById('anuu-gate-input');
    if (input) setTimeout(() => input.focus(), 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
