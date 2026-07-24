# GATE · R11-Z FAIL · cierre Ola B Sprint 8 · 2026-07-24

## Veredicto

**R11-Z FAIL técnico.**

U164 ✅ y U166 ✅ quedan aceptados. U165 requiere corrección dentro de su
alcance antes de cerrar Ola B / Sprint 8.

## Evidencia verde

- Tip código: `348183850f3197c5c0600db3299da82c46a7dec4`.
- HEAD: `5032cbb9254351d0ac6e6f3ffe9a93a95eadb9bf` =
  `origin/main`; working tree limpio.
- Orden comprobado: merges U164 `6a2a409` y U166 `25cf693` son ancestros
  del merge U165 `3481838`.
- CI `30083260737`: success; smoke registry `89449461940`: success.
- Docs `30083260612`: success.
- Release de árbol `packages/**` equivalente, `30082419532`: success.
- Re-gate ejecutado: P0×4 PASS; fail-probe `*` devuelve exit 1.
- Audit: 49 = 29 publicados + 5 candidatos + 15 privados.
- Los cuatro manifests P0 conservan `private: true`; no hay changesets de
  publicación, cambios de workflow publish ni publish.
- Worktrees, ramas `wp/*`, stash y locks: cero.

## Bloqueo

El CA de U165 exige un comando que falle cuando una dependencia interna
viole la condición publish-ready de semver fijado/resoluble en registry.

En `scripts/gate-publish-ready.mjs`, `isRegistryRange()` solo rechaza:

- `*`;
- prefijos `workspace:`, `file:` y `link:`;
- valores que empiezan por `.` o `/`.

Por tanto acepta como válidos, entre otros:

- `latest` u otro dist-tag;
- `github:org/repo` / `git+https://...`;
- `https://...`;
- rutas absolutas Windows como `C:\...`;
- una versión semver exacta inexistente en el registry.

El mensaje del gate afirma “expected a registry semver range”, pero el
predicado no demuestra esa propiedad. El único fail-probe cubre `*`.
El estado actual de los P0 es correcto; el defecto está en el sensor que
debe impedir regresiones futuras, núcleo de U165.

## Corrección requerida

Reabrir U165 como corrección del mismo WP, sin crear un WP nuevo:

1. Validar semver conforme a la política de pines P0; rechazar tags, Git,
   URL, alias/protocolos locales y rutas POSIX/Windows.
2. Comprobar que cada `@zeus/*@versión` medida sea resoluble en el registry
   canónico, o documentar y probar un mecanismo equivalente sin workspace.
3. Añadir pruebas rojas para al menos `*`, `latest`, Git/URL, ruta Windows y
   versión inexistente; mantener una prueba verde.
4. Re-ejecutar P0×4, fail-probes, gates, lint y CI.
5. Mantener allowlist solo lectura, `private` intacto, cero changesets de
   publicación y cero publish.

## Decisión del custodio

**No hace falta un GO nuevo:** es corrección del CA ya autorizado de U165.
No dar GO publish.

## Handoff copiable al orquestador-Z

```text
R11-Z FAIL técnico.

U164 ✅ y U166 ✅ se conservan.
Reabrir solo U165 para corregir su gate:
- isRegistryRange acepta latest, git/url y rutas Windows
- tampoco prueba existencia de la versión en registry
- añadir validación semver/pin + resolubilidad C8
- añadir probes rojos: *, latest, git/url, C:\ruta, versión inexistente
- mantener probe verde
- re-gate P0x4 + gates + lint + CI

No WP nuevo y no GO nuevo: corrección dentro del CA U165.
Allowlist solo lectura.
No private, no changesets de publicación, no publish.
Después pedir reintento R11-Z a SOL.
DC-15 LOCAL-ONLY.
```
