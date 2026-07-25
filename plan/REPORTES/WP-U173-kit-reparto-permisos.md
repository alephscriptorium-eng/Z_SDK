# Reporte — WP-U173 · Kit de reparto y permisos de dominio

- Rama: `wp/u173-kit-reparto-permisos` (base `origin/main` = `f35c6b5`)
- Worktree: `C:\S_LAB\.worktrees\z\wp-u173-kit-reparto-permisos`
- Runner: Fable (sin fallback).

## Qué se hizo

Nuevo paquete `@zeus/reparto-kit` (`packages/engine/reparto-kit`): kit de
**reparto** del dominio narrativo (personajes/roles) + **permisos de dominio**,
montado sobre **identidad y seats EXISTENTES** (`@zeus/protocol` peer-card /
peer-card-seat; alineado con la emisión de `@zeus/authority-kit`). Cero
identidad paralela: el actor ES el `ssbId` durable de la peer-card. Relación 1
actor — N personajes vía filas `Asignacion`. El adaptador de vista (subpath
`./vista`) **consume el cast-table EXISTENTE de `@zeus/view-kit`**
(`renderCastTableWidget`) como dependencia real, sin fork ni copia. Contrato
mínimo congelado v1 al patrón de `parte-kit` (shape + guards + versión). Sin
nombres de juego (D-8). Cero publish / flip private / changesets.

## Shape v1 del contrato (literal, congelado en `src/tipos.mjs`)

```text
REPARTO_VERSION = 'reparto/1'
PERMISOS = ['reparto:leer', 'reparto:interpretar', 'reparto:dirigir']   // congelado

RepartoV1 {
  version: 'reparto/1',
  personajes:   Personaje[]     // Personaje  { id: string, nombre: string, rol: string }
  asignaciones: Asignacion[]    // Asignacion { actorSsbId: string(ssbId @….ed25519), personajeId: string }
  politica:     { [rolNarrativo: string]: Permiso[] }   // rol → permisos de dominio que concede
}
// 1 actor (actorSsbId durable) — N personajes = N filas Asignacion con el mismo actorSsbId.
```

Decisión de permiso (`evaluarPermiso(reparto, card, { personajeId, permiso, now })`):
```text
1 card vigente (isPeerCardFresh)        → si no: card_no_vigente
2 identidad durable ssbId (isSsbId)     → si no: identidad_ausente
3 permiso ∈ PERMISOS                     → si no: permiso_desconocido
4 personaje ∈ reparto.personajes         → si no: personaje_desconocido
5 asignacion (actorSsbId, personajeId)   → si no: personaje_no_en_reparto
6 politica[personaje.rol] ⊇ {permiso}    → si no: rol_sin_permiso
→ { ok:true, motivo:'concedido', actorSsbId, personajeId, rol, asiento, permiso }
```

## Ficheros

Nuevos (todos bajo `packages/engine/reparto-kit/`):
- `package.json` (`@zeus/reparto-kit` 0.1.0 · type module · exports `.`/`./tipos`/`./permisos`/`./validar`/`./filas`/`./vista` · license AIPLv1 · `zeus.role=lib` · deps `@zeus/protocol` 0.4.1 + `@zeus/view-kit` 0.1.5)
- `README.md`
- `src/tipos.mjs` (shape v1 congelado, guards, `crearReparto`, `repartoVacio`, `PERMISOS`, `MOTIVOS`)
- `src/permisos.mjs` (`evaluarPermiso`, `puede`, `actorDeCard`, `personajesDeActor`, `actoresDePersonaje`, `permisosDePersonaje`)
- `src/validar.mjs` (`validarReparto`/`blobReparto`/`patronCegueraDesdeEnv` — guardarraíl de ceguera por env, patrón parte-kit)
- `src/filas.mjs` (`filasCastDesdeReparto` — proyección pura al schema del cast-table)
- `src/vista.mjs` (`montarReparto` — consumo real de `@zeus/view-kit` `renderCastTableWidget`)
- `src/index.mjs` (core, importa solo `@zeus/protocol`)
- `types/{index,tipos,permisos,validar,filas,vista}.d.ts`
- `test/{contrato,permisos,identidad,frontera,ceguera,vista}.test.mjs`

Modificado (dentro de ALCANCE_DIFF): `package-lock.json` — SOLO las dos entradas
del nuevo workspace `@zeus/reparto-kit` (diff quirúrgico; ver §supuestos sobre
los 4 bumps colaterales revertidos).

## CA por CA (evidencia literal)

Salida `node --test packages/engine/reparto-kit/test/*.mjs`:
```text
# tests 26
# pass 25
# fail 0
# skipped 1
# todo 0
```

