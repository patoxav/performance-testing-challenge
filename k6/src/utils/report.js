// Utilidad de reportes basada exclusivamente en las capacidades nativas
// de k6 (handleSummary), sin necesidad de servicios externos.
//
// Genera:
//   - reports/summary.html -> reporte HTML navegable (k6-reporter)
//   - reports/summary.json -> reporte JSON con todas las métricas
//   - stdout                -> resumen de texto en consola (k6 estándar)
//
// Uso en un script de prueba:
//   import { buildSummary } from '../utils/report.js';
//   export function handleSummary(data) {
//     return buildSummary(data, 'nombre-de-la-prueba');
//   }

import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

/**
 * Genera un resumen de texto plano a partir de las métricas de k6, sin
 * depender de librerías externas. Se usa como salida por consola (stdout).
 */
function renderTextSummary(data, testName) {
  const metrics = data.metrics || {};
  const reqs = metrics.http_reqs ? metrics.http_reqs.values.count : 0;
  const failed = metrics.http_req_failed
    ? (metrics.http_req_failed.values.rate * 100).toFixed(2)
    : '0.00';
  const duration = metrics.http_req_duration ? metrics.http_req_duration.values : {};
  const checksTotal = metrics.checks ? metrics.checks.values.passes + metrics.checks.values.fails : 0;
  const checksPassed = metrics.checks ? metrics.checks.values.passes : 0;

  const lines = [
    '',
    `===== Resumen de prueba: ${testName} =====`,
    `Requests totales : ${reqs}`,
    `Requests fallidos: ${failed}%`,
    `Checks           : ${checksPassed}/${checksTotal}`,
    'Duración de requests (ms):',
    `  avg=${(duration.avg || 0).toFixed(2)} min=${(duration.min || 0).toFixed(2)} ` +
      `med=${(duration.med || 0).toFixed(2)} max=${(duration.max || 0).toFixed(2)} ` +
      `p(90)=${(duration['p(90)'] || 0).toFixed(2)} p(95)=${(duration['p(95)'] || 0).toFixed(2)}`,
    '=============================================',
    '',
  ];

  return lines.join('\n');
}

export function buildSummary(data, testName = 'k6-test') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = `${testName}-${timestamp}`;

  return {
    stdout: renderTextSummary(data, testName),
    [`reports/${baseName}.html`]: htmlReport(data),
    [`reports/${baseName}.json`]: JSON.stringify(data, null, 2),
    // Mantiene también una copia "latest" para consulta rápida/CI.
    'reports/summary-latest.html': htmlReport(data),
    'reports/summary-latest.json': JSON.stringify(data, null, 2),
  };
}
