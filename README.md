# Performance Testing Challenge

Este repositorio contiene una prueba de carga local para un endpoint de login usando k6, sin Docker, con carga escalonada y validación funcional de la respuesta de autenticación.

## Tecnologías utilizadas

- Node.js 24.14.1
- npm 11.11.0
- k6 v2.2.0
- OpenAI API / LLM para análisis post-ejecución

## Objetivo del challenge

Validar que el servicio de login cumpla con los requisitos del ejercicio:

- máximo 1.5 segundos de latencia p95
- tasa de error menor al 3%
- alcanzar al menos 20 TPS en la prueba de carga escalonada
- mantener el flujo con stages y sleep entre peticiones
- validar que la respuesta real del endpoint sea 201 y que devuelva un JWT

## Requisitos previos

- macOS o entorno similar con terminal zsh
- Node.js 18+
- k6 instalado localmente

### Instalar k6 en macOS con Homebrew

```bash
brew install k6
```

### Instalar dependencias del proyecto

```bash
npm install
```

## Validación de configuración

Antes de ejecutar la carga, puedes validar la estructura y la config del proyecto:

```bash
npm test
```

Esto ejecuta las pruebas de Node para verificar:

- normalización de URLs
- perfiles de stages
- conversion de env vars
- código esperado para el login
- validación de status real (201)

## Ejecución paso a paso

### 1) Ejecutar la prueba de carga

```bash
cd /Users/xavier/Desktop/Xavier/PerformanceChallenge/performance-testing-challenge
npm run load
```

Esto corre la carga escalonada con el escenario definido en [scripts/api-performance.js](scripts/api-performance.js) y exporta resultados en:

- [reports/load-summary.json](reports/load-summary.json)
- [reports/load-metrics.json](reports/load-metrics.json)

### 2) Verificar el resultado del último JSON generado

La forma recomendada para no mezclar ejecuciones viejas es apuntar explícitamente al JSON más reciente:

```bash
cd /Users/xavier/Desktop/Xavier/PerformanceChallenge/performance-testing-challenge
node ./ai-quality-analysis/analyze-response.js ./reports/load-summary.json
```

### 3) Ejecutar análisis con LLM usando la API key en consola

Si quieres enviar los resultados a OpenAI para que un LLM los interprete:

```bash
cd /Users/xavier/Desktop/Xavier/PerformanceChallenge/performance-testing-challenge
export OPENAI_API_KEY="tu_clave_aqui"
node ./ai-quality-analysis/analyze-response.js ./reports/load-summary.json
```

También puedes hacerlo con la variable en una sola línea:

```bash
cd /Users/xavier/Desktop/Xavier/PerformanceChallenge/performance-testing-challenge && export OPENAI_API_KEY="tu_clave_aqui" && node ./ai-quality-analysis/analyze-response.js ./reports/load-summary.json
```

### 4) Limpiar reportes

```bash
npm run clean:reports
```

## Configuración de carga utilizada

El escenario usa una curva escalonada con stages y pausa entre peticiones:

```js
stages: [
  { duration: '1m', target: 25 },
  { duration: '2m', target: 50 },
  { duration: '2m', target: 75 },
  { duration: '2m', target: 100 },
  { duration: '3m', target: 130 },
  { duration: '2m', target: 150 },
  { duration: '1m', target: 0 }
]
```

Además, cada VU hace `sleep(5)` entre peticiones.

## Archivos clave del proyecto

- [scripts/api-performance.js](scripts/api-performance.js): script principal de la prueba de carga
- [scripts/config.js](scripts/config.js): configuración del escenario y defaults del runner
- [scripts/run-k6.mjs](scripts/run-k6.mjs): wrapper para ejecutar k6 y exportar reportes
- [data/users.csv](data/users.csv): usuarios usados para el login
- [reports/load-summary.json](reports/load-summary.json): resumen final de k6
- [reports/load-metrics.json](reports/load-metrics.json): métricas detalladas exportadas por k6
- [ai-quality-analysis/analyze-response.js](ai-quality-analysis/analyze-response.js): análisis con LLM
- [ai-quality-analysis/reports](ai-quality-analysis/reports): reportes markdown generados por IA

## Análisis con LLM incorporado

El proyecto incluye una etapa adicional de análisis con IA para interpretar la ejecución de k6:

- toma el JSON de resultados
- extrae TPS, p95, latencia promedio, errores y checks
- arma un prompt técnico para QA
- envía la información a OpenAI
- genera un markdown con hallazgos y recomendaciones

Esto queda en la carpeta [ai-quality-analysis](ai-quality-analysis) y la salida se guarda en [ai-quality-analysis/reports](ai-quality-analysis/reports).

## Resultado esperado

El endpoint de login debe responder con status 201 y devolver un token JWT. En las ejecuciones validadas, los checks de estado, latencia y token fueron exitosos y la tasa de error se mantuvo dentro del límite aceptable.

## Nota final

La ejecución recomendada para obtener un análisis: performance + IA es esta:

```bash
cd /Users/xavier/Desktop/Xavier/PerformanceChallenge/performance-testing-challenge && export OPENAI_API_KEY="tu_clave_aqui" && npm run load && node ./ai-quality-analysis/analyze-response.js ./reports/load-summary.json
```

Esto asegura que el reporte generado por la IA corresponda a la última ejecución cargada.
