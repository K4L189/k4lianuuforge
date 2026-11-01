# TARIFARIO OFICIAL Y CATÁLOGO EXHAUSTIVO DE SERVICIOS TÉCNICOS

**ESTUDIO:** K4L1 STUDIO  
**DOCUMENTO:** CATÁLOGO TÉCNICO & MATRIZ DE PRECIOS  
**CÓDIGO DE REGISTRO:** `K4L1-CAT-2026-V1`  
**CLASIFICACIÓN:** PÚBLICA / COMERCIAL  
**FRECUENCIA DE CALIBRACIÓN:** `189.89.619 Hz` — ESCUDO KANUV 🛡️  
**CANAL CRIPTOGRÁFICO DIRECTO:** Signal `@k4li.89`

---

## INTRODUCCIÓN Y POLÍTICA DE CONTRATACIÓN

K4L1 STUDIO opera como una boutique de ingeniería de software crítica, fortificación defensiva y soberanía digital. No competimos en volumen ni en burocracia corporativa; ejecutamos arquitecturas sólidas, medibles y desprovistas de abstracciones innecesarias.

### Principios Operativos Innegociables
1. **Regla de Hitos Financieros:** 50% por adelantado para reservar recursos e iniciar la ingeniería; 50% a la entrega formal y verificación de criterios de aceptación.
2. **Confidencialidad Rigurosa (E2EE):** Toda relación técnica se ampara bajo nuestro Acuerdo Mutuo de Confidencialidad con custodia criptográfica estricta.
3. **Garantía Post-Entrega:** Cada servicio incluye **15 días naturales de SLA y garantía gratuita** para solventar cualquier inconsistencia o anomalía técnica.
4. **Monedas Aceptadas:** Euros (€) mediante transferencia SEPA/SWIFT, o criptoactivos soberanos (USDT, USDC, Monero [XMR], Bitcoin [BTC]) con paridad fijada en la factura proforma.

---

## ÍNDICE DE SERVICIOS ESPECIALIZADOS

