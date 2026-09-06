export const DEFAULT_BASE_URL = 'https://test-api.k6.io';
export const DEFAULT_API_PATH = '/public/crocodiles/';

function createProfile({ responseTimeLimit, ...options }) {
  return {
    ...options,
    responseTimeLimit,
    thresholds: {
      http_req_failed: ['rate<0.01'],
      http_req_duration: [`p(95)<${responseTimeLimit}`],
      api_error_rate: ['rate<0.01'],
      checks: ['rate>0.99']
    }
  };
}

export const testProfiles = {
  smoke: createProfile({
    vus: 1,
    duration: '15s',
    responseTimeLimit: 1000
  }),
  load: createProfile({
    stages: [
      { duration: '30s', target: 5 },
      { duration: '30s', target: 10 },
      { duration: '15s', target: 0 }
    ],
    responseTimeLimit: 1500
  })
};

export function getProfile(profileName = 'load') {
  return testProfiles[String(profileName).toLowerCase()] || testProfiles.load;
}

export function getOptions(profileName = 'load') {
  const { responseTimeLimit, ...options } = getProfile(profileName);
  return options;
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

export function buildHeaders({ authToken, payload }) {
  const headers = {};

  if (payload !== null) {
    headers['Content-Type'] = 'application/json';
  }

  if (authToken) {
    headers.Authorization = 'Bearer ' + authToken;
  }

  return headers;
}

export function getExecutionConfig(env = {}) {
  const profileName = (env.TEST_TYPE || 'load').toLowerCase();
  const profile = getProfile(profileName);
  const normalizedApiPath = normalizeApiPath(env.API_PATH);
  const method = (env.METHOD || 'GET').toUpperCase();
  const payload = ['POST', 'PUT', 'PATCH'].includes(method) ? env.REQUEST_BODY || '' : null;

  return {
    profileName,
    options: getOptions(profileName),
    url: buildUrl(env.BASE_URL, env.API_PATH),
    normalizedApiPath,
    method,
    expectedStatus: Number(env.EXPECTED_STATUS || 200),
    sleepSeconds: Number(env.SLEEP_SECONDS || 1),
    timeout: env.TIMEOUT || '30s',
    payload,
    headers: buildHeaders({ authToken: env.AUTH_TOKEN, payload }),
    responseTimeLimit: profile.responseTimeLimit
  };
}
