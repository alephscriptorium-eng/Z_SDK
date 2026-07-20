# WP-U147 · claude-skills — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Claude Code, background) |
| fecha | 2026-07-20 |
| rama | `wp/u147-claude-skills` |
| base | `wp/u145-dep-skills-scriptorium` (tip `2b4eee3`) — U145 aceptado, **no mergeado a main**; este WP consume su devDependency |
| commit(s) | `b070405` (script + npm script + espejo `.claude/skills/`) + commit de este reporte |
| estado propuesto | listo para revisión |

## Qué se hizo

Se creó `scripts/sync-claude-skills.mjs` (Node ESM, estilo de los scripts
existentes en `scripts/`): copia
`node_modules/@alephscript/skills-scriptorium/skills/*` → `.claude/skills/`
excluyendo `_plantilla` (tabla `EXCLUDE`), borra-y-recrea cada directorio
sincronizado (los listados en el manifiesto del README anterior ∪ los de la
fuente — nunca arrasa otros contenidos de `.claude/`), y regenera
`.claude/skills/README.md` de procedencia con nombre+versión leídos del
`package.json` del paquete instalado. Se añadió el npm script `skills:sync`
al `package.json` raíz. Se ejecutó el sync tres veces (pre y post commit):
3 skills materializadas (`site-web`, `swarm-orquestacion`, `vigilancia`),
idénticas byte a byte a la fuente, segunda/tercera corrida sin cambios.
**Decisión commit vs gitignore:** `.claude/skills/` **se commitea**
(recomendación del orquestador; reproducible tras clone sin paso extra, y el
espejo queda auditable en el diff — la fuente de verdad sigue siendo el
paquete versionado; el README lo dice explícitamente).

## Archivos tocados

- `scripts/sync-claude-skills.mjs` · creado — el script de sync
- `package.json` · modificado — script `"skills:sync": "node scripts/sync-claude-skills.mjs"` (+1 línea)
- `.claude/skills/**` · creado (55 archivos) — espejo generado: 3 skills + `README.md` de procedencia
- `plan/REPORTES/WP-U147-claude-skills.md` · creado — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Instalación previa (el worktree nace sin `node_modules`)

```
$ npm install
added 2689 packages, and audited 2875 packages in 3m
exit=0
```

Tras el install, `git restore` de los 3 `bin/*.mjs` con EOL reescrito
(hallazgo conocido de U145: `feed-kit`, `linea-kit`, `playbook-kit`) —
`git status` quedó limpio de ellos antes de tocar nada.

### CA1 · `.claude/skills/vigilancia/SKILL.md` idéntico byte a byte

```
$ diff -q node_modules/@alephscript/skills-scriptorium/skills/vigilancia/SKILL.md .claude/skills/vigilancia/SKILL.md
exit=0

$ for s in site-web swarm-orquestacion vigilancia; do diff -rq "node_modules/@alephscript/skills-scriptorium/skills/$s" ".claude/skills/$s" && echo "$s: identico"; done
site-web: identico
swarm-orquestacion: identico
vigilancia: identico
```

(`diff -q` sin salida = sin diferencias; el `-rq` recursivo cubre las 3
skills completas, no solo el SKILL.md del CA.)

### CA2 · Idempotencia (dos corridas literales)

Primera corrida:

```
$ npm run skills:sync
→ site-web
→ swarm-orquestacion
→ vigilancia

skills:sync — 3 skills desde @alephscript/skills-scriptorium@0.3.0 → .claude/skills/
exit=0

$ git status --porcelain
 M package.json
?? .claude/
?? scripts/sync-claude-skills.mjs
```

Segunda corrida (misma salida del script; `git status` idéntico, sin
cambios nuevos):

```
$ npm run skills:sync
→ site-web
→ swarm-orquestacion
→ vigilancia

skills:sync — 3 skills desde @alephscript/skills-scriptorium@0.3.0 → .claude/skills/
exit=0

$ git status --porcelain
 M package.json
?? .claude/
?? scripts/sync-claude-skills.mjs
```

Prueba definitiva — corrida **post-commit** (`b070405`), el árbol queda
limpio:

```
$ npm run skills:sync
→ site-web
→ swarm-orquestacion
→ vigilancia

skills:sync — 3 skills desde @alephscript/skills-scriptorium@0.3.0 → .claude/skills/
exit=0

$ git status --porcelain
(vacío = sin cambios)
```

