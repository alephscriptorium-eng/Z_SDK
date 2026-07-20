# Proyecto

Plano **back** del mundo Zeus SDK: dónde vive el código, el registry, la CI
y el tablero de gobierno. Los **enlaces vivos** (repo / registry / CI) se
declaran **una sola vez** en el tema del portal (`themeConfig` · pie y
GitHub) — no se copian en cada página.

## Qué hay detrás del portal

| Plano | Qué es | Dónde mirar en este sitio |
| ----- | ------ | ------------------------- |
| Repo | Monorepo del SDK (engine / editor / mesh) | icono GitHub del header · pie «repo» |
| Registry | npm scope `@zeus` / `@alephscript` | pie «registry» |
| CI | Actions (lint, gates, docs, release) | pie «CI» |
| Backlog | Tablero vivo del swarm | [Estado del swarm](/guide/estado) |

## Gobierno

El plan (`plan/BACKLOG.md`, `plan/DECISIONES.md`, reportes) es la fuente de
verdad del swarm. Resumen histórico en el portal:
[Estado del swarm](/guide/estado). Layout del monorepo:
[Mapa del monorepo](/guide/layout).

## Publicación web

Cómo se construye y despliega este portal:
[Publicar la web](/guide/publicar-la-web).
