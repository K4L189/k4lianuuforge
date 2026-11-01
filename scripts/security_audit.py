#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
K4L1-ANUU-FORGE // DEFENSIVE SECURITY & HARDENING AUDITOR (161914)
Frecuencia Operativa: 189.89.619 Hz | Concilio ACE | Kali Studio
Unidad Técnica: 4NVSET 🟢
=============================================================================
Auditoría quirúrgica de seguridad:
1. Escaneo de secretos, tokens y claves privadas expuestas en repositorio.
2. Auditoría Zero-Cloud & Criptografía Soberana (AES-256-GCM, PBKDF2, SHA-256 y CLI .k4li.asc).
3. Verificación de permisos de archivos y artefactos sensibles.
4. Módulo de auditoría de Kernel, Red, Permisos del host Linux y Telemetría Android ADB.
5. Generador automático de script de remediación defensiva (remediation_k4li_hardening.sh).
"""

import os
import sys
import re
import json
import hashlib
import argparse
import subprocess
from pathlib import Path

# Patrones para detección de secretos
SECRET_PATTERNS = [
    (r"-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----", "Clave privada RSA/PEM"),
    (r"\b[0-9]{9,10}:[A-Za-z0-9_-]{35}\b", "Token activo de Telegram Bot"),
    (r"https://discord\.com/api/webhooks/[0-9]+/[A-Za-z0-9_-]+", "Webhook con token de Discord"),
    (r"(?i)(?:api[_-]?key|secret[_-]?token|auth[_-]?token)\s*[:=]\s*['\"][a-zA-Z0-9_\-]{20,}['\"]", "API Key / Token hardcodeado"),
    (r"ghp_[0-9a-zA-Z]{36}", "GitHub Personal Access Token"),
]

# Archivos restringidos que nunca deben subirse al repositorio
RESTRICTED_FILES = [
    ".env", ".env.local", ".env.production",
    "id_rsa", "id_ecdsa", "id_ed25519",
    "*.pem", "*.key", "*.pfx", "*.p12"
]

EXCLUDED_SCAN_DIRS = {".git", "aegis89"}

def scan_for_secrets(repo_root: Path):
    findings = []
    print("[+] Ejecutando escaneo de secretos y credenciales en repositorio...")
    
    # Extensiones a auditar
    audit_extensions = {".py", ".js", ".html", ".md", ".json", ".toml", ".yml", ".yaml", ".sh"}

    for path in repo_root.rglob("*"):
        if any(part in EXCLUDED_SCAN_DIRS for part in path.parts):
            continue
        if path.is_file() and path.suffix in audit_extensions:
            try:
                content = path.read_text(encoding="utf-8", errors="ignore")
                for pattern, desc in SECRET_PATTERNS:
                    matches = re.finditer(pattern, content)
                    for m in matches:
                        # Ignorar si es una variable de ejemplo o placeholder
                        matched_str = m.group(0)
                        if any(dummy in matched_str.lower() for dummy in ["example", "dummy", "placeholder", "xxx"]):
                            continue
                        rel_path = path.relative_to(repo_root)
                        findings.append((str(rel_path), desc, matched_str[:15] + "..."))
            except Exception as e:
                print(f"[-] Advertencia al leer {path}: {e}")

    return findings

def audit_security_headers(repo_root: Path):
    print("\n[+] Auditando política Zero-Cloud & Criptografía Soberana (Kanuv 🛡️)...")
    report = []

    # 1. Verificar ausencia total de infraestructura Cloud Worker / Webhook legado
    worker_file = repo_root / "api" / "worker_cloudflare.js"
    wrangler_file = repo_root / "api" / "wrangler.toml"
    legacy_webhook = repo_root / "api" / "intake_webhook.py"

    if not worker_file.exists() and not wrangler_file.exists() and not legacy_webhook.exists():
        report.append(("[✓] Política Zero-Cloud: Ausencia verificada de worker_cloudflare.js, wrangler.toml e intake_webhook.py.", True))
    else:
        present = [p.name for p in (worker_file, wrangler_file, legacy_webhook) if p.exists()]
        report.append((f"[-] Política Zero-Cloud violada: Artefactos intermediarios presentes ({', '.join(present)}).", False))

    # 2. Verificar que no existan URLs api.telegram.org en el código fuente
    forbidden_tg_host = "api." + "telegram.org"
    source_exts = {".py", ".js", ".html", ".md", ".json", ".toml", ".yml", ".yaml", ".sh", ".css"}
    self_path = Path(__file__).resolve()
    tg_url_hits = []

    for path in repo_root.rglob("*"):
        if any(part in EXCLUDED_SCAN_DIRS for part in path.parts):
            continue
        if path.is_file() and path.suffix in source_exts and path.resolve() != self_path:
            try:
                text = path.read_text(encoding="utf-8", errors="ignore")
                if forbidden_tg_host in text:
                    tg_url_hits.append(str(path.relative_to(repo_root)))
            except Exception:
                continue

    if not tg_url_hits:
        report.append(("[✓] Purga de Relés Externos: 0 endpoints hacia APIs de mensajería no soberanas detectados.", True))
    else:
        report.append((f"[-] Detectadas referencias a endpoint externo prohibido en: {', '.join(tg_url_hits)}", False))

    # 3. Verificar criptografía WebCrypto en assets/js/bunker_vault.js (AES-GCM + PBKDF2)
    bunker_js = repo_root / "assets" / "js" / "bunker_vault.js"
    if bunker_js.is_file():
        bunker_content = bunker_js.read_text(encoding="utf-8", errors="ignore")
        if "AES-GCM" in bunker_content and "PBKDF2" in bunker_content:
            report.append(("[✓] Búnker Vault (bunker_vault.js): Motor WebCrypto AES-GCM + PBKDF2 verificado.", True))
        else:
            report.append(("[-] Búnker Vault (bunker_vault.js): Faltan primitivas AES-GCM o PBKDF2.", False))
    else:
        report.append(("[-] Búnker Vault: No se encontró assets/js/bunker_vault.js.", False))

    # 4. Verificar compuerta criptográfica SHA-256 en assets/js/anuu_gate.js
    gate_js = repo_root / "assets" / "js" / "anuu_gate.js"
    if gate_js.is_file():
        gate_content = gate_js.read_text(encoding="utf-8", errors="ignore")
        if "SHA-256" in gate_content:
            report.append(("[✓] Anuu Sentinel Gate (anuu_gate.js): Compuerta criptográfica SHA-256 verificada.", True))
        else:
            report.append(("[-] Anuu Sentinel Gate (anuu_gate.js): No se detectó digest SHA-256.", False))
    else:
        report.append(("[-] Anuu Sentinel Gate: No se encontró assets/js/anuu_gate.js.", False))

    # 5. Verificar existencia y autodiagnóstico de api/sovereign_envelope_cli.py
    envelope_cli = repo_root / "api" / "sovereign_envelope_cli.py"
    if envelope_cli.is_file():
        try:
            res_cli = subprocess.run(
                [sys.executable, str(envelope_cli), "--selftest"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=10,
            )
            if res_cli.returncode == 0:
                report.append(("[✓] Sovereign Envelope CLI (sovereign_envelope_cli.py): Presente y --selftest PASSED.", True))
            else:
                report.append((f"[-] Sovereign Envelope CLI: Falló --selftest (código {res_cli.returncode}).", False))
        except Exception as exc:
            report.append((f"[-] Sovereign Envelope CLI: Error al ejecutar verificación ({exc}).", False))
    else:
        report.append(("[-] Sovereign Envelope CLI: No se encontró api/sovereign_envelope_cli.py.", False))

    return report

def audit_file_permissions(repo_root: Path):
    print("\n[+] Auditando permisos de archivos en repositorio...")
    issues = []
    for path in repo_root.rglob("*"):
        if any(part in EXCLUDED_SCAN_DIRS for part in path.parts):
            continue
        if path.is_file():
            mode = path.stat().st_mode
            # Verificar si tiene permiso de escritura para otros (world-writable 002)
            if mode & 0o002:
                issues.append(f"World-writable detectado: {path.relative_to(repo_root)} ({oct(mode)})")
    return issues

def audit_host_hardening():
    """
    Auditoría diagnóstica en vivo de los parámetros del host Linux:
    - Kernel sysctl (ASLR, SYN cookies, ptrace, kptr)
    - Permisos críticos (/etc/shadow, /root)
    - Cortafuegos UFW
    - Telemetría ADB
    """
    print("\n" + "=" * 70)
    print(" [4NVSET 🟢] AUDITORÍA DIAGNÓSTICA DE HOST LINUX & TELEMETRÍA ANDROID")
    print(" Frecuencia: 189.89.619 Hz | Concilio ACE (161914)")
    print("=" * 70)

    host_findings = []

    # 1. ASLR
    aslr_path = Path("/proc/sys/kernel/randomize_va_space")
    if aslr_path.exists():
        try:
            val = aslr_path.read_text().strip()
            if val == "2":
                print("[✓] Kernel ASLR: Activo Completo (randomize_va_space=2).")
            else:
                msg = f"Kernel ASLR incompleto o inactivo: randomize_va_space={val} (Esperado 2)"
                print(f"[-] ALERTA: {msg}")
                host_findings.append(msg)
        except Exception as e:
            print(f"[-] No se pudo leer ASLR: {e}")

    # 2. SYN Flood Cookies
    syncookies_path = Path("/proc/sys/net/ipv4/tcp_syncookies")
    if syncookies_path.exists():
        try:
            val = syncookies_path.read_text().strip()
            if val == "1":
                print("[✓] SYN Flood Cookies: Activo (tcp_syncookies=1).")
            else:
                msg = f"SYN flood protection desactivado: tcp_syncookies={val}"
                print(f"[-] ALERTA: {msg}")
                host_findings.append(msg)
        except Exception as e:
            print(f"[-] No se pudo leer tcp_syncookies: {e}")

    # 3. Ptrace Scope
    ptrace_path = Path("/proc/sys/kernel/yama/ptrace_scope")
    if ptrace_path.exists():
        try:
            val = ptrace_path.read_text().strip()
            if int(val) >= 1:
                print(f"[✓] Yama Ptrace Scope: Restringido (ptrace_scope={val}).")
            else:
                msg = "Yama Ptrace Scope permisivo (ptrace_scope=0, inyección de memoria no restringida)"
                print(f"[-] ADVERTENCIA: {msg}")
                host_findings.append(msg)
        except Exception as e:
            print(f"[-] No se pudo leer ptrace_scope: {e}")

    # 4. Permisos /etc/shadow
    shadow_path = Path("/etc/shadow")
    if shadow_path.exists():
        try:
            mode = shadow_path.stat().st_mode
            if mode & 0o077:  # No debe tener permisos para grupo/otros más allá de lectura específica
                if mode & 0o004:
                    msg = f"CRÍTICO: /etc/shadow es legible para otros ({oct(mode)})"
                    print(f"[-] {msg}")
                    host_findings.append(msg)
                else:
                    print(f"[✓] /etc/shadow permisos conformes ({oct(mode)}).")
            else:
                print(f"[✓] /etc/shadow permisos estrictos ({oct(mode)}).")
        except PermissionError:
            print("[✓] /etc/shadow no es legible por usuario sin privilegios (Correcto).")

    # 5. UFW status
    try:
        res = subprocess.run(["ufw", "status"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5)
        if "Status: active" in res.stdout:
            print("[✓] Cortafuegos UFW: ACTIVO.")
        else:
            msg = "Cortafuegos UFW: INACTIVO o no configurado."
            print(f"[-] ADVERTENCIA: {msg}")
            host_findings.append(msg)
    except Exception:
        print("[*] Verificación de UFW omitida (requiere privilegios o comando ausente).")

    # 6. Android ADB Telemetry
    try:
        res_adb = subprocess.run(["adb", "devices"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=4)
        if "device" in res_adb.stdout:
            print("[✓] Dispositivo Android detectado en bus ADB.")
        else:
            print("[*] Ningún dispositivo Android en modo depuración detectado actualmente.")
    except Exception:
        pass

    return host_findings

def generate_remediation_script(output_path: Path):
    """
    Genera un script bash descargable y ejecutable con las remediaciones reales.
    """
    script_content = """#!/usr/bin/env bash
