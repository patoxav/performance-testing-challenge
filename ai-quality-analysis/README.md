# AI Quality Analysis

Esta carpeta está diseñada para convertir un resumen exportado por k6 en un prompt estructurado y enviarlo a OpenAI para que un LLM lo interprete con contexto de QA / rendimiento.

## Estructura

```text
ai-quality-analysis/
├── .gitignore
├── README.md
├── package.json
├── analyze-response.js
├── fixtures/
│   └── sample-response.json
├── reports/
│   └── performance-analysis-2026-09-06T00-00-00-000Z.md
└── results/
    └── (legacy output)
```

## Instalación

```bash
cd ai-quality-analysis
npm install
```

## Uso real

### Opción 1: ejecutar con un archivo específico

```bash
cd ai-quality-analysis
OPENAI_API_KEY=tu_api_key_real node analyze-response.js ./fixtures/sample-response.json
```

### Opción 2: dejar que detecte automáticamente el JSON más reciente

```bash
cd ai-quality-analysis
OPENAI_API_KEY=tu_api_key_real node analyze-response.js
```

El script busca archivos `.json` en:

- `./fixtures`
- `./reports`
- `../reports`

y usa el más reciente.

## Salida

El resultado se guarda con fecha y hora en:

```text
ai-quality-analysis/reports/
```

por ejemplo:

```text
performance-analysis-2026-09-06T12-30-15-000Z.md
```

## Qué hace el script

1. Lee un JSON de resultados de k6.
2. Extrae:
   - TPS
   - total de requests
   - latencia promedio, p95 y máxima
   - error rate
   - checks exitosos
3. Genera un prompt técnico para QA.
4. Lo envía a OpenAI.
5. Guarda el análisis final en Markdown en `reports/`.

## Objetivo

Permitir un flujo real de análisis de rendimiento, donde una IA interpreta el resultado del escenario de carga, hace una evaluación objetiva y genera un informe listo para entregar.
