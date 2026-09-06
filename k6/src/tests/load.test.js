// Prueba de carga: simula el volumen de tráfico esperado en condiciones normales.
// Uso: k6 run src/tests/load.test.js

import http from 'k6/http';
import { getEnvironment } from '../config/environments.js';
import { loadOptions } from '../config/options.js';
import { checkResponse, randomSleep } from '../utils/helpers.js';
import { buildSummary } from '../utils/report.js';

const env = getEnvironment();

export const options = loadOptions;

export default function () {
  const res = http.get(`${env.baseUrl}/`);
  checkResponse(res, { expectedStatus: 200, maxDuration: 500 });
  randomSleep();
}

export function handleSummary(data) {
  return buildSummary(data, 'load');
}
