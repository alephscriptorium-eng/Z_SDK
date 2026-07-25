# `@zeus/reparto-kit`

Kit de **reparto** del dominio narrativo (personajes/roles) y **permisos de
dominio**, montado sobre la **identidad y los seats existentes**
(`@zeus/protocol` peer-card/seat + `@zeus/authority-kit`). **Cero identidad
paralela:** el actor es la identidad durable `ssbId` de la peer-card. **Sin
nombres de juego** (D-8): el caller aporta personajes, política y datos.

Relación del dominio: **1 actor** (`actorSsbId` = ssbId durable) — **N
personajes** (`personajeId`), expresada como N asignaciones que comparten actor.

## Contrato v1 (congelado)

Shape en `src/tipos.mjs` (`isRepartoShaped`). No añadir campos.

```text
RepartoV1 {
  version: 'reparto/1',
  personajes:   Personaje[]   // { id, nombre, rol }
  asignaciones: Asignacion[]  // { actorSsbId, personajeId }   (1 actor – N personajes)
  politica:     { [rol: string]: Permiso[] }   // rol narrativo → permisos de dominio
}
```

`Permiso ∈ PERMISOS = ['reparto:leer','reparto:interpretar','reparto:dirigir']`
(verbos genéricos; sin nombre de juego).

## API

| fn | firma |
| --- | --- |
| `crearReparto` | `({ personajes, asignaciones, politica }) → Readonly<RepartoV1>` — valida shape + integridad referencial + `actorSsbId` ssbId; congela |
| `isRepartoShaped` / `isPersonajeShaped` / `isAsignacionShaped` | guards del shape congelado |
| `evaluarPermiso` | `(reparto, card, { personajeId, permiso, now? }) → { ok, motivo, actorSsbId, rol, asiento, permiso }` |
| `puede` | `(reparto, card, personajeId, permiso, now?) → boolean` |
| `actorDeCard` | `(card) → ssbId | null` (identidad durable de la peer-card) |
| `personajesDeActor` / `actoresDePersonaje` / `permisosDePersonaje` | consultas del reparto |
| `validarReparto` | `(reparto, patronCeguera) → { ok, matches }` — guardarraíl de ceguera por env |
| `filasCastDesdeReparto` | `(reparto) → rows[]` — proyección al schema del cast-table de view-kit |

Adaptador de vista (subpath `./vista`, opcional):

| fn | firma |
| --- | --- |
| `montarReparto` | `({ reparto, mount, doc?, id?, title?, registry? }) → { el, id, destroy() }` — monta en el **cast-table EXISTENTE** de `@zeus/view-kit` (`renderCastTableWidget`), sin copia |

## Identidad y permisos

- La identidad del actor se resuelve **siempre** desde `card.ssbId`
  (`@zeus/protocol` `isSsbId`); el kit no crea ids propios.
- Vigencia de la card: ciclo no-crypto de la peer-card (`isPeerCardFresh`).
- **Verificación de asiento (paso 3):** si la card trae `seatSignature`,
  `evaluarPermiso`/`puede` la verifican con `verifyTravelingPeerCard` del
  protocol (**no se reimplementa cripto**). Un `ssbId` manipulado tras firmar no
  verifica → `seat_invalido`. Card **sin** `seatSignature` = identidad no
  acreditada por asiento: por defecto se acepta (el llamador es responsable de
  haber autenticado la card); con `exigirSeat:true` se deniega (`seat_ausente`).
- Decisión de `evaluarPermiso` (deny por: `card_no_vigente`,
  `identidad_ausente`, `seat_invalido`, `seat_ausente`, `permiso_desconocido`,
  `personaje_desconocido`, `personaje_no_en_reparto`, `rol_sin_permiso`; allow:
  `concedido`).

## Frontera

- `./tipos`, `./filas`, `./validar` importan a lo sumo `@zeus/protocol` (raíz,
  browser-safe).
- `.` (core) / `./permisos` importan además `@zeus/protocol/peer-card-seat`
  para verificar el asiento; ese subpath usa `node:crypto`, por lo que la
  **evaluación de permisos con asiento es node-side** (autoridad). El adaptador
  de vista queda aparte.
- `./vista` importa `@zeus/view-kit`.
- Ningún otro `@zeus/*`; ningún `domain.mjs`.

## Consumo de view-kit (deuda aceptada)

El código de `./vista` consume el widget público `renderCastTableWidget` de
`@zeus/view-kit` (dependencia real, sin copia). El **test** de node carga el
`widgets.mjs` enviado por view-kit vía `import.meta.resolve('@zeus/view-kit')` +
URL relativa, porque el índice público del paquete arrastra un asset
solo-navegador no cargable en node y su mapa `exports` solo publica `.`/`./node`.
Esa resolución por ruta relativa es **frágil ante un refactor interno de
view-kit**: deuda aceptada, con puntero al candidato de que `@zeus/view-kit`
exponga `./widgets` en su `exports` (view-kit es solo lectura para este WP; no se
toca aquí).

## Tests

`node --test test/*.mjs` (o `npm test -w @zeus/reparto-kit`).
