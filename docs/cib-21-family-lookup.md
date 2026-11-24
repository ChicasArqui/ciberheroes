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

## Backend provisional

Express monta la ruta, pero el arranque habitual no registra un repositorio
real. Para códigos válidos devuelve HTTP 503 con
`FAMILY_LOOKUP_UNAVAILABLE`. Las respuestas de éxito solo se producen cuando
se inyecta un repositorio; las pruebas usan dobles de prueba.

El repositorio implementa `findProfilesByFamilyCode(code)` y devuelve un
arreglo con los perfiles elegibles de esa familia, o `null` si no existe.
Un arreglo vacío significa que existe, pero no tiene perfiles elegibles. La
ruta proyecta únicamente `id`, `nickname` y, si es texto, `avatar`. El
repositorio futuro también debe consultar solo los campos necesarios.

Como política provisional, la ruta acepta JSON de hasta 1 KiB y un código de
1 a 64 caracteres ASCII alfanuméricos, guiones o guiones bajos después de
recortar espacios. Pasa el código en mayúsculas al repositorio. Responde 400
para entrada inválida, 413 para un cuerpo demasiado grande, 404 con
`FAMILY_NOT_FOUND` para una familia inexistente, y 500 con
`FAMILY_LOOKUP_FAILED` si falla el repositorio. Los errores usan códigos fijos
y la ruta envía `Cache-Control: no-store`.

Antes de activar datos reales:

- CIB-19 debe confirmar formato, entropía, unicidad, normalización, vigencia y
  tratamiento de códigos deshabilitados. Una respuesta distinta para familias
  inexistentes, vacías y con perfiles permite inferir su existencia.
- CIB-20 debe confirmar el vínculo familia-perfil, qué perfiles se consideran
  elegibles y el formato de ID, apodo y avatar. La selección no autentica al
  menor y la verificación del PIN corresponde a CIB-22.
- Aplicar límites de intentos compartidos entre instancias, por origen y con
  un presupuesto global. Acordar cuotas y ventanas con el equipo, devolver
  429 con un mensaje uniforme y `Retry-After`, y considerar intentos
  distribuidos. Solo usar la IP reenviada desde proxies de confianza. Evitar
  guardar códigos en claro o apodos en logs o métricas. Acordar qué estados se
  pueden distinguir después de aplicar estos controles.
