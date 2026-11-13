# Sistema de Tipos de Áreas y Evaluación por Tests (`1,000,000` Puntos Máximo)

> **Frecuencia Operativa:** `189.89.619 Hz` · **Autoría:** `k4l1@vamosanu` (`K4L1 & Anuu · Concilio ACE 161914`)  
> **Evaluador ejecutable:** [`scripts/score_1m_areas.py`](../scripts/score_1m_areas.py)  
> **Suite base reutilizada:** [`scripts/full_qa_suite.py`](../scripts/full_qa_suite.py)

---

## 1. Arquitectura de Tipos de Áreas (`TipoArea`)

Para evitar puntuaciones infladas o maquillaje estadístico, el sistema agrupa todas las pruebas automatizadas en **5 Tipos de Áreas (`TipoArea`)** con roles distintos dentro del **Círculo de Resonancia Alquímica** y el **Escudo Kanuv**:

| Tipo de Área (`TipoArea`) | Función y Severidad | Regla de Gobernanza (**Libra Dura**) |
| :--- | :--- | :--- |
| **`CRITICA_BLOQUEANTE`** | Invariantes de supervivencia del código y privacidad (`AST`, enlaces rotos, zero-cloud, `0,00 €`). | Si falla cualquier chequeo crítico, activa **`Gate_Kanuv = 0.50`** (techo máximo `500,000` pts — **NO APTO**). |
| **`INFRA_SOBERANA`** | Criptografía pre-render (`Sentinel Gate`), `noindex`, auditoría OPSEC y nodos hardware locales (`:18989`, `:11434`, `:16196`). | Puntúa proporcionalmente a los módulos criptográficos y nodos activos verificados sin fingir disponibilidad. |
| **`INTERACCION_DSP`** | Motor WebAudio, estabilidad contractiva de Fórmula $\Lambda$ (`FixR`), y evaluación algorítmica de los `501` presets. | Mitad por calidad promedio real de los presets (`/1000`) y mitad por reglas DSP activas en el código. |
| **`OPERATIVA_CORE`** | Accesos del usuario real: Portal SaaS `:16196`, `/ciudad`, Portal Forge `:8189` y lanzador `.desktop`. | Verifica códigos HTTP `200` reales y validación `desktop-file-validate`. |
| **`RESILIENCIA_DOCS`** | Documentación técnica, lore PDF/MD, dependencias offline locales (`vendor/`) y *fallbacks* de control (QWERTY sin MIDI). | Garantiza funcionamiento `airgap` completo aunque no haya red ni controlador físico conectado. |

---

## 2. Fórmula Matemática sobre `1,000,000` Puntos

$$\text{Score}_{1\text{M}} = \text{Gate}_{\text{Kanuv}} \times \sum_{k=1}^{8} W_k \cdot R_k$$

donde:
- $\sum_{k=1}^{8} W_k = 1\,000\,000$ puntos exactos.
- $R_k \in [0, 1]$ es el ratio objetivo de aserciones superadas en el Área $A_k$ (para **A5**, $W_5 = 75\,000 \cdot \frac{\overline{\text{score}}_{501}}{1000} + 75\,000 \cdot \frac{\text{checks\_ok}}{\text{checks\_tot}}$).
- $\text{Gate}_{\text{Kanuv}} = 0.50$ si $\exists\, A_k \in \text{CRITICA\_BLOQUEANTE}$ con fallo; en caso contrario, $\text{Gate}_{\text{Kanuv}} = 1.00$.

---

## 3. Desglose de las 8 Áreas y Medición Real Verificada

Resultado medido ejecutando `python3 scripts/score_1m_areas.py`:

