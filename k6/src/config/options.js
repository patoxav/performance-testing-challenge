// Presets reutilizables de "options" para los distintos tipos de prueba
// de performance (smoke, load, stress, spike, soak).
//
// Cada perfil define stages y thresholds por defecto que pueden
// sobrescribirse desde el propio script de prueba si es necesario.

export const thresholds = {
  http_req_failed: ['rate<0.01'], // menos del 1% de requests fallidos
  http_req_duration: ['p(95)<500', 'p(99)<1000'], // percentiles de latencia
};

// Prueba rápida para validar que el script y el entorno funcionan.
export const smokeOptions = {
  vus: 1,
  duration: '30s',
  thresholds,
};

// Prueba de carga normal/esperada.
export const loadOptions = {
  stages: [
    { duration: '1m', target: 20 }, // ramp-up
    { duration: '3m', target: 20 }, // carga sostenida
    { duration: '1m', target: 0 }, // ramp-down
  ],
  thresholds,
};

// Prueba de estrés: se lleva el sistema más allá de su capacidad esperada.
export const stressOptions = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds,
};

// Prueba de picos: incremento repentino y agresivo de usuarios.
export const spikeOptions = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '30s', target: 200 },
    { duration: '1m', target: 200 },
    { duration: '30s', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds,
};

// Prueba de resistencia/soak: carga moderada durante un período largo.
export const soakOptions = {
  stages: [
    { duration: '2m', target: 20 },
    { duration: '30m', target: 20 },
    { duration: '2m', target: 0 },
  ],
  thresholds,
};
