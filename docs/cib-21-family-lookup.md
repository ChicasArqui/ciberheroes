# CIB-21 · Búsqueda familiar

El frontend envía `POST /api/child/family/lookup` al mismo origen con un cuerpo
JSON `{ "familyCode": "EQUIPO" }`. Estos formatos se usan para desarrollar y
probar la interfaz y quedan pendientes de confirmación con el equipo de backend.

| Caso | Interpretación provisional del cliente |
| --- | --- |
| Familia con perfiles | HTTP 2xx con `{ "profiles": [{ "id": "kid-1", "nickname": "Luna", "avatar": "⭐" }] }`. El ID debe ser una cadena no vacía o un entero seguro y ser único. El apodo debe ser una cadena no vacía. El avatar es texto opcional. |
| Familia sin perfiles | HTTP 2xx con `{ "profiles": [] }`. |
| Código inexistente | Propuesta: HTTP 404 con `{ "code": "FAMILY_NOT_FOUND" }`. Un 404 genérico de Express también aparece cuando la ruta falta, así que no se interpreta como familia inexistente. |
| Error del servicio | HTTP 5xx u otro estado de error sin significado acordado para CIB-21. |
| Error de conexión | Fallo de la petición o interrupción al leer el cuerpo. |
| Respuesta malformada | JSON ilegible en una respuesta de búsqueda o estructura de perfiles inválida. Si falla un perfil, se rechaza la lista completa. |

Confirmar con backend los estados HTTP exactos, el discriminador de familia
inexistente, el formato y la normalización del código familiar, los tipos de ID
y avatar, y si se necesita distinguir otros estados, como HTTP 400 o 429.
Los datos del ejemplo son ficticios.

Para ejecutar las pruebas con respuestas simuladas:

```bash
npm --prefix frontend test
```
