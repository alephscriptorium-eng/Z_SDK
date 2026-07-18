# WP-U122 · registry-password-auth — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (swarm chat WP-U122 · resume) |
| fecha | 2026-07-18 |
| rama | `wp/u122-registry-password-auth` |
| commit(s) | `27427d9` `5a4db5a` (tip) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se cambió el bloque de auth de `.github/workflows/release.yml` al patrón
basic-auth durable **D-24 (a)** alineado al canónico
`aleph-scriptorium/ScriptoriumVps/.npmrc.example`:
`username` + `_password` (solo-password base64) + `email` + `always-auth`.
Secrets Actions: `NPM_USERNAME` + `NPM_PASSWORD` (valor de `_password` ya
en base64). Email CI fijo `ci@scriptorium.escrivivir.co` (ops no carga
`NPM_EMAIL`). **NO** `_auth` · **NO** `_authToken`. Anti-patrón
`ScriptoriumVps/PATTERN-DOCKER/verdaccio/.npmrc.example` (`_authToken`
JWT) no se copió. Sin ambos secrets → `has_npm=false` y skip ⏳ limpio
(quality+test siguen). Demolición: vía JWT (`registry-url`/`scope` de
`setup-node`, `NODE_AUTH_TOKEN`, `secrets.NPM_TOKEN`). Contrato U53 y
docs del gate actualizados. **No** se inventaron credenciales; publish
real = ops post-merge.

## Archivos tocados

- `.github/workflows/release.yml` — modificado: auth canónico `_password`
- `.github/workflows/ci.yml` — modificado: comentario del gate de publish
- `test/release/release-u53.test.mjs` — modificado: contrato orden +
  demolición `_auth`/`_authToken`
- `scripts/release-changeset-dry.mjs` — modificado: mensaje ⏳ alineado
- `.changeset/README.md` — modificado: gate publish
- `plan/PRACTICAS.md` — modificado: §6 secrets
- `plan/REPORTES/WP-U122-registry-password-auth.md` — creado/actualizado

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Canónico localizado

```
$ ls /c/Users/aleph/OASIS/aleph-scriptorium/ScriptoriumVps/.npmrc.example
/c/Users/aleph/OASIS/aleph-scriptorium/ScriptoriumVps/.npmrc.example

# campos (sin valores secretos):
//npm.scriptorium.escrivivir.co/:username=…
//npm.scriptorium.escrivivir.co/:_password=…
//npm.scriptorium.escrivivir.co/:email=…
//npm.scriptorium.escrivivir.co/:always-auth=true
# cabecera: NO _auth ni _authToken
```

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
$ rg -n "NODE_AUTH_TOKEN|secrets\.NPM_TOKEN|registry-url:|:_authToken=|:_auth=" .github/workflows/release.yml
(sin matches)

$ rg -n ":username=|:_password=|:email=|:always-auth=" .github/workflows/release.yml
132:            echo "//${HOST}/:username=${NPM_USERNAME}"
133:            echo "//${HOST}/:_password=${NPM_PASSWORD}"
134:            echo "//${HOST}/:email=ci@scriptorium.escrivivir.co"
135:            echo "//${HOST}/:always-auth=true"
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
- eliminados `NODE_AUTH_TOKEN` / `NPM_TOKEN` del env de `changesets/action`
- detect credentials ya no lee `secrets.NPM_TOKEN`
- asserts de contrato: no `:_authToken=` ni `:_auth=`

```
$ rg -n "NODE_AUTH_TOKEN|secrets\.NPM_TOKEN|registry-url:|:_authToken=|:_auth=" .github/workflows/release.yml
(sin matches)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: solo host del registry
  `npm.scriptorium.escrivivir.co` en el step de auth (mismo host que
  `.npmrc` / U50; no hay puerto nuevo).
- [x] Cadenas if/switch que debieron ser tabla: N/A (gate binario
  has_creds).
- [x] Duplicación con otros paquetes: N/A (workflow); patrón tomado del
  canónico externo ScriptoriumVps, no de PATTERN-DOCKER/verdaccio.
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres fuera de glosario o de transición: no (`_password` es el
  campo npm/Verdaccio; D-24 (a)).
- [x] Demolición completa (grep arriba): sí en `release.yml`.
- [x] Tests prueban comportamiento: contrato YAML (orden canónico,
  secrets, ausencia de JWT/`_auth`) — no solo «no explota».
- [ ] Arranque real verificado: ⏳ sin secret en Actions / sin publish.
- [x] README/specs del paquete siguen siendo verdad: actualizados
  comentarios/docs del gate; canónico vive en ScriptoriumVps (citado).
- [x] El diff contiene solo el alcance del WP: sí (workflow + contrato +
  docs del gate). No U55, no credenciales, no BACKLOG.

## Hallazgos fuera de alcance

- `test/release/release-u53.test.mjs` «version tree prepared…» falla si
  hay changesets pendientes en `.changeset/` (`pending.length === 0`).
  Preexistente; no tocado.
- `plan/ARQUITECTURA.md` §5 aún cita `NPM_TOKEN` en el gate de publish —
  no tocado (candidato higiene orquestador).
- `plan/DECISIONES.md` §abiertas aún nombra `NPM_TOKEN` en ops residual
  (a) — desalineado tras D-24 (a); no tocado (solo usuario cierra DA).
- Reportes históricos U53 siguen nombrando `NPM_TOKEN` — no reescritos.

## Dudas / bloqueos

- Ops debe crear en GitHub Actions (post-merge) los secrets
  `NPM_USERNAME` y `NPM_PASSWORD` (`NPM_PASSWORD` = valor base64 de
  `_password` del login al registry, sin comillas). Hasta entonces el
  job `release` hará skip ⏳ (esperado).
- CA `npm view @zeus/protocol` verde = post-ops + primer publish real
  (desbloquea U55); no es verificable en este WP.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
