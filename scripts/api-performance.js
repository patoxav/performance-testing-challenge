import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { buildUrl, getProfile, getResponseTimeLimit, normalizeApiPath } from './config.js';

const apiResponseTime = new Trend('api_response_time', true);
const apiErrorRate = new Rate('api_error_rate');

const profileName = (__ENV.TEST_TYPE || 'load').toLowerCase();
const method = (__ENV.METHOD || 'GET').toUpperCase();
const expectedStatus = Number(__ENV.EXPECTED_STATUS || 200);
const sleepSeconds = Number(__ENV.SLEEP_SECONDS || 1);
const timeout = __ENV.TIMEOUT || '30s';
const requestBody = __ENV.REQUEST_BODY || '';
const url = buildUrl(__ENV.BASE_URL, __ENV.API_PATH);
const normalizedApiPath = normalizeApiPath(__ENV.API_PATH);
const responseTimeLimit = getResponseTimeLimit(profileName);

export const options = getProfile(profileName);

export default function () {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (__ENV.AUTH_TOKEN) {
    headers.Authorization = 'Bearer ' + __ENV.AUTH_TOKEN;
  }

  const payload = ['POST', 'PUT', 'PATCH'].includes(method) ? requestBody : null;
  const response = http.request(method, url, payload, {
    headers,
    timeout,
    tags: {
      endpoint: normalizedApiPath || '/',
      method
    }
  });

  apiResponseTime.add(response.timings.duration);

  const success = check(response, {
    [`status is ${expectedStatus}`]: (res) => res.status === expectedStatus,
    [`response time is below ${responseTimeLimit}ms`]: (res) => res.timings.duration < responseTimeLimit
  });

  apiErrorRate.add(!success || response.status >= 400);
  sleep(sleepSeconds);
}
