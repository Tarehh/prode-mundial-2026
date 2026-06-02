# Prode Mundial 2026

Aplicacion web estatica para organizar un prode del Mundial 2026 usando el modo oficial:
solo se pronostican los partidos desbloqueados por el organizador.

## Reglas implementadas

- Marcador exacto: 5 puntos.
- Empate correcto no exacto: 4 puntos.
- Diferencia de gol + ganador: 4 puntos.
- Solo ganador: 3 puntos.
- Errado: 0 puntos.
- Eliminacion: ganador final correcto suma 1 punto extra; ganador final incorrecto resta 1 punto.

## Uso local

La app ahora usa un backend minimo en Node para manejar login por PIN, bloqueo de
pronosticos y resultados finales.

```powershell
cd C:\apps\codex\prode-mundial-2026
node server.js
```

Luego entrar a `http://localhost:4174`.

Para validar cambios:

```powershell
npm run check
```

Si no tenes `npm` en el PATH, tambien sirve correr:

```powershell
node --check app.js
node --check server.js
node --test
```

Credenciales iniciales:

- Jugador demo: `Demo`
- PIN demo: `123456`
- Codigo admin por defecto: `admin2026`

Para produccion, definir un codigo admin propio:

```powershell
$env:ADMIN_CODE="cambiar-este-codigo"
node server.js
```

Tambien podes crear un archivo local `config.local.json` en la raiz del proyecto. Ese
archivo no se sube a Git.

```json
{
  "ADMIN_CODE": "cambiar-este-codigo"
}
```

Tambien se soporta `.env`:

```text
ADMIN_CODE=cambiar-este-codigo
```

## Fixture y resultados

El fixture de fase de grupos esta cargado localmente con fecha, hora y sede. Los resultados
oficiales se cargan manualmente desde Admin y quedan bloqueados al marcar el partido como final.

## Deploy con Docker

```powershell
docker build -t prode-mundial-2026 .
docker run --rm -p 8080:80 `
  -e ADMIN_CODE="cambiar-este-codigo" `
  -v ${PWD}\data:/app/data `
  prode-mundial-2026
```

## Persistencia

Los datos se guardan en `data/store.json` del lado servidor. Para produccion conviene montar
esa carpeta como volumen o migrarla a PostgreSQL.
