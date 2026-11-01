#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
K4L1-ANUU-FORGE // SOVEREIGN ENVELOPE CLI (.k4li.asc)
Frecuencia Operativa: 189.89.619 Hz | Concilio ACE (161914)
Comandancia: Kanuv 🛡️ & Unidad Técnica 4NVSET 🟢
=============================================================================
Utilidad forense 100% offline (Zero-Cloud / Cero llamadas de red) para:
  1. Inspeccionar metadatos de sobres blindados .k4li.asc generados en
     el navegador por K4L1 Studio para despacho directo vía Signal E2EE o PGP.
  2. Verificar integridad criptográfica SHA-256 contra manipulación.
  3. Decodificar cargas JSON en modo firmado o descifrar cargas blindadas
     con PBKDF2 + AES-256-GCM (compatible con WebCrypto BunkerCrypto).
  4. Sellar nuevos sobres .k4li.asc desde línea de comandos y ejecutar
     autodiagnóstico criptográfico (--selftest).
"""

import argparse
import base64
import binascii
import hashlib
import json
import os
import secrets
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    from cryptography.exceptions import InvalidTag
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    HAS_CRYPTOGRAPHY = True
except ImportError:
    AESGCM = None  # type: ignore[assignment]
    InvalidTag = Exception  # type: ignore[assignment,misc]
    HAS_CRYPTOGRAPHY = False

ARMOR_BEGIN = "-----BEGIN K4L1 SOVEREIGN ENVELOPE-----"
ARMOR_END = "-----END K4L1 SOVEREIGN ENVELOPE-----"
DEFAULT_PBKDF2_ITERATIONS = 100_000
MAX_ENVELOPE_BYTES = 5 * 1024 * 1024  # 5 MiB límite defensivo anti-DoS


class EnvelopeError(Exception):
    """Error forense de validación, formato o descifrado de sobre .k4li.asc."""


def _b64_decode_flexible(data_str: str) -> bytes:
    """Decodifica Base64 estándar o URL-safe tolerando saltos de línea y padding."""
    cleaned = "".join(data_str.split())
    if not cleaned:
        raise EnvelopeError("Bloque Base64 vacío en el sobre soberano.")
    normalized = cleaned.replace("-", "+").replace("_", "/")
    pad_len = (-len(normalized)) % 4
    if pad_len:
        normalized += "=" * pad_len
    try:
        return base64.b64decode(normalized, validate=False)
    except (binascii.Error, ValueError) as exc:
        raise EnvelopeError(f"Codificación Base64 corrupta: {exc}") from exc


def _sha256_hex(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def extract_armor(raw_text: str) -> Tuple[Dict[str, str], Dict[str, Any]]:
    """
    Extrae cabeceras opcionales y decodifica el objeto JSON desde un bloque
    blindado -----BEGIN K4L1 SOVEREIGN ENVELOPE----- (o JSON directo).
    """
    if len(raw_text.encode("utf-8", errors="replace")) > MAX_ENVELOPE_BYTES:
        raise EnvelopeError("El tamaño del sobre excede el límite defensivo permitido (5 MiB).")

    stripped = raw_text.strip()
    if not stripped:
        raise EnvelopeError("Entrada vacía: no se encontró ningún sobre .k4li.asc.")

    armor_headers: Dict[str, str] = {}

    if ARMOR_BEGIN in stripped:
        begin_idx = stripped.find(ARMOR_BEGIN)
        after_begin = stripped[begin_idx + len(ARMOR_BEGIN) :]
        end_idx = after_begin.find(ARMOR_END)
        if end_idx == -1:
            raise EnvelopeError("Sobre truncado: falta la marca de cierre END K4L1 SOVEREIGN ENVELOPE.")

        inner_lines = after_begin[:end_idx].strip().splitlines()
        b64_chunks: List[str] = []
        for line in inner_lines:
            clean_line = line.strip()
            if not clean_line:
                continue
            # El alfabeto Base64 jamás contiene ':'; las líneas Key: Value son cabeceras de armadura
            if ":" in clean_line and not clean_line.startswith("{"):
                key, _, val = clean_line.partition(":")
                armor_headers[key.strip()] = val.strip()
            else:
                b64_chunks.append(clean_line)

        if not b64_chunks:
            raise EnvelopeError("El sobre blindado no contiene carga útil Base64.")

        joined_body = "".join(b64_chunks)
        if joined_body.startswith("{") and joined_body.endswith("}"):
            decoded_bytes = joined_body.encode("utf-8")
        else:
            decoded_bytes = _b64_decode_flexible(joined_body)
    elif stripped.startswith("{"):
        decoded_bytes = stripped.encode("utf-8")
    else:
        decoded_bytes = _b64_decode_flexible(stripped)

    try:
        envelope_obj = json.loads(decoded_bytes.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise EnvelopeError(f"Estructura interna JSON inválida en el sobre: {exc}") from exc

    if not isinstance(envelope_obj, dict):
        raise EnvelopeError("La raíz del sobre decodificado debe ser un objeto JSON.")

    return armor_headers, envelope_obj


def _candidate_digests_for_value(value: Any) -> List[str]:
    """
    Calcula huellas SHA-256 canónicas compatibles con JSON.stringify de WebCrypto
    y serializaciones deterministas de Python.
    """
    candidates: List[str] = []
    if value is None:
        return candidates

    if isinstance(value, (bytes, bytearray)):
        candidates.append(_sha256_hex(bytes(value)))
        return candidates

    if isinstance(value, str):
        candidates.append(_sha256_hex(value.encode("utf-8")))
        try:
            raw_b = _b64_decode_flexible(value)
            candidates.append(_sha256_hex(raw_b))
        except EnvelopeError:
            pass
        return candidates

    if isinstance(value, (dict, list)):
        # 1. Equivalente exacto a JSON.stringify(payload) en navegadores JS
        js_compact = json.dumps(value, separators=(",", ":"), ensure_ascii=False)
        candidates.append(_sha256_hex(js_compact.encode("utf-8")))

        # 2. Variante con claves ordenadas canónicamente
        js_sorted = json.dumps(value, separators=(",", ":"), sort_keys=True, ensure_ascii=False)
        candidates.append(_sha256_hex(js_sorted.encode("utf-8")))

        # 3. Variantes ASCII y formateadas
        candidates.append(_sha256_hex(json.dumps(value, separators=(",", ":"), ensure_ascii=True).encode("utf-8")))
        candidates.append(_sha256_hex(json.dumps(value, ensure_ascii=False).encode("utf-8")))
        candidates.append(_sha256_hex(json.dumps(value, indent=2, ensure_ascii=False).encode("utf-8")))

        if isinstance(value, dict) and isinstance(value.get("ciphertext"), str):
            ct_str = value["ciphertext"]
            candidates.append(_sha256_hex(ct_str.encode("utf-8")))
            try:
                candidates.append(_sha256_hex(_b64_decode_flexible(ct_str)))
            except EnvelopeError:
                pass

    return candidates


def _extract_encrypted_fields(envelope: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Detecta si el sobre contiene parámetros de cifrado AES-GCM (en payload o raíz)."""
    payload = envelope.get("payload")
    for container in (payload if isinstance(payload, dict) else None, envelope):
        if isinstance(container, dict) and all(k in container for k in ("salt", "iv", "ciphertext")):
            return container
    return None


