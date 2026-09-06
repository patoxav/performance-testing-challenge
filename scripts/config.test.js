import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildUrl,
  getProfile,
  getResponseTimeLimit,
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
});

test('derives the response-time check from the selected profile thresholds', () => {
  assert.equal(getResponseTimeLimit('smoke'), 1000);
  assert.equal(getResponseTimeLimit('load'), 1500);
});
