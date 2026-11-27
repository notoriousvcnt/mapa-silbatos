# Silbato Sampler: demostración

Demostración del sampler de silbatos para la sección de instrumentos del catálogo
web de MAPA. El micrófono controla un sampler: al soplar se dispara la nota, se
sostiene en bucle y se libera al dejar de soplar.

## Requisitos

- Node.js
- Certificado HTTPS local en `cert/` (`192.168.1.100.pem` y `192.168.1.100-key.pem`).
  El servidor no arranca sin ellos. **[confirmar]**
- Archivos de audio en `web/media/audio/<id>/`. Están excluidos de git, por lo
  que hay que añadirlos a mano.

## Ejecución

```bash
npm install
npm start        # servidor HTTPS en el puerto 9000
```

Abrir `https://<IP-del-equipo>:9000`, hacer clic en la página para activar el
audio y aceptar el permiso de micrófono.

## Estructura

```
web/      Página (p5.js), runtime RNBO y patch exportado (export/)
rnbo/     Parches fuente en Max/RNBO
server.js Servidor Express (estáticos por HTTPS)
```

## Agregar un instrumento

En `web/sketch.js`:
1. Registrar los dos audios (grave y agudo) en `SAMPLES_<id>`.
2. Definir los puntos de inicio y fin del sustain, en ms, en `sustainLoopPoints`.

## Pendientes

- Subir puntos de sustain para cada archivo de audio (hoy solo está el instrumento 2961).
- Manejar el caso especial de 3104, que tiene un solo archivo de audio.
