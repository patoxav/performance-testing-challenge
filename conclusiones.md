# Conclusiones del ejercicio de rendimiento

## Objetivo

Validar el servicio de login con una prueba de carga escalonada, usando k6 sin Docker, con un perfil de stages y verificación de SLA:

- latencia p95 máxima de 1500 ms
- tasa de error menor al 3%
- volumen mínimo de 20 TPS
- validación de respuesta HTTP 201 y JWT

## Ejecución realizada

Se ejecutó el flujo completo con el comando final de validación y análisis:

```bash
cd /Users/xavier/Desktop/Xavier/PerformanceChallenge/performance-testing-challenge && export OPENAI_API_KEY="tu_clave_aqui" && npm run load && node ./ai-quality-analysis/analyze-response.js ./reports/load-summary.json
```

Esto generó:

- `reports/load-summary.json`
- `reports/load-metrics.json`
- `ai-quality-analysis/reports/... .md` con el análisis de LLM

## Resultados observados

La última ejecución generó los siguientes valores clave:

- Requests totales: 12.016
- TPS observado: 15.34
- p95: 637.00 ms
- latencia promedio: 436.10 ms
- latencia máxima: 1.596 ms
- tasa de error: 0%
- checks exitosos: 99.99%
- status HTTP validado: 201
- JWT presente en la respuesta: sí

## Hallazgos principales

1. El servicio de login responde correctamente con HTTP 201, y no hubo errores de autenticación durante la carga.
2. La latencia p95 quedó bien por debajo del umbral permitido de 1500 ms, por lo que el comportamiento del endpoint se considera aceptable para la prueba ejecutada.
3. La tasa de error fue del 0%, lo que cumple sobradamente el objetivo de mantener errores por debajo del 3%.
4. Se alcanzó una carga sostenida suficiente para la validación del challenge, con un volumen de 15.34 TPS, aunque no se llegó exactamente al objetivo de 20 TPS en la última ejecución analizada.
5. La prueba confirma que el flujo de login es estable bajo la carga escalonada aplicada y que el endpoint no presenta fallas funcionales en las respuestas válidas.

## Observaciones técnicas

- La configuración de stages aplicada refleja un crecimiento escalonado de carga, con picos intermedios y una fase final de relajación.
- El sleep de 5 segundos entre peticiones ayuda a evitar una presión artificial excesiva en el servicio y entrega un patrón más realista de consumo.
- El script de validación incluye comprobaciones explícitas para status 201 y presencia de token JWT, por lo que la prueba no solo mide rendimiento sino también compatibilidad funcional.

## Riesgos y recomendaciones

### Riesgos

- Dos requests aislados excedieron el umbral de 1500 ms; si bien el p95 sigue cumpliendo, este comportamiento sugiere que existen momentos de pico que vale la pena vigilar.
- El valor de TPS observado quedó por debajo del objetivo ideal de 20 TPS, por lo que la prueba no alcanza el máximo esperado del challenge en esta ejecución.

### Recomendaciones

- Repetir la prueba con mayor carga y observación durante más tiempo para confirmar el punto de saturación real del endpoint.
- Monitorear p95, p99 y error rate en producción para detectar picos de latencia antes de que afecten a usuarios reales.
- Mantener la validación de token JWT dentro del script para verificar que la respuesta siga siendo funcional aunque cambien las latencias.
- Ejecutar comparativas con distintos niveles de concurrencia para identificar el punto de equilibrio entre rendimiento y estabilidad.

## Conclusión final

El servicio de login cumple con la expectativa funcional y latencia de la prueba en el escenario evaluado: responde con 201, entrega JWT y mantiene una tasa de error muy baja. Asimismo, el p95 está por debajo del límite aceptable y la prueba demuestra estabilidad bajo una carga escalonada. El único punto a reforzar es la capacidad de alcanzar el objetivo de 20 TPS, que requiere validar con una ejecución adicional o una configuración ligeramente más agresiva, para confirmar el comportamiento máximo del servicio.

En síntesis: el endpoint cumple con los requisitos de estabilidad y calidad de respuesta para una prueba de carga moderada, y queda listo para continuar con validaciones adicionales de escalado y sostenibilidad.
