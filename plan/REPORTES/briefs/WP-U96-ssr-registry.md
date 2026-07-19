# Brief — WP-U96 · Un solo registro SSR

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U96 · Un solo registro SSR
Rama: wp/u96-ssr-registry
Worktree: .worktrees/wp-u96-ssr-registry
Reporte: plan/REPORTES/WP-U96-ssr-registry.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U96-ssr-registry.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — cola higiene; lote-higiene-11b;
formaliza diferido colas U20/U21/U22; paralelo con U94
(otro worktree; superficies distintas):
- `defineView/createViewRegistry/renderHud/renderViewLayout`
  duplicados en `games/delta/arg-console/src/view-kit/` y
  `mesh/3d-monitor/src/view-kit/` (ya divergiendo ES/EN).
- Extraer a módulo compartido y renombrar para deshacer la colisión
  léxica con `@zeus/view-kit` (browser).
- CA (literal BACKLOG):
  · una sola implementación
  · `*view-kit*` deja de dar 3 rutas de código con la misma API
  · SSR de ambos consumidores verde
- Demolición: la segunda copia.

Alcance orientativo:
- Copias SSR a unificar:
  · `packages/games/delta/arg-console/src/view-kit/index.mjs`
  · `packages/mesh/3d-monitor/src/view-kit/index.mjs`
- Extraer a módulo compartido (elige ancla mínima: p.ej. util en
  engine / app-shell / paquete SSR pequeño — no inventar paquete si
  hay hogar natural). Renombrar para que `*view-kit*` no choque con
  `@zeus/view-kit` (browser).
- Consumidores: arg-console + 3d-monitor SSR; tests de esos paquetes.
- NO tocar el kit browser `@zeus/view-kit` salvo imports de rename
  si hace falta clarificar; no mezclar APIs browser↔SSR.
- NO tocar WP-U93 / peer-card / webrtc / A-11.
- NO implementar U94 (fuente dominio) — otro WP del lote.
- NO tocar U98/U99 ni Ola 6 / credenciales.
- NO editar plan/BACKLOG.md.

Regla de los dos juegos (PRACTICAS §1.11):
- El módulo SSR compartido = engine/mesh genérico; cero conceptos
  exclusivos de delta/pozo. arg-console solo consume.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- Los 2 `src/view-kit/index.mjs` listados arriba
- Imports de `defineView` / `createViewRegistry` /
  `renderViewLayout` en arg-console y 3d-monitor
- Colas hallazgos ola 2 (U20/U21/U22) en BACKLOG — contexto de la
  colisión léxica

Notas del orquestador:
- Lote-higiene-11b paralelo: U96 = registro SSR único; U94 =
  fuente única dominio delta. Partición clara — no solapar.
- Independiente de peer-card / U93; sin credenciales.
- Pregunta obligatoria (CA): ¿una sola impl? ¿`*view-kit*` deja de
  dar 3 rutas con la misma API? ¿SSR ambos consumidores verde?
  ¿segunda copia demolida? Evidencia literal.
- NO editar plan/BACKLOG.md.
- NO push.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