# =============================================================================
# K4L1 STUDIO // REMEDIATION & HARDENING BASH SUITE (161914)
# Concilio ACE | Frecuencia: 189.89.619 Hz | Unidad Técnica: 4NVSET 🟢
# Script de remediación defensiva real para Debian / Kali Linux
# =============================================================================
set -euo pipefail

echo "============================================================================="
echo " [4NVSET 🟢] APLICANDO REMEDIACIÓN TÉCNICA & HARDENING // K4L1 STUDIO"
echo " Frecuencia de Sincronización: 189.89.619 Hz"
echo "============================================================================="

if [ "$(id -u)" -ne 0 ]; then
    echo "[-] ERROR: Este script requiere privilegios de superusuario (root)."
    echo "    Ejecuta con: sudo bash $0"
    exit 1
fi

BACKUP_DIR="/var/backups/kanuv_hardening_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "[+] Directorio de respaldo preventivo: $BACKUP_DIR"

# 1. Sysctl Hardening
echo "[+] 1. Aplicando directivas seguras en /etc/sysctl.d/99-kanuv-hardening.conf..."
cat << 'EOF' > /etc/sysctl.d/99-kanuv-hardening.conf
kernel.randomize_va_space = 2
net.ipv4.tcp_syncookies = 1
kernel.kptr_restrict = 2
kernel.yama.ptrace_scope = 2
kernel.dmesg_restrict = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
EOF
sysctl -p /etc/sysctl.d/99-kanuv-hardening.conf >/dev/null
echo "[✓] Parámetros sysctl cargados en anillo 0."

