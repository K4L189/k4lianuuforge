# 🛡️ K4LI-ANUU-FORGE // ARQUITECTURA ZERO-CLOUD & DESPACHO SOBERANO E2EE

> **Frecuencia Operativa:** `189.89.619 Hz` | **Concilio ACE:** `161914`  
> **Comandancia de Seguridad:** `Kanuv 🛡️` & **Unidad Técnica:** `4NVSET 🟢`  
> **Coste Operativo & Exposición Cloud:** `0,00 € / mes` — **Modo 100% Directo Zero-Cloud**

Infraestructura criptográfica de recepción técnica, custodia local y despacho directo de encargos para **K4L1 Studio**, diseñada bajo doctrina de **Soberanía Radical y Privacidad Zero-Knowledge**:

- **Cero Cloudflare Workers** ni proxies serverless intermediarios que terminen TLS en terceros.
- **Cero bots corporativos espías** ni webhooks en claro.
- **Cero Telegram** ni APIs centralizadas que almacenen metadatos o payloads de clientes en nubes ajenas.

---

## ⚡ 1. Flujo Criptográfico Directo (Zero-Cloud Architecture)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   NAVEGADOR DEL CLIENTE / OPERADOR (LOCAL)                  │
│                                                                             │
│  [Formulario de Encargo / SOW]                                              │
│               │                                                             │
│               ▼                                                             │
│  [WebCrypto API Nativa: Digest SHA-256 + Derivación PBKDF2 + AES-256-GCM]   │
│               │                                                             │
│       ┌───────┴───────────────────────────────────────────┐                 │
│       ▼                                                   ▼                 │
│  [Búnker IndexedDB Zero-Knowledge]        [Sobre Blindado .k4li.asc / PGP]  │
│  (assets/js/bunker_vault.js)              (BEGIN K4L1 SOVEREIGN ENVELOPE)   │
└───────┼───────────────────────────────────────────────────┼─────────────────┘
        │                                                   │
        │ Custodia Local en Reposo                          │ Despacho E2EE Directo
        ▼                                                   ▼
 [Cifrado AES-256-GCM / PQC 500k]            [Canal Directo Signal E2EE @k4li.89]
                                                            │
                                                            ▼
                                             [Verificación Forense Offline]
                                             python3 api/sovereign_envelope_cli.py
```

### Etapas del Protocolo:
1. **Empaquetado y Firma en Navegador:** El cliente genera el expediente técnico localmente. El motor nativo `window.crypto.subtle` calcula el hash de integridad `SHA-256` sobre el payload canónico sin realizar ninguna petición HTTP externa.
2. **Persistencia Zero-Knowledge en Búnker Local:** Si la bóveda [`assets/js/bunker_vault.js`](file:///home/kali/k4li-anuu-forge/assets/js/bunker_vault.js) se encuentra activa (tras superar la compuerta `SHA-256` de [`assets/js/anuu_gate.js`](file:///home/kali/k4li-anuu-forge/assets/js/anuu_gate.js)), el registro se cifra en memoria con `AES-256-GCM` + `PBKDF2` (`100.000` iteraciones `SHA-256` o `500.000` iteraciones `SHA-512` en modo Post-Cuántico) y se archiva en `IndexedDB`.
3. **Despacho Directo E2EE:** El encargo se transmite sin intermediarios punto a punto mediante:
   - **Signal E2EE (`@k4li.89`):** `https://signal.me/#u/k4li.89` (Protocolo Double Ratchet / X25519).
   - **Sobre Soberano `.k4li.asc` / Bloque PGP:** Archivo blindado en ASCII descargable o copiable al portapapeles para adjuntar por Signal E2EE o correo cifrado con PGP / Age.
