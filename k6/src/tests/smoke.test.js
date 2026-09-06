// Prueba de "smoke test": valida que el flujo básico funciona con carga mínima.
// Uso: k6 run src/tests/smoke.test.js

import http from 'k6/http';
import { getEnvironment } from '../config/environments.js';
import { smokeOptions } from '../config/options.js';
import { checkResponse, randomSleep } from '../utils/helpers.js';
import { buildSummary } from '../utils/report.js';

const env = getEnvironment();

export const options = smokeOptions;

export default function () {
  const res = http.get(`${env.baseUrl}/`);
  checkResponse(res, { expectedStatus: 200, maxDuration: 800 });
  randomSleep();
}

export function handleSummary(data) {
  return buildSummary(data, 'smoke');
}
