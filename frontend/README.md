# CiberHéroes – Frontend

Frontend de React con bienvenida, selección de rol y registro e inicio/cierre de sesión del Guardián. Consulta `/health` para mostrar el estado de Express y MongoDB y recupera la sesión existente al abrir las pantallas del Guardián.

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
El acceso del Guardián utiliza la API y su cookie de sesión para mostrar el código familiar privado. El acceso de CiberHéroe se integrará en una tarea posterior.

## Pruebas del frontend

Desde la raíz del repositorio:

```bash
npm ci --prefix frontend
npm test --prefix frontend
```

Las pruebas comprueban la recuperación de sesión al recargar, registro, inicio/cierre de sesión, errores de servicio y copia del código familiar. Usan respuestas de API ficticias y no necesitan MongoDB. GitHub Actions las ejecuta junto con las pruebas del backend.
