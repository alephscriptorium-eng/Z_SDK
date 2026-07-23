# Consumidor externo mínimo (WP-U54 · endurecido WP-U161)

Plantilla de un proyecto **fuera** del monorepo que instala `@zeus/protocol`,
`@zeus/rooms` y `@zeus/socket-core` desde tarballs (`npm pack` / `file:`) —
no exige registry live. El `.npmrc` del consumidor solo enruta **`@zeus`**
(sin scope `@alephscript`).

```bash
# Desde la raíz del monorepo:
npm run smoke:external-consumer
```

El orquestador:

1. Empaqueta `socket-core` + `protocol` + `rooms`
2. Crea un directorio limpio bajo el temp del SO (fuera del workspace)
3. Escribe `.npmrc` solo-`@zeus` e instala los tarballs
4. Levanta `socket-server` en un puerto aislado vía env
5. Corre el consumidor con **Node** y **Bun**

No setea `ZEUS_OPEN_BROWSER` (opt-in).

## Manual (equivalente)

```bash
npm pack -w @zeus/socket-core -w @zeus/protocol -w @zeus/rooms \
  --pack-destination /tmp/zeus-packs
mkdir /tmp/zeus-ext && cd /tmp/zeus-ext
npm init -y
printf '@zeus:registry=https://npm.scriptorium.escrivivir.co\n' > .npmrc
npm install /tmp/zeus-packs/zeus-socket-core-0.1.0.tgz \
  /tmp/zeus-packs/zeus-protocol-*.tgz \
  /tmp/zeus-packs/zeus-rooms-*.tgz
# con ZEUS_SCRIPTORIUM_URL apuntando a un scriptorium vivo:
node consumer.mjs
bun run consumer.ts
```

Handshake documentado en el portal: [Handshake externo](/guide/external-handshake).