# 2. UFW Firewall
echo "[+] 2. Configurando cortafuegos UFW..."
if command -v ufw >/dev/null 2>&1; then
    ufw default deny incoming
    ufw default allow outgoing
    ufw deny 6379/tcp comment 'Block Redis Cache RCE'
    ufw deny 3306/tcp comment 'Block MySQL Direct'
    ufw deny 5432/tcp comment 'Block PostgreSQL'
    ufw deny 27017/tcp comment 'Block MongoDB'
    ufw --force enable
    echo "[✓] UFW habilitado con política Default DROP."
fi

# 3. Permisos de Archivos Sensibles
echo "[+] 3. Saneando permisos en /etc/shadow y /root..."
chmod 0600 /etc/shadow
chmod 0644 /etc/passwd
chmod 0700 /root
echo "[✓] Permisos corregidos."

echo "============================================================================="
echo " [4NVSET 🟢] REMEDIACIÓN TÉCNICA APLICADA CON ÉXITO."
echo "============================================================================="
"""
    output_path.write_text(script_content, encoding="utf-8")
    output_path.chmod(0o755)
    print(f"[✓] Script de remediación generado en: {output_path}")

def main():
    parser = argparse.ArgumentParser(description="K4L1 Forge - Defensive Security & Audit Suite (4NVSET 🟢)")
    parser.add_argument("--host", action="store_true", help="Ejecutar diagnóstico en vivo de hardening del host Linux")
    parser.add_argument("--generate-remediation", action="store_true", help="Generar script remediation_k4li_hardening.sh")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    print("=" * 70)
    print(" [4NVSET 🟢] K4LI-ANUU-FORGE - DEFENSIVE SECURITY & AUDIT SUITE")
    print(f" Target: {repo_root}")
    print("=" * 70)

    # 1. Escaneo de secretos
    secret_findings = scan_for_secrets(repo_root)
    if secret_findings:
        print("[-] ALERTA: Posibles secretos o tokens detectados:")
        for file_p, desc, preview in secret_findings:
            print(f"    - {file_p}: {desc} ({preview})")
    else:
        print("[✓] 0 Secretos o tokens en texto claro detectados en el código.")

    # 2. Auditoría de cabeceras
    header_reports = audit_security_headers(repo_root)
    for msg, status in header_reports:
        print(f"    {msg}")

    # 3. Auditoría de permisos
    perm_issues = audit_file_permissions(repo_root)
    if perm_issues:
        print("[-] ALERTA: Permisos inseguros detectados:")
        for issue in perm_issues:
            print(f"    - {issue}")
    else:
        print("[✓] Permisos de archivos conformes con la directriz de seguridad.")

    # 4. Host audit opcional
    if args.host:
        audit_host_hardening()

    # 5. Generación de script de remediación opcional
    if args.generate_remediation:
        remediation_file = repo_root / "scripts" / "remediation_k4li_hardening.sh"
        generate_remediation_script(remediation_file)

    # Evaluación global del repositorio
    critical_errors = len(secret_findings) + len(perm_issues)
    failed_headers = [msg for msg, ok in header_reports if not ok]

    print("\n" + "=" * 70)
    if critical_errors == 0 and len(failed_headers) == 0:
        print(" [4NVSET 🟢] AUDITORÍA DE SEGURIDAD COMPLETADA EXITOSAMENTE: PASSED")
        print("=" * 70)
        return 0
    else:
        print(f" [4NVSET 🟢] AUDITORÍA FALLIDA: {critical_errors} críticos, {len(failed_headers)} advertencias.")
        print("=" * 70)
        return 1

if __name__ == "__main__":
    sys.exit(main())
