<div align="center">

![CiberHéroes](https://capsule-render.vercel.app/api?type=waving&color=0:4C1D95,50:7C3AED,100:C4B5FD&height=220&section=header&text=CiberH%C3%A9roes&fontSize=55&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Aprende%20%7C%20Juega%20%7C%20Prot%C3%A9gete&descAlignY=60&descSize=19)

### 🛡️ Pequeños héroes, grandes decisiones digitales

**Una aventura interactiva para aprender a navegar con seguridad.**

![Estado](https://img.shields.io/badge/Estado-En%20desarrollo-8B5CF6?style=for-the-badge)
![Tipo](https://img.shields.io/badge/Proyecto-Académico-6D28D9?style=for-the-badge)
![Plataforma](https://img.shields.io/badge/Plataforma-Web-A78BFA?style=for-the-badge)

</div>

---

## Sobre CiberHéroes

**CiberHéroes** es un proyecto académico de desarrollo web que propone una plataforma educativa gamificada, diseñada para enseñar a niños y niñas a reconocer riesgos en internet y desarrollar hábitos de navegación seguros.

A través de juegos, historias, desafíos y recompensas, buscamos convertir el aprendizaje sobre ciberseguridad en una experiencia divertida, accesible y significativa.

>  **Aprender a protegerse en internet también puede ser una aventura.**
##  Contexto y problemática

Actualmente, los niños y niñas interactúan con plataformas digitales desde edades tempranas. Aunque internet ofrece oportunidades educativas y sociales, también puede exponerlos a riesgos como el **grooming, la manipulación en línea y la divulgación de información personal**.

La falta de conocimientos sobre estas amenazas puede dificultar que identifiquen situaciones peligrosas o sepan cómo actuar.

Frente a esta problemática, CiberHéroes propone una alternativa educativa basada en el juego, la prevención y el desarrollo de habilidades digitales.

## Nuestro objetivo

Desarrollar una plataforma web educativa que fortalezca los conocimientos de seguridad digital infantil mediante actividades interactivas y experiencias de aprendizaje gamificadas.

### Objetivos específicos

- Enseñar a identificar comportamientos sospechosos en internet.
- Promover la protección de datos personales y la privacidad.
- Fomentar la comunicación con adultos de confianza.
- Reforzar el aprendizaje mediante niveles, retos y recompensas.

## Aprende jugando

La plataforma propone una experiencia de aprendizaje progresiva, organizada en **4 módulos educativos con 5 niveles cada uno**.

<div align="center">

| 📚 Aprende | 🎯 Supera desafíos |
|:---:|:---:|
| Descubre conceptos de seguridad digital. | Resuelve situaciones y toma decisiones. |
| **🏆 Gana recompensas** | **🛡️ Conviértete en héroe** |
| Acumula puntos por tus avances. | Aplica lo aprendido para navegar con seguridad. |

</div>

Cada nivel busca desarrollar habilidades que permitan reconocer riesgos y responder de manera responsable ante situaciones digitales.

> 🔐 **Un verdadero CiberHéroe aprende, piensa antes de actuar y sabe cuándo pedir ayuda.**
## Stack tecnológico

CiberHéroes se desarrolla utilizando tecnologías del ecosistema JavaScript y una arquitectura web con frontend y backend.

<div align="center">

### Frontend

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

### Backend y base de datos

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-404D59?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

### Herramientas de desarrollo

![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![VS Code](https://img.shields.io/badge/VS_Code-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white)

</div>

## Instalación y ejecución local

### 1. Requisitos

- Node.js 24 y npm.
- Git.
- Un editor de código, como Visual Studio Code.
- MongoDB para verificar la conexión completa; la interfaz y las lecciones en memoria también funcionan si no está conectado.
- Docker (opcional, para probar la imagen de producción).

### 2. Clonar el repositorio

```bash
git clone https://github.com/ChicasArqui/ciberheroes.git
cd ciberheroes
```

### 3. Instalar dependencias y configurar entorno

Instala las dependencias de la raíz, del backend y del frontend:

```bash
npm ci
npm ci --prefix backend
npm ci --prefix frontend
```

Para conectar MongoDB en local, crea `backend/.env` tomando como base `backend/.env.example` (define `PORT=3000` y `MONGODB_URI=mongodb://127.0.0.1:27017/ciberheroes`). El backend carga este archivo tanto al iniciarlo desde la raíz como desde `backend/`. No agregues `.env` al repositorio.

### 4. Build y ejecución en local

#### Opción A: Modo integrado (backend sirviendo el build de React)

Compila el frontend y levanta el servidor Express desde la raíz:

```bash
npm run build --prefix frontend
npm start
```

También puedes iniciar el backend directamente desde su carpeta con `npm start --prefix backend`. Luego abre <http://localhost:3000>.

#### Opción B: Modo desarrollo separado (frontend + backend)

En una terminal inicia el backend con recarga automática:

```bash
npm run dev --prefix backend
```

En otra terminal inicia el servidor de desarrollo de Vite para el frontend:

```bash
npm run dev --prefix frontend
```

Vite muestra el estado de la API y MongoDB en el pie de página. Las rutas `/health` y `/api` se reenvían al backend en `http://127.0.0.1:3000`.

### 5. Build y ejecución con Docker

Para construir y ejecutar la imagen Docker (la misma que se valida en CI y despliega en Render):

```bash
docker build -t ciberheroes:local .
docker run --rm -e PORT=10000 -p 127.0.0.1:3000:10000 ciberheroes:local
```

### 6. Tests, cobertura, linting y verificación

Ejecuta los tests completos (raíz + backend) exigiendo el umbral mínimo de cobertura del 85%:

```bash
npm run test:coverage
```

Para ejecutar únicamente los tests del backend:

```bash
npm test --prefix backend
```

Para ejecutar el análisis de estilo y seguridad (ESLint / SAST) y la auditoría de dependencias:

```bash
npm run lint
npm run lint --prefix frontend
npm audit --omit=dev --audit-level=high
npm audit --prefix backend --omit=dev --audit-level=high
npm audit --prefix frontend --omit=dev --audit-level=high
```

Con el servidor local o el contenedor Docker levantado en el puerto `3000`, puedes verificar los endpoints `/`, `/health`, `/api/lecciones` y los assets compilados desde otra terminal:

```bash
node scripts/verify-deployment.cjs http://localhost:3000
```

Para exigir que MongoDB también esté conectado (como en Dev), agrega `--require-database`:

```bash
node scripts/verify-deployment.cjs http://localhost:3000 --require-database
```

### 7. Despliegues

El workflow despliega a Dev automáticamente después de las comprobaciones en `main` y falla si el smoke test no confirma que MongoDB está conectado. Prod solo se puede solicitar manualmente desde Actions en `main`; el job utiliza el Environment `production`.

En Render Dev, configura `MONGODB_URI` como variable privada del servicio y permite la conexión desde Atlas. Render asigna `PORT`; no agregues credenciales ni URI al repositorio ni a los logs.

Para exigir aprobación antes de que se ejecute el job, una persona administradora debe configurar en GitHub **Settings → Environments → production → Required reviewers** y guardar `RENDER_PROD_HOOK` como secreto de ese Environment (no como secreto general del repositorio). La protección del Environment es una configuración de GitHub y debe verificarse allí; el archivo del workflow por sí solo no puede imponerla.


## Seguridad y enfoque educativo

CiberHéroes busca promover una experiencia de aprendizaje responsable, considerando la protección de los menores como un principio fundamental.

El contenido educativo está orientado a fortalecer la prevención, la privacidad, la toma de decisiones seguras y la búsqueda de ayuda ante situaciones de riesgo.


## Equipo de desarrollo

<div align="center">

**Desarrollado por un equipo de estudiantes comprometidas con la educación y la seguridad digital.**

[@edith-hu](https://github.com/edith-hu) ·
[@hexdii](https://github.com/hexdii) ·
[@PengwinKingdom](https://github.com/PengwinKingdom) ·
[@Stephlyy](https://github.com/Stephlyy)

</div>

---

<div align="center">

### 💜 Formando pequeños héroes digitales

**Porque cada niño merece explorar internet con conocimiento, confianza y seguridad.**

*CiberHéroes*

![Footer](https://capsule-render.vercel.app/api?type=waving&color=0:C4B5FD,50:7C3AED,100:4C1D95&height=110&section=footer)

</div>