def _derive_pbkdf2_key(passphrase: str, salt: bytes, iterations: int, hash_alg: str) -> bytes:
    alg_norm = hash_alg.upper().replace("-", "")
    digest_name = "sha512" if alg_norm == "SHA512" else "sha256"
    if iterations < 10_000 or iterations > 5_000_000:
        raise EnvelopeError(f"Número de iteraciones PBKDF2 fuera de rango seguro: {iterations}")
    return hashlib.pbkdf2_hmac(digest_name, passphrase.encode("utf-8"), salt, iterations, dklen=32)


def decrypt_aes_gcm_block(enc_block: Dict[str, Any], passphrase: str) -> Tuple[bytes, Any]:
    """
    Descifra un bloque PBKDF2 + AES-256-GCM compatible con WebCrypto BunkerCrypto.
    Retorna (plaintext_bytes, objeto_json_o_texto).
    """
    if not HAS_CRYPTOGRAPHY or AESGCM is None:
        raise EnvelopeError(
            "El módulo 'cryptography' no está instalado en este entorno Python; "
            "no es posible descifrar bloques AES-256-GCM."
        )

    salt = _b64_decode_flexible(str(enc_block["salt"]))
    iv = _b64_decode_flexible(str(enc_block["iv"]))
    ciphertext = _b64_decode_flexible(str(enc_block["ciphertext"]))

    # Si el tag GCM viniera separado en 'tag' o 'authTag', concatenarlo al final como hace WebCrypto
    separate_tag = enc_block.get("tag") or enc_block.get("authTag")
    if isinstance(separate_tag, str) and separate_tag.strip():
        ciphertext = ciphertext + _b64_decode_flexible(separate_tag)

    iterations = int(enc_block.get("iterations", DEFAULT_PBKDF2_ITERATIONS))
    default_hash = "SHA-512" if (enc_block.get("pqcVersion") or iterations >= 500_000) else "SHA-256"
    hash_name = str(enc_block.get("hash", default_hash))

    key = _derive_pbkdf2_key(passphrase, salt, iterations, hash_name)
    aesgcm = AESGCM(key)
    try:
        plaintext_bytes = aesgcm.decrypt(iv, ciphertext, None)
    except InvalidTag as exc:
        raise EnvelopeError(
            "FALLO_AUTENTICACION_GCM: Frase de paso incorrecta o texto cifrado adulterado."
        ) from exc

    text_out = plaintext_bytes.decode("utf-8")
    try:
        return plaintext_bytes, json.loads(text_out)
    except json.JSONDecodeError:
        return plaintext_bytes, text_out


