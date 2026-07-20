# WP-U145 · dep-skills-scriptorium — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Claude Code, background) |
| fecha | 2026-07-20 |
| rama | `wp/u145-dep-skills-scriptorium` |
| commit(s) | `b7110ad` (dep) + commit de este reporte |
| estado propuesto | listo para revisión |

## Qué se hizo

Se añadió `@alephscript/skills-scriptorium` como devDependency del
`package.json` raíz con **versión exacta `0.3.0`** (sin `^` ni `~`; el pin es
doctrina D-35). `npm install` resolvió el paquete desde el registry propio vía
`.npmrc` (scope `@alephscript` ya apuntaba ahí; no se pasó `--registry` al
install). Se verificó el contenido instalado: `skills/` del paquete contiene
`vigilancia`, `swarm-orquestacion`, `site-web` y `_plantilla`, y
`skills/vigilancia/SKILL.md` existe. Verde local: `npm run lint` (exit 0, 0
errores, 11 warnings preexistentes) y `npm run gates` (`OK (0 offenders)`).
Sin push (repo de trabajo local): evidencia CI = N/A, ver subsección.

## Archivos tocados

- `package.json` · modificado — devDependency `"@alephscript/skills-scriptorium": "0.3.0"` (exacta)
- `package-lock.json` · modificado — entrada nueva del paquete (resolved al
  registry propio, `dev: true`) + realineado de versiones workspace que
  `npm install` sincroniza (ver §hallazgos)
- `plan/REPORTES/WP-U145-dep-skills-scriptorium.md` · creado — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### CA1 · `skills/vigilancia/SKILL.md` instalado (ls literal)

```
$ ls -1 node_modules/@alephscript/skills-scriptorium/skills/
_plantilla/
site-web/
swarm-orquestacion/
vigilancia/

$ ls -l node_modules/@alephscript/skills-scriptorium/skills/vigilancia/SKILL.md
-rw-r--r-- 1 aleph 197121 2336 Jul 20 11:00 node_modules/@alephscript/skills-scriptorium/skills/vigilancia/SKILL.md
exit=0
```

Los cuatro directorios esperados (`vigilancia`, `swarm-orquestacion`,
`site-web`, `_plantilla`) están presentes.

### CA2 · versión fijada resoluble contra el registry (patrón I60)

```
$ npm view @alephscript/skills-scriptorium@0.3.0 --registry=https://npm.scriptorium.escrivivir.co version
0.3.0
exit=0
```

### CA3 · alcance del diff

```
$ git diff --name-only main...HEAD
package-lock.json
package.json
plan/REPORTES/WP-U145-dep-skills-scriptorium.md
```

Solo los tres archivos del CA. Entrada del lockfile (extracto del diff):

```
+    "node_modules/@alephscript/skills-scriptorium": {
+      "version": "0.3.0",
+      "resolved": "https://npm.scriptorium.escrivivir.co/@alephscript/skills-scriptorium/-/skills-scriptorium-0.3.0.tgz",
+      "dev": true,
```

### Verde local

```
$ npm install
added 2689 packages, and audited 2875 packages in 3m
… exit 0   (53 vulnerabilities preexistentes reportadas por audit — ver §hallazgos)

$ npm run lint
✖ 11 problems (0 errors, 11 warnings)
exit=0

$ npm run gates
gates: OK (0 offenders)
exit=0
```

### Evidencia CI

| campo | valor |
| ----- | ----- |
| branch | `wp/u145-dep-skills-scriptorium` |
| run_id | **N/A** — sin push (repo de trabajo local; brief: NO push) |
| workflow | CI |
| conclusion | **N/A** |

Nota honesta: `package*.json` **no** cae en el paths-ignore U104
(`plan/**` / `**.md`), así que si esta rama se pushease, el workflow CI
**sí correría**. Ese verde queda pendiente del momento de push/merge del
orquestador — no se inventa aquí.

## Demolición

n/a (WP aditivo según BACKLOG: «Demolición: n/a». No se borró ningún símbolo
ni archivo).

