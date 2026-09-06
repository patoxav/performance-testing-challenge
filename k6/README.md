# Arquetipo de pruebas de performance con k6

Este directorio contiene un **arquetipo (plantilla base)** reutilizable para
ejecutar pruebas de performance con [k6](https://k6.io/), incluyendo la
generación de **informes y reportes usando exclusivamente las capacidades
nativas de la herramienta** (sin depender de servicios externos como
Grafana Cloud o InfluxDB).

## Estructura

```
k6/
├── src/
│   ├── config/
│   │   ├── environments.js   # URLs base por entorno (local, dev, staging, prod)
│   │   └── options.js        # Perfiles de carga (smoke, load, stress, spike, soak)
│   ├── tests/
│   │   ├── smoke.test.js     # Prueba rápida de validación (1 VU)
│   │   ├── load.test.js      # Prueba de carga esperada
│   │   ├── stress.test.js    # Prueba de estrés (más allá de la capacidad esperada)
│   │   └── spike.test.js     # Prueba de picos repentinos de tráfico
│   └── utils/
│       ├── helpers.js        # Checks y utilidades comunes
│       └── report.js         # Generación de reportes (HTML/JSON/consola)
├── reports/                  # Salida de los reportes generados (ignorado en git)
├── scripts/
│   └── run-tests.sh          # Script de conveniencia para ejecutar pruebas
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Requisitos

- [k6](https://k6.io/docs/get-started/installation/) v0.54 o superior instalado localmente, **o**
- Docker / Docker Compose (para ejecutar sin instalar k6, usa la imagen `grafana/k6:latest`)

## Cómo ejecutar las pruebas

### Localmente con k6 instalado

```bash
cd k6
./scripts/run-tests.sh smoke local
./scripts/run-tests.sh load local
./scripts/run-tests.sh stress staging
./scripts/run-tests.sh spike staging
```

O directamente con los scripts de npm (solo como atajos, no requiere Node.js
en tiempo de ejecución, k6 corre el JS de forma nativa):

```bash
cd k6
npm run test:smoke
npm run test:load
npm run test:stress
npm run test:spike
```

### Con Docker (sin instalar k6)

```bash
cd k6
docker compose run --rm k6 run -e ENV=local src/tests/smoke.test.js
```

## Reportes e informes

Cada prueba implementa `handleSummary()` (función nativa de k6) mediante el
helper `src/utils/report.js`, generando automáticamente al finalizar la
ejecución:

- **`reports/<prueba>-<timestamp>.html`** — reporte HTML navegable con
  gráficos y resumen de métricas (usando
  [k6-reporter](https://github.com/benc-uk/k6-reporter)).
- **`reports/<prueba>-<timestamp>.json`** — reporte JSON completo con todas
  las métricas, útil para integraciones o análisis posterior.
- **`reports/summary-latest.html` / `summary-latest.json`** — copia de la
  última ejecución, útil para pipelines de CI.
- **Resumen de texto en consola** (`stdout`) con colores, mostrado al
  finalizar cada ejecución.

No se requiere ninguna herramienta externa: todo el reporting se basa en
capacidades nativas de k6 (`handleSummary`, `k6-summary` y `k6-reporter`,
cargados como librerías JS estándar).

## Cómo crear una nueva prueba a partir del arquetipo

1. Copia uno de los scripts en `src/tests/` como punto de partida (por
   ejemplo `load.test.js`).
2. Ajusta la lógica de la petición/flujo de usuario en la función
   `default`.
3. Selecciona o crea un perfil de carga en `src/config/options.js`.
4. Reutiliza `checkResponse` y `randomSleep` desde `src/utils/helpers.js`.
5. Mantén `handleSummary` con `buildSummary(data, '<nombre-de-la-prueba>')`
   para obtener los reportes automáticamente.

## Umbrales (thresholds)

Los umbrales por defecto (`src/config/options.js`) definen criterios de
éxito/fallo automáticos:

- `http_req_failed`: menos del 1% de solicitudes fallidas.
- `http_req_duration`: p95 < 500ms y p99 < 1000ms.

Si un umbral no se cumple, k6 finaliza con código de salida distinto de
cero, lo que permite integrar estas pruebas fácilmente en pipelines de CI/CD.