- **CA1 · consume peer-card/seat existentes, CERO identidad paralela.**
  `test/identidad.test.mjs`: firma un asiento viajero con
  `@zeus/protocol/peer-card-seat` (`generateSeatKeyPair`/`signTravelingPeerCard`),
  `verifyTravelingPeerCard` → `{ ok:true }`, y `actorDeCard(card) === seat.ssbId`
  (la identidad del dominio ES la del protocolo). `crearReparto` lanza si
  `actorSsbId` no es ssbId. Evidencia:
  ```text
  ok 9  - contrato: crearReparto rechaza actorSsbId no-ssb (cero identidad paralela)
  ok 14 - identidad: el actor del reparto es el ssbId de la peer-card/seat firmada
  ok 15 - identidad: actorDeCard rechaza ausencia o forma inválida de ssbId
  ok 21 - permiso DENEGADO: card fresca sin ssbId → identidad_ausente
  ```

- **CA2 · permisos verificables por test (rol/actor permitido y denegado, con y
  sin personaje en su reparto).** `test/permisos.test.mjs` con peer-cards reales:
  ```text
  ok 16 - permiso CONCEDIDO: actor con personaje en su reparto y rol que concede el permiso
  ok 17 - permiso DENEGADO por rol: mismo actor/personaje, rol no concede el permiso
  ok 18 - permiso DENEGADO por actor SIN personaje en su reparto
  ok 19 - permiso CONCEDIDO por actor CON personaje en su reparto (contraste)
  ok 20 - permiso DENEGADO: peer-card caducada → card_no_vigente
  ok 22 - permiso DENEGADO: permiso o personaje desconocidos
  ok 23 - relación 1 actor – N personajes vía asignaciones
  ```

- **CA3 · regla D-8 (el kit no nombra ningún juego concreto).**
  `test/ceguera.test.mjs` (conteo de vocabulario vetado sobre `src`+`types`+`README`
  = 0) + heurística sin token de juego en PERMISOS/version:
  ```text
  ok 1 - ceguera: cero vocabulario vetado en fuentes públicas (src + types + README)
  ok 2 - ceguera: fuentes públicas no nombran un juego concreto en PERMISOS/version
  ok 3 - ceguera: validarReparto marca !ok ante blob envenenado y ok ante blob limpio
  ```
  Conteo directo `grep -rEic "novela|novelist"` sobre el kit = **0**.

- **CA · consumo real de view-kit sin fork ni copia.** `test/vista.test.mjs`
  resuelve el fichero ENVIADO por `@zeus/view-kit` (`import.meta.resolve` →
  `widgets.mjs`) y ejecuta `renderCastTableWidget` con las filas proyectadas:
  ```text
  ok 24 - vista/proyección: filasCastDesdeReparto mapea al schema del cast-table
  ok 25 - vista: el cast-table EXISTENTE de @zeus/view-kit renderiza nuestras filas (consumo real, sin copia)
  ```

- **CA · frontera de imports.** `test/frontera.test.mjs`:
  ```text
  ok 12 - frontera: imports solo protocol (core) + view-kit (vista); cero domain.mjs
  ok 13 - frontera: solo vista.mjs importa @zeus/view-kit (core libre de la cadena 3D)
  ```

- **CA · cero publish / flip private / changesets.** No se creó `.changeset/`,
  no se ejecutó publish, no hay campo `private` flipeado. `git status` final:
  solo `package-lock.json` (M, 2 entradas reparto-kit) + `packages/engine/reparto-kit/`
  (nuevo) + este reporte.

## Skip honesto (1)

```text
ok 26 - vista: montarReparto ... # SKIP view-kit index solo-navegador (esperado en node)
```
El **índice público** de `@zeus/view-kit` (`.`) arrastra `src/room.mjs`, que
importa un asset solo-navegador (`/assets/room-client/room-client.browser.mjs`)
inexistente en node; por eso `import('@zeus/view-kit')` no carga en node. El
adaptador `montarReparto` de `src/vista.mjs` usa el import público correcto
(runtime navegador vía import-map). La evidencia de consumo del widget se cubre
en node cargando el `widgets.mjs` REAL que envía view-kit (test 25). El render
end-to-end de `montarReparto` queda **`<pendiente>` de verificación en navegador**.

## Corrección tras contrarrevisión (R1)

Devolución del revisor independiente atendida en la MISMA rama
`wp/u173-kit-reparto-permisos`. Nombre `@zeus/reparto-kit` en
`packages/engine/reparto-kit`: **CERRADO** (validado, sin colisión). Suite tras
corrección:
```text
# tests 29
# pass 28
# fail 0
# skipped 1
# todo 0
```

