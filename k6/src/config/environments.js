// Configuración de entornos para las pruebas de performance.
// El entorno activo se selecciona mediante la variable de entorno ENV
// (ej: k6 run -e ENV=staging src/tests/load.test.js)

export const environments = {
  local: {
    baseUrl: 'http://localhost:3000',
  },
  dev: {
    baseUrl: 'https://dev.example.com',
  },
  staging: {
    baseUrl: 'https://staging.example.com',
  },
  prod: {
    baseUrl: 'https://example.com',
  },
};

export function getEnvironment() {
  const envName = __ENV.ENV || 'local';
  const env = environments[envName];

  if (!env) {
    throw new Error(
      `Entorno "${envName}" no encontrado. Entornos disponibles: ${Object.keys(
        environments
      ).join(', ')}`
    );
  }

  return env;
}
