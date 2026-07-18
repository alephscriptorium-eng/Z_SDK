# Regla de juegos de referencia

El engine se valida con **≥2 juegos de referencia independientes** que lo
consumen tal cual. Hoy esos juegos son **delta** y **pozo** (y la library
puede añadir más). Si una abstracción del engine solo sirve a un título, es
el ejemplo con disfraz.

- `engine/*` habla el **protocolo común**. Los nombres y conceptos de un
  juego concreto viven en el paquete de ese juego.
- Lo específico de un juego vive en su repo/paquete
  ([`Z_SDK-games-library`](https://github.com/alephscriptorium-eng/Z_SDK-games-library)).
- La documentación de engine muestra el kit genérico; los ejemplos de un
  título concreto van en la página de ese juego.
- Un cambio en engine deja verdes los tests de **todos** los juegos de
  referencia que lo consumen.

Ids de decisión y WPs relacionados: [estado del swarm](/guide/estado).

Ver [Games](/games/). Demos (desde el clone hermano):

```bash
cd ../Z_SDK-games-library
npm run demo:arg
npm run demo:pozo
```
