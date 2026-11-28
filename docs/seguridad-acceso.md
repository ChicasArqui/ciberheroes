# Protección del acceso del Guardián

## Política aplicada

| Operación | Criterio | Límite |
| --- | --- | --- |
| Login | Fallos por correo e IP | 5 por 15 minutos |
| Login | Solicitudes por IP | 30 por 15 minutos |
| Login | Fallos por correo entre todas las IP | Tras 10 en 15 minutos, requiere Turnstile |
| Registro | Solicitudes por IP | 20 por hora |
| Registro | Solicitudes por correo | 3 por hora |

Las ventanas empiezan con la primera solicitud. Un rechazo no prolonga la ventana.
Solo `INVALID_CREDENTIALS` conserva las reservas de fallo del login; las entradas
inválidas y los errores internos siguen sujetos al límite general de IP, pero no
consumen oportunidades de contraseña. Un acierto reinicia los fallos de correo e IP,
sin borrar los fallos acumulados desde otras direcciones ni la cuota de red.

Los límites por IP se comparten entre personas que salen a Internet por la misma
dirección pública. Estos valores son decisiones del equipo, no cifras impuestas por OWASP.
Se pueden ajustar en `AUTH_RATE_LIMITS`, dentro de `backend/src/modules/auth/auth-rate-limit.js`.

## Activar Turnstile en Dev

1. Crear una cuenta de Cloudflare y abrir **Turnstile** en su panel.
2. Añadir un widget para CiberHéroes Dev, de tipo **Managed**.
3. Autorizar el hostname `miapp-dev-0pav.onrender.com`, sin protocolo ni ruta.
   Para pruebas manuales locales, autorizar también `localhost` y `127.0.0.1`
   en el widget de desarrollo; usar otro widget para producción.
4. Copiar la **site key** (pública) y la **secret key** (privada).
5. Quien tenga acceso a Render debe abrir **miapp-dev → Environment → Edit** y añadir:

   ```text
   TURNSTILE_SITE_KEY=<site key del widget Dev>
   TURNSTILE_SECRET_KEY=<secret key del widget Dev>
   TURNSTILE_HOSTNAMES=miapp-dev-0pav.onrender.com
   ```

6. Guardar y aplicar las variables al despliegue que contenga esta implementación.
7. Para ejecutar manualmente en local, configurar las claves del widget Dev en
   `backend/.env` y `TURNSTILE_HOSTNAMES=localhost,127.0.0.1`.
   `.env.example` contiene únicamente los nombres de las variables.

No subir las claves privadas al repositorio ni incluirlas en capturas. La site key
se envía al navegador cuando se exige la comprobación. El registro de la cuenta
Cloudflare y las claves son configuración externa necesaria: tener el código no
activa automáticamente el servicio. El plan Free de Turnstile permite verificaciones
ilimitadas y no exige alojar la aplicación en Cloudflare.

## Validación y fallos

Antes de escuchar peticiones, el servidor espera la creación explícita de los
índices únicos de correo y código familiar, también con `autoIndex` desactivado.
Si un índice falla, no se aceptan registros. El login ejecuta `scrypt` una vez tanto
para un correo inexistente como para una contraseña incorrecta de una cuenta
existente; ambos casos responden `INVALID_CREDENTIALS`. Esto elimina la salida
rápida por cuenta inexistente, sin prometer tiempos de red idénticos.

Todas las respuestas de `/api/auth` y `/api/guardian`, incluidos sus errores,
llevan `Cache-Control: no-store`. Si el registro persiste cuenta y familia pero
falla la sesión automática, devuelve `201` con `sessionCreated: false`, descarta
la sesión incompleta y borra la cookie. La interfaz confirma que la cuenta existe
y permite ir al login, sin ofrecer repetir el registro.

El backend valida el token en Siteverify con un tiempo máximo de ocho segundos.
Exige el hostname configurado, la acción `guardian-login` y un contexto HMAC que
vincula el token al correo y la IP. Además reserva atómicamente el token en MongoDB
durante cinco minutos para impedir su reutilización entre instancias; la validación
del proveedor por sí sola tiene detección de reutilización eventualmente consistente.

Si falta configuración o falla el proveedor cuando la comprobación es necesaria,
la respuesta es `503 AUTH_SERVICE_UNAVAILABLE`. Un token inválido o vencido produce
`403 CHALLENGE_REQUIRED` y exige repetir la comprobación. Nunca se permite saltarla.
Los límites temporales responden `429 TOO_MANY_REQUESTS` con `Retry-After` en segundos.

Los contadores están en la misma base configurada por `MONGODB_URI`. El servidor
espera la creación de los índices TTL y únicos antes de escuchar. La biblioteca
comprueba el vencimiento incluso si MongoDB aún no ha borrado el documento.
Los identificadores usan HMAC con `SESSION_SECRET`; mantener esta clave entre
reinicios conserva la identificación de los contadores. Rotarla cambia dichas claves
y también invalida las cookies firmadas anteriormente.

## Comprobaciones antes de aceptar en Dev

- Confirmar que `/health` identifica el commit que contiene estos cambios y MongoDB conectado.
- Probar registro, login, recuperación de sesión y logout con cuentas ficticias.
- Comprobar cookie `HttpOnly`, `Secure` y `SameSite=Lax` mediante HTTPS.
- Render añade automáticamente `RENDER=true`. En ese entorno público, los límites
  y Turnstile usan `CF-Connecting-IP`, que Cloudflare establece para el visitante.
  Si falta o no es una IP válida, la autenticación responde 503. Fuera de Render
  se usa `req.ip` y se ignora ese encabezado. No establecer `RENDER=true` en un
  servidor que se pueda alcanzar directamente sin ese ingreso de confianza.
- `trust proxy: 1` se conserva para el protocolo HTTPS; el contador de intentos
  no depende de que ese número represente todos los proxies de Render.
  Verificar en Dev que el sexto fallo de un correo desde una misma red devuelve
  429, incluso si se envían distintos valores de `X-Forwarded-For`.
- Tras diez fallos de un correo desde distintas IP, comprobar Turnstile real:
  solución válida, vencimiento y nuevo intento después de una contraseña incorrecta.
- Registrar resultados y límites sin capturar cookies, tokens, contraseñas o URI privadas.

`npm run test:mongo` usa exclusivamente MongoDB local y una base de pruebas. Las
pruebas de Turnstile simulan Siteverify y el SDK del navegador; no requieren claves,
no contactan el proveedor y no sustituyen la comprobación del widget real en Dev.

Esta implementación conserva el contrato actual de registro. No añade verificación
del correo ni MFA. El control de intentos y Turnstile no prueban la propiedad del correo.

## Referencias

- [OWASP: Login Throttling](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#login-throttling)
- [Cloudflare: planes](https://developers.cloudflare.com/turnstile/plans/)
- [Cloudflare: validación del token](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Express: proxies](https://expressjs.com/en/guide/behind-proxies/)
- [Render: encabezado del visitante en servicios públicos](https://render.com/articles/host-pocketbase-on-render)
