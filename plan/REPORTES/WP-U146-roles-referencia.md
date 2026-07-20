# WP-U146 · roles-referencia — reporte

| dato | valor |
| ---- | ----- |
| agente | worker swarm (chat U146, worktree paralelo) |
| fecha | 2026-07-20 |
| rama | `wp/u146-roles-referencia` |
| commit(s) | `9d7be36` (dedup + README + costuras) · `8da5381` (máscara brief, CA5) · commit de este reporte |
| estado propuesto | listo para revisión |

## Qué se hizo

Se ejecutó la **parte diferida de D-35** («sustitución gradual: `roles/` →
README-referencia con versión fijada»), con **GO Sprint 4**, replicando el
procedimiento probado de emmanuel **WP-I60** adaptado a **0.3.0**. Los 5
prompts genéricos de `plan/roles/` (ORQUESTADOR, WORKER, REVISION,
CORRECCION, BRIEF) eran copia derivada del protocolo canónico y se
**eliminaron con `git rm`**; su fuente pasa a ser el paquete publicado
`@alephscript/skills-scriptorium@0.3.0 › skills/swarm-orquestacion` +
`skills/vigilancia` (versión **fijada**, registry
`npm.scriptorium.escrivivir.co`). `plan/roles/README.md` se reescribió como
**referencia versionada** más la **calibración local de zeus** (dos backlogs
separados, adaptador de evidencia CI `gh`/paths-ignore U104, límites Actions
del swarm, dónde vive el estado, semver en CI/CD), visible sin abrir el
paquete. Se cosieron `plan/README.md` y `plan/PRACTICAS.md` para que
«autocontenido» signifique «autocontenido vía referencia versionada,
resoluble por `npm view` (C8)», no «copiado aquí». Desviación puntual (por
CA5): se enmascaró en el brief U146 una ruta local que citaba el token del
repo externo — detalle en §Evidencia CA5 y §Hallazgos.

## Archivos tocados

- `plan/roles/ORQUESTADOR.md` · **borrado** (git rm) — copia genérica
- `plan/roles/WORKER.md` · **borrado** (git rm) — copia genérica
- `plan/roles/REVISION.md` · **borrado** (git rm) — copia genérica
- `plan/roles/CORRECCION.md` · **borrado** (git rm) — copia genérica
- `plan/roles/BRIEF.md` · **borrado** (git rm) — copia genérica
- `plan/roles/README.md` · **modificado** — referencia versionada 0.3.0 + calibración local zeus
- `plan/README.md` · **modificado** — §Protocolo del swarm: «autocontenido vía referencia versionada»
- `plan/PRACTICAS.md` · **modificado** — cabecera (delta local sobre el paquete) + §5 puntero a roles/README (los roles borrados ya no se citan)
- `plan/REPORTES/briefs/WP-U146-roles-referencia.md` · **modificado** — máscara `<ruta-local-custodio>` (ceguera CA5, convención U141)
- `plan/REPORTES/WP-U146-roles-referencia.md` · **creado** — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### CA1 · dedup (los prompts genéricos ya no están copiados)

```
$ grep -rniE "^# Rol: (orquestador|agente worker|revisión|corrección)|^# Brief para lanzar worker" plan/
exit=1        # ← sin coincidencias: ninguna definición de prompt genérico vive ya en plan/

$ ls -1 plan/roles/
README.md     # ← único fichero; la definición del protocolo es ahora referencia al paquete
```

### CA2 · referencia versionada resoluble (C8)

```
$ npm view @alephscript/skills-scriptorium@0.3.0 --registry=https://npm.scriptorium.escrivivir.co version
0.3.0
exit=0        # ← la versión FIJADA 0.3.0 existe y resuelve

$ npm view @alephscript/skills-scriptorium --registry=https://npm.scriptorium.escrivivir.co
@alephscript/skills-scriptorium@0.3.0 | UNLICENSED | deps: none | versions: 3
Skills library — método marco-agnóstico en formato skill estándar (SKILL.md + recursos)
dist-tags:
latest: 0.3.0
```

