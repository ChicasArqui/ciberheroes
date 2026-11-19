
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

## Herramientas previstas

- Jest: pruebas automatizadas.
- Supertest: pruebas de endpoints HTTP.
- MongoDB: verificación de persistencia.
- GitHub Actions: ejecución de pruebas en CI.

## Criterios de aceptación

- Los flujos válidos funcionan según los contratos acordados.
- Los intentos de acceso no autorizado son rechazados.
- No se exponen contraseñas, tokens ni información sensible.
- Los errores son controlados.
- Las pruebas automatizadas se ejecutan correctamente.
- Los resultados quedan documentados con evidencia.

## Dependencias

La implementación de las pruebas depende de que estén disponibles los módulos de autenticación, familias y perfiles desarrollados por el equipo.

Los endpoints, códigos HTTP específicos y mecanismos de sesión se confirmarán al integrar las funcionalidades.

## Estado

Planificación inicial. Casos pendientes de ejecución y validación.
