# performance-testing-challenge

Arquetipo base de **k6** para ejecutar pruebas de rendimiento sobre APIs y generar reportes con métricas y gráficos nativos de k6.

## Qué incluye

- Prueba reutilizable para APIs HTTP/HTTPS.
- Perfil **smoke** para validación rápida.
- Perfil **load** para carga básica.
- Export de resumen en **JSON** con métricas de k6.
- Export de reporte **HTML** del Web Dashboard de k6 con gráficos.
- Configuración mediante variables de entorno para reutilizar el arquetipo con cualquier API.

## Estructura

```text
.
├── .gitignore
├── package.json
├── scripts/
│   └── api-performance.js
└── README.md
```

## Requisitos

- [Docker](https://www.docker.com/) instalado.
- [Node.js](https://nodejs.org/) instalado para ejecutar los scripts `npm`.

> Los scripts usan la imagen oficial `grafana/k6`, por lo que no necesitas instalar k6 localmente.
>
> Además agregan `host.docker.internal` para que también puedas apuntar a APIs que estén corriendo en tu máquina.

## Configuración

Puedes sobrescribir estos valores al ejecutar la prueba:

- `BASE_URL`: URL base de la API.
- `API_PATH`: path del endpoint.
- `METHOD`: método HTTP (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
- `EXPECTED_STATUS`: código esperado de respuesta.
- `AUTH_TOKEN`: valor para el header Authorization
- `REQUEST_BODY`: payload JSON para `POST`, `PUT` o `PATCH`.
- `SLEEP_SECONDS`: pausa entre iteraciones.
- `TIMEOUT`: timeout por request.

Valores por defecto:

- `BASE_URL=https://test-api.k6.io`
- `API_PATH=/public/crocodiles/`
- `METHOD=GET`
- `EXPECTED_STATUS=200`
- `SLEEP_SECONDS=1`
- `TIMEOUT=30s`

## Ejecución

### Smoke test

```bash
npm run smoke
```

Genera:

- `reports/smoke-summary.json`
- `reports/smoke-report.html`

### Load test

```bash
npm run load
```

Genera:

- `reports/load-summary.json`
- `reports/load-report.html`

## Ejemplos

### Probar un endpoint GET propio

```bash
BASE_URL=https://mi-api.com API_PATH=/health npm run smoke
```

### Probar un endpoint autenticado

```bash
BASE_URL=https://mi-api.com \
API_PATH=/v1/orders \
AUTH_TOKEN=mi_token \
EXPECTED_STATUS=200 \
npm run load
```

### Probar un POST con body JSON

```bash
BASE_URL=https://mi-api.com \
API_PATH=/v1/orders \
METHOD=POST \
EXPECTED_STATUS=201 \
REQUEST_BODY='{"productId":1,"quantity":2}' \
npm run smoke
```

## Métricas y reportes

El script valida y expone métricas de k6 como:

- `http_req_duration`
- `http_req_failed`
- `checks`
- `api_response_time`
- `api_error_rate`

El reporte HTML se genera usando el **Web Dashboard de k6**, por lo que incluye gráficos y visualización nativa de la herramienta.

## Limpieza de reportes

```bash
npm run clean:reports
```
