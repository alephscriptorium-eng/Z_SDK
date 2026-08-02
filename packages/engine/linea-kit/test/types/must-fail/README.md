# `must-fail/` — controles negativos de las declaraciones

Cada fichero de esta carpeta **tiene que NO compilar**. `check.mjs` los ejecuta
uno a uno y se pone rojo si alguno pasa: una declaración que ya no rechaza el
código que la motivó es una declaración que volvió a mentir.

Todos vienen de la devolución de WP-U245. Cada uno reproduce, en el tipo, un
comportamiento que primero se midió en el runtime.

| caso | qué código prohíbe | error que debe dar |
| --- | --- | --- |
| `b2-hop.ts` | leer `hop` tras `acceptWalks`, que nunca lo comprueba | TS2339 |
| `b2-from.ts` | tratar `accepted[0].from` como `string` sin narrowing | TS2322 |
| `b2-untyped.ts` | `.length` sobre un `from` que el acceptor no miró | TS2571 |
| `b3-null.ts` | `applyMilestoneRules(null)` | TS2345 |
| `b3-undef.ts` | `applyMilestoneRules(undefined)` | TS2345 |
| `b3-allowlist.ts` | `editorAllowlist` como array en vez de `Set` | TS2740 |
| `b3-viaje-allowlist.ts` | lo mismo vía `segmentarViaje`, que no normaliza | TS2740 |
| `b3-partes-obj.ts` | `partes` como registro en vez de array | TS2740 |
| `b3-partes-null.ts` | una parte `null` | TS2322 |
| `b3-nodos-null.ts` | un nodo ref `null` dentro de una parte | TS2322 |
| `b4-parte-id.ts` | `parte.id.toUpperCase()` sobre lo que el schema no promete | TS18046 |
| `m8-ids.ts` | `nodoIdsFromTrunk` con ids no-string asignado a `string[]` | TS2322 |
| `m11-paso.ts` | `paso.chosen_from` asumido presente | TS2532 |

## Lo que NO hay aquí, y por qué

**No hay caso para el bloqueante 1** (el atributo de importación de
`./schemas/*`). No lo hay porque **TypeScript no lo puede cazar**: resolver por
la condición `types` apaga TS1543. Ese contrato se sostiene con
`test/json-import-attribute.test.mjs` —que lo comprueba en el runtime, en CI— y
con la pierna J del gate, que exige que las 19 declaraciones lo sigan
documentando. Poner aquí un caso que pasara sería justo la clase de evidencia
falsa que estos ficheros existen para evitar.
