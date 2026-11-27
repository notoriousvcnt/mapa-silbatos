# SilbatoExpo

Instalación interactiva de la exposición "Tecnologías para tocar lo invisible"
(MAPA, enero–mayo 2025). El visitante sopla un silbato y mueve un celular; el
sistema responde con sonido y envía datos a TouchDesigner.

## Arquitectura

```
Celular (app p5.js: micrófono, cámara, sacudida, giroscopio)
   │  HTTPS / WebSocket (8080)
   ▼
Servidor Node (app_p5.js/server.js, puente OSC)
   │  UDP 9129
   ▼
Max/RNBO ──► TouchDesigner
```

## Requisitos

- Node.js y Max (para `maxServer.js` y los parches). **[confirmar]**
- Certificados HTTPS locales en `app_p5.js/cert/` (`localhost+2.pem` y
  `localhost+2-key.pem`). **[confirmar]**
- Celular y servidor en la misma red.

## Ejecución

```bash
cd app_p5.js
npm install
npm start        # web en el puerto 9000, puente OSC en el 8080
```

- Dentro de Max, se usa `maxServer.js` (mismo servidor, con `max-api`) a través
  de `maxServer.maxpat`.
- En `app_p5.js/public/sketch.js`, `IPaddress` debe apuntar a la máquina que
  ejecuta el servidor.

## Mensajes OSC enviados por la app

| Dirección | Contenido |
|---|---|
| `/camera` | Promedio de luz de una región de la cámara |
| `/note` | Estado note on/off del silbato (0/1) |
| `/shake` | Sacudida del celular |
| `/moved` | Movimiento del celular |
| `/gyro` | Rotación (x, y, z) |

## Parámetros principales (RNBO)

| Parámetro | Función |
|---|---|
| `micGain` | Ganancia de entrada del micrófono (dB) |
| `cutoffFreq` | Suavizado de la envolvente (Hz): menor valor, respuesta más lenta |
| `lowThresh` / `hiThresh` | Umbrales inferior y superior para detectar el soplido |

## Estructura

```
app_p5.js/   App web (public/), servidor y parches de Max
rnbo/        Parches fuente en Max/RNBO
```
