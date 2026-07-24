# Consumidor TS desde registry (WP-U158)

Plantilla de un proyecto **fuera** del monorepo que instala `@zeus/*`
**desde el registry real** (`https://npm.scriptorium.escrivivir.co`) y
compila TypeScript con `tsc --noEmit` (strict, sin `any` de escape).

Cubre:

- `@zeus/protocol` (+ subpath tipado `peer-card-seat`)
- `@zeus/rooms`
- `@zeus/webrtc-signaling/messages` (subpath tipado)

El smoke U54/U161 (`npm run smoke:external-consumer`) sigue usando
tarballs — convive; no lo reemplaza.

```bash
# Desde la raíz del monorepo:
npm run smoke:ts-registry
```

Si el registry no responde, el smoke sale **0** con skip `⏳` (patrón U122).
