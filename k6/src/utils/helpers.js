// Helpers comunes reutilizables entre scripts de prueba.

import { check, sleep } from 'k6';

/**
 * Ejecuta un check estándar sobre una respuesta HTTP validando el status
 * code esperado y un tiempo máximo de respuesta.
 */
export function checkResponse(res, { expectedStatus = 200, maxDuration = 1000 } = {}) {
  return check(res, {
    [`status es ${expectedStatus}`]: (r) => r.status === expectedStatus,
    [`tiempo de respuesta < ${maxDuration}ms`]: (r) => r.timings.duration < maxDuration,
  });
}

/**
 * Pausa aleatoria entre iteraciones para simular "think time" real de usuario.
 */
export function randomSleep(min = 1, max = 3) {
  sleep(Math.random() * (max - min) + min);
}
