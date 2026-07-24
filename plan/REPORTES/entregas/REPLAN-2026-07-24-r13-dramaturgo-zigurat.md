# REPLAN · R13-Z · tercer frente Dramaturgo + Zigurat (planificación · HOLD)

| dato | valor |
| ---- | ----- |
| Fecha | 2026-07-24 |
| Rol | orquestador-Z |
| Autorización | **GO custodio 2026-07-24 · asiento DA-S21 pendiente** (**D-43**) — solo planificación |
| Estado gate | **R13-Z en HOLD** hasta commit del asiento DA-S21 (no pedir R13-Z PASS antes) |
| Gate previo | R12-Z **pendiente** (pedido vigente: [AVISO-R12-Z-plan.md](AVISO-R12-Z-plan.md)) · PAUSA / CORTE TÉCNICO vigente |
| Proyección | DC-15 **LOCAL-ONLY** |

## Mandato (fronteras duras)

```text
GO custodio 2026-07-24 (asiento DA-S21 pendiente): planificar el tercer
frente Dramaturgo + Zigurat. Prep permitida: replan, briefs, olas,
entradas ⬜ y épica U73 ⬜. Sin workers, sin 🔶, sin implementación,
sin publicación. R13-Z en HOLD hasta el asiento. Tercer frente
bloqueado hasta: asiento DA-S21 + R12 cerrado + R13-Z PASS + GO
implementación aparte.
```

## Fuentes

- [ADDENDA-R13-Z-TERCER-FRENTE-DRAMATURGO.md](ADDENDA-R13-Z-TERCER-FRENTE-DRAMATURGO.md)
  (espejo `vigilancia/z/`) — §WP
- [ADDENDA-R12-Z-GO-PUBLICACION-ALLOWLIST.md](ADDENDA-R12-Z-GO-PUBLICACION-ALLOWLIST.md)
  (D-42; separa `linea-editor` publish-ready = U178, fuera de este frente)
- BACKLOG § R13-Z · DECISIONES **D-43** · D-16/D-19/D-20 (dominio
  dramaturgo, import precedente, hook SSB)

## Camino A — absorber, no reconstruir (DRY)

Extender antes de crear; **cero** reconstrucción del editor legado:

| pieza existente | extensión R13 |
| --------------- | ------------- |
| `@zeus/http-contract` (proyección RouteEntry→MCP, WP-U40) | **U172** mutaciones → tools MCP |
| identidad/seats (`@zeus/protocol` peer-card/seat · authority-kit) | **U173** kit reparto + permisos |
| `@zeus/story-board-schema` | **U174** refs de personajes |
| `@zeus/linea-editor` (autoría gateada existente) | **U175** autoría por reparto |
| formatos linea-kit + precedente import D-19 | **U176** importador one-off |
| épica Zigurat histórica (**U73**, ex «teatro capa 2») | **U177** cierre de diseño acotado |

Ownership externo (sin WP en zeus): archivo del editor legado / DAS-1 /
extensión VS Code (otro carril) · sidecar/pub (otro carril). Rutas
fuente del legado = **solo lectura** para diseñar el importador.

## Olas y dependencias

```text
[asiento DA-S21] → [R12 cerrado] → [R13-Z PASS] → [GO implementación]
        │                                              (no ahora)
        ▼
    ┌───┴───┐
    ▼       ▼
  U172    U173          Ola A (∥)
  tools   reparto+
  MCP     permisos
    │       │
    │       ▼
    │     U174          Ola B (personajes story-board)
    │       │
    ├───────┤
    ▼       ▼
  U175    U176          Ola C · Ola D (∥ posible; archivos disjuntos)
  autoría import
  gateada one-off
    │
    ▼
  U177                  Ola E (contrato IDE + cierre diseño U73)
```

| WP | ola | est. | deps | eje | posesión archivos |
| -- | --- | ---- | ---- | --- | ----------------- |
| **U172** | A | M | R13-Z PASS + GO impl. | I | `packages/engine/http-contract/**` |
| **U173** | A | M | R13-Z PASS + GO impl. | I | `packages/engine/reparto-kit/**` (nuevo; nombre a validar) |
| **U174** | B | S/M | U173 ✅ | I | `packages/engine/story-board-schema/**` |
| **U175** | C | M | U172+U173+U174 ✅ | I+IV | `packages/mesh/linea-editor/**` (src; no manifests pub) |
| **U176** | D | M | U173+U174 ✅ (∥ U175) | II | `scripts/import-legado/**` |
| **U177** | E | M | U173–U175 ✅ (diseño ∥) | IV | docs contrato bajo `plan/REPORTES/` |

**Épica U73** (⬜, reactivada desde Horizonte): paraguas del frente; no
asignable como WP único; U177 cierra su diseño. Acotada — sin capa
federada completa; hook SSB D-20 queda como punto de extensión.

**Sin colisión con R12/U178:** U175 y U178 tocan `linea-editor` en
archivos distintos (src vs manifests) y **no** se despachan
simultáneos; U172–U177 no tocan gate ni manifests de publish.

## Contrarrevisión (puntos obligatorios)

| WP | motivo |
| -- | ------ |
| U172 | contrato de proyección (tools de mutación) |
| U173 | contrato de permisos/identidad |
| U174 | schema compartido |
| U175 | gate de autoría |
| U176 | migración + **ceguera** (conteo literal 0) |
| U177 | revisión ligera orquestador (diseño) |

## CA transversales

1. Lock coherente en todo WP que toque manifests (CA R11-Z).
2. Contrarrevisión PASS documentada antes de ✅ donde aplica.
3. Ceguera: ningún vocabulario/artefacto legado en código público;
   evidencia con tokens enmascarados (clase U141/D-32) y conteo 0.
4. Cero publish / flip `private` / changesets de pub en este frente.

## Gates

| gate | significado |
| ---- | ----------- |
| asiento DA-S21 | commit del asiento en el carril de origen; **levanta el HOLD** de R13-Z |
| **R12-Z** | planificación Sprint 9 (pedido vigente; independiente) |
| cierre R12 | U168–U171 ✅ + gates; precondición del tercer frente |
| **R13-Z** | SOL valida este plan — **HOLD**; se pedirá tras el asiento |
| GO implementación | custodio; habilita 🔶 + despacho del frente |

## Nota de runtime (despachos futuros R13)

Cascada de modelo para workers/backgrounds: preferir **Fable**; si no
está disponible, **GPT-5.6 Sol**; si tampoco, el mejor disponible.
Anotar la cascada empleada en el aviso de cada despacho. (Esta pasada
de planificación se ejecutó con Fable — sin fallback.)

## Prueba de ceguera de esta pasada

Textos nuevos del plan redactados con «editor legado» (sin el token
prohibido del patrón de la addenda R13). Grep del patrón legado
(tokens enmascarados, clase U141/D-32) sobre los ficheros nuevos de
esta pasada (BACKLOG § R13-Z, briefs U172–U178, este replan, aviso):
**0** coincidencias fuera de la línea de definición del patrón en la
addenda archivada.

## Estado orquestador tras este replan

- BACKLOG: cola **R13-Z** ⬜ (U73 épica + U172–U177) · **U178** ⬜ ·
  GO publish condicionado **D-42** asentado.
- **0 🔶 · cero workers · cero publish · tercer frente sin abrir.**
- PAUSA / CORTE TÉCNICO respetada (solo gobierno de plan).
- R13-Z: **HOLD** — pedido a SOL diferido al asiento DA-S21.
- Aviso: [AVISO-R13-Z-plan-hold.md](AVISO-R13-Z-plan-hold.md).
