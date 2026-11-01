#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
K4LI-ANUU-FORGE // ASSET & HYPERLINK INTEGRITY AUDITOR
Frecuencia Operativa: 189.89.619 Hz | Concilio ACE (161914)
Unidad Técnica: 4NVSET 🟢
=============================================================================
Verifica la integridad de referencias locales (src/href), archivos estáticos
vitales, estructura PWA, búnker criptográfico y despliegue para GitHub Pages.
"""

import os
import sys
import re
import json
from pathlib import Path

def run_integrity_check(repo_root: Path):
    print("=" * 70)
    print(" [4NVSET 🟢] K4LI-ANUU-FORGE - ASSET & HYPERLINK INTEGRITY AUDIT")
    print(f" Root Directory: {repo_root}")
    print("=" * 70)

    # 1. Verificar archivos esenciales de infraestructura y componentes
    critical_files = [
        repo_root / "index.html",
        repo_root / "README.md",
        repo_root / ".nojekyll",
        repo_root / "manifest.json",
        repo_root / "sw.js",
        repo_root / "assets" / "css" / "fullwallpaper.css",
        repo_root / "assets" / "js" / "fullwallpaper.js",
        repo_root / "assets" / "js" / "bunker_vault.js",
        repo_root / "assets" / "vault_payload.json",
        repo_root / "assets" / "relics_manifest.json",
        repo_root / "assets" / "js" / "vendor" / "three.min.js",
        repo_root / "assets" / "js" / "vendor" / "GLTFLoader.js",
        repo_root / "assets" / "js" / "vendor" / "OrbitControls.js",
        repo_root / "assets" / "js" / "vendor" / "three-vrm.js",
        repo_root / "components" / "sovereign_sanctuary.html",
        repo_root / "components" / "roi_calculator.html",
        repo_root / "components" / "security_audit_tool.html",
        repo_root / "components" / "market_arbitrage_engine.html",
        repo_root / "components" / "ai_benchmark_calculator.html",
        repo_root / "components" / "contract_generator.html",
        repo_root / "components" / "terminal_hud.html",
        repo_root / "components" / "relics_explorer.html",
        repo_root / "components" / "internal_crm.html",
        repo_root / "components" / "vrm_avatar_studio.html",
        repo_root / "components" / "resonance_synthesizer.html",
        repo_root / "components" / "os_deployment_forge.html",
        repo_root / "components" / "forensic_carver_service.html",
        repo_root / "components" / "network_diagnostic_studio.html",
        repo_root / "components" / "local_ai_studio.html",
        repo_root / "assets" / "css" / "anuu_gate.css",
        repo_root / "assets" / "js" / "anuu_gate.js",
        repo_root / "omega" / "index.html",
        repo_root / "omega" / "omega_stage.css",
        repo_root / "omega" / "omega_bridge.js",
        repo_root / "omega" / "codex_144.json",
        repo_root / "vendor" / "tailwind.min.js",
        repo_root / "api" / "sovereign_envelope_cli.py",
        repo_root / "scripts" / "full_qa_suite.py",
        repo_root / "assets" / "carver_status.json",
        repo_root / "docs" / "ROI_CALCULATOR_GUIDE.md",
        repo_root / "docs" / "QLLM_NEURAL_SURGERY_ARCHITECTURE.md"
    ]

    missing_critical = []
    print("\n[+] 1. Verificando archivos críticos de infraestructura:")
    for cf in critical_files:
        rel = cf.relative_to(repo_root)
        if not cf.exists():
            missing_critical.append(str(rel))
            print(f"[-] CRITICAL MISSING: {rel}")
        else:
            print(f"[✓] FOUND: {rel} ({cf.stat().st_size} bytes)")

    if missing_critical:
        print(f"\n[FAIL] Archivos esenciales faltantes: {missing_critical}")
        return False, len(missing_critical), 0

    # 2. Verificar catálogo canónico de los 7 fondos de pantalla y assets de marca
    wallpapers = [
        "anu_banner.png",
        "anuu_core.jpg",
        "anuu_hero.png",
        "bg_nexus.png",
        "bruma_mist.jpg",
        "kilonova_sovereign.jpg",
        "nexus_stellar.png"
    ]
    brand_assets = [
        repo_root / "assets" / "icon-192.png",
        repo_root / "assets" / "icon-512.png"
    ]

    print("\n[+] 2. Verificando catálogo de fondos HD y assets PWA:")
    missing_assets = []
    for wp in wallpapers:
        wp_path = repo_root / "assets" / "wallpapers" / wp
        if not wp_path.exists():
            missing_assets.append(f"assets/wallpapers/{wp}")
            print(f"[-] MISSING WALLPAPER: assets/wallpapers/{wp}")
        else:
            print(f"[✓] WALLPAPER OK: assets/wallpapers/{wp} ({wp_path.stat().st_size} bytes)")

    for ba in brand_assets:
        rel = ba.relative_to(repo_root)
        if not ba.exists():
            missing_assets.append(str(rel))
            print(f"[-] MISSING BRAND ASSET: {rel}")
        else:
            print(f"[✓] BRAND ASSET OK: {rel} ({ba.stat().st_size} bytes)")

    if missing_assets:
        print(f"\n[FAIL] Activos gráficos faltantes: {missing_assets}")
        return False, len(missing_assets), 0

    # 3. Validar integridad de JSON y Búnker Criptográfico
    print("\n[+] 3. Auditando integridad de esquemas JSON y Búnker Criptográfico:")
    json_files_to_check = [
        repo_root / "manifest.json",
        repo_root / "assets" / "vault_payload.json",
        repo_root / "assets" / "relics_manifest.json"
    ]
    for jf in json_files_to_check:
        if jf.exists():
            try:
                data = json.loads(jf.read_text(encoding="utf-8"))
                if jf.name == "vault_payload.json":
                    for req_field in ["salt", "iv", "ciphertext", "version"]:
                        if req_field not in data:
                            raise ValueError(f"Falta campo requerido '{req_field}' en vault_payload.json")
                print(f"[✓] JSON VALID: {jf.relative_to(repo_root)} (OK)")
            except Exception as e:
                print(f"[-] JSON CORRUPT: {jf.relative_to(repo_root)} -> {e}")
                return False, 1, 0

    # 4. Validar Service Worker PWA (Versión de Caché y Cobertura de Activos)
    print("\n[+] 4. Auditando Service Worker PWA (sw.js):")
    sw_file = repo_root / "sw.js"
    if sw_file.exists():
        sw_content = sw_file.read_text(encoding="utf-8")
        version_match = re.search(r"CACHE_NAME\s*=\s*['\"]([^'\"]+)['\"]", sw_content)
        cache_version = version_match.group(1) if version_match else "DESCONOCIDO"
        print(f"    - Versión de caché detectada: '{cache_version}'")
        
        # Extraer lista ASSETS_TO_CACHE
        assets_match = re.search(r"ASSETS_TO_CACHE\s*=\s*\[(.*?)\];", sw_content, re.DOTALL)
        if assets_match:
            cached_entries = re.findall(r"['\"]([^'\"]+)['\"]", assets_match.group(1))
            missing_cached = []
            for entry in cached_entries:
                if entry in ("./", "/"):
                    continue
                clean_entry = entry.lstrip("./")
                entry_path = repo_root / clean_entry
                if not entry_path.exists():
                    missing_cached.append(entry)
                    print(f"[-] ERROR: Recurso en sw.js ASSETS_TO_CACHE no existe en disco: {entry}")
                else:
                    print(f"[✓] SW ASSET DISK OK: {entry}")

            if missing_cached:
                print(f"[FAIL] El Service Worker lista recursos inexistentes: {missing_cached}")
                return False, len(missing_cached), 0
        else:
            print("[-] ALERTA: No se encontró array ASSETS_TO_CACHE en sw.js")

    # 5. Escanear enlaces y recursos locales en páginas principales
    core_html_files = (
        [repo_root / "index.html"]
        + sorted(list((repo_root / "components").glob("*.html")))
        + sorted(list((repo_root / "omega").glob("*.html")))
    )
    
    broken_links = []
    checked_count = 0

    ignored_prefixes = (
        "http://", "https://", "mailto:", "tel:", "javascript:", "data:", "#", "file://", "blob:"
    )

    print("\n[+] 5. Auditando referencias locales en componentes de producción:")
    for doc in core_html_files:
        content = doc.read_text(encoding="utf-8", errors="ignore")
        matches = re.findall(r'(?:src|href)=["\']([^"\']+)["\']', content)
        doc_rel = doc.relative_to(repo_root)

        for ref in matches:
            ref_clean = ref.strip()
            if not ref_clean or ref_clean.startswith(ignored_prefixes) or "${" in ref_clean:
                continue

            checked_count += 1
            # Normalizar URL relativa eliminando queries y anclas
            target_path = ref_clean.split("?")[0].split("#")[0]
            if not target_path:
                continue

            # Buscar respecto al directorio del archivo o a la raíz
            cand_local = (doc.parent / target_path).resolve()
            cand_root = (repo_root / target_path).resolve()

            if not (cand_local.exists() or cand_root.exists()):
                broken_links.append((str(doc_rel), ref_clean))
                print(f"[-] ERROR: {doc_rel} -> referencia rota '{ref_clean}'")
            else:
                print(f"[✓] VALID: {doc_rel} -> '{ref_clean}'")

    print("\n" + "-" * 70)
    print(f"Total referencias locales auditadas: {checked_count}")
    print(f"Total enlaces rotos detectados: {len(broken_links)}")
    print("-" * 70)

    if broken_links:
        print("[FAIL] Se detectaron hipervínculos o recursos locales inexistentes.")
        return False, len(missing_critical), len(broken_links)

    print("\n [4NVSET 🟢] AUDITORÍA DE INTEGRIDAD DE ACTIVOS COMPLETADA EXITOSAMENTE: PASSED")
    print("=" * 70)
    return True, 0, 0

if __name__ == "__main__":
    current_dir = Path(__file__).resolve().parent.parent
    success, missing_crit, broken = run_integrity_check(current_dir)
    sys.exit(0 if success else 1)
