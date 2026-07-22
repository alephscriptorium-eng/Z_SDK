# Kits FOSS — catálogo citable

Paquetes `@zeus/*` instalables desde el registry público. Cada fila es
`npm view <paquete> version --registry https://npm.scriptorium.escrivivir.co`
(corte 2026-07-22). Sin promesa de roadmap: solo lo que el canal responde.

## Núcleo de federación / runtime

| Paquete | Versión en registry | Rol breve |
| ------- | ------------------- | --------- |
| `@zeus/protocol` | `0.4.0` | Contrato único + peer-card / seat |
| `@zeus/rooms` | `0.1.1` | Cliente Socket.IO / join de room |
| `@zeus/player-mcp-kit` | `0.1.3` | Un MCP por actor |

## Kits de juego publicados

| Paquete | Versión en registry | Rol breve |
| ------- | ------------------- | --------- |
| `@zeus/embajador-kit` | `0.1.1` | Puerta peercard → startpack |
| `@zeus/parte-kit` | `0.1.1` | Parte / contribución tipada |
| `@zeus/acta-kit` | `0.1.1` | Acta de barrio / cierre |
| `@zeus/lifecycle-kit` | `0.1.1` | Ciclo de vida de instancia |
| `@zeus/ciudad-lifecycle` | `0.1.1` | Lifecycle MCP de ciudad |

## Cómo verificar (C8)

```bash
npm view @zeus/protocol version --registry https://npm.scriptorium.escrivivir.co
npm view @zeus/player-mcp-kit version --registry https://npm.scriptorium.escrivivir.co
npm view @zeus/rooms version --registry https://npm.scriptorium.escrivivir.co
npm view @zeus/embajador-kit version --registry https://npm.scriptorium.escrivivir.co
npm view @zeus/parte-kit version --registry https://npm.scriptorium.escrivivir.co
npm view @zeus/acta-kit version --registry https://npm.scriptorium.escrivivir.co
npm view @zeus/lifecycle-kit version --registry https://npm.scriptorium.escrivivir.co
npm view @zeus/ciudad-lifecycle version --registry https://npm.scriptorium.escrivivir.co
```

Registry: [npm.scriptorium.escrivivir.co](https://npm.scriptorium.escrivivir.co).
Handshake de consumidores: [Handshake externo](/guide/external-handshake).
Jugar ciudad (catálogo library): [startpacks](https://games.z-sdk.escrivivir.co/startpacks).
