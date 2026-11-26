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
