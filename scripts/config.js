export const DEFAULT_BASE_URL = 'https://fakestoreapi.com';
export const DEFAULT_API_PATH = '/auth/login';

function createProfile({ responseTimeLimit, thresholds, ...options }) {
  return {
    ...options,
    responseTimeLimit,
    thresholds: {
      http_req_failed: ['rate<0.03'],
      http_req_duration: [`p(95)<${responseTimeLimit}`],
      api_error_rate: ['rate<0.03'],
      checks: ['rate>0.99'],
      ...thresholds
    }
  };
}

export const testProfiles = {
  load: createProfile({
    responseTimeLimit: 1500,
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
      http_req_failed: ['rate<0.03'],
      http_req_duration: ['p(95)<1500'],
      api_error_rate: ['rate<0.03']
    }
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

  if (payload !== null && payload !== '') {
    headers['Content-Type'] = 'application/json';
  }

  if (authToken) {
    headers.Authorization = 'Bearer ' + authToken;
  }

  return headers;
}

function parseNumericEnv(name, value, defaultValue) {
  if (value === undefined || value === '') {
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    throw new Error(`${name} must be a valid number`);
  }

  return parsedValue;
}

function parseIntegerEnv(name, value, defaultValue) {
  const parsedValue = parseNumericEnv(name, value, defaultValue);

  if (!Number.isInteger(parsedValue)) {
    throw new Error(`${name} must be a valid integer`);
  }

  return parsedValue;
}

export function getExecutionConfig(env = {}) {
  const profileName = (env.TEST_TYPE || 'load').toLowerCase();
  const profile = getProfile(profileName);
  const defaultResponseTimeLimit = profile.responseTimeLimit ?? 1500;
  const responseTimeLimit = parseIntegerEnv(
    'RESPONSE_TIME_LIMIT',
    env.RESPONSE_TIME_LIMIT,
    defaultResponseTimeLimit
  );
  const normalizedApiPath = normalizeApiPath(env.API_PATH || DEFAULT_API_PATH);
  const method = (env.METHOD || 'POST').toUpperCase();
  const rawRequestBody = env.REQUEST_BODY === undefined ? '' : String(env.REQUEST_BODY);
  const payload =
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && rawRequestBody !== ''
      ? rawRequestBody
      : null;
  const defaultSleepSeconds = 5;

  const steppedLoadOptions = {
    ...getOptions(profileName),
    stages: [
      { duration: '1m', target: 25 },
      { duration: '2m', target: 50 },
      { duration: '2m', target: 75 },
      { duration: '2m', target: 100 },
      { duration: '3m', target: 130 },
      { duration: '2m', target: 150 },
      { duration: '1m', target: 0 }
    ]
  };

  return {
    profileName,
    options: {
      ...steppedLoadOptions,
      thresholds: {
        http_req_failed: ['rate<0.03'],
        http_req_duration: [`p(95)<${responseTimeLimit}`],
        api_error_rate: ['rate<0.03']
      }
    },
    url: buildUrl(env.BASE_URL || DEFAULT_BASE_URL, env.API_PATH || DEFAULT_API_PATH),
    normalizedApiPath,
    method,
    expectedStatus: parseIntegerEnv('EXPECTED_STATUS', env.EXPECTED_STATUS, 200),
    sleepSeconds: parseNumericEnv('SLEEP_SECONDS', env.SLEEP_SECONDS, defaultSleepSeconds),
    timeout: env.TIMEOUT || '60s',
    payload,
    headers: buildHeaders({ authToken: env.AUTH_TOKEN, payload }),
    responseTimeLimit,
    csvFile: env.CSV_FILE || './data/users.csv',
    targetVus: 150
  };
}
