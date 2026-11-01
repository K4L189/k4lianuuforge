#!/usr/bin/env bash
# =============================================================================
# K4LI-ANUU-FORGE // ZERO-CLOUD SOVEREIGN CRYPTO TEST SUITE (.k4li.asc)
# Frecuencia Operativa: 189.89.619 Hz | Concilio ACE (161914)
# Unidades Activas: Kanuv 🛡️ & 4NVSET 🟢
# =============================================================================
# Ejecuta 7 pruebas criptográficas automatizadas 100% offline contra
# api/sovereign_envelope_cli.py (SHA-256 Tamper Guard + PBKDF2-AES256GCM)
# y audita el cumplimiento estricto de la arquitectura Zero-Cloud.

set -euo pipefail

# Estética ANSI Seinen // 4NVSET 🟢 & Kanuv 🛡️
VIOLET="\033[38;2;147;51;234m"
CYAN="\033[38;2;6;182;212m"
EMERALD="\033[38;2;16;185;129m"
AMBER="\033[38;2;245;158;11m"
ROSE="\033[38;2;244;63;94m"
BOLD="\033[1m"
DIM="\033[2m"
RESET="\033[0m"

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI_BIN="${BASE_DIR}/api/sovereign_envelope_cli.py"
PYTHON_BIN="$(command -v python3 || echo "python3")"

TMP_DIR="$(mktemp -d /tmp/k4li_crypto_suite_XXXXXX)"
SIGNED_ASC="${TMP_DIR}/expediente_signed.k4li.asc"
TAMPERED_ASC="${TMP_DIR}/expediente_tampered.k4li.asc"
ENCRYPTED_ASC="${TMP_DIR}/expediente_encrypted.k4li.asc"

PASSED_COUNT=0
TOTAL_TESTS=7

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT INT TERM

pass_step() {
  PASSED_COUNT=$((PASSED_COUNT + 1))
  echo -e "${EMERALD}${BOLD}[✓] PASS (${PASSED_COUNT}/${TOTAL_TESTS}):${RESET} $1\n"
}

fail_step() {
  echo -e "${ROSE}${BOLD}[✗] FAIL:${RESET} $1" >&2
  exit 1
}

echo -e "${VIOLET}${BOLD}╔══════════════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${VIOLET}${BOLD}║  🛡️  KANUV & 4NVSET 🟢 // ZERO-CLOUD SOVEREIGN CRYPTO TEST SUITE     ║${RESET}"
echo -e "${VIOLET}${BOLD}║  Frecuencia: 189.89.619 Hz | Concilio ACE 161914 | 100% Offline     ║${RESET}"
echo -e "${VIOLET}${BOLD}╚══════════════════════════════════════════════════════════════════════╝${RESET}"
echo -e "${DIM}Target CLI : ${CLI_BIN}${RESET}"
echo -e "${DIM}Scratchpad : ${TMP_DIR}${RESET}\n"

if [ ! -f "${CLI_BIN}" ]; then
  fail_step "No se encontró '${CLI_BIN}'."
fi

# -----------------------------------------------------------------------------
# TEST 1/7: Autodiagnóstico criptográfico base (--selftest)
# -----------------------------------------------------------------------------
echo -e "${CYAN}${BOLD}[TEST 1/7] Ejecutando --selftest criptográfico offline...${RESET}"
SELFTEST_OUT="$("${PYTHON_BIN}" "${CLI_BIN}" --selftest)"
if echo "${SELFTEST_OUT}" | grep -q "PASSED"; then
  pass_step "Autodiagnóstico base (--selftest) verificado al 100% offline."
else
  fail_step "El autodiagnóstico --selftest no reportó PASSED."
fi

# -----------------------------------------------------------------------------
# TEST 2/7: Sellado (seal) de expediente JSON realista por stdin -> .k4li.asc
# -----------------------------------------------------------------------------
echo -e "${CYAN}${BOLD}[TEST 2/7] Sellando expediente JSON realista vía stdin -> archivo .k4li.asc...${RESET}"
REALISTIC_JSON='{"client":"Valkyrie SecOps SL","contact":"@valkyrie.89","service":"siem","urgency":"express","budget":850,"brief":"Auditoría forense y hardening Debian 12 en bare-metal."}'