def encrypt_aes_gcm_block(
    payload_obj: Any,
    passphrase: str,
    iterations: int = DEFAULT_PBKDF2_ITERATIONS,
    hash_name: str = "SHA-256",
) -> Dict[str, Any]:
    """Cifra un payload con PBKDF2 + AES-256-GCM en formato idéntico a WebCrypto."""
    if not HAS_CRYPTOGRAPHY or AESGCM is None:
        raise EnvelopeError("Se requiere 'cryptography' para cifrar en modo AES-256-GCM.")

    salt_len = 32 if hash_name.upper().replace("-", "") == "SHA512" else 16
    salt = secrets.token_bytes(salt_len)
    iv = secrets.token_bytes(12)
    key = _derive_pbkdf2_key(passphrase, salt, iterations, hash_name)

    if isinstance(payload_obj, str):
        plaintext_bytes = payload_obj.encode("utf-8")
    else:
        plaintext_bytes = json.dumps(payload_obj, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

    ciphertext_with_tag = AESGCM(key).encrypt(iv, plaintext_bytes, None)
    return {
        "salt": base64.b64encode(salt).decode("ascii"),
        "iv": base64.b64encode(iv).decode("ascii"),
        "iterations": iterations,
        "hash": hash_name,
        "ciphertext": base64.b64encode(ciphertext_with_tag).decode("ascii"),
    }


def seal_envelope(
    payload_obj: Any,
    passphrase: Optional[str] = None,
    version: str = "1.0-SOVEREIGN",
) -> str:
    """
    Empaqueta un payload en formato blindado .k4li.asc listo para envío por
    Signal E2EE (@k4li.89) o canal PGP.
    """
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    if passphrase:
        enc_payload = encrypt_aes_gcm_block(payload_obj, passphrase)
        mode = "aes-256-gcm"
        canonical = json.dumps(enc_payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        digest = _sha256_hex(canonical)
        body_payload: Any = enc_payload
    else:
        mode = "ZERO-CLOUD-DIRECT"
        if isinstance(payload_obj, str):
            digest = _sha256_hex(payload_obj.encode("utf-8"))
        else:
            canonical = json.dumps(payload_obj, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
            digest = _sha256_hex(canonical)
        body_payload = payload_obj

    envelope_dict = {
        "version": version,
        "timestamp": now_iso,
        "sha256": digest,
        "mode": mode,
        "payload": body_payload,
    }

    raw_json = json.dumps(envelope_dict, indent=2, ensure_ascii=False).encode("utf-8")
    b64_raw = base64.b64encode(raw_json).decode("ascii")
    wrapped_lines = [b64_raw[i : i + 64] for i in range(0, len(b64_raw), 64)]

    lines = [
        ARMOR_BEGIN,
        "Version: K4L1-ZeroCloud-161914",
        f"Mode: {mode}",
        f"Hash: SHA-256/{digest[:16]}",
        "Frequency: 189.89.619 Hz",
        "",
        *wrapped_lines,
        ARMOR_END,
    ]
    return "\n".join(lines) + "\n"


def inspect_and_verify(
    raw_text: str,
    passphrase: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Inspecciona un sobre .k4li.asc, verifica su integridad SHA-256 y decodifica
    o descifra el payload si procede.
    """
    armor_headers, envelope = extract_armor(raw_text)

    version = str(envelope.get("version") or armor_headers.get("Version") or "1.0")
    timestamp = str(envelope.get("timestamp") or envelope.get("createdAt") or "unknown")
    mode = str(envelope.get("mode") or armor_headers.get("Mode") or "signed-sha256")
    raw_sha = str(envelope.get("sha256") or envelope.get("digest") or "").strip().lower()
    if raw_sha.startswith("sha256:"):
        raw_sha = raw_sha.split(":", 1)[1].strip()

    if not raw_sha or len(raw_sha) != 64 or any(c not in "0123456789abcdef" for c in raw_sha):
        raise EnvelopeError("Campo 'sha256' ausente o con formato hexadecimal inválido (se requieren 64 hex chars).")

    payload = envelope.get("payload")
    if payload is None and "data" in envelope:
        payload = envelope["data"]

    enc_block = _extract_encrypted_fields(envelope)
    is_encrypted = enc_block is not None or any(
        token in mode.lower() for token in ("aes", "gcm", "encrypt", "pbkdf2", "pqc")
    )

    candidate_hashes = _candidate_digests_for_value(payload)
    if enc_block is not None and enc_block is not payload:
        candidate_hashes.extend(_candidate_digests_for_value(enc_block))

    decrypted_payload: Any = None
    decryption_status = "not_applicable"

    if is_encrypted:
        if enc_block is None:
            raise EnvelopeError("El sobre declara modo cifrado pero faltan campos salt/iv/ciphertext.")
        if passphrase:
            pt_bytes, pt_obj = decrypt_aes_gcm_block(enc_block, passphrase)
            decrypted_payload = pt_obj
            decryption_status = "decrypted_ok"
            candidate_hashes.append(_sha256_hex(pt_bytes))
            candidate_hashes.extend(_candidate_digests_for_value(pt_obj))
        else:
            decryption_status = "locked_no_passphrase"
    else:
        decrypted_payload = payload

    sha256_verified = raw_sha in candidate_hashes
    if not sha256_verified and is_encrypted and decryption_status == "locked_no_passphrase":
        # El hash podría corresponder al texto plano interno previo al cifrado; requerir passphrase
        integrity_note = "unverified_until_decrypt"
    elif not sha256_verified:
        raise EnvelopeError(
            f"INTEGRIDAD_COMPROMETIDA: El digest SHA-256 declarado ({raw_sha[:16]}...) "
            "no coincide con la carga útil del sobre."
        )
    else:
        integrity_note = "sha256_verified"

    return {
        "valid": sha256_verified,
        "integrity": integrity_note,
        "version": version,
        "timestamp": timestamp,
        "mode": mode,
        "sha256": raw_sha,
        "encrypted": is_encrypted,
        "decryption_status": decryption_status,
        "cryptography_backend": "AES-256-GCM (cryptography)" if HAS_CRYPTOGRAPHY else "stdlib-only (SHA-256/Base64)",
        "armor_headers": armor_headers,
        "payload": decrypted_payload if decrypted_payload is not None else payload,
    }


def run_selftest() -> int:
    """Autodiagnóstico offline completo de integridad SHA-256 y cifrado AES-256-GCM."""
    print("=" * 70)
    print(" [KANUV 🛡️] K4L1 SOVEREIGN ENVELOPE CLI — OFFLINE SELF-TEST")
    print(" Frecuencia: 189.89.619 Hz | Zero-Cloud | Cero Red")
    print("=" * 70)

    sample_payload = {
        "service": "security",
        "urgency": "express",
        "name": "Operador Soberano",
        "contact": "@client.89 (Signal E2EE)",
        "brief": "Auditoría de hardening Linux y despliegue SIEM Zero-Cloud.",
    }

    # 1. Prueba de sellado e inspección en modo firmado SHA-256
    armored_signed = seal_envelope(sample_payload)
    res_signed = inspect_and_verify(armored_signed)
    if not res_signed["valid"] or res_signed["payload"] != sample_payload:
        print("[-] FALLO: El sobre firmado SHA-256 no superó la verificación.")
        return 1
    print("[✓] 1/3 Sobre firmado (.k4li.asc) + verificación SHA-256: OK")

    # 2. Prueba de detección de adulteración (Tamper Detection)
    _, env_tampered = extract_armor(armored_signed)
    env_tampered["payload"]["brief"] = "Payload manipulado por atacante"
    tampered_b64 = base64.b64encode(json.dumps(env_tampered).encode("utf-8")).decode("ascii")
    tampered_asc = f"{ARMOR_BEGIN}\n{tampered_b64}\n{ARMOR_END}\n"
    tamper_caught = False
    try:
        inspect_and_verify(tampered_asc)
    except EnvelopeError:
        tamper_caught = True

    if not tamper_caught:
        print("[-] FALLO: No se detectó la alteración maliciosa del payload.")
        return 1
    print("[✓] 2/3 Detección anti-manipulación (SHA-256 Tamper Guard): OK")

    # 3. Prueba de cifrado autenticado PBKDF2 + AES-256-GCM (si cryptography está presente)
    if HAS_CRYPTOGRAPHY:
        ephemeral_key = secrets.token_hex(16)
        wrong_key = secrets.token_hex(16)
        armored_enc = seal_envelope(sample_payload, passphrase=ephemeral_key)
        res_enc = inspect_and_verify(armored_enc, passphrase=ephemeral_key)
        if not res_enc["valid"] or res_enc["payload"] != sample_payload:
            print("[-] FALLO: Descifrado PBKDF2 + AES-256-GCM no reconstruyó el payload original.")
            return 1

        wrong_caught = False
        try:
            inspect_and_verify(armored_enc, passphrase=wrong_key)
        except EnvelopeError:
            wrong_caught = True

        if not wrong_caught:
            print("[-] FALLO: AES-256-GCM no rechazó una clave inválida.")
            return 1
        print("[✓] 3/3 Cifrado autenticado PBKDF2 (100k) + AES-256-GCM & rechazo GCM: OK")
    else:
        print("[*] 3/3 Motor opcional 'cryptography' ausente: modo stdlib SHA-256 activo (OK)")

    print("=" * 70)
    print(" [KANUV 🛡️] SELF-TEST COMPLETADO EXITOSAMENTE: PASSED (100% OFFLINE)")
    print("=" * 70)
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="sovereign_envelope_cli.py",
        description=(
            "K4L1 Studio — Utilidad Forense Offline para Sobres Soberanos (.k4li.asc). "
            "Inspecciona, verifica integridad SHA-256 y sella/descifra cargas PBKDF2/AES-256-GCM "
            "para despacho directo por Signal E2EE (@k4li.89) o PGP (Zero-Cloud)."
        ),
    )
    parser.add_argument(
        "envelope",
        nargs="?",
        help="Ruta al archivo .k4li.asc a inspeccionar/verificar (usa '-' para leer de stdin).",
    )
    parser.add_argument(
        "-i",
        "--inspect",
        metavar="FILE",
        help="Inspeccionar y verificar integridad SHA-256 de un archivo .k4li.asc.",
    )
    parser.add_argument(
        "--stdin",
        action="store_true",
        help="Leer el bloque -----BEGIN K4L1 SOVEREIGN ENVELOPE----- desde stdin.",
    )
    parser.add_argument(
        "-p",
        "--passphrase",
        metavar="KEY",
        help="Frase de paso para descifrar o cifrar en modo PBKDF2 + AES-256-GCM (o env K4LI_ENVELOPE_KEY).",
    )
    parser.add_argument(
        "--seal",
        metavar="JSON_OR_FILE",
        help="Empaquetar un JSON o archivo en un nuevo sobre blindado .k4li.asc.",
    )
    parser.add_argument(
        "-o",
        "--output",
        metavar="OUT_PATH",
        help="Ruta de salida opcional para guardar el sobre .k4li.asc o el payload decodificado.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emitir resultado de inspección en formato JSON estructurado.",
    )
    parser.add_argument(
        "--selftest",
        action="store_true",
        help="Ejecutar autodiagnóstico criptográfico offline completo.",
    )
    return parser


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.selftest:
        return run_selftest()

    passphrase = args.passphrase or os.environ.get("K4LI_ENVELOPE_KEY")

    if args.seal:
        seal_source = Path(args.seal)
        if seal_source.is_file():
            raw_input = seal_source.read_text(encoding="utf-8")
        else:
            raw_input = args.seal

        try:
            payload_data: Any = json.loads(raw_input)
        except json.JSONDecodeError:
            payload_data = raw_input

        try:
            armored = seal_envelope(payload_data, passphrase=passphrase)
        except EnvelopeError as exc:
            print(f"[-] ERROR AL SELLAR SOBRE: {exc}", file=sys.stderr)
            return 1

        if args.output:
            out_path = Path(args.output)
            out_path.write_text(armored, encoding="utf-8")
            print(f"[✓] Sobre soberano sellado en: {out_path}")
        else:
            sys.stdout.write(armored)
        return 0

    target_path = args.inspect or args.envelope
    if args.stdin or target_path == "-":
        raw_envelope = sys.stdin.read()
    elif target_path:
        file_p = Path(target_path)
        if not file_p.is_file():
            print(f"[-] ERROR: Archivo no encontrado: {file_p}", file=sys.stderr)
            return 1
        raw_envelope = file_p.read_text(encoding="utf-8")
    else:
        parser.print_help()
        return 0

    try:
        report = inspect_and_verify(raw_envelope, passphrase=passphrase)
    except EnvelopeError as exc:
        if args.json:
            print(json.dumps({"valid": False, "error": str(exc)}, ensure_ascii=False, indent=2))
        else:
            print(f"[-] VERIFICACIÓN FALLIDA: {exc}", file=sys.stderr)
        return 1

    if args.output:
        Path(args.output).write_text(
            json.dumps(report["payload"], ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print("=" * 70)
        print(" [KANUV 🛡️] INSPECCIÓN FORENSE DE SOBRE SOBERANO (.k4li.asc)")
        print("=" * 70)
        print(f" Versión     : {report['version']}")
        print(f" Timestamp   : {report['timestamp']}")
        print(f" Modo        : {report['mode']}")
        print(f" SHA-256     : {report['sha256']}")
        print(f" Integridad  : {report['integrity'].upper()}")
        print(f" Cifrado GCM : {'SÍ' if report['encrypted'] else 'NO'} ({report['decryption_status']})")
        print("-" * 70)
        print(" PAYLOAD:")
        print(json.dumps(report["payload"], ensure_ascii=False, indent=2))
        print("=" * 70)

    return 0


if __name__ == "__main__":
    sys.exit(main())
