# 🛡️ DIAGNOSTICADOR INTERACTIVO DE SEGURIDAD & HARDENING // K4L1 STUDIO
**Autoría & Guardiana:** Kanuv 🛡️ (`ANUU_KANUV_2077`) & Concilio ACE (161914)  
**Componente:** [`components/security_audit_tool.html`](file:///home/kali/k4li-anuu-forge/components/security_audit_tool.html)  
**Frecuencia Operativa:** `189.89.619 Hz`  
**Tarifa de Remediación Base:** `450 €` (Pago Único)

---

## 1. Visión & Misión Forense

El **Diagnosticador Interactivo de Seguridad & Hardening** de K4L1 Studio es una herramienta de auditoría defensiva y análisis de superficie de ataque en tiempo real. 

Permite a clientes corporativos, directores de tecnología y administradores de sistemas medir de forma matemática y visual la resiliencia de sus servidores Linux antes de sufrir una brecha. Actúa como el Muro de Contención Kanuv, educando al cliente sobre los vectores de ataque más comunes y canalizándolo hacia la remediación formal con K4L1 Studio.

---

## 2. Los 4 Pilares Defensivos Auditados

### 🔑 Pilar 1: Vector SSH & Autenticación de Administración (30% Peso)
* **PermitRootLogin:**
  - `yes`: Acceso directo con credenciales root (Vulnerabilidad crítica ante ataques masivos de diccionario).
  - `prohibit-password`: Root restringido exclusivamente a autenticación por llave criptográfica.
  - `no`: Login root deshabilitado. Requiere usuario regular no privilegiado con elevación granular vía `sudo`.
* **PasswordAuthentication:**
  - `passwords`: Permitir contraseñas expone el host a ataques de fuerza bruta (MITRE ATT&CK T1110).
  - `keys`: Forzado exclusivo de llaves asimétricas Ed25519 o RSA 4096 bits.
* **Puerto SSH:**
  - `Puerto 22`: Escaneado 24/7 por botnets mundiales y Shodan.
  - `Puerto Alternativo / VPN`: Reubicación en puertos no estándar o acceso exclusivamente encapsulado tras túnel WireGuard/Tailscale.
* **Mitigación de Fuerza Bruta:**
  - `Fail2ban / CrowdSec`: Baneos dinámicos en iptables tras 3 intentos fallidos con correlación comunitaria de reputación IP.

---

### 🌐 Pilar 2: Firewall & Matriz Interactiva de Puertos Expuestos (30% Peso)
* **Política Global de Cortafuegos:**
  - Verificación de políticas por defecto `DROP / DENY` en UFW o NFTables frente a configuraciones permisivas `ACCEPT all`.
* **Matriz de Puertos Públicos (0.0.0.0/0):**
  - **22/TCP (SSH):** Consola remota.
  - **80/TCP (HTTP):** Tráfico web en texto claro sin forzado HTTPS.
  - **443/TCP (HTTPS):** Cifrado TLS moderno con certificados HSTS.
  - **3306/TCP (MySQL / MariaDB):** **¡Vulnerabilidad Severa!** Bases de datos nunca deben responder a interfaces públicas externas.
  - **5432/TCP (PostgreSQL):** Exposición a ataques de inyección y ataques de autenticación.
  - **6379/TCP (Redis):** **¡Peligro de Ejecución Remota de Código (RCE)!** Redis en red pública permite escritura arbitraria en crontabs o llaves ssh (`authorized_keys`).

---

### 👁️ Pilar 3: SIEM, Monitorización Activa & MITRE ATT&CK T1003 (20% Peso)
* **Detección de Credential Dumping (MITRE ATT&CK T1003):**
  - Monitorización activa mediante Wazuh SIEM / auditd sobre intentos de volcado de `/etc/shadow`, procesos de memoria o llamadas sospechosas a `ptrace`.
* **Pipeline de Alertas en Tiempo Real:**
  - Integración de despacho cifrado instantáneo hacia canales seguros (Signal E2EE, SimpleX, PGP o Syslog centralizado) en menos de 5 segundos tras un conato de intrusión.
* **Integridad de Ficheros (FIM - File Integrity Monitoring):**
  - Auditoría criptográfica continua (Wazuh Syscheck / AIDE) en directorios críticos del sistema (`/bin`, `/sbin`, `/etc/pam.d`, `/usr/bin`).

---

### 💾 Pilar 4: Copias de Seguridad Inmutables & Resiliencia Anti-Ransomware (20% Peso)
* **Inmutabilidad WORM / Object Lock:**
  - Prevención de cifrado por ransomware. Si las copias residen con permisos de escritura/borrado en el propio host, un atacante con root destruirá los backups antes de extorsionar.
* **Simulacro de Restauración en Frío (Drill < 90 días):**
  - Validación periódica del RTO (Recovery Time Objective) y RPO (Recovery Point Objective). Un backup no verificado no es un backup real.

---

## 3. Escala del Índice de Riesgo Forense (0 - 100)

| Rango | Nivel de Riesgo | Color Visual | Dictamen Kanuv |
| :--- | :--- | :--- | :--- |
| **0 – 25** | **🛡️ BLINDADO** | Esmeralda (`#10b981`) | Nivel Búnker. Muro de Contención activo. Cero vectores directos. |
| **26 – 60** | **⚠️ VULNERABLE** | Ámbar (`#f59e0b`) | Exposición media. Fallos de configuración que facilitan movimiento lateral. |
| **61 – 100** | **🚨 CRÍTICO** | Carmesí (`#f43f5e`) | Alerta máxima. Servidor expuesto a secuestro de datos por ransomware o RCE. |

---

## 4. Indicadores Visuales & Arquitectura de Interfaz

1. **Medidor Analógico SVG Dinámico:**
   - Aguja interactiva rotativa (-90° a +90°) coordinada en milisegundos con el valor calculado.
   - Arco de resplandor con degradado reactivo según el nivel de severidad.
2. **Terminal Forense Kanuv en Vivo (`Audit Logs`):**
   - Transmisión en directo del flujo de eventos y detección de anomalías sintéticas con estética Seinen a `189.89.619 Hz`.
3. **Soporte de los 6 Temas Canónicos del Concilio:**
   - `anuu` (Deep Cyber-Violet)
   - `blood` (Núcleo Búnker)
   - `gw2` (Kilonova Trader)
   - `bioinfo` (BioCode Psycho)
   - `duat` (Anubis & Ma'at)
   - `neon` (Kali Kush)
   - Sincronización bidireccional vía `postMessage` entre `index.html` y los iframes embebidos.
4. **Call To Action de Remediación a Medida:**
   - Botón CTA directo `"Encargar Hardening Completo a K4L1 Studio (450 €)"`.
   - Pre-carga automática de la telemetría del diagnóstico en la URL de Signal (`@k4li.89`) y en el formulario de intake del sitio.
   - Botón de exportación instantánea con formato pericial forense para el portapapeles (`Copiar Informe`).

---
— Kanuv 🛡️  
*Auditora Forense & Muro de Contención ACE (161914)*