### CA3 · calibración local visible sin abrir el paquete

```
$ grep -rniE "referencia versionada|npm view|spec/BACKLOG\.md|paths-ignore U104|workflow_dispatch|z-sdk\.escrivivir\.co" \
    plan/roles/README.md plan/README.md plan/PRACTICAS.md
plan/roles/README.md:10:## Protocolo canónico (referencia versionada)
plan/roles/README.md:23:npm view @alephscript/skills-scriptorium@0.3.0 \
plan/roles/README.md:52:- `packages/games/delta/spec/BACKLOG.md` — las **features del juego delta**
plan/roles/README.md:64:- **paths-ignore U104**: si el diff solo toca `plan/**` / `**.md`, CI **no
plan/roles/README.md:70:  propios: `z-sdk.escrivivir.co` (portal zeus) y `games.z-sdk.escrivivir.co`
plan/roles/README.md:79:| `workflow_dispatch` de publish / release | solo ops / usuario |
plan/README.md:38:## Protocolo del swarm (referencia versionada)
plan/README.md:43:resoluble por `npm view` — C8). El plan queda **autocontenido vía referencia
plan/PRACTICAS.md:8:este árbol: es la **referencia versionada**
plan/PRACTICAS.md:110:misma literalidad que tests/lint. Si paths-ignore U104: **N/A** (no inventes
```

Delta conservado (verificado prompt a prompt contra el contenido 0.3.0 del
paquete): (1) separación `plan/BACKLOG.md` vs
`packages/games/delta/spec/BACKLOG.md`; (2) adaptador de evidencia CI = CLI
`gh` + paths-ignore U104 (N/A si solo `plan/**` / `**.md`) + workflow Docs
con dominios propios `z-sdk.escrivivir.co` / `games.z-sdk.escrivivir.co`;
(3) límites Actions (secrets, `workflow_dispatch` de publish = ops/usuario);
(4) dónde vive el estado (BACKLOG en `main`, reporte en rama desde
`REPORTES/PLANTILLA.md` con Evidencia CI, custodio de DECISIONES = usuario,
handoffs a `REPORTES/entregas/`, ciclo de sprint PRACTICAS §7); (5) semver
en CI/CD (changesets, PRACTICAS §6). La regla «un WP = un chat = una rama =
un worktree» **la trae el paquete** (reglas de oro del skill) → no se
duplicó; se dejó constancia explícita de que la fija el paquete.

### CA4 · alcance (el diff toca SOLO plan/)

```
$ git diff --name-only main...HEAD
plan/PRACTICAS.md
plan/README.md
plan/REPORTES/WP-U146-roles-referencia.md
plan/REPORTES/briefs/WP-U146-roles-referencia.md
plan/roles/BRIEF.md
plan/roles/CORRECCION.md
plan/roles/ORQUESTADOR.md
plan/roles/README.md
plan/roles/REVISION.md
plan/roles/WORKER.md

$ git diff --name-only main...HEAD | grep -vE "^plan/"
exit=1        # ← nada fuera de plan/ (BACKLOG.md y package.json intactos; U145 no pisado)
```

### CA5 · ceguera

```
# patrón real usado al correr = <términos-marco> (el de la prueba de
# ceguera del skill, armado por fragmentos; no se transcribe el literal
# en este árbol público — mismo criterio que I60 §CA5 y U141/D-32)

$ git diff main...HEAD | grep -E "^\+" | grep -iE "<términos-marco>" | grep -v "ZEUS_SDK"
added_exit=1  # ← 0 coincidencias reales en líneas AÑADIDAS del diff

$ grep -rniE "<términos-marco>" plan/ | grep -v "ZEUS_SDK"
tree_exit=1   # ← 0 coincidencias reales en el árbol público plan/
```

Notas de medida (honestidad, no ✅ mecánico):

- El grep crudo (árbol y líneas añadidas) da hits **todos falsos positivos
  por substring**: la env var propia `ZEUS_SDK_ROOT` — y su mención en la
  propia evidencia de este reporte — contiene uno de los fragmentos del
  patrón. Por eso ambas medidas aplican el mismo filtro del token propio
  (`grep -v`); filtrado, diff añadido y árbol quedan a 0.
- El brief U146 (preexistente en `main`, commit del orquestador `702f18c`)
  citaba una **ruta local absoluta con el token del repo externo** (misma
  clase que U140/U141). Se enmascaró como `<ruta-local-custodio>` en
  `8da5381` (convención U141). Por eso el diff completo contiene el token
  en **1 línea de borrado** («-»), que es la propia máscara; en líneas
  añadidas: 0. El token sigue **reachable en el historial de `main`**
  (no lo introdujo esta rama) — ver §Hallazgos.

### Evidencia CI

> Tras push de la rama. Canónico: `gh run list --branch <rama>`. Verde local
> ≠ gate CI (PRACTICAS §5).

| campo | valor |
| ----- | ----- |
| branch | `wp/u146-roles-referencia` |
| run_id | **N/A** (paths-ignore U104: diff solo `plan/**` / `**.md`) |
| workflow | — |
| conclusion | **N/A** |

```
⏳ sin push (indicación del orquestador para este lote: no push desde el
worker). Esperado N/A: el diff completo es plan/** (CA4), CI no dispara
por paths-ignore U104. Verificable tras push con:
gh run list --branch wp/u146-roles-referencia --limit 5
```

## Demolición

Los 5 prompts genéricos copiados (`ORQUESTADOR.md`, `WORKER.md`,
`REVISION.md`, `CORRECCION.md`, `BRIEF.md`) — `git rm`; su fuente es el
paquete en versión fijada. Cero cabeceras de prompt genérico vivas en
`plan/` (grep CA1, exit=1) y `plan/roles/` = solo `README.md`. Referencias
vivas dentro de los canónicos de `plan/` cosidas (PRACTICAS §5 ya no cita
los ficheros borrados); las menciones en `REPORTES/*` y
`BACKLOG-HISTORICO.md` son actas históricas y no se tocan; las de
`.cursor/` quedan fuera del alcance (§Hallazgos).

```
$ grep -rniE "^# Rol: (orquestador|agente worker|revisión|corrección)|^# Brief para lanzar worker" plan/
exit=1
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: solo URLs de cita (registry,
      dominios del portal) — docs pueden citarlas (PRACTICAS §1.1); además
      se **eliminó** una ruta local absoluta del brief (máscara U141).
- [x] Cadenas if/switch que debieron ser tabla: N/A (WP documental).
- [x] Duplicación con otros paquetes: al contrario — se elimina la copia
      del protocolo; el delta local se verificó prompt a prompt contra el
      contenido 0.3.0 para no duplicar lo que el paquete ya fija.
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres fuera de glosario o de transición: no.
- [x] Demolición completa (grep arriba): sí; costura de referencias vivas
      en canónicos hecha; `.cursor/` reportado como hallazgo, no arreglado.
- [x] Tests prueban comportamiento: N/A (CA = grep + `npm view`).
- [x] Arranque real verificado: N/A (docs); la verificación real es CA2
      contra el registry real (exit 0).
- [x] README/specs siguen siendo verdad: sí — `plan/README.md` y
      `PRACTICAS.md` cosidos en el mismo WP; `roles/README.md` ya no
      promete ficheros que no existen.
- [x] El diff contiene solo el alcance del WP: solo `plan/` (CA4); la
      máscara del brief es servidumbre directa de CA5 (misma clase U141),
      declarada arriba, no un arreglo de pasada silencioso.
- [x] Docs públicas C8/C9: `plan/` es interno; aun así el comando copiable
      del README de roles se ejecutó contra su canal real (CA2, C8). Sin
      listas manuales de eventos futuros (C9): la tabla de referencia fija
      paquete/versión, no estado de canales.

## Hallazgos fuera de alcance

1. **`.cursor/README.md` y `.cursor/rules/*.mdc` citan los prompts
   borrados** (`@plan/roles/ORQUESTADOR.md`, `@plan/roles/WORKER.md`,
   `@plan/roles/BRIEF.md`). Están fuera de `plan/` (CA4) y no se tocaron.
   Candidato a micro-WP: repuntar el adaptador Cursor a
   `plan/roles/README.md` + paquete.
2. **Token del repo externo reachable en historial de `main`**: el brief
   U146 entró en `main` (`702f18c`) citando la ruta local con el token
   (clase U140/D-32). Esta rama lo enmascara en el árbol, pero el
   historial de `main` lo conserva; squash/reescritura (si se quiere) es
   decisión del orquestador/usuario, no de este worker.
3. El paso «Ciclo de trabajo de un agente del swarm» de `plan/README.md`
   («Toma un WP ⬜ … márcalo 🔶») contradice el protocolo vigente (🔶 lo
   marca el orquestador al asignar). Prosa anterior a los roles; no se
   tocó por alcance mínimo. Candidato a costura futura.

## Dudas / bloqueos

- Ninguno. El registry resolvió `0.3.0` sin incidencias desde este entorno.
  Pendiente solo el push de la rama (lo hace quien el orquestador decida;
  CI esperado N/A por U104).

---

## Revisión del orquestador

**Veredicto: Aceptado ✅** (orquestador · 2026-07-20)

### CA

- [x] CA1 — dedup reproducido por el orquestador:
      `git ls-tree wp/u146-roles-referencia plan/roles/` → solo
      `README.md`; grep de cabeceras genéricas exit 1.
- [x] CA2 — `npm view …@0.3.0` → `0.3.0` exit 0 (literal en reporte).
- [x] CA3 — calibración local inspeccionada: los 5 deltas son
      genuinamente zeus (dos backlogs, adaptador CI gh/U104, límites
      Actions, estado, semver CI/CD); constancia explícita de que la
      regla 1WP=1chat=1rama la fija el paquete — dedup bien hecho, no
      dedup ciego.
- [x] CA4 — reproducido desde main: diff solo `plan/`; BACKLOG y
      package.json intactos (cero solape con U145).
- [x] CA5 — medida con filtro del token propio declarada, no ✅
      mecánico. La máscara del brief (8da5381) es servidumbre legítima
      de CA5, clase U141.

### PRACTICAS

- Demolición completa con costura de referencias vivas (PRACTICAS §5 ya
  no cita ficheros borrados) ✓. Auto-revisión honesta ✓. CI = N/A
  legítimo (U104, diff solo plan/**). Commits convencionales ✓.

### Merge

Orden sugerido: **U145 → U147 → U146** (este WP es solo plan/; conflicto
esperado a lo sumo trivial en REPORTES/).

### Hallazgos → destino

1. `.cursor/` cita prompts borrados → **candidato micro-WP U148**
   (repuntar adaptador Cursor a roles/README + paquete); sin GO no se
   abre. Nota: tras el merge de este WP el adaptador queda
   temporalmente incoherente — U148 conviene en el mismo lote de merge.
2. Token en historial de `main` (clase U140/D-32) → **decisión del
   usuario** (squash/reescritura de historial no la decide el swarm);
   elevado en el remate del sprint.
3. Prosa antigua de plan/README («márcalo 🔶») → cola residual.

### Nota post-aceptación (orquestador · 2026-07-20, GO usuario)

- El hallazgo 2 (ruta con token en historial) quedó **resuelto en
  origen**: el commit del brief se reescribió en local antes del primer
  push (la máscara `8da5381` de esta rama se absorbió en la base y el
  rebase la descartó como vacía — los hashes citados en este reporte
  son pre-reescritura).
- Amend del usuario: pin `0.3.0` → rango `0.x` — la prosa «versión
  fijada» de los tres docs cosidos se actualizó en esta rama
  (costura post-aceptación).
- El hallazgo 1 (`.cursor/`) se resolvió **demoliendo** el adaptador
  (U148, decisión usuario: sin carpetas IDE con markdown), no
  repuntándolo; las menciones en `plan/README.md` y `roles/README.md`
  se cosieron aquí.
