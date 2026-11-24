export class FamilyLookupError extends Error {
  constructor(kind) {
    super(kind);
    this.name = 'FamilyLookupError';
    this.kind = kind;
  }
}

async function readLookupJson(response) {
  try {
    return await response.json();
  } catch (error) {
    throw new FamilyLookupError(error instanceof SyntaxError ? 'malformed' : 'connection');
  }
}

function isNonBlankString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseProfiles(data) {
  if (!Array.isArray(data?.profiles)) {
    throw new FamilyLookupError('malformed');
  }

  const seenIds = new Set();

  return data.profiles.map(profile => {
    const { id, nickname, avatarId } = profile ?? {};
    if ((!isNonBlankString(id) && !Number.isSafeInteger(id)) || !isNonBlankString(nickname)) {
      throw new FamilyLookupError('malformed');
    }

    const normalizedId = typeof id === 'string' ? id.trim() : id;
    const key = String(normalizedId);
    if (seenIds.has(key)) {
      throw new FamilyLookupError('malformed');
    }
    seenIds.add(key);

    return {
      id: normalizedId,
      nickname: nickname.trim(),
      avatarId: isNonBlankString(avatarId) ? avatarId.trim() : undefined
    };
  });
}

export async function lookupFamily(familyCode) {
  let response;
  try {
    response = await fetch('/api/child/family/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ familyCode })
    });
  } catch {
    throw new FamilyLookupError('connection');
  }

  if (response.status === 404) {
    // The Express fallback also returns 404 when the route is missing.
    const data = await readLookupJson(response);
    if (data?.code === 'FAMILY_NOT_FOUND') {
      throw new FamilyLookupError('not-found');
    }
  }

  if (!response.ok) {
    throw new FamilyLookupError('server');
  }

  return parseProfiles(await readLookupJson(response));
}
