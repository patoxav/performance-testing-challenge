import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const action = process.argv[2];
const workingDirectory = process.cwd();
const reportsDirectory = resolve(workingDirectory, 'reports');

if (action === 'clean') {
  rmSync(reportsDirectory, { recursive: true, force: true });
  process.exit(0);
}

if (action !== 'load') {
  console.error('Usage: node ./scripts/run-k6.mjs <load|clean>');
  process.exit(1);
}

mkdirSync(reportsDirectory, { recursive: true });

const resolveProjectPath = (value) => {
  if (!value) {
    return resolve(workingDirectory, 'data/users.csv');
  }

  return value.startsWith('/') ? value : resolve(workingDirectory, value);
};

const defaultEnvironment = {
  BASE_URL: process.env.BASE_URL || 'https://fakestoreapi.com',
  API_PATH: process.env.API_PATH || '/auth/login',
  METHOD: process.env.METHOD || 'POST',
  CSV_FILE: resolveProjectPath(process.env.CSV_FILE || './data/users.csv'),
  EXPECTED_STATUS: process.env.EXPECTED_STATUS || '200',
  SLEEP_SECONDS: process.env.SLEEP_SECONDS || '5',
  TARGET_VUS: process.env.TARGET_VUS || '150',
  RESPONSE_TIME_LIMIT: process.env.RESPONSE_TIME_LIMIT || '1500',
  TIMEOUT: process.env.TIMEOUT || '60s',
  TEST_TYPE: 'load'
};

const k6Command = process.platform === 'win32' ? 'k6.exe' : 'k6';
const result = spawnSync(
  k6Command,
  [
    'run',
    '--summary-export', `${reportsDirectory}/load-summary.json`,
    '--out', `json=${reportsDirectory}/load-metrics.json`,
    'scripts/api-performance.js'
  ],
  {
    stdio: 'inherit',
    cwd: workingDirectory,
    env: {
      ...process.env,
      ...defaultEnvironment
    }
  }
);

if (result.error) {
  console.error(`Failed to execute k6: ${result.error.message}`);
  console.error('Install k6 locally: brew install k6');
  process.exit(1);
}

process.exit(result.status ?? 1);
