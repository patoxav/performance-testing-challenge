import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { getExecutionConfig } from './config.js';

const apiResponseTime = new Trend('api_response_time', true);
const apiErrorRate = new Rate('api_error_rate');

const executionConfig = getExecutionConfig(__ENV);

export const options = executionConfig.options;

export default function () {
  const response = http.request(executionConfig.method, executionConfig.url, executionConfig.payload, {
    headers: executionConfig.headers,
    timeout: executionConfig.timeout,
    tags: {
      endpoint: executionConfig.normalizedApiPath || '/',
      method: executionConfig.method
    }
  });

  apiResponseTime.add(response.timings.duration);

  const success = check(response, {
    [`status is ${executionConfig.expectedStatus}`]: (res) =>
      res.status === executionConfig.expectedStatus,
    [`response time is at most ${executionConfig.responseTimeLimit}ms`]: (res) =>
      res.timings.duration <= executionConfig.responseTimeLimit
  });

  apiErrorRate.add(!success || response.status >= 400);
  sleep(executionConfig.sleepSeconds);
}
