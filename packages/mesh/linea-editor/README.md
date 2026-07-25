# `@zeus/linea-editor`

MCP server for **gated line authorship**. Sibling of `linea-system` (read):
this pack **mutates** via thin wraps of `@zeus/linea-kit/tools` and exports
`story-board.json`. Offered on horse as curated preset `linea-editor`
(refs / URIs only — never corpus).

## Tools

| tool | gate | wraps |
|------|------|-------|
| `crear_linea` | `approve` + `approvalToken` (+ reparto) | `crearLinea` |
| `export_story_board` | same | compose board + `validateStoryBoard` |

Gate is **visible** (`editor://info`, server card, error payloads include
`gate.gate_line`). Token from `ZEUS_MCP_APPROVAL_TOKEN` (default `APROBAR`).

### Gate por reparto (autoría · U173)

El **mismo** gate tiene una segunda cara: cuando la llamada aporta un `reparto`
(`@zeus/reparto-kit` `reparto/1`) + `card` (peer-card de `@zeus/protocol`, con
`ssbId`) + `personajeId`, autorar exige además que la peer-card **pueda
`reparto:interpretar`** ese personaje. Se evalúa con `evaluarPermiso` y
`exigirSeat:true` (frontera de asiento): una card sin asiento deniega
(`seat_ausente`) y un `ssbId` manipulado tras firmar deniega (`seat_invalido`).
Un solo objeto `gate` lleva ambas caras (`gate.reparto`); **cero mecanismo
paralelo**. Motivos de denegación: `reparto_requerido`, `card_no_vigente`,
`identidad_ausente`, `seat_invalido`, `seat_ausente`, `personaje_desconocido`,
`personaje_no_en_reparto`, `rol_sin_permiso`.

> **⚠️ ADVERTENCIA DE SEGURIDAD — quién exige el reparto.** La cara de reparto es
> **aditiva por llamada**: si el llamador NO aporta `reparto`, por defecto solo se
> aplica el token. Es decir, **con la política desactivada el control de reparto
> solo protege frente a llamadores cooperativos** — un cliente que simplemente
> omita `reparto` autoriza con el token a secas. Para cerrar ese bypass, la
> exigencia es una **política servidor-side del despliegue**, no del llamador:
>
> - Env: **`ZEUS_LINEA_EDITOR_REQUIRE_REPARTO`** (junto a `ZEUS_LINEAS_ROOT`).
>   Truthy (`1`/`true`/`yes`/`on`) ⇒ **toda** mutación gateada (`crear_linea`,
>   `export_story_board`) **sin `reparto` se DENIEGA** con `reparto_requerido`
>   **antes de escribir** en el volumen. Default **OFF** (retro-compat).
> - **Los despliegues del flujo dramaturgo DEBEN activar el flag.** Con él OFF,
>   quien despliega asume que confía en todos los llamadores.
> - El estado real se refleja en `editor://info` (`gate.reparto_required`) y la
>   server card; los payloads de deny incluyen el motivo.

### Personajes en el story-board (U174)

`export_story_board` con `reparto` emite el campo opcional `personajes` del
`@zeus/story-board-schema` (**refs-only**: `{ personajeId }`, nunca nombre/rol) y
**valida** el board contra el schema (AJV). El payload horse lleva los ids de
personaje y el puntero `reparto://…` — jamás corpus.

## Frontier

- Path / camino model → `@zeus/linea-kit/viaje` (read; not reimplemented here)
- Read MCP → `@zeus/linea-system`
- This pack → mutation + export only

## Horse

```js
import { resolveLineaEditorOffer, broadcastLineaEditorOffer } from '@zeus/linea-editor/horse-preset';
const offer = resolveLineaEditorOffer();
broadcastLineaEditorOffer(client, room, selfId, offer);
```

## Start

```bash
npm start -w @zeus/linea-editor
# ZEUS_LINEAS_ROOT=/path/to/LINEAS  ZEUS_MCP_LINEA_EDITOR=4115
```

## Test

```bash
npm test -w @zeus/linea-editor
```
