
# Etapa 1: compilar React
FROM node:24-slim AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


# Etapa 2: preparar Express
FROM node:24-slim

ENV NODE_ENV=production

WORKDIR /app

# Instalar dependencias del backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copiar el backend
COPY backend/ ./backend/

# Incorporar React compilado
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

EXPOSE 3000

# Ejecutar el backend real
CMD ["node", "backend/src/server.js"]
