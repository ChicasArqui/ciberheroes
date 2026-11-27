# CIB-27 · Prueba de persistencia

Desde la raíz del worktree, instala las dependencias del backend con
`npm ci --prefix backend` si aún faltan. Usa PowerShell y una URI de desarrollo
cuya ruta sea `/ciberheroes_dev` antes del `?`, si hay parámetros. Conserva los
parámetros de conexión que ya funcionan, incluido `authSource` si está presente.

La prueba comprueba la base seleccionada, escribe y lee un documento en una
colección de nombre único y verifica que el documento se haya eliminado. La
colección vacía puede permanecer. Ejecuta el bloque cuando quieras realizar
la prueba real en Atlas.

### Ejecución desde PowerShell

Usa `$false` para conservar la configuración DNS habitual. Si las consultas
SRV o TXT de Node fallan en Windows, cambia `$usarDnsPublicoCib27` a `$true`
para usar temporalmente `1.1.1.1` y `8.8.8.8` en este proceso de Node.
La configuración de Windows permanece igual.

~~~powershell
$usarDnsPublicoCib27 = $false
$opcionesNodeCib27 = @()
if ($usarDnsPublicoCib27) {
    $precargaCib27 = 'data:text/javascript,import%20dns%20from%20%22node%3Adns%22%3Bdns.setServers(%5B%221.1.1.1%22%2C%228.8.8.8%22%5D)%3B'
    $opcionesNodeCib27 = @('--import', $precargaCib27)
}

$uriAnteriorCib27 = $env:MONGODB_URI
try {
    $uriOcultaCib27 = Read-Host 'URI de Atlas para ciberheroes_dev' -AsSecureString
    $env:MONGODB_URI = [System.Net.NetworkCredential]::new('', $uriOcultaCib27).Password
    node @opcionesNodeCib27 .\backend\scripts\check-persistence.js --execute
    Write-Host "Código de salida CIB-27 $LASTEXITCODE"
} finally {
    $env:MONGODB_URI = $uriAnteriorCib27
    Remove-Variable uriAnteriorCib27, uriOcultaCib27 -ErrorAction SilentlyContinue
}
~~~

El resultado esperado es «Escritura, lectura y limpieza verificadas» y código
de salida `0`. Si aparece «base inesperada», verifica que la ruta de la URI
seleccione `ciberheroes_dev`.

Las pruebas automatizadas de CIB-27 usan operaciones simuladas. Para ejecutarlas
desde la raíz, usa `npm test -- --runInBand backend/tests/persistence-check.test.js`.
