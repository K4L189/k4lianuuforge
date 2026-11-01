#!/usr/bin/env bash
# =============================================================================
# K4L1 STUDIO // DESPLIEGUE SOBERANO AUDITADO (ZERO-TOKEN CLI)
# Frecuencia Operativa: 189.89.619 Hz | Concilio ACE (161914)
# Gobernanza: Kanuv 🛡️ & 4NVSET 🟢
# =============================================================================
# Ejecuta las compuertas obligatorias de integridad y seguridad antes de
# sincronizar con el remoto 'origin' mediante el credential helper del sistema.

set -euo pipefail

VIOLET="\033[38;2;147;51;234m"
CYAN="\033[38;2;6;182;212m"
EMERALD="\033[38;2;16;185;129m"
ROSE="\033[38;2;244;63;94m"
BOLD="\033[1m"
RESET="\033[0m"

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${BASE_DIR}"

DRY_RUN=0
COMMIT_MSG="chore(forge): deploy audited sovereign update (161914)"

for arg in "$@"; do
  case "${arg}" in
    --dry-run|--check)
      DRY_RUN=1
      ;;
    ghp_*|github_pat_*|glpat-*)
      echo -e "${ROSE}${BOLD}[KANUV 🛡️ VETO]:${RESET} Prohibido pasar tokens en texto claro por CLI. Usa el credential helper del sistema." >&2
      exit 1
      ;;
    *)
      COMMIT_MSG="${arg}"
      ;;
  esac
done

enforce_local_excludes() {
  local exclude_file="${BASE_DIR}/.git/info/exclude"
  if [ -f "${exclude_file}" ]; then
    while IFS= read -r rule || [ -n "${rule}" ]; do
      case "${rule}" in
        ""|\#*) continue ;;
      esac
      local clean_rule="${rule%/}"
      git reset -q HEAD -- "${clean_rule}" 2>/dev/null || true
    done < "${exclude_file}"
  fi
}

echo -e "${VIOLET}${BOLD}=== K4L1 STUDIO // PIPELINE DE DESPLIEGUE SOBERANO (161914) ===${RESET}"

echo -e "${CYAN}[1/3] Verificando integridad de activos locales (verify_assets.py)...${RESET}"
python3 "${BASE_DIR}/scripts/verify_assets.py"

echo -e "${CYAN}[2/3] Ejecutando auditoría defensiva Zero-Cloud (security_audit.py)...${RESET}"
python3 "${BASE_DIR}/scripts/security_audit.py"

echo -e "${CYAN}[3/3] Aplicando blindaje silencioso de exclusiones locales (.git/info/exclude)...${RESET}"
enforce_local_excludes

if [ "${DRY_RUN}" -eq 1 ]; then
  echo -e "${EMERALD}${BOLD}[✓] DRY-RUN COMPLETADO: Auditorías superadas y exclusiones protegidas.${RESET}"
  exit 0
fi

if [ -x "${HOME}/.local/bin/anuu-push" ]; then
  "${HOME}/.local/bin/anuu-push" "${COMMIT_MSG}"
else
  if [ -n "$(git status --porcelain)" ]; then
    git add -A
    enforce_local_excludes
    git commit -m "${COMMIT_MSG}"
  fi
  git push origin main
fi

echo -e "${EMERALD}${BOLD}[✓] Despliegue soberano a 'origin/main' completado con éxito.${RESET}"
