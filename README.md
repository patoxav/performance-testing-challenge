# Performance Testing Challenge

Este repositorio contiene la prueba de carga del challenge usando k6 local, sin Docker, con carga escalonada y validación de login.

## Requisitos

- Node.js 18+
- k6 instalado localmente

```bash
brew install k6
```

## Instalación

```bash
npm install
```

## Ejecución

### 1) Validar la configuración

```bash
npm test
```

### 2) Ejecutar la prueba de carga

```bash
npm run load
```

### 3) Limpiar reportes

```bash
npm run clean:reports
```

## Configuración de carga

La prueba usa este patrón de stages:

```js
export const options = {
  stages: [
    { duration: '1m', target: 25 },
    { duration: '2m', target: 50 },
    { duration: '2m', target: 75 },
    { duration: '2m', target: 100 },
    { duration: '3m', target: 130 },
    { duration: '2m', target: 150 },
    { duration: '1m', target: 0 }
  ],

  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.03']
  }
};
```

Además, cada VU hace `sleep(5)` entre peticiones.

## Archivos clave

- [scripts/api-performance.js](scripts/api-performance.js): lógica del login y validación
- [scripts/config.js](scripts/config.js): configuración del escenario
- [data/users.csv](data/users.csv): usuarios de prueba
- [reports/](reports/): resultados exportados por k6

## Análisis con LLM

Si quieres un análisis adicional con IA basado en el JSON generado:

```bash
npm run analyze:llm
```

Esto usa la carpeta [ai-quality-analysis](ai-quality-analysis) y genera un reporte markdown.