1. [SERVICIO 1: Auditoría, Hardening de Servidores & Despliegue SIEM (Blue Team)](#servicio-1-auditoría-hardening-de-servidores--despliegue-siem)
2. [SERVICIO 2: Dashboards React, Web Apps & Generative UI de Alta Frecuencia](#servicio-2-dashboards-react-web-apps--generative-ui)
3. [SERVICIO 3: Despliegue de IA Local Soberana On-Premise (Modelos Privados & Cero Fugas)](#servicio-3-despliegue-de-ia-local-soberana-on-premise)
4. [SERVICIO 4: Automatización, Scrapers & Bots en Python (Ingeniería de Procesos)](#servicio-4-automatización-scrapers--bots-en-python)
5. [MATRIZ DE RETAINERS MENSUALES Y MANTENIMIENTO](#matriz-de-retainers-mensuales-y-mantenimiento)
6. [SERVICIOS ADICIONALES (ADD-ONS)](#servicios-adicionales-add-ons)

---

## SERVICIO 1: AUDITORÍA, HARDENING DE SERVIDORES & DESPLIEGUE SIEM

> **Objetivo:** Blindaje perimetral y nuclear de servidores Linux en producción, monitorización continua contra intrusiones, detección de movimiento lateral y credential dumping (MITRE ATT&CK T1003), con entrega de informe forense formal.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA DE FORTIFICACIÓN                   │
│                                                                        │
│   [Red Externa] ──► [IPTABLES/UFW (Drop-All)] ──► [SSH Ed25519 Only]   │
│                             │                                          │
│                             ▼                                          │
│         [Kernel Hardened sysctl + SUID Sanitization]                   │
│                             │                                          │
│                             ▼                                          │
│         [Wazuh SIEM Manager + Agentes FIM + Suricata DPI]             │
│                             │                                          │
│                             ▼                                          │
│           [Alertas E2EE Signal / Dashboard Blue Team]                  │
└────────────────────────────────────────────────────────────────────────┘
```

### Tiers y Precios

| Tier | Denominación | Inversión Base (€ / USDT) | Plazo Estimado |
| :---: | :--- | :---: | :---: |
| **Tier 1** | **Linux Kernel & Host Hardening (Esencial)** | **450 €** *(o 480 USDT)* | 3 - 5 días hábiles |
| **Tier 2** | **Despliegue SIEM Wazuh & Reglas MITRE ATT&CK (Avanzado)** | **850 €** *(o 920 USDT)* | 6 - 9 días hábiles |
| **Tier 3** | **Búnker Defensivo Enterprise & Threat Hunting Continuo** | **1.600 €** *(o 1.750 USDT)* | 10 - 15 días hábiles |

---

### Desglose Exhaustivo por Tier

#### Tier 1: Linux Kernel & Host Hardening (Esencial) — 450 €
- **Qué Incluye:**
  - **SSH Armor:** Deshabilitación absoluta de `PermitRootLogin`, eliminación de autenticación por contraseña, enforced public-key cryptography (Ed25519), limitación de ciphers obsoletos, configuración de MaxAuthTries restrictivo y cambio de puerto.
  - **Cortafuegos Perimetral Endurecido:** Reglas UFW/Iptables/nftables con política de descarte por defecto (`DEFAULT_INPUT_POLICY="DROP"`), bloqueo de paquetes inválidos, mitigación de SYN floods y cierre de puertos ociosos.
  - **Parámetros de Kernel (`sysctl.conf`):** Endurecimiento de ASLR (Address Space Layout Randomization), deshabilitación de `IP forwarding`, protección estricta contra ataques de spoofing y redirecciones ICMP, limitación de acceso a `dmesg` (`kernel.dmesg_restrict=1`) y restricción de `ptrace` (`kernel.yama.ptrace_scope=2`).
  - **Sanitización del File System:** Auditoría y purga de binarios con permisos `SUID`/`SGID` innecesarios; particionamiento lógico seguro (`/tmp`, `/var/tmp` y `/dev/shm` con flags `nodev,nosuid,noexec`).
  - **Protección contra Fuerza Bruta:** Instalación y afinado de Fail2ban con jails agresivas para SSH y servicios expuestos.
  - **Auditoría Forense Lynis:** Escaneo completo de seguridad antes y después del endurecimiento, garantizando un índice de endurecimiento superior a 80 puntos.
- **Requisitos Técnicos del Cliente:**
  - Servidor con SO Linux (Debian 12, Ubuntu 22.04/24.04 LTS, Rocky Linux 9 o Arch Linux).
  - Acceso administrativo temporal vía SSH mediante llave pública suministrada por K4L1 STUDIO con permisos de `sudo`.
- **Entregables:**
  - Archivos de configuración aplicados, documentados y versionados en `/etc/sysctl.d/`, `/etc/ssh/` y cortafuegos.
  - Script de validación de integridad para verificar que los parámetros persisten tras reinicios.
  - **Informe Forense Ejecutivo (PDF/Markdown):** Diagnóstico inicial, vector de ataque mitigado, índice Lynis y recomendaciones de operación.

#### Tier 2: Despliegue SIEM Wazuh & Reglas MITRE ATT&CK (Avanzado) — 850 €
- **Qué Incluye:**
  - **Todo el contenido del Tier 1** (Hardening integral de host base).
  - **Instalación y Configuración de Wazuh SIEM:** Despliegue de Wazuh Manager, Wazuh Indexer (OpenSearch optimizado) y Wazuh Dashboard asegurados con certificados TLS locales de 4096 bits.
  - **Agentes Wazuh y FIM (File Integrity Monitoring):** Monitorización en tiempo real de cambios o alteraciones en archivos críticos del sistema (`/etc/passwd`, `/etc/shadow`, `/etc/sudoers`, directorios web y binarios).
  - **Detección de Amenazas MITRE ATT&CK:** Reglas personalizadas XML para detectar activamente:
    - **T1003:** Intentos de OS Credential Dumping (lecturas anómalas de memoria o `/etc/shadow`).
    - **T1059:** Ejecución de intérpretes y shells inversas no autorizadas.
    - **T1053:** Modificación fraudulenta de tareas programadas (`cron` y `systemd timers`).
  - **Notificaciones E2EE en Tiempo Real:** Configuración de canal de alerta inmediata cifrada hacia Signal E2EE, SimpleX o bloque PGP ante incidentes de Severidad 10+.
  - **Dashboard Blue Team:** Configuración de paneles visuales para monitorización en vivo de ataques, geolocalización de IPs maliciosas y métricas de cumplimiento de normativas.
- **Requisitos Técnicos del Cliente:**
  - Servidor dedicado o VPS con un mínimo de 4 vCPUs, 8 GB de memoria RAM (recomendado 16 GB para entornos con alto tráfico) y 60 GB de almacenamiento SSD/NVMe libre.
  - Apertura de puertos específicos para comunicación de agentes y dashboard restringidos por IP.
- **Entregables:**
  - Stack Wazuh SIEM 100% operativo y enlazado con agentes.
  - Repositorio con el conjunto de reglas XML y decodificadores específicos del cliente.
  - Credenciales de acceso administrativo transmitidas por canal cifrado E2EE.
  - Manual de operación de incidentes y lectura de eventos del SIEM.

#### Tier 3: Búnker Defensivo Enterprise & Threat Hunting Continuo — 1.600 €
- **Qué Incluye:**
  - **Todo el contenido del Tier 1 y Tier 2** aplicado a una infraestructura de hasta tres (3) servidores/nodos.
  - **IDS/IPS de Red (Suricata):** Inspección profunda de paquetes (DPI) en tiempo real con reglas ET Open/Pro integrada con Wazuh para bloqueo automático de tráfico hostil.
  - **Honeypots y Señuelos Internos (Canary Tokens):** Creación de falsos archivos de configuración, credenciales señuelo y puertos trampa para identificar movimiento lateral antes de la exfiltración.
  - **Fortificación de Contenedores Docker/Podman:** Configuración de perfiles `seccomp`, perfiles `AppArmor`, ejecución obligatoria sin privilegios de root (`rootless`) y limitación de capacidades de kernel (`cap-drop=ALL`).
  - **Simulación de Ataque (Adversary Emulation):** Ejecución de pruebas de penetración controladas desde nodo externo para verificar la reactividad de las defensas y la activación de contramedidas.
  - **1 Mes de Auditoría Prioritaria Incluida:** Revisión semanal de logs y ajuste fino de falsos positivos durante los primeros 30 días.
- **Requisitos Técnicos del Cliente:**
  - Clúster de servidores dedicados o entorno cloud con red privada aislada (VPC).
  - Designación de un interlocutor técnico para la sesión de emulación de amenazas.
- **Entregables:**
  - Infraestructura defensiva multi-nodo completamente encriptada.
  - Informe Técnico de Simulación de Adversario con evidencias de detección en tiempo real.
  - Guía Forense de Respuesta ante Brechas de Seguridad (Runbook de Contención Kanuv).

---

## SERVICIO 2: DASHBOARDS REACT, WEB APPS & GENERATIVE UI

> **Objetivo:** Creación de interfaces de usuario vanguardistas, dashboards financieros de baja latencia con procesamiento reactivo en tiempo real (estilo Kilonova Trader), portales de datos y aplicaciones web ligeras sin hinchazón de librerías comerciales.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA FRONTEND REACT                     │
│                                                                        │
│   [API / WebSocket] ──► [Zustand / Redux Store] ──► [Canvas 60 FPS]    │
│                                  │                                     │
│                                  ▼                                     │
│                [Vite + React 18/19 + Tailwind CSS]                     │
│                                  │                                     │
│                                  ▼                                     │
│          [Tema Dinámico: 6 Estilos Seinen / Cyberpunk / Duat]          │
└────────────────────────────────────────────────────────────────────────┘
```

### Tiers y Precios

| Tier | Denominación | Inversión Base (€ / USDT) | Plazo Estimado |
| :---: | :--- | :---: | :---: |
| **Tier 1** | **Dashboard React / SPA Componentizado (Core)** | **350 €** *(o 380 USDT)* | 4 - 6 días hábiles |
| **Tier 2** | **Real-Time Streaming & High-Frequency Dashboard (Pro)** | **750 €** *(o 800 USDT)* | 7 - 10 días hábiles |
| **Tier 3** | **Plataforma Web Completa & Generative Suite (Enterprise)** | **1.450 €** *(o 1.550 USDT)* | 12 - 18 días hábiles |

---

### Desglose Exhaustivo por Tier

#### Tier 1: Dashboard React / SPA Componentizado (Core) — 350 €
- **Qué Incluye:**
  - **Stack Técnico:** Desarrollo en **Vite + React 18/19 + Tailwind CSS**.
  - **Vistas y Componentes:** Hasta 4 vistas o módulos analíticos principales (KPI cards con métricas clave, tablas ordenables con búsqueda instantánea, gráficos de series temporales con Chart.js o Recharts).
  - **Selector de Temas Dinámicos:** Selector de paleta visual integrado (ej. Modo Oscuro Seinen / High-Tech Neon / Clean Minimalist).
  - **Diseño Adaptativo:** Maquetación 100% responsiva (escritorio, tablet y smartphone) sin fallos visuales.
  - **Integración de API:** Conexión con un (1) endpoint o API REST externa para la carga, actualización y filtrado de datos.
- **Requisitos Técnicos del Cliente:**
  - Especificación clara de los datos a representar o documentación de la API REST a consumir.
  - Logotipos, activos gráficos y preferencias estéticas preliminares.
- **Entregables:**
  - Repositorio Git con código modular, semántico y comentado.
  - Build estático de producción optimizado en carpeta `/dist`.
  - Manual de configuración de variables de entorno (`.env`) y despliegue rápido.

#### Tier 2: Real-Time Streaming & High-Frequency Dashboard (Pro) — 750 €
- **Qué Incluye:**
  - **Todo el contenido del Tier 1** con arquitectura tipada estricta en **TypeScript**.
  - **Flujo de Datos en Tiempo Real:** Integración con **WebSockets** o Server-Sent Events (SSE) para renderizado instantáneo de cotizaciones, libros de órdenes, telemetría de servidores o transacciones en vivo.
  - **Gráficos de Alto Rendimiento:** Renderizado acelerado por Canvas o WebGL (TradingView Lightweight Charts, D3.js o visualizaciones de partículas ambientales).
  - **Gestión de Estado Escalable:** Implementación de Zustand o Redux Toolkit para garantizar un rendimiento fluido a 60 FPS sin re-renders innecesarios.
  - **Micro-interacciones y Sonido Opcional:** Animaciones fluidas mediante Framer Motion y efectos de sonido de interfaz sutiles para transacciones o alertas.
  - **Módulo de Autenticación:** Pantalla de acceso protegida mediante JWT, cookies seguras o login descentralizado Web3.
- **Requisitos Técnicos del Cliente:**
  - Endpoints de WebSocket o servidores de streaming operativos con datos de prueba o sandbox.
  - Servidor de hosting o plataforma de despliegue definida (Vercel, Cloudflare Pages o VPS con Nginx).
- **Entregables:**
  - Código fuente completo en TypeScript con arquitectura limpia y componentes reutilizables.
  - Contenedor Docker (`Dockerfile` y `nginx.conf`) optimizado con compresión gzip/brotli.
  - Pruebas de estrés y benchmarking de consumo de CPU en cliente.

#### Tier 3: Plataforma Web Completa & Generative Suite (Enterprise) — 1.450 €
- **Qué Incluye:**
  - **Todo el contenido del Tier 1 y Tier 2** con arquitectura Full-Stack (Next.js / React + backend ligero en FastAPI o Express).
  - **Panel de Control Administrativo Completo:** Control de acceso basado en roles (RBAC: Administrador, Auditor, Operador, Cliente).
  - **Generación y Exportación de Informes:** Módulo de exportación masiva a formatos PDF vectoriales de alta calidad, hojas CSV y JSON estructurado en un clic.
  - **Lienzo Generativo & Shaders:** Fondo dinámico procedural interactivo en Three.js / WebGL personalizable por el usuario.
  - **Optimización Máxima de Rendimiento:** Auditoría Google Lighthouse garantizada con puntuaciones superiores a 95 en Rendimiento, Accesibilidad y Mejores Prácticas.
- **Requisitos Técnicos del Cliente:**
  - Base de datos operativa (PostgreSQL, Supabase o Redis) o servidor de aplicaciones dedicado.
  - Especificación detallada de los roles de usuario y flujos de negocio.
- **Entregables:**
  - Plataforma web llave en mano lista para producción.
  - Configuración de pipelines de integración y despliegue continuo (GitHub Actions CI/CD).
  - Documentación de arquitectura de software y guía de onboarding para desarrolladores.

---

## SERVICIO 3: DESPLIEGUE DE IA LOCAL SOBERANA ON-PREMISE

> **Objetivo:** Despliegue de modelos de inteligencia artificial de última generación ejecutándose al 100% en infraestructura local o privada del cliente. Cero telemetría externa, cero dependencia de OpenAI u otras grandes corporaciones, garantizando el secreto industrial y el cumplimiento estricto del RGPD / Secreto Profesional.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA DE IA SOBERANA                     │
│                                                                        │
│   [Archivos / PDFs / DBs] ──► [Pipeline Embeddings Local (BGE)]        │
│                                          │                             │
│                                          ▼                             │
│                           [ChromaDB / Vector Database]                 │
│                                          │                             │
│                                          ▼                             │
│   [Prompt de Usuario] ─────► [RAG Engine + Context Injector]           │
│                                          │                             │
│                                          ▼                             │
│                     [Ollama / vLLM / GGUF Local Model]                 │
│                                          │                             │
│                                          ▼                             │
│                   [Open WebUI / API Interna sin Salida Externa]        │
└────────────────────────────────────────────────────────────────────────┘
```

### Tiers y Precios

| Tier | Denominación | Inversión Base (€ / USDT) | Plazo Estimado |
| :---: | :--- | :---: | :---: |
| **Tier 1** | **Servidor de Inferencia Local & WebUI Privada (Core)** | **600 €** *(o 650 USDT)* | 4 - 6 días hábiles |
| **Tier 2** | **Asistente RAG Local (Documentos Propios & Cero Alucinaciones)** | **1.150 €** *(o 1.250 USDT)* | 8 - 12 días hábiles |
| **Tier 3** | **Infraestructura de IA Multimodal & Fine-Tuning LoRA (Enterprise)** | **2.200 €** *(o 2.400 USDT)* | 15 - 20 días hábiles |

---

### Desglose Exhaustivo por Tier

#### Tier 1: Servidor de Inferencia Local & WebUI Privada (Core) — 600 €
- **Qué Incluye:**
  - **Motor de Inferencia:** Instalación y configuración de Ollama / llama.cpp / vLLM optimizado con soporte para CUDA, ROCm o aceleración de CPU (AVX2/AVX-512).
  - **Selección y Cuantización de Modelos:** Descarga y configuración de modelos de lenguaje de código abierto de máxima capacidad adaptados al hardware disponible (Llama 3.1 8B, Qwen 2.5 7B/14B, Mistral Nemo o DeepSeek Coder en formatos GGUF de 4, 5 u 8 bits).
  - **Interfaz de Usuario Privada:** Despliegue de **Open WebUI** en entorno aislado Docker, accesible exclusivamente mediante IP de red local o túnel encriptado WireGuard/Tailscale.
  - **Perfiles de Agente y Prompts Maestros:** Configuración de hasta 3 *personas* o asistentes especializados con instrucciones del sistema ajustadas a los flujos de la empresa.
  - **Blindaje Airgap:** Configuración del cortafuegos interno para impedir que el motor de inferencia realice cualquier conexión saliente hacia internet (Zero Telemetry).
- **Requisitos Técnicos del Cliente:**
  - Estación de trabajo o servidor con GPU NVIDIA (mínimo 8 GB de VRAM como RTX 3060/4060) o procesador multinúcleo con mínimo 16-32 GB de RAM para inferencia en CPU.
  - Sistema operativo Linux (Ubuntu/Debian) con drivers NVIDIA propietarios y nvidia-container-toolkit instalados (se ofrece asistencia técnica si se requiere).
- **Entregables:**
  - Servidor de IA local 100% operativo ejecutándose como servicio systemd con reinicio automático.
  - Manual de administración de modelos y comandos de mantenimiento.
  - Informe de prueba forense de aislamiento de red (evidencia de cero paquetes salientes).

#### Tier 2: Asistente RAG Local (Documentos Propios & Cero Alucinaciones) — 1.150 €
- **Qué Incluye:**
  - **Todo el contenido del Tier 1** (Inferencia local optimizada y WebUI).
  - **Motor Vectorial Local:** Despliegue de base de datos vectorial on-premise (ChromaDB, Qdrant o PostgreSQL con extensión pgvector).
  - **Pipeline de Ingestión Documental:** Procesamiento automático de documentos corporativos (manuales técnicos, PDFs clínicos, contratos legales, código fuente, políticas internas) con segmentación semántica (*chunking* optimizado).
  - **Modelo de Embeddings On-Premise:** Configuración de modelos locales de embedding de alta precisión (bge-large, nomic-embed) que convierten texto a vectores sin salir de la máquina.
  - **Trazabilidad y Citación de Fuentes:** Configuración de respuestas con indicación exacta del párrafo y archivo original del que se extrajo la información, erradicando alucinaciones.
  - **Voz Neuronal Local Opcional:** Integración de síntesis de voz Piper TTS y reconocimiento Whisper ASR corriendo 100% en local para interacción por voz confidencial.
- **Requisitos Técnicos del Cliente:**
  - Servidor dedicado con GPU NVIDIA de al menos 12 GB - 16 GB VRAM (RTX 3060 12GB, RTX 4060 Ti 16GB, RTX 3090/4090 o líneas Tesla/Quadro).
  - Mínimo 32 GB de memoria RAM y 150 GB de almacenamiento NVMe SSD.
- **Entregables:**
  - Sistema RAG operativo conectado a la base documental de la empresa.
  - Script de re-indexación programada para incorporar nuevos documentos automáticamente.
  - Documentación de arquitectura técnica y taller de formación de 1 hora para el equipo del cliente.

#### Tier 3: Infraestructura de IA Multimodal & Fine-Tuning LoRA (Enterprise) — 2.200 €
- **Qué Incluye:**
  - **Todo el contenido del Tier 1 y Tier 2** escalado para configuraciones multi-GPU o servidores de alto rendimiento.
  - **Fine-Tuning con Adaptadores LoRA / QLoRA:** Entrenamiento fino supervisado sobre el dataset corporativo para que el modelo aprenda el tono institucional, la taxonomía técnica exacta y formatos de salida propios de la empresa.
  - **Capacidades Multimodales Privadas:** Configuración de modelos de visión por computador locales (Llama-3.2-Vision o Qwen2-VL) para análisis automático de diagramas, radiografías médicas, facturas o capturas forenses sin enviar imágenes a nubes públicas.
  - **API REST Interna Segura:** Creación de endpoints autenticados compatibles con la especificación de OpenAI para conectar el modelo a los sistemas internos de la empresa (ERP, CRM, software clínico).
  - **Defensas contra Inyecciones de Prompt:** Filtros de sanitización y guardrails de seguridad locales para evitar jailbreaks y manipulación de instrucciones.
- **Requisitos Técnicos del Cliente:**
  - Servidor bare-metal de cálculo con al menos 24 GB a 48 GB de VRAM (RTX 3090/4090, RTX 6000 Ada o A100/H100 on-premise).
  - Al menos 64 GB de RAM del sistema y dataset de entrenamiento estructurado en JSONL/Markdown.
- **Entregables:**
  - Adaptadores LoRA generados, versionados y fusionados con el modelo base.
  - API interna documentada con Swagger/OpenAPI protegida con autenticación mTLS.
  - Certificado de calibración de métricas de precisión y retención de conocimiento.

---

## SERVICIO 4: AUTOMATIZACIÓN, SCRAPERS & BOTS EN PYTHON

> **Objetivo:** Automatización sistemática de tareas repetitivas, scrapers resistentes a protecciones antibot modernas, bots interactivos para Signal E2EE, SimpleX o Discord, y pipelines de sincronización de datos con máxima resiliencia.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA DE AUTOMATIZACIÓN                  │
│                                                                        │
│   [Sitios Web / APIs] ──► [Playwright Stealth + Proxy Rotativo]        │
│                                         │                              │
│                                         ▼                              │
│                     [Pipeline ETL + Validación Pydantic]               │
│                                         │                              │
│                                         ▼                              │
│         [Base de Datos SQL] ◄──► [Signal E2EE / SimpleX / PGP]         │
│                                         │                              │
│                                         ▼                              │
│               [Servicio Desatendido systemd + Auto-Restart]            │
└────────────────────────────────────────────────────────────────────────┘
```

### Tiers y Precios

| Tier | Denominación | Inversión Base (€ / USDT) | Plazo Estimado |
| :---: | :--- | :---: | :---: |
| **Tier 1** | **Script de Automatización / Bot Simple (Core)** | **200 €** *(o 220 USDT)* | 2 - 4 días hábiles |
| **Tier 2** | **Scraper Avanzado Anti-Detección & Pipeline de Datos (Pro)** | **450 €** *(o 490 USDT)* | 5 - 8 días hábiles |
| **Tier 3** | **Ecosistema Autónomo de Bots & Integración Multi-Plataforma (Enterprise)** | **950 €** *(o 1.050 USDT)* | 9 - 14 días hábiles |

---

### Desglose Exhaustivo por Tier

#### Tier 1: Script de Automatización / Bot Simple (Core) — 200 €
- **Qué Incluye:**
  - **Desarrollo en Python 3.11+:** Código limpio, tipado estático con *type hints* y arquitectura modular.
  - **Opción A (Bot de Mensajería):** Bot funcional para Signal E2EE, SimpleX o Discord con comandos básicos, respuestas predefinidas y alertas automáticas periódicas.
  - **Opción B (Scraper Web):** Script de extracción estructurada de datos para sitios web sin protecciones complejas (BeautifulSoup4 / requests / Playwright) con volcado ordenado a archivos CSV, Excel, JSON o SQLite.
  - **Robustez y Tolerancia a Fallos:** Manejo global de excepciones, reintentos exponenciales y rotación de logs para evitar detenciones por caídas de conexión.
  - **Despliegue Desatendido:** Configuración como servicio `systemd` para arranque automático con el servidor.
- **Requisitos Técnicos del Cliente:**
  - Enlaces a los portales o especificación exacta de los datos a extraer.
  - Tokens de acceso de bot o servidor Linux básico (VPS de 1 CPU / 1 GB RAM suficiente).
- **Entregables:**
  - Repositorio con código fuente documentado y archivo `requirements.txt`.
  - Archivo unitario `.service` para `systemd` y guía de puesta en marcha.

#### Tier 2: Scraper Avanzado Anti-Detección & Pipeline de Datos (Pro) — 450 €
- **Qué Incluye:**
  - **Todo el contenido del Tier 1** con ingeniería de evasión avanzada.
  - **Módulos Anti-Bot y Bypass:** Implementación de Playwright con plugins *stealth*, simulación de comportamiento humano (movimientos de ratón, pausas aleatorias), spoofing de fingerprint de navegador (WebGL, canvas, audio) y evasión de soluciones antibot estándar (Cloudflare Turnstile, hCaptcha).
  - **Rotación de Proxies y Cabeceras:** Gestión de rotación inteligente de direcciones IP (proxies residenciales o móviles) y cabeceras HTTP/2 dinámicas.
  - **Pipeline ETL Completo:** Extracción, normalización y validación estricta de datos mediante esquemas **Pydantic** antes de su inserción en bases de datos relacionales (PostgreSQL, MySQL) o vectoriales.
  - **Sistema de Alertas Inteligentes:** Envío de avisos automáticos ante fluctuaciones de precios, cambios de stock de competidores o hallazgos anómalos.
- **Requisitos Técnicos del Cliente:**
  - Proveedor de proxies residenciales configurado (si la web objetivo aplica bloqueos estrictos de IP).
  - Acceso a base de datos de destino para el almacenamiento estructurado.
- **Entregables:**
  - Contenedor Docker listo para producción (`Dockerfile` + `docker-compose.yml`).
  - Suite de pruebas de extracción automatizadas para validar la continuidad ante cambios en la web objetivo.
  - Manual de mantenimiento y cambio de credenciales de proxies.

#### Tier 3: Ecosistema Autónomo de Bots & Integración Multi-Plataforma (Enterprise) — 950 €
- **Qué Incluye:**
  - **Todo el contenido del Tier 1 y Tier 2** orquestado como una suite de microservicios asíncronos (`asyncio`, Celery o Redis Queue).
  - **Integración Bidireccional de APIs Complejas:** Sincronización continua de datos entre pasarelas de pago (Stripe/Crypto), CRMs, ERPs, hojas de cálculo de Google y sistemas de mensajería.
  - **Bot de Operaciones Interactivo:** Menús dinámicos con botones en línea (*inline keyboards*), gestión de sesiones por usuario, subida/bajada de ficheros y generación de gráficos estadísticos en tiempo real.
  - **Panel de Supervisión Ligero:** Mini-dashboard web para visualizar el estado de las tareas en cola, logs de ejecución y tasa de aciertos de las automatizaciones.
  - **Aislamiento Criptográfico:** Almacenamiento cifrado de credenciales y llaves de acceso mediante variables de entorno selladas.
- **Requisitos Técnicos del Cliente:**
  - Servidor dedicado o VPS con al menos 2 vCPUs y 4 GB de memoria RAM.
  - Claves de API de los sistemas que se integrarán en el flujo de trabajo.
- **Entregables:**
  - Ecosistema completo empaquetado en contenedores Docker orquestados.
  - Scripts de migración de bases de datos y fixtures de prueba.
  - Sesión de demostración técnica y soporte prioritario de lanzamiento.

---

## MATRIZ DE RETAINERS MENSUALES Y MANTENIMIENTO

Para clientes que requieren monitorización proactiva, actualización de defensas y garantía de disponibilidad continua tras la entrega:

| Modalidad | Cobertura Mensual | Inversión Mensual | SLA de Respuesta |
| :--- | :--- | :---: | :---: |
| **Retainer Blue Watchdog (Seguridad & SIEM)** | Auditoría mensual de vulnerabilidades, actualización de reglas de detección Wazuh, parches de seguridad de kernel críticos y respuesta prioritaria ante alertas. | **250 € / mes** | **< 4 Horas** |
| **Retainer AI & Systems Care (IA & Infraestructura)** | Supervisión de salud del servidor LLM local, mantenimiento de índices RAG, depuración de logs y re-entrenamiento periódico menor de modelos. | **350 € / mes** | **< 3 Horas** |
| **Retainer Full Studio Partner (Soporte Integral)** | Cobertura integral de los 4 frentes: seguridad activa, mantenimiento de dashboards React, soporte de IA local y ajuste continuo de scrapers/bots. | **650 € / mes** | **< 2 Horas** *(Prioridad Absoluta)* |

*Condiciones de Retainers: Compromiso mínimo de tres (3) meses, liquidables mediante domiciliación mensual anticipada o pago trimestral en criptoactivos.*

---

## SERVICIOS ADICIONALES (ADD-ONS)

- **Despliegue de Emergencia / Modo Express:**  
  * Recargo: **+25% sobre la tarifa base del tier**.  
  * Compromiso: Dedicación prioritaria y jornadas intensivas para reducir los tiempos de entrega hasta en un 50%.
- **Nodo / Servidor Adicional en Fortificación:** **+180 €** por host adicional (incluye hardening y vinculación de agente al SIEM).
- **Modelo de Lenguaje Adicional en Servidor de IA:** **+150 €** (incluye descarga, cuantización óptima y configuración en la WebUI).
- **Módulo de Autenticación Biométrica / WebAuthn:** **+220 €** para dashboards React.
- **Sesión de Consultoría Técnica Personalizada con Kali:** **120 € / hora** (vía Signal / canal de voz encriptado).

---

## PROCEDIMIENTO DE CONTRATACIÓN

```
1. CONTACTO INICIAL   ──► Canal Seguro Signal (@k4li.89) o cotizador web.
2. EVALUACIÓN TÉCNICA ──► Firma de NDA Mutuo & análisis de requerimientos.
3. EMISIÓN DEL SOW    ──► Envío de Propuesta Comercial con hitos y entregables.
4. PAGO INICIAL (50%) ──► Reserva de capacidad técnica e inicio de labores.
5. ENTREGA & AUDITORÍA ──► Pruebas de aceptación, informe forense y pago final (50%).
6. COBERTURA SLA      ──► 15 días naturales de garantía y soporte directo.
```

---
*K4L1 STUDIO — Ingeniería Soberana, Ciberseguridad & Privacidad Radical.*  
*Certificación de Integridad: Escudo Kanuv 🛡️ — Concilio ACE (161914) a 189.89.619 Hz.*
