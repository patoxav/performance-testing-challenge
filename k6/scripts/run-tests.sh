#!/usr/bin/env bash
# Script de conveniencia para ejecutar las pruebas de performance del arquetipo k6.
#
# Uso:
#   ./scripts/run-tests.sh <smoke|load|stress|spike> [entorno]
#
# Ejemplos:
#   ./scripts/run-tests.sh smoke
#   ./scripts/run-tests.sh load staging

set -euo pipefail

TEST_TYPE="${1:-smoke}"
ENVIRONMENT="${2:-local}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_FILE="${SCRIPT_DIR}/src/tests/${TEST_TYPE}.test.js"

if [[ ! -f "${TEST_FILE}" ]]; then
  echo "Tipo de prueba inválido: '${TEST_TYPE}'. Opciones válidas: smoke, load, stress, spike" >&2
  exit 1
fi

mkdir -p "${SCRIPT_DIR}/reports"

echo "Ejecutando prueba '${TEST_TYPE}' contra el entorno '${ENVIRONMENT}'..."
k6 run -e ENV="${ENVIRONMENT}" "${TEST_FILE}"
