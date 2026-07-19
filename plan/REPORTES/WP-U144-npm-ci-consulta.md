# WP-U144 · npm-ci-consulta — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok) |
| fecha | 2026-07-19 |
| rama zeus | `wp/u144-npm-ci-consulta` |
| rama library | `wp/u144-npm-ci-consulta` |
| commit(s) library | `ad9627c` |
| commit(s) zeus | `bcf0e30` |
| opción CA | **A** (`npm ci` + build Docs verde) |
| estado propuesto | listo para revisión |

## Qué se hizo

Consulta ENTREGA Sprint 3 §Nota ítem 2 / D-34: el `docs.yml` del catálogo
usaba `npm install` mientras el portal zeus usa `npm ci`. Se eligió **opción A**
(preferencia orquestador): hay `package-lock.json` + `.npmrc` con scopes
`@zeus` / `@alephscript` → registry; `npm ci` resuelve del registry vía
lockfile igual que `install`.

En library se cambió el step a `npm ci`, se alineó el nombre del step a
`Install` (como portal zeus) y se sustituyó la prosa «(@zeus desde registry)»
por un comentario que documenta por qué `npm ci` basta. Verificación local
`npm ci` + `npm run docs:build` OK; Actions Docs en la rama
`success` (workflow_dispatch: el push solo tocó `.github/workflows/docs.yml`,
fuera de `paths: docs/**`).

No se tocó U143 (`docs/public/CNAME`), DNS, ni BACKLOG.

## Archivos tocados

- library `.github/workflows/docs.yml` — modificado: `npm install` → `npm ci`;
  prosa del step alineada
- zeus `plan/REPORTES/WP-U144-npm-ci-consulta.md` — creado (este reporte)

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Local (library worktree)

```
$ npm ci
added 434 packages, and audited 448 packages in 1m
… exit 0

$ npm run docs:build
> z-sdk-games-library@0.0.0 docs:build
> vitepress build docs
  vitepress v1.6.4
✓ building client + server bundles...
✓ rendering pages...
build complete in 16.11s.
… exit 0
```

### Diff library (acotado)

```
-      - name: Install (@zeus desde registry)
-        run: npm install
+      # npm ci: lockfile + .npmrc (@zeus / @alephscript → registry); mismo canal que portal zeus.
+      - name: Install
+        run: npm ci
```

Referencia (solo lectura): zeus `.github/workflows/docs.yml` step `Install` /
`npm ci`.

### Evidencia CI

| campo | valor |
| ----- | ----- |
| branch | `wp/u144-npm-ci-consulta` (library) |
| run_id | `29704186751` |
| workflow | Docs |
| conclusion | `success` |
| nota | `workflow_dispatch` — push no disparó Docs (`paths: docs/**` only) |

```
$ gh run list --branch wp/u144-npm-ci-consulta --limit 5
completed	success	Docs	Docs	wp/u144-npm-ci-consulta	workflow_dispatch	29704186751	35s	2026-07-19T21:20:46Z
completed	success	ci(docs): usar npm ci en workflow del catálogo	CI	wp/u144-npm-ci-consulta	push	29704173737	41s	2026-07-19T21:20:21Z
```

```
$ gh run view 29704186751 --json conclusion,status,displayTitle,url,headSha
{"conclusion":"success","displayTitle":"Docs","headSha":"ad9627c1e20bd6477ada416c471ac7becf0d4cf2","status":"completed","url":"https://github.com/alephscriptorium-eng/Z_SDK-games-library/actions/runs/29704186751"}
```

Job Docs: step **Install** (`npm ci`) ✓ → **Build VitePress catalog** ✓
(Upload Pages artifact skipped: no `main`).

Zeus (solo reporte bajo `plan/`): **N/A** (paths-ignore U104).

## Demolición

Prosa del step «Install (@zeus desde registry)» eliminada (sugería que solo
`npm install` traía deps del registry). Sustituida por comentario + nombre
`Install` alineado al portal. n/a de símbolos/código de producto.

```
(grep n/a — solo yml de workflow)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no tocados (solo yml + comentario
      de registry ya existente vía `.npmrc`)
- [x] Cadenas if/switch que debieron ser tabla: n/a
- [x] Duplicación con otros paquetes: n/a; patrón copiado del portal zeus
      `docs.yml` (referencia brief)
- [x] console.log / código comentado / TODO sin backlog: comentario
      intencional en yml (motivo consulta documentado)
- [x] Nombres fuera de glosario o de transición: no
- [x] Demolición completa: prosa obsoleta del step retirada
- [x] Tests prueban comportamiento: CA = build Docs; no tests unitarios
      nuevos (WP workflow-only)
- [x] Arranque real verificado: `docs:build` local + Actions Docs success
- [x] README/specs del paquete siguen siendo verdad: no tocados
- [x] El diff contiene solo el alcance del WP: sí (yml library + reporte
      zeus)
- [x] C8/C9: n/a — no se tocó docs públicas / comandos copiables (solo
      workflow interno)

## Hallazgos fuera de alcance

- `docs.yml` library (y portal zeus) filtran `paths: docs/**` y **no** incluyen
  `.github/workflows/docs.yml`: un cambio solo de workflow no dispara Docs en
  push; hace falta `workflow_dispatch` (o ampliar paths). Candidato residual
  menor si se quiere evidencia automática en WPs de yml.
- `ci.yml` del catálogo sigue en `npm install` (fuera de alcance U144; solo
  Docs).

## Dudas / bloqueos

Ninguno. Opción A cumplida. NO merge / NO ✅ (orquestador).

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
