# WP-U122 · registry-password-auth — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (swarm chat WP-U122) |
| fecha | 2026-07-18 |
| rama | `wp/u122-registry-password-auth` |
| commit(s) | `27427d9` `ccf1f4b` `9374ae5` |
| estado propuesto | listo para revisión |

## Qué se hizo

Se cambió el bloque de auth de `.github/workflows/release.yml` al patrón
basic-auth durable **D-24 (a)**: secrets `NPM_USERNAME` + `NPM_PASSWORD`
(valor de `_password` ya en base64, como el `.npmrc.example` del registry /
`npm login`) escritos en `.npmrc` del job (`//host/:_password=` +
`username` + `always-auth`). Se eliminó la vía JWT: `registry-url`/
`scope` de `setup-node` (inyectaba bearer), `NODE_AUTH_TOKEN` y
`secrets.NPM_TOKEN`. Sin ambos secrets → `has_npm=false` y skip ⏳ limpio
(quality+test siguen corriendo). Se actualizó el test de contrato U53 y
menciones documentales del gate de publish (`ci.yml` comentario,
`.changeset/README.md`, `release-changeset-dry.mjs`, `PRACTICAS` §6).
**No** se inventaron ni commitearon credenciales; publish real = ops
post-merge.

## Archivos tocados

- `.github/workflows/release.yml` — modificado: auth `_password` + skip ⏳
- `.github/workflows/ci.yml` — modificado: comentario del gate de publish
- `test/release/release-u53.test.mjs` — modificado: contrato `_password` +
  asserts de demolición
- `scripts/release-changeset-dry.mjs` — modificado: mensaje ⏳ alineado
- `.changeset/README.md` — modificado: gate publish
- `plan/PRACTICAS.md` — modificado: §6 secrets
- `plan/REPORTES/WP-U122-registry-password-auth.md` — creado (este reporte)

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Contrato workflow (test U53 / U122)

```
$ node --test --test-name-pattern "publish gated on _password" test/release/release-u53.test.mjs
ok 1 - release.yml: release job needs quality+test; publish gated on _password basic-auth
# tests 1
# pass 1
# fail 0
```

### Demolición en `release.yml`

```
$ rg -n "NODE_AUTH_TOKEN|secrets\.NPM_TOKEN|registry-url:" .github/workflows/release.yml
(sin matches)

$ rg -n ":_password=" .github/workflows/release.yml
127:            echo "//${HOST}/:_password=${NPM_PASSWORD}"
```

### Path skip sin secret (simulación local del gate)

```
$ NPM_USERNAME= NPM_PASSWORD= bash -c 'if [ -n "${NPM_USERNAME}" ] && [ -n "${NPM_PASSWORD}" ]; then echo has_npm=true; else echo has_npm=false; echo "NPM_USERNAME/NPM_PASSWORD absent — publish/tag/GitHub Release skipped (⏳)"; fi'
has_npm=false
NPM_USERNAME/NPM_PASSWORD absent — publish/tag/GitHub Release skipped (⏳)
```

### CA `npm view @zeus/protocol --registry=…`

```
$ npm view @zeus/protocol --registry=https://npm.scriptorium.escrivivir.co version
npm error code E404
npm error 404 Not Found - GET https://npm.scriptorium.escrivivir.co/@zeus%2fprotocol - no such package available
```

⏳ **documentado**: ops aún no cargó `NPM_USERNAME`/`NPM_PASSWORD` en Actions
ni hay publish real post-merge; el paquete no está en el registry. El CA
«con secret + tests verdes → versión publicada» queda para ops tras merge
de este WP (frontera D-24).

### Lint / gates

⏳ **sin verificar** — WP de workflow/docs; CA no exige lint del monorepo.
Verificación acotada al test de contrato del workflow.

### Arranque / publish real en Actions

