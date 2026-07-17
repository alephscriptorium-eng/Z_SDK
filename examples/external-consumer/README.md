# Consumidor externo mínimo (WP-U54)

Plantilla de un proyecto **fuera** del monorepo que instala `@zeus/protocol`
y `@zeus/rooms` desde tarballs (`npm pack` / `file:`) — no exige registry live.

```bash
# Desde la raíz del monorepo:
npm run smoke:external-consumer
```

El orquestador:

1. Empaqueta `protocol` + `rooms`
2. Crea un directorio limpio bajo el temp del SO (fuera del workspace)
3. Instala los tarballs
4. Levanta `socket-server` en un puerto aislado vía env
5. Corre el consumidor con **Node** y **Bun**

No setea `ZEUS_OPEN_BROWSER` (opt-in).

## Manual (equivalente)

```bash
npm pack -w @zeus/protocol -w @zeus/rooms --pack-destination /tmp/zeus-packs
mkdir /tmp/zeus-ext && cd /tmp/zeus-ext
npm init -y
npm install /tmp/zeus-packs/zeus-protocol-0.1.0.tgz /tmp/zeus-packs/zeus-rooms-0.1.0.tgz
# con ZEUS_SCRIPTORIUM_URL apuntando a un scriptorium vivo:
node consumer.mjs
bun run consumer.ts
```

Handshake documentado en el portal: [Handshake externo](/guide/external-handshake).