printf '%s' "${REALISTIC_JSON}" | "${PYTHON_BIN}" "${CLI_BIN}" --seal "$(cat)" -o "${SIGNED_ASC}" >/dev/null

if [ -s "${SIGNED_ASC}" ] \
  && grep -q "^-----BEGIN K4L1 SOVEREIGN ENVELOPE-----" "${SIGNED_ASC}" \
  && grep -q "^-----END K4L1 SOVEREIGN ENVELOPE-----" "${SIGNED_ASC}"; then
  pass_step "Sobre soberano firmado generado correctamente en '${SIGNED_ASC##*/}'."
else
  fail_step "El archivo .k4li.asc generado está vacío o carece de cabeceras armor."
fi

# -----------------------------------------------------------------------------
# TEST 3/7: Inspección (inspect) y verificación exitosa de huella SHA-256
# -----------------------------------------------------------------------------
echo -e "${CYAN}${BOLD}[TEST 3/7] Inspeccionando sobre y verificando huella criptográfica SHA-256...${RESET}"
INSPECT_JSON="$("${PYTHON_BIN}" "${CLI_BIN}" --inspect "${SIGNED_ASC}" --json)"

"${PYTHON_BIN}" - "${INSPECT_JSON}" "${REALISTIC_JSON}" <<'PYEOF'
import hashlib
import json
import sys

