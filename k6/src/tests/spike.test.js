// Prueba de picos (spike): valida cómo responde el sistema ante un
// incremento repentino y agresivo de usuarios concurrentes.
// Uso: k6 run src/tests/spike.test.js

import http from 'k6/http';
import { getEnvironment } from '../config/environments.js';
import { spikeOptions } from '../config/options.js';
import { checkResponse, randomSleep } from '../utils/helpers.js';
import { buildSummary } from '../utils/report.js';

const env = getEnvironment();

export const options = spikeOptions;

export default function () {
  const res = http.get(`${env.baseUrl}/`);
  checkResponse(res, { expectedStatus: 200, maxDuration: 2000 });
  randomSleep(0.2, 1);
}

export function handleSummary(data) {
  return buildSummary(data, 'spike');
}
