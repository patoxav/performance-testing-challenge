import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const apiResponseTime = new Trend('api_response_time', true);
const apiErrorRate = new Rate('api_error_rate');

const testProfiles = {
  smoke: {
    vus: 1,
    duration: '15s',
    thresholds: {
      http_req_failed: ['rate<0.01'],
      http_req_duration: ['p(95)<1000'],
      api_error_rate: ['rate<0.01'],
      checks: ['rate>0.99']
    }
  },
  load: {
    stages: [
      { duration: '30s', target: 5 },
      { duration: '30s', target: 10 },
      { duration: '15s', target: 0 }
    ],
    thresholds: {
      http_req_failed: ['rate<0.01'],
      http_req_duration: ['p(95)<1500'],
      api_error_rate: ['rate<0.01'],
      checks: ['rate>0.99']
    }
  }
};

const profileName = (__ENV.TEST_TYPE || 'load').toLowerCase();
const baseUrl = (__ENV.BASE_URL || 'https://test-api.k6.io').replace(/\/$/, '');
const apiPath = (__ENV.API_PATH || '/public/crocodiles/').replace(/^\//, '');
const method = (__ENV.METHOD || 'GET').toUpperCase();
const expectedStatus = Number(__ENV.EXPECTED_STATUS || 200);
const sleepSeconds = Number(__ENV.SLEEP_SECONDS || 1);
const timeout = __ENV.TIMEOUT || '30s';
const requestBody = __ENV.REQUEST_BODY || '';

export const options = testProfiles[profileName] || testProfiles.load;

export default function () {
  const url = `${baseUrl}/${apiPath}`;
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
      endpoint: apiPath,
      method
    }
  });

  apiResponseTime.add(response.timings.duration);

  const success = check(response, {
    [`status es ${expectedStatus}`]: (res) => res.status === expectedStatus,
    'tiempo de respuesta < threshold esperado': (res) => res.timings.duration < 2000
  });

  apiErrorRate.add(!success || response.status >= 400);
  sleep(sleepSeconds);
}