res = json.loads(sys.argv[1])
orig = json.loads(sys.argv[2])
expected_sha = hashlib.sha256(
    json.dumps(orig, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
).hexdigest()

assert res.get("valid") is True, f"Sobre inválido: {res}"
assert res.get("integrity") == "sha256_verified", f"Integridad inesperada: {res.get('integrity')}"
assert res.get("sha256") == expected_sha, f"SHA-256 mismatch: {res.get('sha256')} != {expected_sha}"
assert res.get("payload") == orig, "El payload inspeccionado no coincide con el original"
PYEOF

pass_step "Inspección forense y huella SHA-256 verificadas bit a bit."

# -----------------------------------------------------------------------------
# TEST 4/7: Prueba negativa Tamper Guard (alteración de 1 byte en payload Base64)
# -----------------------------------------------------------------------------
echo -e "${CYAN}${BOLD}[TEST 4/7] Prueba negativa Tamper Guard (mutando 1 byte del payload Base64)...${RESET}"
"${PYTHON_BIN}" - "${SIGNED_ASC}" "${TAMPERED_ASC}" <<'PYEOF'
import base64
import pathlib
import sys

src = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
lines = src.splitlines()
headers = []
b64_chunks = []
for line in lines:
    s = line.strip()
    if not s or s.startswith("-----END"):
        continue
    if s.startswith("-----BEGIN") or ":" in s:
        headers.append(line)
    else:
        b64_chunks.append(s)

raw_bytes = bytearray(base64.b64decode("".join(b64_chunks)))
target_idx = raw_bytes.find(b"850")
assert target_idx != -1, "No se localizó el campo objetivo para mutación de 1 byte"
raw_bytes[target_idx + 2] = ord("1")  # Modifica exactamente 1 byte ("850" -> "851")

mutated_b64 = base64.b64encode(bytes(raw_bytes)).decode("ascii")
out_text = "\n".join(headers) + "\n\n" + mutated_b64 + "\n-----END K4L1 SOVEREIGN ENVELOPE-----\n"
pathlib.Path(sys.argv[2]).write_text(out_text, encoding="utf-8")
PYEOF

set +e
"${PYTHON_BIN}" "${CLI_BIN}" --inspect "${TAMPERED_ASC}" >/dev/null 2>&1
TAMPER_RC=$?
set -e

if [ "${TAMPER_RC}" -ne 0 ]; then
  pass_step "SHA-256 Tamper Guard detectó alteración de 1 byte y rechazó el sobre (exit=${TAMPER_RC})."
else
  fail_step "Vulnerabilidad crítica: un sobre adulterado en 1 byte no fue rechazado."
fi

# -----------------------------------------------------------------------------
# TEST 5/7: Sellado cifrado (PBKDF2 + AES-256-GCM) y apertura con coincidencia exacta
# -----------------------------------------------------------------------------
echo -e "${CYAN}${BOLD}[TEST 5/7] Sellando y abriendo sobre cifrado (PBKDF2 100k + AES-256-GCM)...${RESET}"
TEST_PASSPHRASE="K4L1-161914-Sovereign-VaultKey!"

"${PYTHON_BIN}" "${CLI_BIN}" --seal "${REALISTIC_JSON}" --passphrase "${TEST_PASSPHRASE}" -o "${ENCRYPTED_ASC}" >/dev/null
OPENED_JSON="$("${PYTHON_BIN}" "${CLI_BIN}" --inspect "${ENCRYPTED_ASC}" --passphrase "${TEST_PASSPHRASE}" --json)"

"${PYTHON_BIN}" - "${OPENED_JSON}" "${REALISTIC_JSON}" <<'PYEOF'
import json
import sys

opened = json.loads(sys.argv[1])
expected = json.loads(sys.argv[2])

assert opened.get("valid") is True, "Sobre cifrado marcado como inválido"
assert opened.get("encrypted") is True, "El sobre no fue reportado como cifrado"
assert opened.get("decryption_status") == "decrypted_ok", f"Estado GCM inesperado: {opened.get('decryption_status')}"
assert opened.get("payload") == expected, f"Campos JSON descifrados no coinciden: {opened.get('payload')}"
PYEOF

pass_step "Cifrado y apertura PBKDF2 + AES-256-GCM verificados con coincidencia JSON exacta."

# -----------------------------------------------------------------------------
# TEST 6/7: Prueba negativa GCM Auth Tag (passphrase errónea -> exit != 0)
# -----------------------------------------------------------------------------
echo -e "${CYAN}${BOLD}[TEST 6/7] Prueba negativa AES-256-GCM Auth Tag (passphrase incorrecta)...${RESET}"
set +e
"${PYTHON_BIN}" "${CLI_BIN}" --inspect "${ENCRYPTED_ASC}" --passphrase "WRONG-PASSPHRASE-000" >/dev/null 2>&1
WRONG_KEY_RC=$?
set -e

if [ "${WRONG_KEY_RC}" -ne 0 ]; then
  pass_step "GCM Auth Tag rechazó apertura con passphrase errónea (exit=${WRONG_KEY_RC})."
else
  fail_step "Fallo criptográfico: AES-256-GCM no devolvió error ante passphrase errónea."
fi

# -----------------------------------------------------------------------------
# TEST 7/7: Verificación de política Zero-Cloud (0 relés serverless / webhooks)
# -----------------------------------------------------------------------------
echo -e "${CYAN}${BOLD}[TEST 7/7] Auditando política Zero-Cloud (ausencia de webhooks o workers externos)...${RESET}"
FORBIDDEN_FOUND="$(find "${BASE_DIR}" -maxdepth 2 \( -name "worker_*.js" -o -name "wrangler.toml" -o -name "intake_webhook.py" \) 2>/dev/null | wc -l | tr -d ' ')"

if [ "${FORBIDDEN_FOUND}" -eq 0 ]; then
  pass_step "Política Zero-Cloud intacta: 0 artefactos de relé/webhook externo presentes."
else
  fail_step "Violación Zero-Cloud: se detectaron ${FORBIDDEN_FOUND} archivos prohibidos."
fi

echo -e "${EMERALD}${BOLD}══════════════════════════════════════════════════════════════════════${RESET}"
echo -e "${EMERALD}${BOLD}🛡️  [KANUV] & [4NVSET 🟢]: ${PASSED_COUNT}/${TOTAL_TESTS} TESTS PASSED (100% OFFLINE ZERO-CLOUD)${RESET}"
echo -e "${EMERALD}${BOLD}══════════════════════════════════════════════════════════════════════${RESET}"
