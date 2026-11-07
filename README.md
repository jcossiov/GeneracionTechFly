# SkyStrike 3D

Juego de avión arcade en 3D low-poly (HTML5 + Three.js). Esquiva obstáculos y destruye a los enemigos que bloquean tu ruta. Un jugador, con modos Arcade infinito y Niveles con jefes.

## Ejecutar en local (recomendado para máxima fluidez)

Requisitos: Python 3 o Node.js.

### Windows
Doble clic en `start.bat` o ejecuta:
```
python -m http.server 8080
```
Luego abre http://localhost:8080

### macOS / Linux
```
./start.sh
```
o `python3 -m http.server 8080`.

> Nota: por usar módulos ES, no abras `index.html` directamente con `file://`. Usa el servidor local.

## Controles
- `WASD` / flechas — mover
- `Espacio` o clic — disparar
- `Shift` — boost
- `Esc` / `P` — pausar
- Ratón: arrastrar para mover, clic para disparar
- Gamepad: stick izquierdo mover, RT/A disparar, RB boost
- Táctil: joystick virtual + botón FUEGO

## Jugar en la nube
El juego es 100% estático. Súbelo a cualquier hosting estático:
- Netlify: arrastra la carpeta del proyecto
- Vercel: `vercel` en la carpeta
- GitHub Pages: sube el repo y activa Pages
- Cloudflare Pages

Funciona offline gracias al Service Worker (PWA): se puede instalar como app desde el navegador.

## Exportar a APK (Android)
Requisitos: Node.js, Android Studio.

```
npm install
npx cap add android
npx cap sync android
npx cap open android
```
Luego compila desde Android Studio (Build > Build APK). El `webDir` apunta a la raíz del proyecto.

## Estructura
- `index.html` — UI y overlays
- `src/` — código del juego (ES modules)
- `manifest.json` — PWA
- `service-worker.js` — caché offline
- `capacitor.config.json` — config APK

## Presupuesto cero
Sin dependencias de pago. Three.js se carga desde CDN (con caché offline). Audio generado proceduralmente con Web Audio API. Sin backend obligatorio.
