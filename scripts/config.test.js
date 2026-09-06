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
  assert.equal(getProfile('smoke').duration, '15s');
  assert.equal(getProfile('load').stages.length, 3);
  assert.equal(getOptions('unsupported-profile').stages.length, 3);
});

test('uses structured profile data for response-time limits', () => {
  assert.equal(getProfile('smoke').responseTimeLimit, 1000);
  assert.equal(getProfile('load').responseTimeLimit, 1500);
  assert.equal(getOptions('smoke').thresholds.http_req_duration[0], 'p(95)<1000');
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
  const smokeConfig = getExecutionConfig({
    TEST_TYPE: 'smoke',
    BASE_URL: 'https://api.example.com/',
    API_PATH: '/health/',
    EXPECTED_STATUS: '204',
    SLEEP_SECONDS: '0.5'
  });

  assert.equal(smokeConfig.url, 'https://api.example.com/health');
  assert.equal(smokeConfig.options.duration, '15s');
  assert.equal(smokeConfig.responseTimeLimit, 1000);
  assert.equal(smokeConfig.expectedStatus, 204);
  assert.equal(smokeConfig.sleepSeconds, 0.5);

  const fallbackConfig = getExecutionConfig({
    TEST_TYPE: 'unsupported-profile'
  });

  assert.equal(fallbackConfig.options.stages.length, 3);
  assert.equal(fallbackConfig.responseTimeLimit, 1500);

  const postConfig = getExecutionConfig({
    TEST_TYPE: 'smoke',
    METHOD: 'POST',
    REQUEST_BODY: '{"productId":1}'
  });

  assert.equal(postConfig.payload, '{"productId":1}');
  assert.deepEqual(postConfig.headers, {
    'Content-Type': 'application/json'
  });

  const emptyPostConfig = getExecutionConfig({
    TEST_TYPE: 'smoke',
    METHOD: 'POST'
  });

  assert.equal(emptyPostConfig.payload, null);
  assert.deepEqual(emptyPostConfig.headers, {});

  const deleteConfig = getExecutionConfig({
    TEST_TYPE: 'smoke',
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
