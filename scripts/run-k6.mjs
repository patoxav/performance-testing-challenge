import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const k6Image = 'grafana/k6:2.2.0';
const dockerCommand = process.platform === 'win32' ? 'docker.exe' : 'docker';
const action = process.argv[2];
const workingDirectory = process.cwd();
const reportsDirectory = resolve(workingDirectory, 'reports');

if (action === 'clean') {
  rmSync(reportsDirectory, { recursive: true, force: true });
  process.exit(0);
}

if (!['smoke', 'load'].includes(action)) {
  console.error('Usage: node ./scripts/run-k6.mjs <smoke|load|clean>');
  process.exit(1);
}

mkdirSync(reportsDirectory, { recursive: true });

const dockerArgs = ['run', '--rm', '-i'];

if (typeof process.getuid === 'function' && typeof process.getgid === 'function') {
  dockerArgs.push('--user', `${process.getuid()}:${process.getgid()}`);
}

if (process.platform === 'linux' && ['1', 'true'].includes(process.env.ENABLE_HOST_GATEWAY || '')) {
  dockerArgs.push('--add-host', 'host.docker.internal:host-gateway');
}

dockerArgs.push('-v', `${workingDirectory}:/work`, '-w', '/work');

for (const variableName of [
  'BASE_URL',
  'API_PATH',
  'METHOD',
  'AUTH_TOKEN',
  'REQUEST_BODY',
  'EXPECTED_STATUS',
  'SLEEP_SECONDS',
  'TIMEOUT'
]) {
  dockerArgs.push('-e', variableName);
}

dockerArgs.push(
  '-e',
  `TEST_TYPE=${action}`,
  '-e',
  'K6_WEB_DASHBOARD=true',
  '-e',
  'K6_WEB_DASHBOARD_PERIOD=1s',
  '-e',
  `K6_WEB_DASHBOARD_EXPORT=/work/reports/${action}-report.html`,
  k6Image,
  'run',
  `--summary-export=/work/reports/${action}-summary.json`,
  '/work/scripts/api-performance.js'
);

const result = spawnSync(dockerCommand, dockerArgs, { stdio: 'inherit' });

if (result.error) {
  console.error(`Failed to execute Docker: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
