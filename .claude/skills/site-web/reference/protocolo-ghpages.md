# Protocolo ghpages (VitePress → Pages)

Pipeline de portal de docs. Parametrizá dominio, `base`, rutas `docs/` y
registry según calibración del mundo. Fuente de patrón: variante library
ya estabilizada (workflow + config con guard); aquí solo el método.

## Piezas

| Pieza | Dónde (parametrizable) |
| ----- | ---------------------- |
| Markdown / VitePress | `{{DOCS}}/` (default `docs/`) |
| Config | `{{DOCS}}/.vitepress/config.mjs` |
| Theme / piel | `{{DOCS}}/.vitepress/theme/` |
| CNAME | `{{DOCS}}/public/CNAME` = `{{DOMINIO}}` |
| Workflow | `.github/workflows/docs.yml` |
| Dev / build | `npm run docs:dev` / `docs:build` |
| Artifact | `{{DOCS}}/.vitepress/dist` |

## Config: `base` parametrizado (frágil #2)

```js
function resolveDocsBase() {
  const raw = process.env.{{BASE_ENV}}?.trim(); // ej. DOCS_BASE
  if (raw) {
    // Guard MSYS: path Windows colado por conversión de env → no es base
    if (/^[A-Za-z]:[\\/]/.test(raw)) return '/';
    const cleaned = raw.replace(/^\/+|\/+$/g, '');
    return cleaned ? `/${cleaned}/` : '/';
  }
  return '/'; // custom domain → `/`; project pages → `/<repo>/`
}
```

Plantilla lista: `plantillas/config.mjs.tpl`.

## Workflow (frágiles #4, #6, #7)

Plantilla: `plantillas/docs.yml.tpl`.

Requisitos:

- Triggers: `push` `main` + `wp/**` con `paths: {{DOCS}}/**`;
  `pull_request` mismo paths; `workflow_dispatch`.
- `concurrency` por ref; `cancel-in-progress: true`.
- Install: **`npm ci`** (no `npm install`).
- Build: `npm run docs:build` — **sin** acoplar generadores de spec al
  script de docs.
- Upload artifact + deploy **solo** si `main` y no es PR.
- Node 22.

### Gap paths (#7)

Si solo cambian `package.json`, lock o el YAML del workflow, el filtro
`paths: docs/**` **no** dispara el job. Mitigación: Actions → Run
workflow, o un push que toque `docs/**`.

## CNAME + DNS + HTTPS (#1, #3)

1. Commitear `{{DOCS}}/public/CNAME` con una línea: `{{DOMINIO}}`.
2. DNS: CNAME del dominio → `<org>.github.io` (ops del mundo).
3. Settings → Pages → Source = GitHub Actions; Enforce HTTPS.

No hardcodear el dominio de otro mundo en plantillas del skill: usá
`{{DOMINIO}}`.

## Piel zine

- Tipografía local del sistema (p. ej. Courier); monocromo; sin CDN ni
  `@import` de fuentes web.
- Si se incluye CSS de referencia: **copia-release** con cabecera:

```css
/* Procedencia: copia-release desde {{RUTA_FUENTE_RELATIVA_O_CITA}}
   Fecha: {{FECHA}} · mundo={{MUNDO_ID}} */
```

- No meter rutas absolutas de árboles ajenos en la cara pública del skill;
  la cita vive en el CSS del **mundo** consumidor.

## Los 7 frágiles — mitigación de serie

| # | Fallo | Mitigación |
| - | ----- | ---------- |
| 1 | CNAME no commiteado | `docs/public/CNAME` en repo |
| 2 | `base:'/'` sin guard (rompe project-pages / MSYS) | `resolveDocsBase()` + env |
| 3 | DNS hardcodeado en prosa | checklist + `{{DOMINIO}}` |
| 4 | `npm install` en CI | `npm ci` |
| 5 | `dist/` versionado | gitignore `docs/.vitepress/dist/` |
| 6 | spec-gen acoplado a `docs:build` | build = solo VitePress |
| 7 | gap `paths: docs/**` | documentar + `workflow_dispatch` |

## Checklist de publicación

- [ ] `npm ci` + `docs:build` verdes en local
- [ ] CNAME presente y equal a dominio vivo
- [ ] Workflow parsea; deploy solo en `main`
- [ ] Ceguera del mundo = 0 en copy pública
- [ ] C8: cada comando de la página ejecutado en su canal
- [ ] DNS + HTTPS (ops) — marcar `<pendiente>` si no verificados