### CA3 · Procedencia visible

```
$ cat .claude/skills/README.md
# .claude/skills — generado, NO editar a mano

Fuente: `@alephscript/skills-scriptorium@0.3.0` (instalado en `node_modules/`).
Este directorio es un espejo para el runner Claude Code; la fuente de
verdad es el paquete versionado. Cualquier cambio manual se pierde en la
siguiente regeneración: `npm run skills:sync`.

Skills sincronizadas:

- `site-web`
- `swarm-orquestacion`
- `vigilancia`
```

La versión no está hardcodeada: el script la lee de
`node_modules/@alephscript/skills-scriptorium/package.json` en cada corrida.
La lista de skills del README es además el manifiesto que la corrida
siguiente usa para borrar restos si el paquete elimina/renombra una skill.

### CA4 · Alcance del diff (contra la base U145)

```
$ git diff --name-only wp/u145-dep-skills-scriptorium...HEAD
.claude/skills/README.md
.claude/skills/site-web/…            (28 archivos)
.claude/skills/swarm-orquestacion/…  (18 archivos)
.claude/skills/vigilancia/…          (7 archivos)
package.json
scripts/sync-claude-skills.mjs
```

(55 rutas bajo `.claude/skills/**` — lista completa en `git show --stat
b070405`; ninguna ruta fuera de `.claude/skills/**`, `package.json`,
`scripts/sync-claude-skills.mjs` y, tras su commit, este reporte.)
`_plantilla` excluida:

```
$ ls .claude/skills | grep -c plantilla
0
exit=1 (no aparece)
```

### Verde local

```
$ npm run lint
✖ 11 problems (0 errors, 11 warnings)   ← warnings preexistentes (mismos 11 de U145)
exit=0

$ npm run gates
gates: OK (0 offenders)
exit=0
```

### Evidencia CI

| campo | valor |
| ----- | ----- |
| branch | `wp/u147-claude-skills` |
| run_id | **N/A** — sin push (brief: NO push) |
| workflow | CI |
| conclusion | **N/A** |

Nota honesta: `scripts/**` y `package.json` **no** caen en el paths-ignore
U104 (`plan/**` / `**.md`) — al pushear esta rama, el workflow CI **sí**
correrá y ese verde queda pendiente para la revisión/merge del orquestador.
No se inventa aquí.

## Demolición

n/a (WP aditivo según BACKLOG: «Demolición: n/a». No se borró ningún símbolo
ni archivo; el propio script demuele-y-recrea su salida en cada corrida).