4. **Inspección y Verificación Offline:** En la estación de trabajo de Kali Linux, [`api/sovereign_envelope_cli.py`](file:///home/kali/k4li-anuu-forge/api/sovereign_envelope_cli.py) valida matemáticamente la huella `SHA-256` y decodifica o descifra la carga útil 100% sin conexión a red.

---

## 🔐 2. Especificación del Sobre Soberano (`.k4li.asc`)

Los sobres generados por K4L1 Studio o por la CLI utilizan armadura ASCII determinista:

```text
-----BEGIN K4L1 SOVEREIGN ENVELOPE-----
Version: K4L1-ZeroCloud-161914
Mode: ZERO-CLOUD-DIRECT
Hash: SHA-256/9c81f4a02d7e31b5
Frequency: 189.89.619 Hz

eyJ2ZXJzaW9uIjogIjEuMCIsICJ0aW1lc3RhbXAiOiAiMjAyNi0xMS0wMVQwNzo...
-----END K4L1 SOVEREIGN ENVELOPE-----
```

### Estructura JSON Interna (Base64 UTF-8)

```json
{
  "version": "1.0",
  "timestamp": "2026-11-01T07:15:00Z",
  "sha256": "9c81f4a02d7e31b5e0c4f8a21d6b9034f1e72c8a50d4b3197e6a02c1f8b4d912",
  "mode": "ZERO-CLOUD-DIRECT",
  "payload": {
    "service": "security",
    "urgency": "express",
    "name": "Operador Soberano",
    "contact": "@operador.89 (Signal E2EE)",
    "brief": "Auditoría de hardening Linux Debian 12 y despliegue SIEM Wazuh."
  }
}
```

En modo cifrado simétrico (`mode: "aes-256-gcm"`), `payload` encapsula los parámetros autenticados `{salt, iv, iterations, hash, ciphertext}` compatibles bit a bit con WebCrypto `AES-256-GCM` y `PBKDF2`.

---

## 🛠️ 3. Utilidad Forense Offline (`api/sovereign_envelope_cli.py`)

La herramienta [`api/sovereign_envelope_cli.py`](file:///home/kali/k4li-anuu-forge/api/sovereign_envelope_cli.py) opera **100% offline** (cero sockets, cero llamadas HTTP) utilizando la biblioteca estándar de Python 3 y soporte automático de `AES-256-GCM` si `cryptography` está disponible en el sistema.

### Autodiagnóstico Criptográfico (`--selftest`)
Verifica generación de armadura, comprobación `SHA-256`, detección anti-manipulación (*Tamper Guard*) y cifrado/descifrado `PBKDF2 + AES-256-GCM`:

```bash
python3 api/sovereign_envelope_cli.py --selftest
```

### Inspeccionar y Verificar un Sobre `.k4li.asc` Recibido por Signal / PGP
```bash
# Inspección forense directa desde archivo
python3 api/sovereign_envelope_cli.py encargo_cliente.k4li.asc

# Lectura desde portapapeles / tubería estándar (stdin)
cat encargo_cliente.k4li.asc | python3 api/sovereign_envelope_cli.py --stdin

# Salida estructurada en JSON para integración con herramientas locales
python3 api/sovereign_envelope_cli.py --inspect encargo_cliente.k4li.asc --json
```

### Sellar y Descifrar Sobres con `PBKDF2 + AES-256-GCM`
```bash
# Sellar un expediente JSON firmado con SHA-256 (modo ZERO-CLOUD-DIRECT)
python3 api/sovereign_envelope_cli.py \
  --seal '{"service":"security","contact":"@client.89","brief":"Hardening Linux"}' \
  --output encargo.k4li.asc

# Sellar un expediente cifrado con clave simétrica AES-256-GCM (PBKDF2 100k iteraciones)
K4LI_ENVELOPE_KEY="frase-secreta-acordada-por-signal" \
  python3 api/sovereign_envelope_cli.py \
  --seal expediente.json \
  --output expediente_blindado.k4li.asc

# Descifrar y verificar integridad del sobre blindado
K4LI_ENVELOPE_KEY="frase-secreta-acordada-por-signal" \
  python3 api/sovereign_envelope_cli.py \
  --inspect expediente_blindado.k4li.asc
```

---

## 🔍 4. Auditoría Defensiva Zero-Cloud (`scripts/security_audit.py`)

El auditor de seguridad [`scripts/security_audit.py`](file:///home/kali/k4li-anuu-forge/scripts/security_audit.py) garantiza de forma automatizada el cumplimiento estricto de la arquitectura soberana:

1. **Erradicación Cloud:** Verifica la ausencia total de workers intermediarios y configuraciones serverless heredadas.
2. **Purga de Relés Externos:** Escanea el árbol de código fuente asegurando cero endpoints hacia APIs de mensajería no soberanas.
3. **Verificación Criptográfica:** Audita la presencia de `AES-GCM` y `PBKDF2` en [`assets/js/bunker_vault.js`](file:///home/kali/k4li-anuu-forge/assets/js/bunker_vault.js), `SHA-256` en [`assets/js/anuu_gate.js`](file:///home/kali/k4li-anuu-forge/assets/js/anuu_gate.js) y ejecuta la validación funcional de [`api/sovereign_envelope_cli.py`](file:///home/kali/k4li-anuu-forge/api/sovereign_envelope_cli.py).

```bash
python3 scripts/security_audit.py
```

---
*Sellado bajo el Escudo Kanuv 🛡️ — Concilio ACE (`161914`) a `189.89.619 Hz`.*
