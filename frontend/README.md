# CiberHéroes – Frontend

Frontend de React para CIB-26. Incluye la bienvenida y la selección de rol con el sistema visual aprobado. No implementa autenticación, registro ni persistencia de perfiles; consulta `/health` para mostrar el estado de Express y MongoDB.

## Requisitos
- Node.js 24.x y npm, igual que el backend y la raíz del repositorio.
- npm.

## Desarrollo local
Desde la raíz del repositorio, inicia Express en una terminal:

```bash
npm run dev --prefix backend
```

En otra terminal, inicia Vite:

```bash
npm run dev --prefix frontend
```

Abre <http://localhost:5173>. Vite reenvía `/health` y `/api` al backend local en el puerto `3000`.

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
En desarrollo, Vite usa el puerto `5173` y reenvía `/health` y `/api` a Express en el puerto `3000`. En producción, Express sirve el build de React y ambos usan el mismo origen. El cliente valida la respuesta de `/health` y muestra por separado el estado de la API y de MongoDB.

## Alcance intencional
La selección de rol solo informa qué espacio eligió la persona. No crea usuarios, no solicita contraseñas, no almacena datos ni simula una sesión real.
