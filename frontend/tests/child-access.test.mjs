import { after } from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

const dom = new JSDOM('<div id="fixture"></div>', { url: 'http://localhost/' });
const browserGlobals = {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  IS_REACT_ACT_ENVIRONMENT: true
};

const previousGlobals = new Map();
for (const [name, value] of Object.entries(browserGlobals)) {
  previousGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
}

let vite;
after(async () => {
  try {
    await vite?.close();
  } finally {
    dom.window.close();
    for (const [name, previous] of previousGlobals) {
      if (previous) Object.defineProperty(globalThis, name, previous);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});

// Use the existing React/Vite transforms for JSX, styles and image imports.
vite = await createServer({
  root: fileURLToPath(new URL('../', import.meta.url)),
  server: { middlewareMode: true, hmr: false, watch: null }
});
await vite.ssrLoadModule('/tests/child-access.jsx');