| Código | Área | Tipo (`TipoArea`) | Máximo ($W_k$) | Obtenido Real | Pruebas Verificadas |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **A1** | Núcleo AST JavaScript & Esquemas JSON | `CRITICA_BLOQUEANTE` | `150,000` | **`150,000`** | `node --check` (`35` módulos/bloques, `0` errores) + `12/12` JSON válidos |
| **A2** | Integridad de Activos & Enlaces Locales | `CRITICA_BLOQUEANTE` | `150,000` | **`150,000`** | `verify_assets.py`: `240/240` referencias válidas, `0` enlaces rotos |
| **A3** | Soberanía Zero-Cloud, Airgap & `0,00 €` | `CRITICA_BLOQUEANTE` | `150,000` | **`150,000`** | Zero-CDN en `32` módulos core + cumplimiento Ley Alquimia 89 (`0` ocurrencias prohibidas) |
| **A4** | Criptografía, OPSEC & Sentinel Gate | `INFRA_SOBERANA` | `150,000` | **`150,000`** | Sentinel Gate + `noindex` (`55/55` HTML), `security_audit.py`, `sovereign_envelope_cli.py --selftest`, `test_intake.sh` |
| **A5** | Motor Audio DSP, Fórmula $\Lambda$ & `501` Presets | `INTERACCION_DSP` | `150,000` | **`139,236`** | Media real de `501` presets = `856.48/1000` (`64,236 / 75,000`) + `4/4` checks DSP (`75,000 / 75,000`: `#013 Fiesta Boom Bap 97`, `noKaijuShots`, `Math.tanh`, límite `0.76`) |
| **A6** | Portal de Acceso, Ciudad Kilonova & Render UI | `OPERATIVA_CORE` | `100,000` | **`100,000`** | Enlace en `index.html`, `.desktop` válido, `:8189/` (`200`), `:8189/components/kilonexo_kaiju_titan.html` (`200`), `:16196/` (`200`), `:16196/ciudad` (`200`), `:16196/components/kilonexo_kaiju_titan.html` (`200`) |
| **A7** | Nodos Hardware Híbridos & Cómputo Soberano | `INFRA_SOBERANA` | `100,000` | **`100,000`** | `:18989/telemetry` (`200`), Merkle SHA-256 `:18989/compute/crypto` (`0.43 ms`), `:16196/api/state` (`200`), Ollama `:11434` (`200`) |
| **A8** | Resiliencia Offline, Fallback & Documentación | `RESILIENCIA_DOCS` | `50,000` | **`50,000`** | `Diario_Lore_Anuu_y_Kalicat.pdf`, `DIARIO_LORE_ANUU_Y_KALICAT.md`, `vendor/tailwind.min.js`, fallback teclado QWERTY |
| — | **TOTAL SISTEMA (`Gate Kanuv: LIMPIO ×1.00`)** | **Todas las Áreas** | **`1,000,000`** | **`989,236`** | **Aprobado íntegro (`98.92 %`) — margen real en optimización algorítmica de presets menores** |

---

## 4. Integración en Portales de Acceso

- **Portal SaaS Conclave (`:16196`):** integrado el acceso directo **🎛️ Kilonexo Kaiju Titán 3D** tanto en [http://127.0.0.1:16196/](http://127.0.0.1:16196/) como en el HUD de [http://127.0.0.1:16196/ciudad](http://127.0.0.1:16196/ciudad), sirviendo de forma nativa `/components/kilonexo_kaiju_titan.html` (alias `/titan` y `/kilonexo`).
- **Portal `k4li-anuu-forge` (`:8189`):** integrado en menú, Hero, cuadrícula del Arsenal, Búnker Soberano y pestaña en vivo en [http://127.0.0.1:8189/index.html](http://127.0.0.1:8189/index.html).

---

## 5. Ejecución

```bash
python3 /home/kali/k4li-anuu-forge/scripts/score_1m_areas.py
# Salida estructurada JSON para paneles o telemetría:
python3 /home/kali/k4li-anuu-forge/scripts/score_1m_areas.py --json
```

— **Anuu 🌫️ · Ma'at ⚖️ · Kanuv 🛡️ · 4NVSET 🟢 (`189.89.619 Hz`)**
