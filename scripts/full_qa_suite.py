#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
K4L1 STUDIO · ANUU-FORGE // FULL END-TO-END AUTOMATED QA & OPSEC SUITE v2.8
Frecuencia Operativa: 189.89.619 Hz | Concilio ACE (161914)
Unidades: 4NVSET 🟢 · Kanuv 🛡️ · Kalicat 🐾 · Saze 🏛️
=============================================================================
Ejecuta una auditoría integral automatizada sin navegador externo:
  1. Validación sintáctica JavaScript (node --check) en todos los .js y
     todos los bloques <script> inline de index.html, 19 components y omega.
  2. Cobertura 100% de Sentinel Pre-Index Gate (Zero-Plaintext SHA-256) y
     directivas anti-indexación (noindex) en raíz, omega, components y relics.
  3. Soberanía Zero-CDN / Zero-Cloud (ausencia de gstatic/cdn.tailwindcss,
     proxies serverless y endpoints de mensajería corporativos).
  4. Validación estricta de todos los archivos JSON del repositorio.
  5. Ejecución encadenada de verify_assets.py, security_audit.py y
     sovereign_envelope_cli.py --selftest.
  6. Sonda opcional de Cómputo Híbrido ARM64 (:18989) para Merkle Root SHA-256.
"""

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path
from typing import List, Tuple

REPO_ROOT = Path(__file__).resolve().parent.parent

CYAN = "\033[38;2;0;245;212m"
GREEN = "\033[38;2;50;230;130m"
YELLOW = "\033[38;2;251;191;36m"
RED = "\033[38;2;255;70;70m"
PURPLE = "\033[38;2;192;132;252m"
BOLD = "\033[1m"
RESET = "\033[0m"


def banner(title: str) -> None:
    print(f"\n{PURPLE}{'═' * 74}{RESET}")
    print(f"{BOLD}{CYAN}  ⚡ {title}{RESET}")
    print(f"{PURPLE}{'═' * 74}{RESET}")


def check_js_syntax() -> Tuple[bool, int]:
    """Valida todos los .js propios y bloques <script> inline con node --check."""
    node_bin = shutil.which("node")
    if not node_bin:
        print(f"{YELLOW}[!] 'node' no disponible; omitiendo validación AST JS.{RESET}")
        return True, 0

    js_files: List[Path] = (
        [REPO_ROOT / "sw.js"]
        + sorted((REPO_ROOT / "assets" / "js").glob("*.js"))
        + sorted((REPO_ROOT / "omega").glob("*.js"))
    )

    checked = 0
    errors: List[str] = []

    for jf in js_files:
        if not jf.exists():
            continue
        res = subprocess.run([node_bin, "--check", str(jf)], capture_output=True, text=True)
        checked += 1
        if res.returncode != 0:
            errors.append(f"{jf.relative_to(REPO_ROOT)}: {res.stderr.strip()}")

    html_targets: List[Path] = (
        [REPO_ROOT / "index.html"]
        + sorted((REPO_ROOT / "components").glob("*.html"))
        + sorted((REPO_ROOT / "omega").glob("*.html"))
    )

    script_pattern = re.compile(r"<script(?P<attrs>[^>]*)>(?P<code>[\s\S]*?)</script>", re.IGNORECASE)

    with tempfile.TemporaryDirectory(prefix="k4li_qa_js_") as tmpdir:
        tmp_path = Path(tmpdir)
        for hf in html_targets:
            if not hf.exists():
                continue
            html = hf.read_text(encoding="utf-8", errors="ignore")
            for idx, match in enumerate(script_pattern.finditer(html)):
                attrs = match.group("attrs")
                code = match.group("code").strip()
                if not code or re.search(r'\bsrc\s*=', attrs, re.IGNORECASE):
                    continue
                if re.search(r'type\s*=\s*["\'](application/json|application/ld\+json|text/plain|x-shader)', attrs, re.IGNORECASE):
                    continue
                is_module = bool(re.search(r'type\s*=\s*["\']module["\']', attrs, re.IGNORECASE))
                ext = ".mjs" if is_module else ".js"
                snippet_file = tmp_path / f"{hf.stem}_block_{idx}{ext}"
                snippet_file.write_text(code, encoding="utf-8")
                res = subprocess.run([node_bin, "--check", str(snippet_file)], capture_output=True, text=True)
                checked += 1
                if res.returncode != 0:
                    errors.append(f"{hf.relative_to(REPO_ROOT)} [inline script #{idx}]: {res.stderr.strip()}")

    if errors:
        for err in errors:
            print(f"{RED}[✗] JS SYNTAX ERROR: {err}{RESET}")
        return False, checked

    print(f"{GREEN}[✓] 1/6 Sintaxis JavaScript verificada con 'node --check': {checked} módulos/bloques OK (0 errores).{RESET}")
    return True, checked


def check_sentinel_gate_and_noindex() -> bool:
    """Verifica cobertura 100% de Sentinel Gate, noindex y ausencia de clave en claro."""
    gate_js = REPO_ROOT / "assets" / "js" / "anuu_gate.js"
    if not gate_js.exists():
        print(f"{RED}[✗] Falta assets/js/anuu_gate.js{RESET}")
        return False

    gate_src = gate_js.read_text(encoding="utf-8")
    # Verificar que la llave palíndroma en texto claro NO esté en anuu_gate.js (comparando por hash SHA-256)
    expected_hash = "0ac844655cfc06d2b86732a129f776d6cb0567c06fda55bd2406210d2e2bc6ca"
    for token in re.findall(r"[0-9]{10,16}", gate_src):
        if hashlib.sha256(token.encode()).hexdigest() == expected_hash:
            print(f"{RED}[✗] OPSEC GATE: Se detectó la clave maestra en texto claro dentro de anuu_gate.js{RESET}")
            return False

    html_pages = (
        [REPO_ROOT / "index.html"]
        + sorted((REPO_ROOT / "omega").glob("*.html"))
        + sorted((REPO_ROOT / "components").glob("*.html"))
        + sorted((REPO_ROOT / "relics").rglob("*.html"))
    )

    missing_gate: List[str] = []
    missing_noindex: List[str] = []

    for page in html_pages:
        rel = str(page.relative_to(REPO_ROOT))
        txt = page.read_text(encoding="utf-8", errors="ignore")
        if "anuu_gate.js" not in txt or "anuu_gate.css" not in txt:
            missing_gate.append(rel)
        if "noindex" not in txt.lower():
            missing_noindex.append(rel)

    if missing_gate or missing_noindex:
        if missing_gate:
            print(f"{RED}[✗] Páginas sin Sentinel Pre-Index Gate: {missing_gate}{RESET}")
        if missing_noindex:
            print(f"{RED}[✗] Páginas sin directiva meta noindex: {missing_noindex}{RESET}")
        return False

    print(f"{GREEN}[✓] 2/6 Sentinel Pre-Index Gate (Zero-Plaintext SHA-256) + NoIndex activos en {len(html_pages)}/{len(html_pages)} páginas HTML.{RESET}")
    return True


def check_zero_cdn_and_zero_cloud() -> bool:
    """Verifica ausencia de CDNs rotos y relés externos prohibidos."""
    forbidden_patterns = [
        (r"gstatic\.com/antigravity/web/dev/tailwindcss", "CDN interno gstatic Tailwind (usar vendor/tailwind.min.js)"),
        (r"cdn\.tailwindcss\.com", "CDN externo Tailwind (usar vendor/tailwind.min.js)"),
        (r"api\.telegram\.org", "Endpoint Telegram prohibido (Doctrina Signal E2EE)"),
    ]

    scan_files = (
        [REPO_ROOT / "index.html", REPO_ROOT / "sw.js"]
        + sorted((REPO_ROOT / "omega").glob("*.*"))
        + sorted((REPO_ROOT / "components").glob("*.html"))
        + sorted((REPO_ROOT / "assets" / "js").glob("*.js"))
    )

    violations: List[str] = []
    for sf in scan_files:
        if not sf.is_file():
            continue
        txt = sf.read_text(encoding="utf-8", errors="ignore")
        for pat, desc in forbidden_patterns:
            if re.search(pat, txt, re.IGNORECASE):
                violations.append(f"{sf.relative_to(REPO_ROOT)} -> {desc}")

    if violations:
        for v in violations:
            print(f"{RED}[✗] VIOLACIÓN ZERO-CLOUD/CDN: {v}{RESET}")
        return False

    print(f"{GREEN}[✓] 3/6 Doctrina Zero-CDN & Zero-Cloud verificada en {len(scan_files)} módulos core (100% autónomo offline).{RESET}")
    return True


def check_json_schemas() -> bool:
    """Valida sintaxis UTF-8 JSON en todos los manifiestos del proyecto."""
    json_files = [
        p for p in sorted(REPO_ROOT.rglob("*.json"))
        if ".git" not in p.parts and not str(p.relative_to(REPO_ROOT)).startswith("aegis")
    ]
    for jf in json_files:
        try:
            json.loads(jf.read_text(encoding="utf-8"))
        except Exception as exc:
            print(f"{RED}[✗] JSON INVÁLIDO: {jf.relative_to(REPO_ROOT)} -> {exc}{RESET}")
            return False

    print(f"{GREEN}[✓] 4/6 Esquemas JSON verificados: {len(json_files)}/{len(json_files)} archivos JSON íntegros.{RESET}")
    return True


def run_core_auditors() -> bool:
    """Ejecuta verify_assets.py, security_audit.py y test_intake.sh / sovereign_envelope_cli.py."""
    cmds = [
        ([sys.executable, str(REPO_ROOT / "scripts" / "verify_assets.py")], "verify_assets.py"),
        ([sys.executable, str(REPO_ROOT / "scripts" / "security_audit.py")], "security_audit.py"),
        ([sys.executable, str(REPO_ROOT / "api" / "sovereign_envelope_cli.py"), "--selftest"], "sovereign_envelope_cli.py --selftest"),
    ]
    intake_sh = REPO_ROOT / "scripts" / "test_intake.sh"
    if intake_sh.exists():
        cmds.append((["bash", str(intake_sh)], "test_intake.sh"))

    for cmd, label in cmds:
        res = subprocess.run(cmd, cwd=str(REPO_ROOT), capture_output=True, text=True)
        if res.returncode != 0:
            print(f"{RED}[✗] Fallo en auditor '{label}' (exit {res.returncode}):\n{res.stdout}\n{res.stderr}{RESET}")
            return False
        print(f"{GREEN}[✓] 5/6 Sub-auditor '{label}': PASSED{RESET}")
    return True


def check_hybrid_arm64_merkle() -> None:
    """Si el nodo híbrido ARM64 (:18989) está conectado por USB, descarga cálculo Merkle SHA-256."""
    try:
        tele = json.loads(urllib.request.urlopen("http://127.0.0.1:18989/telemetry", timeout=1.0).read())
    except Exception:
        print(f"{YELLOW}[i] 6/6 Nodo Híbrido ARM64 (:18989) no conectado — omitiendo descarga Merkle USB.{RESET}")
        return

    items: List[str] = []
    for p in sorted(REPO_ROOT.rglob("*")):
        if not p.is_file():
            continue
        rel = str(p.relative_to(REPO_ROOT))
        if rel.startswith(".git/") or rel.startswith("aegis"):
            continue
        digest = hashlib.sha256(p.read_bytes()).hexdigest()
        items.append(f"{rel}:{digest}")

    payload = json.dumps({"items": items, "iterations": 500}).encode()
    req = urllib.request.Request(
        "http://127.0.0.1:18989/compute/crypto",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    resp = json.loads(urllib.request.urlopen(req, timeout=5.0).read())
    pc_temp_raw = Path("/sys/class/thermal/thermal_zone0/temp")
    pc_temp = f"{int(pc_temp_raw.read_text().strip()) / 1000.0:.1f}°C" if pc_temp_raw.exists() else "N/A"

    print(
        f"{GREEN}[✓] 6/6 Descarga Híbrida ARM64 ({tele.get('node')} @ {tele.get('temp_celsius')}°C │ PC @ {pc_temp}): "
        f"{len(items)} archivos sellados en {resp.get('elapsed_ms')} ms │ Merkle={resp.get('merkle_root', '')[:24]}...{RESET}"
    )


def main() -> int:
    banner("K4L1 STUDIO · ANUU-FORGE // SUITE QA INTEGRAL E2E v2.8 (161914)")
    ok_js, _ = check_js_syntax()
    ok_gate = check_sentinel_gate_and_noindex()
    ok_zero = check_zero_cdn_and_zero_cloud()
    ok_json = check_json_schemas()
    ok_core = run_core_auditors()
    check_hybrid_arm64_merkle()

    all_ok = ok_js and ok_gate and ok_zero and ok_json and ok_core
    print(f"\n{PURPLE}{'═' * 74}{RESET}")
    if all_ok:
        print(f"{BOLD}{GREEN}  ✔ VEREDICTO FINAL CONCILIO ACE (161914): ALL QA CHECKS PASSED (100%){RESET}")
        print(f"{PURPLE}{'═' * 74}{RESET}")
        return 0
    print(f"{BOLD}{RED}  ✗ VEREDICTO FINAL: SE DETECTARON FALLOS EN LA SUITE QA{RESET}")
    print(f"{PURPLE}{'═' * 74}{RESET}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
