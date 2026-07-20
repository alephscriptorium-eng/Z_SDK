# WP-U149 · baseline-031 — reporte

| dato | valor |
| ---- | ----- |
| agente | ejecutor lote Sprint 5 (orquestador+worker) |
| fecha | 2026-07-20 |
| rama | `wp/u149-baseline-031` |
| commits | _(tip tras commit de este reporte)_ |
| eje(s) CA | ninguno (gobierno) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se fijó `package-lock.json` en `@alephscript/skills-scriptorium@0.3.1`
(bump ya presente en working tree post-D-37). Se corrió `npm run skills:sync`
(espejo `.claude/skills/` regenerado desde 0.3.1; gitignorado). Se citó la
regla 15 (`reglas-metodo-v04`) en `plan/roles/README.md` §Runners/IDEs y se
añadió el ítem de checklist de cierre de ola v0.4 (residuo IDE + memoria
no-citada) a `plan/PRACTICAS.md` §7. Sin refactor retro: zeus ya cumple
(carpetas IDE trackeadas sin markdowns de sesión).

## Archivos tocados

- `package-lock.json` · modificado — version/resolved/integrity → 0.3.1
- `plan/roles/README.md` · modificado — cita regla 15 en §Runners/IDEs
- `plan/PRACTICAS.md` · modificado — checklist cierre ola v0.4 en §7
- `plan/REPORTES/WP-U149-baseline-031.md` · creado — este reporte

## Evidencia

### CA1 · `npm view …@0.x` incluye 0.3.1

```
$ npm view @alephscript/skills-scriptorium@0.x version
@alephscript/skills-scriptorium@0.1.0 '0.1.0'
@alephscript/skills-scriptorium@0.2.0 '0.2.0'
@alephscript/skills-scriptorium@0.3.0 '0.3.0'
@alephscript/skills-scriptorium@0.3.1 '0.3.1'
exit=0

$ node -e "console.log(require('./node_modules/@alephscript/skills-scriptorium/package.json').version)"
0.3.1
```

### CA2 · `grep -c "regla 15" plan/` ≥ 1

```
$ grep -rc "regla 15" plan/roles/README.md plan/PRACTICAS.md
plan/roles/README.md:1
plan/PRACTICAS.md:2
```

### CA3 · lockfile 0.3.1

```
$ node -e "const l=require('./package-lock.json'); console.log(l.packages['node_modules/@alephscript/skills-scriptorium'].version)"
0.3.1
```

Extracto:

```
"node_modules/@alephscript/skills-scriptorium": {
  "version": "0.3.1",
  "resolved": "https://npm.scriptorium.escrivivir.co/@alephscript/skills-scriptorium/-/skills-scriptorium-0.3.1.tgz",
  "integrity": "sha512-dH3yWnJJC+S1LoSBFBWWwaCfQgVKMeocwmkCgq0nMq2PbgQBVq7fUIGIpoTl3Jv8OYN9Wv/yAtpdpQh5D2TcJg==",
```

### CA4 · gates

```
$ npm run gates
gates: OK (0 offenders)
exit=0
```

### skills:sync (espejo local, fuera de git)

```
$ npm run skills:sync
→ site-web
→ swarm-orquestacion
→ vigilancia
skills:sync — 3 skills desde @alephscript/skills-scriptorium@0.3.1 → .claude/skills/
```

## Auto-revisión (PRACTICAS)

- [x] Diff solo dentro de ALCANCE_DIFF: package-lock + roles/README + PRACTICAS + reporte
- [x] Cero árboles copiados de otros mundos
- [x] Sellos con fuente; regla 15 citada desde reglas-metodo-v04 del paquete
- [x] Sin fluff / promesas sin pendiente
- [x] Eje: ninguno (gobierno)
- [x] Gates OK
- [x] Commits convencionales
- [x] Diff solo del alcance del WP

## Hallazgos fuera de alcance

- `npm view …@0.x version` lista **todas** las versiones 0.x (no solo la
  efectiva). La efectiva queda en lockfile + `node_modules`. Candidato a
  notar en handoff semver (Punto 1) — no bloquea.
- Espejo `.claude/` tras sync incluye `reglas-metodo-v04.md` (antes el
  espejo local podía estar en v0.3) — esperado; fuera de git.

## Dudas / bloqueos

Ninguno. CI run_id = N/A sin push (protocolo: no push salvo pedido).

---

## Revisión del orquestador

**Veredicto: Aceptado ✅** (orquestador · 2026-07-20)

### CA
- [x] CA1 — `npm view …@0.x version` incluye 0.3.1 (reproducido)
- [x] CA2 — `grep -c "regla 15"` en roles/README + PRACTICAS ≥ 1
- [x] CA3 — lockfile `skills-scriptorium` = 0.3.1
- [x] CA4 — `npm run gates` → OK (0 offenders)
- [x] ALCANCE_DIFF respetado (4 ficheros); ceguera OK (sin rutas/sesión)

### Merge
Stack vía **U152** (ff `9f35f13`→`9c5b842`); tip U149 `9290073` en main.
