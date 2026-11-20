
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function lookupFamily(familyCode) {
  const response = await fetch(`${API_URL}/api/child/family/lookup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ familyCode })
  });

  if (!response.ok) {
    throw new Error('No pudimos acceder a la familia. Revisa el código e inténtalo nuevamente.');
  }

  const data = await response.json();

  if (!Array.isArray(data.profiles)) {
    throw new Error('La respuesta del servidor no es válida.');
  }

  return data.profiles;
}
