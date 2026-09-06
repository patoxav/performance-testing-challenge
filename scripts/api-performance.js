import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { getExecutionConfig } from './config.js';

const apiResponseTime = new Trend('api_response_time', true);
const apiErrorRate = new Rate('api_error_rate');

const executionConfig = getExecutionConfig(__ENV);

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

function getCredentialsFromCsv(csvPath) {
  const csvText = open(csvPath);
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error(`CSV file ${csvPath} must include a header and at least one credential row`);
  }

  return lines.slice(1).map((line) => {
    const [username, password] = line.split(',');
    return { username: username.trim(), password: password.trim() };
  });
}

const credentials =
  executionConfig.url.includes('/auth/login') && executionConfig.method === 'POST'
    ? getCredentialsFromCsv(executionConfig.csvFile)
    : [];

export default function () {
  let requestBody = executionConfig.payload;

  if (executionConfig.url.includes('/auth/login') && executionConfig.method === 'POST') {
    const index = (__VU - 1 + __ITER) % credentials.length;
    const credentialsForRequest = credentials[index];

    requestBody = JSON.stringify({
      username: credentialsForRequest.username,
      password: credentialsForRequest.password
    });
  }

  const response = http.request(executionConfig.method, executionConfig.url, requestBody, {
    headers:
      requestBody !== null
        ? {
            ...executionConfig.headers,
            'Content-Type': 'application/json'
          }
        : executionConfig.headers,
    timeout: executionConfig.timeout,
    tags: {
      endpoint: executionConfig.normalizedApiPath || '/',
      method: executionConfig.method
    }
  });

  apiResponseTime.add(response.timings.duration);

  const checks = {
    [`status is ${executionConfig.expectedStatus}`]: (res) =>
      res.status === executionConfig.expectedStatus,
    [`response time is at most ${executionConfig.responseTimeLimit}ms`]: (res) =>
      res.timings.duration <= executionConfig.responseTimeLimit
  };

  if (executionConfig.url.includes('/auth/login') && executionConfig.method === 'POST') {
    checks['login returns a JWT token'] = (res) => {
      if (res.status !== executionConfig.expectedStatus) {
        return false;
      }

      const token = res.json('token');
      return typeof token === 'string' && token.length > 0;
    };
  }

  const success = check(response, checks);

  apiErrorRate.add(!success || response.status >= 400);
  sleep(executionConfig.sleepSeconds);
}
