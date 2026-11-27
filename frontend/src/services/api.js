export async function getHealth() {
  const response = await fetch('/health');
  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}`);
  }

  const health = await response.json();
  if (
    health.status !== 'healthy' ||
    health.server !== 'running' ||
    !['connected', 'disconnected'].includes(health.database)
  ) {
    throw new Error('The API returned an invalid health response');
  }

  return health;
}

async function apiRequest(path, options = {}) {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers
  };

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'include'
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || 'API_REQUEST_FAILED');
    error.code = data.error || 'API_REQUEST_FAILED';
    error.status = response.status;
    error.retryAfter = data.retryAfter;
    error.challenge = data.challenge;
    throw error;
  }

  return data;
}

export function registerGuardian({ email, password }) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export function loginGuardian({ email, password, challengeToken }) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, ...(challengeToken ? { challengeToken } : {}) })
  });
}

export function logoutGuardian() {
  return apiRequest('/api/auth/logout', {
    method: 'POST'
  });
}

export function getGuardianFamily() {
  return apiRequest('/api/guardian/family');
}
