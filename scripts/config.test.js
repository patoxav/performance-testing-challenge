import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildHeaders,
  buildUrl,
  getExecutionConfig,
  getOptions,
  getProfile,
  normalizeApiPath
} from './config.js';

test('normalizes API paths consistently', () => {
  assert.equal(normalizeApiPath('/health/'), 'health');
  assert.equal(normalizeApiPath('health'), 'health');
  assert.equal(normalizeApiPath('/'), '');
});

test('builds URLs without duplicated or inconsistent slashes', () => {
  assert.equal(buildUrl('https://api.example.com/', '/health/'), 'https://api.example.com/health');
  assert.equal(buildUrl('https://api.example.com', 'health'), 'https://api.example.com/health');
  assert.equal(buildUrl('https://api.example.com/', '/'), 'https://api.example.com/');
});

test('falls back to the load profile for unsupported profile names', () => {
  assert.deepEqual(getProfile('unsupported-profile'), getProfile('load'));
  assert.equal(getProfile('load').stages.length, 7);
  assert.equal(getOptions('unsupported-profile').stages.length, 7);
});

test('uses structured profile data for response-time limits', () => {
  assert.equal(getProfile('load').responseTimeLimit, 1500);
  assert.equal(getOptions('load').thresholds.http_req_duration[0], 'p(95)<1500');
});

test('uses a login load profile aligned to the challenge SLA', () => {
  const profile = getProfile('load');

  assert.deepEqual(profile.stages, [
    { duration: '1m', target: 25 },
    { duration: '2m', target: 50 },
    { duration: '2m', target: 75 },
    { duration: '2m', target: 100 },
    { duration: '3m', target: 130 },
    { duration: '2m', target: 150 },
    { duration: '1m', target: 0 }
  ]);
  assert.equal(profile.responseTimeLimit, 1500);
  assert.equal(profile.thresholds.http_req_failed[0], 'rate<0.03');
  assert.equal(profile.thresholds.http_req_duration[0], 'p(95)<1500');
});

test('allows custom stepped-load tuning for the required challenge profile', () => {
  const config = getExecutionConfig({
    TEST_TYPE: 'load',
    TARGET_VUS: '150',
    RESPONSE_TIME_LIMIT: '1500',
    SLEEP_SECONDS: '5'
  });

  assert.deepEqual(config.options.stages, [
    { duration: '1m', target: 25 },
    { duration: '2m', target: 50 },
    { duration: '2m', target: 75 },
    { duration: '2m', target: 100 },
    { duration: '3m', target: 130 },
    { duration: '2m', target: 150 },
    { duration: '1m', target: 0 }
  ]);
  assert.equal(config.responseTimeLimit, 1500);
  assert.equal(config.sleepSeconds, 5);
});

test('builds headers only for the request data that exists', () => {
  assert.deepEqual(buildHeaders({ payload: null }), {});
  assert.deepEqual(buildHeaders({ payload: '{"ok":true}' }), {
    'Content-Type': 'application/json'
  });
  assert.deepEqual(buildHeaders({ authToken: 'token', payload: null }), {
    Authorization: 'Bearer ' + 'token'
  });
});

test('maps environment variables into executable k6 configuration', () => {
  const loadConfig = getExecutionConfig({
    TEST_TYPE: 'load',
    BASE_URL: 'https://api.example.com/',
    API_PATH: '/health/',
    EXPECTED_STATUS: '204',
    SLEEP_SECONDS: '0.5'
  });

  assert.equal(loadConfig.url, 'https://api.example.com/health');
  assert.equal(loadConfig.options.stages[0].duration, '1m');
  assert.equal(loadConfig.responseTimeLimit, 1500);
  assert.equal(loadConfig.expectedStatus, 204);
  assert.equal(loadConfig.sleepSeconds, 0.5);

  const fallbackConfig = getExecutionConfig({
    TEST_TYPE: 'unsupported-profile'
  });

  assert.equal(fallbackConfig.options.stages.length, 7);
  assert.equal(fallbackConfig.responseTimeLimit, 1500);

  const postConfig = getExecutionConfig({
    TEST_TYPE: 'load',
    METHOD: 'POST',
    REQUEST_BODY: '{"productId":1}'
  });

  assert.equal(postConfig.payload, '{"productId":1}');
  assert.deepEqual(postConfig.headers, {
    'Content-Type': 'application/json'
  });

  const emptyPostConfig = getExecutionConfig({
    TEST_TYPE: 'load',
    METHOD: 'POST'
  });

  assert.equal(emptyPostConfig.payload, null);
  assert.deepEqual(emptyPostConfig.headers, {});

  const deleteConfig = getExecutionConfig({
    TEST_TYPE: 'load',
    METHOD: 'DELETE',
    REQUEST_BODY: '{"reason":"cleanup"}'
  });

  assert.equal(deleteConfig.payload, '{"reason":"cleanup"}');
  assert.deepEqual(deleteConfig.headers, {
    'Content-Type': 'application/json'
  });
});

test('rejects invalid numeric environment values with a clear error', () => {
  assert.throws(
    () =>
      getExecutionConfig({
        EXPECTED_STATUS: 'abc'
      }),
    /EXPECTED_STATUS must be a valid number/
  );

  assert.throws(
    () =>
      getExecutionConfig({
        EXPECTED_STATUS: '200.5'
      }),
    /EXPECTED_STATUS must be a valid integer/
  );

  assert.throws(
    () =>
      getExecutionConfig({
        SLEEP_SECONDS: 'fast'
      }),
    /SLEEP_SECONDS must be a valid number/
  );
});