```
(grep n/a)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no. El script deriva todo de
      `import.meta.url` → raíz del repo; el nombre del paquete es una
      constante (`PKG_NAME`) que es exactamente la cita de procedencia
      permitida. Cero puertos/URLs.
- [x] Cadenas if/switch que debieron ser tabla: no hay ramas sobre
      discriminante; la exclusión es tabla (`EXCLUDE = new Set([...])`).
- [x] Duplicación con otros paquetes: busqué — no existía ningún sync de
      skills en `scripts/` ni en workspaces; el patrón (constantes arriba,
      `node:fs`/`node:path`, salida `→ item` + resumen) replica
      `spec-redoc.mjs` en vez de inventar estilo nuevo.
- [x] console.log / código comentado / TODO sin backlog: los `console.log`
      del script son su salida de usuario (como el resto de scripts de
      `scripts/`), no depuración. Sin TODO ni código muerto.
- [x] Nombres fuera de glosario o de transición: no (`skills:sync`,
      `sync-claude-skills`; sin v2/old/new).
- [x] Demolición completa: n/a (aditivo).
- [x] Tests prueban comportamiento: no añadí test de node. Lo declaro:
      la verificación del CA es ejecutar el script real contra el paquete
      real (3 corridas, diff byte a byte, idempotencia post-commit con árbol
      limpio) — comportamiento entrada→salida observado, no «no explota».
      Si el orquestador quiere un test permanente (p. ej. sync a un tmpdir
      con fixture), lo veo razonable como residual; no estaba en el CA.
- [x] Arranque real verificado: lo arrancable es el propio script —
      `npm run skills:sync` ejecutado 3 veces con salida pegada arriba
      (node local v22.21.1).
- [x] README/specs siguen siendo verdad: el README nuevo
      (`.claude/skills/README.md`) es generado y dice de dónde viene y cómo
      regenerarse. No toqué ningún otro README; el consumo canónico
      multi-IDE (node_modules) documentado en U145/U146 no cambia.
- [x] El diff contiene solo el alcance del WP: sí (CA4). Los EOL de los 3
      `bin/*.mjs` que `npm install` reescribe se restauraron antes de
      committear (evidencia arriba) — el diff no los contiene.
- [x] Docs públicas C8/C9: n/a — nada bajo `docs/**`. El único comando
      nuevo copiable (`npm run skills:sync`) se ejecutó contra el canal
      real (este repo, paquete instalado); la lista de skills del README es
      **generada** en cada corrida (C9 opción 1), no manual.

## Hallazgos fuera de alcance

- **Workflow anidado en el espejo**: `site-web` trae un ejemplo con
  `.claude/skills/site-web/examples/mundo-limpio/.github/workflows/docs.yml`.
  Fuera de la raíz del repo es inerte para GitHub Actions, pero un scanner
  o un humano grepeando workflows puede sorprenderse. Viene del paquete
  (0.3.0); si molesta, el sitio de arreglarlo es el paquete, no este script.
- **EOL**: git avisó `LF will be replaced by CRLF` al añadir el espejo
  (autocrlf). Inofensivo hoy (el árbol queda limpio tras re-sync), pero es
  el mismo ruido de fondo que el hallazgo `.gitattributes` de U145 —
  refuerza ese residual.
- **engines**: el paquete declara `node >=22` (hallazgo U145); el sync corrió
  con v22.21.1 local. En CI/máquinas con node 18 (mínimo del raíz) el script
  en sí no usa APIs >22 (`cpSync` existe desde 16.7), pero la divergencia
  declarativa sigue viva.
- El `npm install` de este worktree repitió el realineado de lockfile ya
  commiteado en U145 sin cambios nuevos (lockfile estable) — confirma el
  diagnóstico de U145.

## Dudas / bloqueos

- Ninguno. Sin push (brief); CI queda para el momento de push/merge del
  orquestador. Base declarada: la rama de U145 — el merge a main debe
  llevar U145 → U147 en ese orden (como ya sugirió la revisión de U145).

---

## Revisión del orquestador

**Veredicto: Aceptado ✅** (orquestador · 2026-07-20)

### CA

- [x] CA1 — diff byte a byte reproducible; el `-rq` recursivo sobre las
      3 skills excede el CA en la dirección correcta.
- [x] CA2 — idempotencia con la prueba fuerte (post-commit, árbol
      limpio), no solo la débil.
- [x] CA3 — procedencia generada, versión leída del paquete (no
      hardcodeada); el README-manifiesto que permite podar skills
      retiradas es diseño mejor que lo pedido.
- [x] CA4 — reproducido por el orquestador contra la base U145: 56
      archivos, ninguno fuera de alcance; `_plantilla` ausente.
- [x] **Verificación de facto del orquestador** (evidencia que el worker
      no podía producir): al materializarse `.claude/skills/`, el runner
      Claude Code del orquestador **descubrió y listó las 3 skills**
      (`vigilancia`, `swarm-orquestacion`, `site-web`) como invocables.
      El CA implícito del sprint — «la skill se consume de verdad» —
      queda observado, no inferido.

### PRACTICAS

- Script con estilo de `scripts/` existentes ✓, tabla EXCLUDE ✓, error
  claro si falta install ✓. Auto-revisión honesta (test permanente
  declarado como no hecho — razonable, no estaba en CA; a residual).
- CI: N/A honesto; **condición de merge:** `scripts/**` + `package.json`
  disparan CI al pushear → exigir success.

### Merge

**U145 → U147** (este WP nace de esa rama; fast-forward natural) →
U146. Tras merge: `git worktree remove` de los tres árboles de agente.

### Hallazgos → destino

Workflow anidado en ejemplo de `site-web` → nota para el repo del
paquete (ticket de librería ya abierto); EOL/`.gitattributes` y
`engines.node` → refuerzan residuales U145; test permanente del sync →
cola residual.
