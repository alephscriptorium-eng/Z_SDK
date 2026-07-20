# WP-U152 · docs-back — reporte

| dato | valor |
| ---- | ----- |
| agente | ejecutor lote Sprint 5 (orquestador+worker) |
| fecha | 2026-07-20 |
| rama | `wp/u152-docs-back` (parte de tip U150 `9ef2eaf`) |
| commits | _(tip tras commit)_ |
| eje(s) CA | site-web |
| estado propuesto | listo para revisión |

## Qué se hizo

Se añadió `docs/proyecto.md` (plano back: repo/registry/CI/backlog) en
nav + sidebar. Los back-links viven en **una** fuente
`SITE_BACK` en `docs/.vitepress/config.mjs` → `socialLinks` (GitHub) +
`footer.message` (repo/registry/CI/proyecto). **Prohibido** hardcodear el
bloque en las ~25 páginas (Punto 3 handoff): `proyecto.md` no duplica URLs;
apunta al pie/tema. `verificar-sitio` verde (33 HTML).

## Archivos tocados

- `docs/.vitepress/config.mjs` · modificado — `SITE_BACK` + nav/sidebar/footer/social
- `docs/proyecto.md` · creado — página Proyecto
- `plan/REPORTES/WP-U152-docs-back.md` · creado — este reporte

## Evidencia

### CA1 · Proyecto en nav/sidebar

```
$ grep -n "Proyecto\|/proyecto" docs/.vitepress/config.mjs
… nav: { text: 'Proyecto', link: '/proyecto' }
… sidebar: { text: 'Proyecto (back)', link: '/proyecto' }
$ test -f docs/proyecto.md && echo OK
```

### CA2 · fuente única (no hardcode por página)

```
$ grep -r 'npm.scriptorium.escrivivir.co' docs --include='*.md' || echo '(none)'
(none)

$ grep -n 'SITE_BACK\|npm.scriptorium' docs/.vitepress/config.mjs
25:const SITE_BACK = {
27:  registry: 'https://npm.scriptorium.escrivivir.co',
… socialLinks / footer usan SITE_BACK.*
```

### CA3 · verificar-sitio verde

```
$ npm run docs:build   # BUILD=0
$ npm run docs:verify
[verificar-sitio] dist=… html=33
  enlaces internos rotos: 0
  anclas rotas:           0
[verificar-sitio] OK
```

## Auto-revisión (PRACTICAS)

- [x] Diff ALCANCE_DIFF
- [x] Punto 3 handoff respetado (tema, no 25 páginas)
- [x] Dep U150 (gate) verde
- [x] Commits convencionales

## Hallazgos fuera de alcance

- `docs/guide/estado.md` sigue enlazando ficheros concretos en GitHub
  (preexistente; slug ya unificado en U150). No es el bloque back-links.

## Dudas / bloqueos

Ninguno.

---

## Revisión del orquestador

**Veredicto: Aceptado ✅** (orquestador · 2026-07-20)

### CA
- [x] CA1 — `docs/proyecto.md` en nav + sidebar
- [x] CA2 — `SITE_BACK` fuente única en config; 0 hardcode registry en md
- [x] CA3 — `docs:build` + `verificar-sitio` OK (html=33)
- [x] ALCANCE_DIFF OK (commit propio); ceguera OK; Punto 3 handoff respetado

### Merge
ff stack a main tip código `9c5b842`; gobierno post-aceptación en tip main.