```
(grep n/a)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: la URL del registry aparece solo
      en `package-lock.json` (campo `resolved`, generado por npm — es su
      formato, no código) y en la evidencia CA2 (el brief pide explicitarla ahí
      como en I60). Cero en código.
- [x] Cadenas if/switch que debieron ser tabla: n/a (sin código)
- [x] Duplicación con otros paquetes: n/a; la dep es única y nueva en el raíz
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: no; versión exacta sin sufijos
- [x] Demolición completa: n/a (WP aditivo)
- [x] Tests prueban comportamiento: n/a — WP de dependencia; la verificación
      es CA1 (contenido instalado) + CA2 (registry resuelve la versión fijada)
- [x] Arranque real verificado: lo «arrancable» aquí es la instalación —
      `npm install` real ejecutado y contenido de `node_modules` listado (CA1);
      no se levantó ningún proceso porque el WP no toca runtime
- [x] README/specs del paquete siguen siendo verdad: no se tocó ningún README;
      el consumo de las skills (`.claude/skills/`) es U147, no este WP
- [x] El diff contiene solo el alcance del WP: sí (CA3). Matiz honesto: el
      diff de `package-lock.json` incluye, además de la entrada nueva,
      realineado de versiones workspace (`@zeus/* 0.1.1→0.1.2`, `file:`→semver)
      que npm sincroniza al correr `install` con lockfile desactualizado —
      inevitable y dentro del archivo permitido por el CA; detallado en
      §hallazgos. Además `npm install` reescribió EOL de 3 `bin/*.mjs`
      (diff textual vacío, solo CRLF); se restauraron con `git restore` para
      no contaminar el diff.
- [x] Docs públicas C8/C9: n/a — no se tocó docs; el único comando citado
      (CA2) se ejecutó contra el canal real (registry propio), C8 cumplido

## Hallazgos fuera de alcance

- **Lockfile desincronizado en main**: `package-lock.json` de `main` tenía
  versiones workspace viejas (`@zeus/presets-sdk 0.1.1` vs `0.1.2` real,
  `@zeus/protocol 0.1.0` vs `0.2.0`, deps `file:` de `operator-ui` ya
  migradas a semver). `npm install` lo realineó dentro de este WP (mismo
  archivo del CA). Sugiere que tras los últimos bumps nadie regeneró el
  lockfile en main. Candidato residual: regenerarlo/verificarlo en CI.
- **npm audit**: 53 vulnerabilidades (6 críticas) preexistentes en el árbol
  de devDependencies (ninguna introducida por este WP; `skills-scriptorium`
  no tiene deps). Candidato residual si se quiere triage.
- **EOL de `bin/*.mjs`**: `npm install` reescribe con LF tres binarios de
  workspaces (`feed-kit`, `linea-kit`, `playbook-kit`) y git (autocrlf) los
  marca modificados sin diff textual. Ruido recurrente para cualquier worker
  que corra `install`; candidato: `.gitattributes` con `eol` explícito para
  `bin/*.mjs`.
- El paquete declara `engines.node >=22` mientras el raíz declara
  `>=18.0.0`. npm instaló sin protesta (sin `engine-strict`), pero es una
  divergencia a vigilar cuando U147 ejecute el sync con el node local.

## Dudas / bloqueos

- Ninguno. El registry resolvió `0.3.0` sin incidencias. NO push / NO merge /
  NO BACKLOG (orquestador). U147 puede arrancar desde esta rama (dep
  disponible en `node_modules`).

---

## Revisión del orquestador

**Veredicto: Aceptado ✅** (orquestador · 2026-07-20)

### CA

- [x] CA1 — `skills/vigilancia/SKILL.md` + 4 dirs en `node_modules`: ls
      literal en reporte; coherente con el contenido 0.3.0 conocido.
- [x] CA2 — `npm view …@0.3.0 version` → `0.3.0` exit 0 (patrón I60).
- [x] CA3 — diff reproducido por el orquestador desde main:
      `package.json` (+1 línea, versión exacta sin rango) ·
      `package-lock.json` (`resolved` al registry propio, `dev: true`) ·
      reporte. Nada más.

### PRACTICAS

- Pin exacto = doctrina D-35 ✓ · cero secrets ✓ · BACKLOG intocado ✓ ·
  realineado workspace del lockfile: dentro del archivo del CA, declarado
  con honestidad — aceptado como inevitable de `npm install`.
- CI: N/A por «NO push» del brief. **Condición de merge:** al pushear,
  `package*.json` dispara CI → exigir conclusion success en el run del
  push antes de dar por cerrado el sprint (no sustituible por verde local).

### Merge

Orden sugerido: **U145 → U147 → U146** (U147 parte de esta rama; U146 es
solo `plan/`, sin conflicto esperado salvo trivial en REPORTES/).

### Hallazgos → cola residual

Los 4 hallazgos (lockfile main desincronizado, audit 53 vulns, EOL
`bin/*.mjs` → `.gitattributes`, `engines.node` 22 vs 18) pasan a la cola
residual del BACKLOG — sin GO no hay WP.
