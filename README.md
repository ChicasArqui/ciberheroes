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
- Configuración de MongoDB, según el entorno utilizado.

### 2. Clonar el repositorio

```bash
git clone https://github.com/ChicasArqui/ciberheroes.git
cd ciberheroes
```

### 3. Instalar y compilar desde la raíz

```bash
npm ci
npm ci --prefix backend
npm ci --prefix frontend
npm run build --prefix frontend
```

### 4. Iniciar y verificar

Usa Node.js 24. Si dispones de MongoDB, configura `MONGODB_URI` como variable de entorno.
La interfaz y las lecciones en memoria también se pueden comprobar con MongoDB desconectado.

```bash
npm start
```

Abre http://localhost:3000 y selecciona un rol. Desde otra terminal, comprueba
la interfaz, su recurso JavaScript y los endpoints `/health` y `/api/lecciones`.

```bash
node scripts/verify-deployment.cjs http://localhost:3000
npm run lint
npm run lint --prefix frontend
npm run test:coverage
```

Para probar la imagen que usa Render, detén el servidor local y ejecuta:

```bash
docker build -t ciberheroes:local .
docker run --rm -e PORT=10000 -p 127.0.0.1:3000:10000 ciberheroes:local
```

Repite la comprobación HTTP desde otra terminal.


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