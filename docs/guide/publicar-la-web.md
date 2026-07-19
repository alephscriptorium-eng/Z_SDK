# Publicar la web (portal de docs)

Cómo regenerar y publicar el portal VitePress de este monorepo, y cómo
encaja el catálogo hermano de la library. Doctrina operativa: lo que hay
que editar, qué comandos corren, qué dispara Actions y qué queda en
Settings / DNS.

---

## Piezas

| Pieza | Dónde |
| ----- | ----- |
| Fuente Markdown / VitePress | `docs/` (este repo) |
| Dev local | `npm run docs:dev` |
| Build estático | `npm run docs:build` |
| CI / deploy | `.github/workflows/docs.yml` → GitHub Pages |
| Dominio publicado | `https://z-sdk.escrivivir.co/` (`base` VitePress = `/`) |
| Catálogo de juegos | repo hermano `Z_SDK-games-library` → `https://games.z-sdk.escrivivir.co/` |

El workflow **no** publica paquetes npm ni start packs: solo construye el
sitio y, en `main`, lo sube a Pages.

---

## Ciclo local

### 1. Editar

Todo el portal vive bajo `docs/`. Guías en `docs/guide/`, mapa conceptual
en `docs/engine|editor|mesh|games/`, contratos generados bajo
`docs/contracts/` (y HTML de API que produce el build).

La navegación (nav / sidebar) está en `docs/.vitepress/config.mjs`: si
añadís una página nueva que deba aparecer en el menú, enlazadla ahí.

### 2. Previsualizar

```bash
npm run docs:dev
```

Arranca VitePress en el puerto de docs de `presets-sdk/env` (por defecto
3230; override con `-- --port N`). El navegador solo se abre si
`ZEUS_OPEN_BROWSER=1`.

### 3. Construir

```bash
npm run docs:build
```

En este monorepo el script regenera specs (AsyncAPI / OpenAPI / resources)
y después hace `vitepress build docs`. Salida estática:
`docs/.vitepress/dist`.

Si el build falla en local, el job de Actions también fallará: no
empujéis `docs/**` a `main` sin verde aquí.

---

## Publicar (Actions → Pages)

Workflow canónico: `.github/workflows/docs.yml` en la raíz de este repo.

### Qué lo dispara

| Evento | Efecto |
| ------ | ------ |
| `push` a `main` o `wp/**` con cambios bajo `docs/**` | job `docs:build` |
| `pull_request` con cambios bajo `docs/**` | solo build (sin deploy) |
| `workflow_dispatch` | build manual; deploy solo si la ref es `main` |

Un push que **no** toca `docs/**` no corre este workflow (economía de
builds). Para forzar un rebuild sin tocar Markdown: Actions → Docs →
**Run workflow**.

### Qué hace el job

1. `npm ci`
2. `npm run docs:build`
3. Si la ref es `main` y el evento no es PR: sube el artefacto
   `docs/.vitepress/dist` y el job `deploy` publica en el environment
   `github-pages`.

En ramas `wp/**` el build valida el portal; **no** despliega. El sitio
vivo solo cambia al mergear (o pushear) a `main` con verde.

### Camino típico

1. Rama `wp/…`, editá `docs/**`, `npm run docs:build` en local.
2. Push → Actions corre build en la rama.
3. Merge a `main` → build + deploy Pages.
4. Alternativa en `main`: **workflow_dispatch** si hace falta republicar
   sin un diff de docs.

---

## Dominio custom + HTTPS

Código: VitePress usa `base: '/'` (también en Actions), pensado para el
hostname propio — no para el path `/Z_SDK/` de `*.github.io`.

Ops (Settings del repo, no del workflow):

1. **Settings → Pages → Build and deployment → Source:** GitHub Actions.
2. **Custom domain:** `z-sdk.escrivivir.co`.
3. Tras DNS válido: **Enforce HTTPS**.

DNS (gestor del dominio `escrivivir.co`), registro típico:

```text
CNAME  z-sdk  →  alephscriptorium-eng.github.io
```

Hasta que el CNAME + Custom domain + HTTPS estén activos, la URL de
fallback de Pages puede seguir siendo la de `github.io`; el portal con
`base: '/'` está pensado para el dominio custom.

---

## Catálogo de la library ← Releases

El catálogo público de juegos **no** se genera desde este monorepo. Vive
en el repo hermano `Z_SDK-games-library`:

- Portal: mismos patrones (`docs/`, `docs:dev` / `docs:build`,
  `.github/workflows/docs.yml` → Pages).
- Dominio objetivo: `https://games.z-sdk.escrivivir.co/`
  (CNAME `games.z-sdk` → `alephscriptorium-eng.github.io`; Custom domain
  + Enforce HTTPS en Pages de **ese** repo).
- **Verdadera lista de versiones publicadas:** GitHub Releases del repo
  library (tags `startpack-<game>-v*`, acta + tarball). Las páginas del
  catálogo apuntan ahí; no duplican tablas de versión a mano.

Añadir un juego al catálogo = ficha Markdown + card en la portada (y
sidebar si aplica). **No** hace falta tocar el workflow `docs.yml`: el
pipeline es el mismo; solo cambia contenido bajo `docs/**`. Cuando el
Notario publique un start pack, aparece en Releases y el catálogo ya
enlaza ese canal.

Detalle del pipeline documental en la library: `docs/publicar-la-web.md`
en ese repo (ruta publicada `/publicar-la-web`). Releases / start packs:
rutas `/releases` y `/startpacks` del mismo sitio.

---

## Checklist rápido

- [ ] Editaste solo lo que debe publicarse bajo `docs/`
- [ ] `npm run docs:dev` — se ve bien en local
- [ ] `npm run docs:build` — verde
- [ ] Push con path `docs/**` (o `workflow_dispatch` en `main`)
- [ ] Tras merge a `main`: run verde de Docs + Pages actualizado
- [ ] Si tocás dominio: CNAME + Custom domain + Enforce HTTPS
