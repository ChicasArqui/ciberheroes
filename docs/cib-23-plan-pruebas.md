
# CIB-23 — Plan de pruebas de integración y seguridad

## Objetivo

Verificar que los flujos de registro, autenticación, gestión de familias y perfiles de CiberHéroes funcionen correctamente y protejan la información de los usuarios.

## Alcance

- Registro de Guardianes.
- Inicio y cierre de sesión.
- Gestión de familias.
- Acceso a perfiles infantiles.
- Validación de entradas.
- Control de acceso por usuario, familia y rol.
- Manejo seguro de errores.
- Integración entre frontend, backend y base de datos.

## Casos de prueba

| ID | Escenario | Resultado esperado |
|---|---|---|
| TC-01 | Registrar un Guardián con datos válidos | Registro exitoso y creación de familia |
| TC-02 | Registrar un correo duplicado | Solicitud rechazada sin duplicar usuarios |
| TC-03 | Iniciar sesión con credenciales válidas | Sesión iniciada correctamente |
| TC-04 | Iniciar sesión con contraseña incorrecta | Acceso denegado |
| TC-05 | Consultar un recurso protegido sin sesión | Acceso denegado |
| TC-06 | Acceder a información de otra familia | Acceso denegado sin revelar datos |
| TC-07 | Modificar un perfil de otra familia | Operación rechazada |
| TC-08 | Cerrar sesión y reutilizar la sesión anterior | Sesión invalidada |
| TC-09 | Enviar datos inválidos o incompletos | Error controlado de validación |
| TC-10 | Superar el límite de intentos de acceso | Se aplica la protección acordada |
| TC-11 | Desconectar la base de datos durante una operación | Error controlado sin exponer secretos |
| TC-12 | Recargar la aplicación después de guardar datos | Persistencia correcta en MongoDB |


## Pruebas de seguridad del PIN temporal

| ID | Endpoint | Escenario | Resultado esperado |
|---|---|---|---|
| PIN-01 | POST /api/child/pin/verify | PIN temporal correcto | Autoriza únicamente el cambio obligatorio |
| PIN-02 | POST /api/child/pin/verify | PIN incorrecto | Rechaza el acceso |
| PIN-03 | PATCH /api/child/me/profile | Intentar modificar perfil sin cambiar el PIN temporal | Acceso denegado |
| PIN-04 | POST /api/child/pin/change | Nuevo PIN inválido | Rechaza el cambio |
| PIN-05 | POST /api/child/pin/change | Nuevo PIN igual al temporal | Rechaza el cambio |
| PIN-06 | POST /api/child/pin/change | Cambio válido de PIN | Actualiza el hash y habilita la sesión infantil normal |
| PIN-07 | POST /api/child/pin/verify | Reutilizar el PIN temporal anterior | Rechaza la autenticación |
| PIN-08 | GET /api/guardian/profiles | Consultar perfiles desde la cuenta del Guardián | No revela PIN definitivo ni hashes |

## Controles de autorización

- El Guardián solo puede acceder a su familia.
- Un Guardián no puede modificar perfiles de otra familia.
- Un CiberHéroe no puede modificar perfiles ajenos.
- La autorización temporal del PIN solo permite cambiarlo.
- Las operaciones protegidas requieren una sesión válida.
- Las credenciales y los hashes no deben exponerse.

## Endpoints considerados

Los siguientes endpoints fueron propuestos por el equipo y están pendientes de confirmar como contrato definitivo:

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/guardian/family
- GET /api/guardian/profiles
- POST /api/guardian/profiles
- POST /api/child/family/lookup
- POST /api/child/pin/verify
- POST /api/child/pin/change
- PATCH /api/child/me/profile

## Pruebas automatizadas y pendientes

Jest y Supertest prueban la aplicación Express usada por el servidor
de producción. Estas comprobaciones funcionan sin una conexión a MongoDB.

| Comprobación | Resultado esperado | Archivo |
| --- | --- | --- |
| Ruta web inexistente | HTTP 404 sin patrones de trazas internas. Se amplió la prueba existente. | `backend/tests/health.test.js` |
| Ruta API inexistente | HTTP 404 y cuerpo JSON con solo el mensaje público. Se amplió la prueba existente. | `tests/test_app.js` |
| JSON malformado al responder una lección | HTTP 400 y cuerpo JSON con solo el mensaje público, sin el contenido enviado ni detalles del parser. Cubre parte de TC-09. | `tests/test_app.js` |

El SHA revisado, 5186437, pasó 21 pruebas Jest en 3 suites. También superó el
umbral de cobertura del 85 % y pasó ESLint de raíz y frontend, la compilación
de React y el smoke test de Docker.
[Corrida de GitHub Actions](https://github.com/ChicasArqui/ciberheroes/actions/runs/45080696555)

Las 21 pruebas corresponden a la ejecución completa. Este PR amplía dos casos
404 y agrega un caso 400. Los 20 escenarios del plan incluyen comprobaciones
que aún no se han automatizado.

### Pendiente de automatizar

- TC-01 a TC-08 y TC-10. Registro, autenticación, invalidación de sesión, aislamiento entre familias y perfiles, y limitación de intentos.
- Resto de TC-09. Validación de entradas de los módulos de acceso cuando sus contratos estén acordados.
- TC-11 y TC-12. Fallos de conexión y persistencia con MongoDB.
- PIN-01 a PIN-08. Autorización temporal, cambio de PIN y protección de credenciales y hashes.
- Integración completa de React, Express y MongoDB con los módulos del equipo.
- Completar la revisión cruzada de los escenarios pendientes cuando estén disponibles las APIs.


Dependencias:
- CIB-19 aporta el registro del Guardián, la familia y la autenticación.
- CIB-20 aporta la gestión y el listado de perfiles para probar el aislamiento
  entre familias y la exclusión de PIN y hashes.
- CIB-21 aporta la búsqueda familiar y el contexto de selección del perfil.
- CIB-22 aporta la verificación y el cambio del PIN temporal, y la autorización
  asociada a ese flujo.
- CIB-27 aporta la conexión a MongoDB y una prueba independiente de
  persistencia. TC-11 y TC-12 requieren verificar las operaciones integradas.
- CIB-28: contrato de API.
- CIB-29: integración MERN y CI. La actualización de body-parser 1.20.8 del lockfile raíz se coordina en el PR #15 como corrección compartida con main.

La ejecución DAST en Dev corresponde a CIB-24.


## Herramientas previstas

- Jest: pruebas automatizadas.
- Supertest: pruebas de endpoints HTTP.
- MongoDB: verificación de persistencia.
- GitHub Actions: ejecución de pruebas en CI.

## Criterios de aceptación pendientes de verificar

- Los flujos válidos funcionan según los contratos acordados.
- Los intentos de acceso no autorizado son rechazados.
- No se exponen contraseñas, tokens ni información sensible.
- Los errores son controlados.
- Ejecutar las pruebas automatizadas de acceso, sesión y PIN cuando se integren las APIs.
- Documentar los resultados de los escenarios pendientes con evidencia.


## Estado

Estado: Avance parcial de CIB-23. Este PR deja pendiente el cierre de la tarea. Se elaboró el plan de pruebas, se documentaron 20 escenarios de integración y seguridad y se automatizaron comprobaciones de errores HTTP 404 y 400. Las pruebas integradas de autenticación, autorización y PIN temporal están pendientes de la integración de los módulos del equipo.
