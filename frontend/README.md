# CiberHéroes – Frontend

Frontend independiente de React para CIB-26. Incluye la bienvenida y la selección de rol con el sistema visual aprobado. No implementa autenticación, registro, persistencia de perfiles ni llamadas de API.

## Requisitos
- Node.js 20 o superior (el backend del repositorio declara Node 24.x).
- npm.

## Desarrollo local
Desde la raíz del repositorio:
```bash
cd frontend
npm install
npm run dev
```
Abrir http://localhost:5173.

## Build de producción
```bash
cd frontend
npm run build
npm run preview
```
La vista previa se sirve en http://localhost:4173.

## Sistema visual
- Cian: `#00E5FF`
- Amarillo: `#FFD54F`
- Morado: `#7E57C2`
- Fondo/tinta: `#14072B`

Nunito y Baloo 2 se cargan desde Google Fonts, con fuentes del sistema como alternativa.

## Integración con Express
En desarrollo, Vite usa el puerto `5173` y Express conserva sus rutas actuales (`/` y `/health`). No se modifica el `package.json` de la raíz ni el arranque del backend. La integración en producción y las rutas de API deben acordarse con la persona que trabaja en Express antes de conectar datos o autenticación.

## Alcance intencional
La selección de rol solo informa qué espacio eligió la persona. No crea usuarios, no solicita contraseñas, no almacena datos ni simula una sesión real.