- **OBS-1 (BLOQUEANTE) · seatSignature inválida obtenía «concedido».** Resuelto
  con la opción **(a)** preferida: si la card trae `seatSignature`,
  `evaluarPermiso`/`puede` (src/permisos.mjs) invocan `verifyTravelingPeerCard`
  del protocol (SIN reimplementar cripto) y deniegan con motivo `seat_invalido`
  (más `seatError`) si no verifica. Card **sin** `seatSignature` = comportamiento
  documentado: por defecto acepta (llamador responsable); con `exigirSeat:true`
  deniega `seat_ausente` (frontera de asiento opt-in). Justificación de (a) sobre
  (b): mantiene la API ergonómica (acepta la card del protocol tal cual) sin
  poder saltarse por accidente la verificación cuando hay asiento, y el opt-in
  `exigirSeat` cubre el contexto de confianza estricta. Nota de frontera: la
  verificación usa `@zeus/protocol/peer-card-seat` (`node:crypto`) → la
  evaluación con asiento es node-side (documentado en README/index). Evidencia:
  ```text
  ok 17 - adversarial: ssbId manipulado post-firma NO verifica → seat_invalido (no concedido)
  ok 18 - seat ausente: card sin seatSignature = comportamiento documentado (acepta; exigirSeat lo deniega)
  ```
  El test 17 replica el ataque del revisor: firma → manipula `ssbId` a otro
  ssbId válido **asignado** al personaje → `verifyTravelingPeerCard` =
  `{ok:false, error:'seatSignature mismatch'}` → `evaluarPermiso` deniega
  `seat_invalido` (antes concedía).

- **OBS-2 (menor) · `crearReparto` aceptaba asignaciones duplicadas.** Resuelto:
  validación rechaza pares `actor↔personaje` duplicados (`TypeError`
  `asignacion duplicada`). Evidencia:
  ```text
  ok 11 - contrato: crearReparto rechaza asignacion duplicada actor↔personaje (OBS-2)
  ```

- **OBS-3 (menor) · el catch del skip #29 tragaba cualquier excepción.**
  Resuelto: el test solo omite si el error casa
  `room-client.browser.mjs|@zeus/view-kit`; cualquier otro error hace `assert`
  fallido (no skip). Evidencia: `ok 29 - ... # SKIP ...` con el mensaje del asset
  de navegador; un fallo distinto rompería el test.

- **OBS-4 (menor · deuda documentada) · consumo por `import.meta.resolve`.**
  Documentado en README §«Consumo de view-kit (deuda aceptada)» y aquí: la
  resolución por ruta relativa esquiva el `exports` público de view-kit
  (`.`/`./node`) y es frágil ante refactor interno; candidato futuro = que
  `@zeus/view-kit` exponga `./widgets` en su `exports` (NO tocado: view-kit es
  solo lectura para este WP). El código de producción (`src/vista.mjs`) sí usa el
  import público `@zeus/view-kit`; la resolución por ruta es solo del test node.

## Supuestos a validar en contrarrevisión

1. **Nombre del paquete `@zeus/reparto-kit` / ruta `packages/engine/reparto-kit`**
   — **CERRADO** por la devolución R1 (validado, sin colisión).
2. **Modelo de permisos**: permiso = f(identidad durable asignada al personaje,
   rol narrativo del personaje vía `politica`). El `rol de asiento` del peer-card
   (`player|dj|operator`) se expone como campo advisory `asiento` en la decisión
   pero NO gatea (eso es competencia de la ACL de `@zeus/authority-kit`). Validar
   si se desea gating por asiento adicional.
3. **Catálogo `PERMISOS`** (`leer`/`interpretar`/`dirigir`) — verbos genéricos
   propuestos; congelable o ampliable en contrarrevisión.
4. **`package-lock.json`**: `npm install` reconciliaba además 4 bumps de versión
   colaterales de paquetes `mesh` ajenos (force-system, linea-firehose,
   linea-system, ssb-system: 0.1.0→0.1.1, drift preexistente entre su
   package.json en `main` y el lock). Se **revirtieron** para dejar el diff del
   lock SOLO con las 2 entradas de reparto-kit (ALCANCE_DIFF estricto). Señalado
   por si contrarrevisión prefiere reconciliar ese drift aparte.
5. **Dependencia `@zeus/view-kit`** aporta transitivamente su cadena de UI (no
   cargable en node). El core (`.`) queda libre de ella (solo `@zeus/protocol`);
   la vista es opt-in (`./vista`). Validar si se prefiere una dependencia más
   fina.

## Pendientes honestos

- Render end-to-end de `montarReparto` en navegador: `<pendiente>` (skip #29).
- Deuda OBS-4: `import.meta.resolve` frágil hasta que view-kit exponga
  `./widgets` en `exports` (fuera de alcance de este WP).
- Nombre/ubicación del paquete: **CERRADO** (devolución R1).
- Contrarrevisión independiente PASS de la corrección R1: `<pendiente>` (la
  ejecuta el orquestador).
