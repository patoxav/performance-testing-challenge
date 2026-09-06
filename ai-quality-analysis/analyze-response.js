const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

function safeReadJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function readMetric(metrics, key, fallback = 0) {
  return metrics?.[key] ?? fallback;
}

function getSlaTargets(summary) {
  const explicit = summary.sla || {};
  return {
    targetTps: Number(explicit.target_tps ?? summary.targetTps ?? 20),
    maxP95Ms: Number(explicit.max_p95_ms ?? summary.maxP95Ms ?? 1500),
    maxErrorRatePct: Number(explicit.max_error_rate_pct ?? summary.maxErrorRatePct ?? 3)
  };
}

function buildAnalysis(rawSummary) {
  const metrics = rawSummary.metrics || {};
  const requestMetric = readMetric(metrics, 'http_reqs', { count: 0, rate: 0 });
  const durationMetric = readMetric(metrics, 'http_req_duration', {});
  const failedMetric = readMetric(metrics, 'http_req_failed', { rate: 0, passes: 0, fails: 0 });
  const checksMetric = readMetric(metrics, 'checks', { rate: 0, passes: 0, fails: 0 });

  const totalRequests = Number(requestMetric.count || 0);
  const tps = Number(requestMetric.rate || 0);
  const p95Ms = Number(durationMetric['p(95)'] || 0);
  const avgMs = Number(durationMetric.avg || 0);
  const maxMs = Number(durationMetric.max || 0);
  const errorRatePct = Number((failedMetric.rate || 0) * 100);
  const checksRatePct = Number((checksMetric.rate || 0) * 100);

  const sla = getSlaTargets(rawSummary);
  const slaMet =
    tps >= sla.targetTps &&
    p95Ms <= sla.maxP95Ms &&
    errorRatePct < sla.maxErrorRatePct;

  const summary = {
    status: slaMet ? 'PASS' : 'FAIL',
    totalRequests,
    tps,
    avgLatencyMs: avgMs,
    p95LatencyMs: p95Ms,
    maxLatencyMs: maxMs,
    errorRatePct,
    checksRatePct,
    slaMet
  };

  const llmPrompt = `Actúa como QA / QE Semi Senior. Analiza estos resultados de prueba de carga de K6.

Contexto:
- Escenario: ${rawSummary.scenario?.name || rawSummary.name || 'login_scenario'}
- Executor: ${rawSummary.scenario?.executor || 'constant-arrival-rate'}
- TPS objetivo: ${sla.targetTps}
- SLA p95: ${sla.maxP95Ms} ms
- SLA error rate: ${sla.maxErrorRatePct}%

Métricas:
- Requests totales: ${totalRequests}
- TPS observado: ${tps}
- Latencia promedio: ${avgMs} ms
- p95: ${p95Ms} ms
- Máxima latencia: ${maxMs} ms
- Tasa de error: ${errorRatePct}%
- Tasa de validaciones exitosas: ${checksRatePct}%

Indicador final: ${slaMet ? 'Cumple SLA' : 'No cumple SLA'}.

Entrega un análisis técnico con:
1. resumen ejecutivo,
2. hallazgos,
3. riesgos para negocio,
4. recomendaciones concretas.
`;

  return {
    scenario: rawSummary.scenario || { name: rawSummary.name || 'login_scenario' },
    sla,
    summary,
    llmPrompt
  };
}

function buildMarkdownReport(analysis, llmResponse) {
  const scenario = analysis.scenario || {};
  const sla = analysis.sla || {};
  const summary = analysis.summary || {};

  return `# Análisis de rendimiento - ${scenario.name || 'login_scenario'}

## Resumen ejecutivo

- Estado: **${summary.status || 'UNKNOWN'}**
- TPS observado: **${summary.tps ?? 0}**
- Requests totales: **${summary.totalRequests ?? 0}**
- Latencia promedio: **${summary.avgLatencyMs ?? 0} ms**
- p95: **${summary.p95LatencyMs ?? 0} ms**
- Máxima latencia: **${summary.maxLatencyMs ?? 0} ms**
- Error rate: **${summary.errorRatePct ?? 0}%**
- Checks exitosos: **${summary.checksRatePct ?? 0}%**
- SLA cumplido: **${summary.slaMet ? 'Sí' : 'No'}**

## Contexto del escenario

- Executor: ${scenario.executor || 'N/D'}
- Tasa objetivo: ${sla.targetTps ?? 0} TPS
- Limite p95: ${sla.maxP95Ms ?? 0} ms
- Error máximo permitido: ${sla.maxErrorRatePct ?? 0}%

## Análisis del LLM

${llmResponse}
`;
}

function resolveInputPath(rawArg) {
  if (rawArg) {
    return path.resolve(process.cwd(), rawArg);
  }

  const candidates = [
    path.resolve(__dirname, 'fixtures'),
    path.resolve(__dirname, 'reports'),
    path.resolve(__dirname, '..', 'reports')
  ];

  for (const dir of candidates) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir)
      .filter((file) => /\.(json)$/i.test(file))
      .map((file) => path.join(dir, file))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

    if (files.length > 0) {
      return files[0];
    }
  }

  return path.resolve(__dirname, 'fixtures', 'sample-response.json');
}

async function main() {
  const inputPath = resolveInputPath(process.argv[2]);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('Falta OPENAI_API_KEY. Ejemplo: OPENAI_API_KEY=tu_clave node analyze-response.js ./fixtures/sample-response.json');
    process.exit(1);
  }

  if (!fs.existsSync(inputPath)) {
    console.error(`No se encontró el archivo JSON de entrada: ${inputPath}`);
    process.exit(1);
  }

  const rawSummary = safeReadJson(inputPath);
  const analysis = buildAnalysis(rawSummary);

  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Actúa como QA / QE Semi Senior especialista en performance engineering. Responde siempre en español, con análisis técnico, claro y objetivo.'
      },
      {
        role: 'user',
        content: analysis.llmPrompt
      }
    ],
    temperature: 0.2
  });

  const responseText = completion.choices?.[0]?.message?.content || 'No se obtuvo respuesta del modelo.';
  const outputDir = path.resolve(__dirname, 'reports');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(outputDir, `performance-analysis-${timestamp}.md`);
  const markdownReport = buildMarkdownReport(analysis, responseText);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, markdownReport, 'utf8');

  console.log(JSON.stringify({
    ...analysis,
    sourceFile: inputPath,
    outputFile: outputPath,
    llmResponse: responseText
  }, null, 2));
}

main().catch((error) => {
  console.error('Error al consultar OpenAI:', error.message);
  process.exit(1);
});
