#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
K4L1 STUDIO · ANUU-FORGE // SISTEMA DE TIPOS DE ÁREAS (1,000,000 PTS MÁX.)
Frecuencia Operativa: 189.89.619 Hz | Concilio ACE (161914)
=============================================================================
Evalúa el ecosistema completo (k4li-anuu-forge + Kilonexo + Portal :16196 +
Nodo Híbrido ARM64 :18989) agrupando las pruebas en Tipos de Áreas formales
con peso calibrado que suma exactamente 1,000,000 puntos máximo.
"""

from dataclasses import dataclass, asdict
from enum import Enum
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path
from typing import List, Tuple

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "scripts"))
import full_qa_suite  # reutiliza validadores AST, Gate, Zero-CDN, JSON

MAX_SCORE_TOTAL = 1_000_000


class TipoArea(str, Enum):
    CRITICA_BLOQUEANTE = "CRITICA_BLOQUEANTE"
    INFRA_SOBERANA = "INFRA_SOBERANA"
    INTERACCION_DSP = "INTERACCION_DSP"
    OPERATIVA_CORE = "OPERATIVA_CORE"
    RESILIENCIA_DOCS = "RESILIENCIA_DOCS"


@dataclass
class AreaResultado:
    codigo: str
    nombre: str
    tipo: TipoArea
    peso_max: int
    puntos_obtenidos: int
    checks_ok: int
    checks_total: int
    bloqueo_critico: bool
    detalles: List[str]


def _http_get_ok(url: str, timeout: float = 1.5) -> Tuple[bool, str]:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            return (resp.status == 200, f"HTTP {resp.status}")
    except Exception as exc:
        return (False, f"OFFLINE ({type(exc).__name__})")


def eval_area_1_ast_json() -> AreaResultado:
    ok_js, js_count = full_qa_suite.check_js_syntax()
    ok_json = full_qa_suite.check_json_schemas()
    checks_ok = int(ok_js) + int(ok_json)
    pts = round(150_000 * (checks_ok / 2))
    return AreaResultado(
        codigo="A1",
        nombre="Núcleo AST JavaScript & Esquemas JSON",
        tipo=TipoArea.CRITICA_BLOQUEANTE,
        peso_max=150_000,
        puntos_obtenidos=pts,
        checks_ok=checks_ok,
        checks_total=2,
        bloqueo_critico=(checks_ok < 2),
        detalles=[
            f"node --check: {'OK' if ok_js else 'ERROR'} ({js_count} bloques/módulos)",
            f"JSON schemas: {'OK' if ok_json else 'ERROR'}",
        ],
    )


def eval_area_2_assets() -> AreaResultado:
    res = subprocess.run(
        [sys.executable, str(REPO_ROOT / "scripts" / "verify_assets.py")],
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
    )
    out = res.stdout
    m_tot = re.search(r"Total referencias locales auditadas:\s*(\d+)", out)
    m_brk = re.search(r"Total enlaces rotos detectados:\s*(\d+)", out)
    tot = int(m_tot.group(1)) if m_tot else 1
    brk = int(m_brk.group(1)) if m_brk else tot
    ok_refs = max(0, tot - brk)
    ratio = ok_refs / max(1, tot)
    pts = round(150_000 * ratio) if res.returncode == 0 else round(150_000 * ratio * 0.8)
    return AreaResultado(
        codigo="A2",
        nombre="Integridad de Activos & Enlaces Locales",
        tipo=TipoArea.CRITICA_BLOQUEANTE,
        peso_max=150_000,
        puntos_obtenidos=pts,
        checks_ok=ok_refs,
        checks_total=tot,
        bloqueo_critico=(res.returncode != 0 or brk > 0),
        detalles=[f"verify_assets.py: {ok_refs}/{tot} referencias válidas, {brk} rotos"],
    )


def eval_area_3_zero_cloud() -> AreaResultado:
    ok_zero = full_qa_suite.check_zero_cdn_and_zero_cloud()
    titan = REPO_ROOT / "components" / "kilonexo_kaiju_titan.html"
    txt = titan.read_text(encoding="utf-8", errors="ignore") if titan.exists() else ""
    horno_clean = len(re.findall(r"horno", txt, re.IGNORECASE)) == 0
    checks_ok = int(ok_zero) + int(horno_clean)
    pts = round(150_000 * (checks_ok / 2))
    return AreaResultado(
        codigo="A3",
        nombre="Soberanía Zero-Cloud, Airgap & Escudo 0,00 €",
        tipo=TipoArea.CRITICA_BLOQUEANTE,
        peso_max=150_000,
        puntos_obtenidos=pts,
        checks_ok=checks_ok,
        checks_total=2,
        bloqueo_critico=not ok_zero,
        detalles=[
            f"Doctrina Zero-CDN / Zero-Cloud: {'OK' if ok_zero else 'VIOLACIÓN'}",
            f"Ley Kanuv / Alquimia 89 (0 'horno'): {'OK' if horno_clean else 'MATCH'}",
        ],
    )


def eval_area_4_crypto_opsec() -> AreaResultado:
    ok_gate = full_qa_suite.check_sentinel_gate_and_noindex()
    audits = [
        ([sys.executable, str(REPO_ROOT / "scripts" / "security_audit.py")], "security_audit.py"),
        ([sys.executable, str(REPO_ROOT / "api" / "sovereign_envelope_cli.py"), "--selftest"], "sovereign_envelope_cli.py --selftest"),
        (["bash", str(REPO_ROOT / "scripts" / "test_intake.sh")], "test_intake.sh"),
    ]
    detalles = [f"Sentinel Gate & NoIndex: {'OK' if ok_gate else 'FALLO'}"]
    ok_cnt = int(ok_gate)
    tot_cnt = 1
    for cmd, label in audits:
        if not Path(cmd[-1] if label == "test_intake.sh" else cmd[1]).exists():
            continue
        tot_cnt += 1
        r = subprocess.run(cmd, cwd=str(REPO_ROOT), capture_output=True, text=True)
        passed = r.returncode == 0
        ok_cnt += int(passed)
        detalles.append(f"{label}: {'PASSED' if passed else 'FAILED'}")

    pts = round(150_000 * (ok_cnt / max(1, tot_cnt)))
    return AreaResultado(
        codigo="A4",
        nombre="Criptografía, OPSEC & Sentinel Gate",
        tipo=TipoArea.INFRA_SOBERANA,
        peso_max=150_000,
        puntos_obtenidos=pts,
        checks_ok=ok_cnt,
        checks_total=tot_cnt,
        bloqueo_critico=False,
        detalles=detalles,
    )


def eval_area_5_audio_dsp() -> AreaResultado:
    titan = REPO_ROOT / "components" / "kilonexo_kaiju_titan.html"
    if not titan.exists():
        return AreaResultado("A5", "Motor Audio DSP, Fórmula Λ & 501 Presets", TipoArea.INTERACCION_DSP, 150_000, 0, 0, 1, False, ["No encontrado"])

    html = titan.read_text(encoding="utf-8", errors="ignore")
    scripts = re.findall(r"<script>(.*?)</script>", html, flags=re.S)
    avg_score = 0.0
    count_presets = 0
    if scripts and shutil.which("node"):
        body = "const CORE_ARCHETYPES =" + scripts[-1].split("const CORE_ARCHETYPES =")[1].split("const TRACKS =")[0]
        header = "const METER_KEYS=['38_36','78','58','44']; const ROOTS=['69.30','65.41','61.74','92.50','87.31']; const SCALE_KEYS=['phrygian_dom','dim_hw','harmonic_min','locrian','aeolian'];\n"
        footer = "\nconst avg = PRESETS_501.reduce((a,b)=>a+b.score1000,0)/PRESETS_501.length; console.log(JSON.stringify({count:PRESETS_501.length, avg:+avg.toFixed(2)}));"
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=True) as tf:
            tf.write(header + body + footer)
            tf.flush()
            r = subprocess.run(["node", tf.name], capture_output=True, text=True)
            if r.returncode == 0:
                parsed = json.loads(r.stdout.strip())
                avg_score = float(parsed["avg"])
                count_presets = int(parsed["count"])

    feature_checks = [
        ("501 Presets completos", count_presets == 501),
        ("Preset #013 Fiesta Boom Bap 97", "Fiesta Boom Bap 97" in html),
        ("Bloqueador Sin Disparos Kaiju", "noKaijuShots" in html),
        ("Contracción Fórmula Λ (tanh / cap 0.76)", "Math.tanh" in html and "0.76" in html),
    ]
    feat_ok = sum(int(ok) for _, ok in feature_checks)
    pts_presets = round(75_000 * min(1.0, avg_score / 1000.0))
    pts_engine = round(75_000 * (feat_ok / len(feature_checks)))
    detalles = [f"501 Presets media real: {avg_score}/1000 ({pts_presets:,} / 75,000 pts)"]
    detalles += [f"{name}: {'OK' if ok else 'NO'}" for name, ok in feature_checks]
    return AreaResultado(
        codigo="A5",
        nombre="Motor Audio DSP, Fórmula Λ & 501 Presets",
        tipo=TipoArea.INTERACCION_DSP,
        peso_max=150_000,
        puntos_obtenidos=pts_presets + pts_engine,
        checks_ok=feat_ok + (1 if count_presets == 501 else 0),
        checks_total=len(feature_checks) + 1,
        bloqueo_critico=False,
        detalles=detalles,
    )


def eval_area_6_portal_ui() -> AreaResultado:
    idx_txt = (REPO_ROOT / "index.html").read_text(encoding="utf-8", errors="ignore")
    desktop_file = Path("/home/kali/Escritorio/Kilonexo_Kaiju_Titan.desktop")
    desk_ok = False
    if desktop_file.exists() and shutil.which("desktop-file-validate"):
        desk_ok = subprocess.run(["desktop-file-validate", str(desktop_file)], capture_output=True).returncode == 0

    checks: List[Tuple[str, bool]] = [
        ("Enlace Kilonexo en index.html", "components/kilonexo_kaiju_titan.html" in idx_txt),
        ("Desktop launcher válido", desk_ok),
        ("Portal Forge :8189/index.html", _http_get_ok("http://127.0.0.1:8189/index.html")[0]),
        ("Titán Web :8189/components/kilonexo_kaiju_titan.html", _http_get_ok("http://127.0.0.1:8189/components/kilonexo_kaiju_titan.html")[0]),
        ("Portal SaaS :16196/", _http_get_ok("http://127.0.0.1:16196/")[0]),
        ("Ciudad Kilonova :16196/ciudad", _http_get_ok("http://127.0.0.1:16196/ciudad")[0]),
        ("Titán directo en :16196/components/kilonexo_kaiju_titan.html", _http_get_ok("http://127.0.0.1:16196/components/kilonexo_kaiju_titan.html")[0]),
    ]
    ok_cnt = sum(int(ok) for _, ok in checks)
    pts = round(100_000 * (ok_cnt / len(checks)))
    return AreaResultado(
        codigo="A6",
        nombre="Portal de Acceso, Ciudad Kilonova & Render UI",
        tipo=TipoArea.OPERATIVA_CORE,
        peso_max=100_000,
        puntos_obtenidos=pts,
        checks_ok=ok_cnt,
        checks_total=len(checks),
        bloqueo_critico=False,
        detalles=[f"{k}: {'OK' if ok else 'OFF'}" for k, ok in checks],
    )


def eval_area_7_hybrid_nodes() -> AreaResultado:
    detalles: List[str] = []
    ok_cnt = 0
    tot_cnt = 4

    # 1 & 2: POCO ARM64 :18989 telemetry + crypto Merkle test
    tele_ok, tele_msg = _http_get_ok("http://127.0.0.1:18989/telemetry")
    ok_cnt += int(tele_ok)
    detalles.append(f"Nodo :18989 telemetry: {tele_msg}")

    merkle_ok = False
    if tele_ok:
        try:
            payload = json.dumps({"items": ["a:1", "b:2"], "iterations": 100}).encode()
            req = urllib.request.Request("http://127.0.0.1:18989/compute/crypto", data=payload, headers={"Content-Type": "application/json"})
            resp = json.loads(urllib.request.urlopen(req, timeout=3.0).read())
            merkle_ok = bool(resp.get("merkle_root"))
            detalles.append(f"Merkle SHA-256 :18989: OK ({resp.get('elapsed_ms')} ms)")
        except Exception as exc:
            detalles.append(f"Merkle SHA-256 :18989: ERROR ({type(exc).__name__})")
    else:
        detalles.append("Merkle SHA-256 :18989: omitido (nodo offline)")
    ok_cnt += int(merkle_ok)

    # 3: SaaS state API :16196/api/state
    api_ok, api_msg = _http_get_ok("http://127.0.0.1:16196/api/state")
    ok_cnt += int(api_ok)
    detalles.append(f"Portal :16196/api/state: {api_msg}")

    # 4: Ollama local :11434/api/tags (optional sovereign LLM)
    llm_ok, llm_msg = _http_get_ok("http://127.0.0.1:11434/api/tags")
    ok_cnt += int(llm_ok)
    detalles.append(f"Ollama Local :11434: {llm_msg}")

    pts = round(100_000 * (ok_cnt / tot_cnt))
    return AreaResultado(
        codigo="A7",
        nombre="Nodos Hardware Híbridos & Cómputo Soberano",
        tipo=TipoArea.INFRA_SOBERANA,
        peso_max=100_000,
        puntos_obtenidos=pts,
        checks_ok=ok_cnt,
        checks_total=tot_cnt,
        bloqueo_critico=False,
        detalles=detalles,
    )


def eval_area_8_resilience_docs() -> AreaResultado:
    titan_txt = (REPO_ROOT / "components" / "kilonexo_kaiju_titan.html").read_text(encoding="utf-8", errors="ignore")
    pdf_repo = REPO_ROOT / "docs" / "Diario_Lore_Anuu_y_Kalicat.pdf"
    md_lore = REPO_ROOT / "docs" / "DIARIO_LORE_ANUU_Y_KALICAT.md"
    tw_local = REPO_ROOT / "vendor" / "tailwind.min.js"

    checks: List[Tuple[str, bool]] = [
        ("PDF Lore Diario presente", pdf_repo.exists() and pdf_repo.stat().st_size > 10_000),
        ("Markdown Lore presente", md_lore.exists() and md_lore.stat().st_size > 500),
        ("Tailwind offline local (vendor/)", tw_local.exists() and tw_local.stat().st_size > 50_000),
        ("Fallback QWERTY sin USB MIDI", "keydown" in titan_txt and "keyMap" in titan_txt),
    ]
    ok_cnt = sum(int(ok) for _, ok in checks)
    pts = round(50_000 * (ok_cnt / len(checks)))
    return AreaResultado(
        codigo="A8",
        nombre="Resiliencia Offline, Fallback & Documentación",
        tipo=TipoArea.RESILIENCIA_DOCS,
        peso_max=50_000,
        puntos_obtenidos=pts,
        checks_ok=ok_cnt,
        checks_total=len(checks),
        bloqueo_critico=False,
        detalles=[f"{k}: {'OK' if ok else 'NO'}" for k, ok in checks],
    )


def evaluate_all_areas() -> dict:
    areas = [
        eval_area_1_ast_json(),
        eval_area_2_assets(),
        eval_area_3_zero_cloud(),
        eval_area_4_crypto_opsec(),
        eval_area_5_audio_dsp(),
        eval_area_6_portal_ui(),
        eval_area_7_hybrid_nodes(),
        eval_area_8_resilience_docs(),
    ]
    assert sum(a.peso_max for a in areas) == MAX_SCORE_TOTAL, "Pesos deben sumar 1,000,000"
    raw_sum = sum(a.puntos_obtenidos for a in areas)
    gate_triggered = any(a.bloqueo_critico for a in areas)
    gate_factor = 0.50 if gate_triggered else 1.00
    final_score = round(raw_sum * gate_factor)
    return {
        "max_score": MAX_SCORE_TOTAL,
        "raw_score": raw_sum,
        "gate_kanuv_triggered": gate_triggered,
        "gate_factor": gate_factor,
        "final_score": final_score,
        "areas": [asdict(a) for a in areas],
    }


def main() -> int:
    report = evaluate_all_areas()
    print("\n" + "═" * 78)
    print("  ⚖️  ANUU-FORGE // SISTEMA DE TIPOS DE ÁREAS (1,000,000 PTS MÁX.)")
    print("═" * 78)
    for a in report["areas"]:
        flag = "🚫 GATE" if a["bloqueo_critico"] else "✓"
        print(
            f"  [{a['codigo']}] ({a['tipo']:18s}) {a['nombre']:<44s} "
            f"{a['puntos_obtenidos']:>7,d} / {a['peso_max']:>7,d}  ({a['checks_ok']}/{a['checks_total']}) {flag}"
        )
        for d in a["detalles"]:
            print(f"       └─ {d}")
    print("─" * 78)
    print(f"  Suma Bruta:   {report['raw_score']:,d} / {report['max_score']:,d}")
    print(f"  Gate Kanuv:   {'ACTIVADO (x0.50)' if report['gate_kanuv_triggered'] else 'LIMPIO (x1.00)'}")
    print(f"  PUNTUACIÓN:   {report['final_score']:,d} / {report['max_score']:,d} pts")
    print("═" * 78)
    if "--json" in sys.argv:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if report["gate_kanuv_triggered"] else 0


if __name__ == "__main__":
    sys.exit(main())
