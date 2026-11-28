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

export function getChildProfiles() {
  return apiRequest('/api/guardian/profiles');
}

export function createChildProfile({ nickname, avatarId, temporaryPin }) {
  return apiRequest('/api/guardian/profiles', {
    method: 'POST',
    body: JSON.stringify({ nickname, avatarId, temporaryPin })
  });
}

export function updateChildProfile(profileId, updates) {
  return apiRequest(`/api/guardian/profiles/${encodeURIComponent(profileId)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

export function deleteChildProfile(profileId) {
  return apiRequest(`/api/guardian/profiles/${encodeURIComponent(profileId)}`, {
    method: 'DELETE'
  });
}

export function loginChild({ profileId, pin }) {
  return apiRequest('/api/child/login', {
    method: 'POST',
    body: JSON.stringify({ profileId, pin })
  });
}

export function changeChildPin({ newPin, confirmationPin }) {
  return apiRequest('/api/child/change-pin', {
    method: 'POST',
    body: JSON.stringify({ newPin, confirmationPin })
  });
}
