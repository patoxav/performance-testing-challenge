// Prueba de estrés: lleva el sistema más allá de su capacidad esperada
// para identificar el punto de quiebre.
// Uso: k6 run src/tests/stress.test.js

import http from 'k6/http';
import { getEnvironment } from '../config/environments.js';
import { stressOptions } from '../config/options.js';
import { checkResponse, randomSleep } from '../utils/helpers.js';
import { buildSummary } from '../utils/report.js';

const env = getEnvironment();

export const options = stressOptions;

export default function () {
  const res = http.get(`${env.baseUrl}/`);
  checkResponse(res, { expectedStatus: 200, maxDuration: 1500 });
  randomSleep(0.5, 1.5);
}

export function handleSummary(data) {
  return buildSummary(data, 'stress');
}