⏳ **sin verificar** — política WP: no inventar secrets; publish = ops
post-merge. El path skip está cableado en el job `release` tras
`needs: [quality, test]`.

## Demolición

Wiring `_authToken` / JWT-as-`NPM_TOKEN` como única vía en el workflow:

- eliminado `registry-url` + `scope` del `setup-node` del job `release`
  (evita inyección bearer)
- eliminados `NODE_AUTH_TOKEN` / `NPM_TOKEN` del env de `changesets/action`
- detect credentials ya no lee `secrets.NPM_TOKEN`

```
$ rg -n "NODE_AUTH_TOKEN|secrets\.NPM_TOKEN|registry-url:" .github/workflows/release.yml
(sin matches)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: solo host del registry
  `npm.scriptorium.escrivivir.co` en el step de auth (mismo host que
  `.npmrc` / U50; no hay puerto nuevo).
- [x] Cadenas if/switch que debieron ser tabla: N/A (gate binario
  has_creds).
- [x] Duplicación con otros paquetes: N/A (workflow).
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres fuera de glosario o de transición: no (`_password` es el
  campo npm/Verdaccio; D-24 (a)).
- [x] Demolición completa (grep arriba): sí en `release.yml`.
- [x] Tests prueban comportamiento: contrato YAML (secrets, `:\_password=`,
  ausencia de JWT wiring) — no solo «no explota».
- [ ] Arranque real verificado: ⏳ sin secret en Actions / sin publish.
- [x] README/specs del paquete siguen siendo verdad: actualizados
  comentarios/docs del gate; no hay `.npmrc.example` en este repo (vive
  en el registry ops).
- [x] El diff contiene solo el alcance del WP: sí (workflow + contrato +
  docs del gate). No U55, no credenciales.

## Hallazgos fuera de alcance

- `test/release/release-u53.test.mjs` «version tree prepared…» falla en
  esta punta: hay **6** changesets pendientes en `.changeset/`
  (`wp-u109`, `u113`, `u116`, `u117`, `u119`, `u70`) mientras el test
  exige `pending.length === 0`. Preexistente; no tocado.
- `plan/ARQUITECTURA.md` §5 aún cita `NPM_TOKEN` en el gate de publish —
  no tocado aquí (queda desalineado tras U122; candidato higiene orquestador).
- Reportes históricos U53 siguen nombrando `NPM_TOKEN` — no reescritos.
- No se localizó `.npmrc.example` dentro de zeus-sdk; el patrón se tomó
  de D-24/ENTREGA-18d + formato Verdaccio/`npm login` (`:_password` +
  `username`).

## Dudas / bloqueos

- Ops debe crear en GitHub Actions (post-merge) los secrets
  `NPM_USERNAME` y `NPM_PASSWORD` (`NPM_PASSWORD` = valor base64 de
  `_password` del login al registry, sin comillas). Hasta entonces el
  job `release` hará skip ⏳ (esperado).
- CA `npm view @zeus/protocol` verde = post-ops + primer publish real
  (desbloquea U55); no es verificable en este WP.

---

## Revisión del orquestador

**Aceptado ✅** — orquestador / 2026-07-18 · tip `9374ae5`.

Verificado:
- Diff = `release.yml` + contrato U53 + docs del gate (sin BACKLOG / sin
  credenciales / sin U55).
- Test contrato `_password` pass 1/1 (re-smoke orquestador).
- Demolición: `NODE_AUTH_TOKEN` / `secrets.NPM_TOKEN` / `registry-url:` → 0
  en `release.yml`; skip ⏳ sin secrets cableado.
- CA `npm view` ⏳ honesto (ops + primer publish post-merge; frontera D-24).
- Hallazgo no bloqueante: `ARQUITECTURA.md` §5 aún cita `NPM_TOKEN` → cola.

**Merge:** `wp/u122-registry-password-auth` → `main`. Tras merge: Sprint 1
cerrado; U55 sigue gated a ops (secrets + publish real).
