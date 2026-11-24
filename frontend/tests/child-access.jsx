import { afterEach, beforeEach, test } from 'node:test';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App.jsx';
import ChildAccess from '../src/features/ChildAccess.jsx';

const fixture = document.getElementById('fixture');
const luna = { id: 'fixture-luna', nickname: 'Luna', avatarId: 'tortuga-01' };
const sol = { id: 'fixture-sol', nickname: 'Sol', avatarId: 'sol-no-registrado' };

const originalFetch = globalThis.fetch;
let root;

beforeEach(() => {
  window.history.replaceState(null, '', '#roles');
  globalThis.fetch = () => { throw new Error('Petición sin simular'); };
  root = createRoot(fixture);
});

afterEach(async () => {
  try {
    await act(async () => root.unmount());
  } finally {
    globalThis.fetch = originalFetch;
  }
});

async function render(element) {
  await act(async () => root.render(element));
}

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function button(label) {
  const match = [...fixture.querySelectorAll('button')].find(
    element => element.textContent.trim().includes(label)
  );
  check(match, 'No se encontró el botón: ' + label);
  return match;
}

function codeInput() {
  const input = fixture.querySelector('#family-code');
  check(input, 'No se mostró el campo de código familiar.');
  return input;
}

async function click(element) {
  await act(async () => element.click());
}

async function enterCode(value) {
  const input = codeInput();
  const setValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  await act(async () => {
    setValue.call(input, value);
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
}

async function search(value) {
  await enterCode(value);
  await click(button('Encontrar mi perfil'));
}

function found(...profiles) {
  return Response.json({ profiles });
}

function withProfiles() {
  globalThis.fetch = async () => found(luna, sol);
}

test('Entra al flujo infantil desde la selección de roles', async () => {
  await render(<App />);
  await click(button('Soy CiberHéroe'));
  check(window.location.hash === '#familia', 'La navegación no abrió #familia.');
  codeInput();
});

test('Rechaza un identificador vacío sin hacer una petición', async () => {
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return found();
  };

  await render(<ChildAccess />);
  await search('   ');
  check(requests === 0, 'Se consultó el backend con un código vacío.');
  check(codeInput().getAttribute('aria-invalid') === 'true', 'El campo no se marcó como inválido.');
  check(fixture.querySelector('[role="alert"]')?.textContent.includes('Escribe el código'), 'Falta el mensaje de código vacío.');
});

test('Muestra la carga y deshabilita el envío mientras espera la respuesta', async () => {
  let resolveRequest;
  const request = new Promise(resolve => { resolveRequest = resolve; });
  globalThis.fetch = () => request;

  await render(<ChildAccess />);
  await search('equipo');
  check(codeInput().disabled, 'El campo sigue habilitado durante la carga.');
  check(button('Buscando...').disabled, 'El botón sigue habilitado durante la carga.');

  await act(async () => resolveRequest(found(luna)));
  button('Luna');
});

test('Normaliza el código y presenta los dos perfiles simulados', async () => {
  globalThis.fetch = async (_url, options) => {
    check(JSON.parse(options.body).familyCode === 'EQUIPO', 'El código enviado no fue normalizado.');
    return found(luna, sol);
  };

  await render(<ChildAccess />);
  await search('  equipo  ');
  check(fixture.querySelectorAll('.child-profile-card').length === 2, 'Se esperaban exactamente dos perfiles.');
  button('Luna');
  button('Sol');
});

test('Mantiene un único perfil seleccionado al cambiar de opción', async () => {
  withProfiles();
  await render(<ChildAccess />);
  await search('equipo');
  const first = button('Luna');
  const second = button('Sol');

  await click(first);
  check(first.getAttribute('aria-pressed') === 'true', 'Luna no quedó seleccionada.');
  check(second.getAttribute('aria-pressed') === 'false', 'Sol quedó seleccionado al mismo tiempo.');
  await click(second);
  check(first.getAttribute('aria-pressed') === 'false', 'La selección anterior no se limpió.');
  check(second.getAttribute('aria-pressed') === 'true', 'Sol no quedó seleccionado.');
});

test('Entrega al callback únicamente el perfil elegido', async () => {
  withProfiles();
  const delivered = [];
  await render(<ChildAccess onProfileSelected={profile => delivered.push(profile)} />);
  await search('equipo');
  check(delivered.length === 0, 'El callback se ejecutó antes de elegir.');

  await click(button('Sol'));
  check(delivered.length === 1 && JSON.stringify(delivered[0]) === JSON.stringify(sol),
    'El callback no recibió exactamente el perfil elegido.');
});

test('Muestra un mensaje cuando la familia no tiene perfiles', async () => {
  globalThis.fetch = async () => found();
  await render(<ChildAccess />);
  await search('equipo');

  check(fixture.querySelector('[role="status"]')?.textContent.includes('no hay perfiles'), 'Falta el estado sin perfiles.');
  check(fixture.querySelectorAll('.child-profile-card').length === 0, 'Se mostraron perfiles inexistentes.');
  button('Cambiar de familia');
});

test('Muestra un error de conexión y permite reintentar el mismo código', async () => {
  const codes = [];
  globalThis.fetch = async (_url, options) => {
    codes.push(JSON.parse(options.body).familyCode);
    if (codes.length === 1) throw new TypeError('Fallo de red simulado');
    return found(luna);
  };

  await render(<ChildAccess />);
  await search('equipo');
  check(fixture.querySelector('[role="alert"]')?.textContent.includes('No pudimos conectarnos'), 'Falta el mensaje de conexión.');
  check(!codeInput().disabled, 'El formulario no permite reintentar.');
  await click(button('Encontrar mi perfil'));
  check(codes.join(',') === 'EQUIPO,EQUIPO', 'El reintento no usó el mismo código.');
  button('Luna');
});

test('Limpia el código, los perfiles y la selección al cambiar de familia', async () => {
  globalThis.fetch = async (_url, options) => {
    const { familyCode } = JSON.parse(options.body);
    return familyCode === 'EQUIPO' ? found(luna, sol) : found(sol);
  };

  await render(<ChildAccess />);
  await search('equipo');
  await click(button('Sol'));
  await click(button('Cambiar de familia'));
  check(codeInput().value === '', 'El código anterior no se limpió.');
  check(fixture.querySelectorAll('.child-profile-card').length === 0, 'Quedaron perfiles de la familia anterior.');

  await search('otro');
  check(fixture.querySelectorAll('.child-profile-card').length === 1, 'No se reemplazó la lista anterior.');
  check(button('Sol').getAttribute('aria-pressed') === 'false', 'Se restauró una selección de la familia anterior.');
  check(!fixture.querySelector('[role="status"]'), 'Quedó el mensaje de selección anterior.');
});

test('Muestra avatares del catálogo y conserva el icono por defecto para los demás', async () => {
  globalThis.fetch = async () => found(
    luna,
    sol,
    { id: 'fixture-mar', nickname: 'Mar' },
    { id: 'fixture-luz', nickname: 'Luz', avatarId: 'https://example.invalid/imagen.png' }
  );
  await render(<ChildAccess />);
  await search('equipo');

  check(button('Luna').querySelector('.child-profile-avatar').textContent === '🐢', 'Falta el avatar local de tortuga.');
  for (const nickname of ['Sol', 'Mar', 'Luz']) {
    const avatar = button(nickname).querySelector('.child-profile-avatar');
    check(avatar.textContent === '🦸' && !avatar.querySelector('img'),
      'El avatar no reconocido debe usar el icono por defecto.');
  }
});
