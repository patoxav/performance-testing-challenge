export const DEFAULT_BASE_URL = 'https://test-api.k6.io';
export const DEFAULT_API_PATH = '/public/crocodiles/';

export const testProfiles = {
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

export function getProfile(profileName = 'load') {
  return testProfiles[String(profileName).toLowerCase()] || testProfiles.load;
}

export function normalizeBaseUrl(baseUrl = DEFAULT_BASE_URL) {
  return String(baseUrl || DEFAULT_BASE_URL).trim().replace(/\/+$/, '');
}

export function normalizeApiPath(apiPath = DEFAULT_API_PATH) {
  const rawPath = apiPath === undefined ? DEFAULT_API_PATH : String(apiPath).trim();

  if (rawPath === '') {
    return DEFAULT_API_PATH.replace(/^\/+|\/+$/g, '');
  }

  return rawPath.replace(/^\/+|\/+$/g, '');
}

export function buildUrl(baseUrl = DEFAULT_BASE_URL, apiPath = DEFAULT_API_PATH) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const normalizedApiPath = normalizeApiPath(apiPath);

  return normalizedApiPath ? `${normalizedBaseUrl}/${normalizedApiPath}` : `${normalizedBaseUrl}/`;
}

export function getResponseTimeLimit(profileName = 'load') {
  const threshold = getProfile(profileName).thresholds.http_req_duration.find((item) =>
    item.startsWith('p(95)<')
  );

  return Number(threshold.split('<')[1]);
}
