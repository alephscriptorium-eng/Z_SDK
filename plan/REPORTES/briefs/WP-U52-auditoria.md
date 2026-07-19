# Brief — WP-U52 · Auditoría de vías muertas

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U52 · Auditoría de vías muertas
Rama: wp/u52-auditoria
Worktree: .worktrees/wp-u52-auditoria
Reporte: plan/REPORTES/WP-U52-auditoria.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U52-auditoria.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — Ola 5 **última**; cierra refundación Ola 5
(U50 ✅, U51 ✅, U53 ✅, U54 ✅; U52 cierra la ola):
- Barrido final de vías muertas en el monorepo post-layout (U51) y
  post-publish surface (U50/U53/U54).
- Por **cada paquete** del workspace: lista de consumidores reales
  (grep de imports / `package.json` deps) → tabla **paquete→consumidores**.
- Criterios duros de limpieza:
  · cero huérfanos (paquete sin consumidores reales y sin rol
    documentado como entrypoint/demo/example)
  · cero TODO / FIXME / HACK sin entrada en backlog (plan/BACKLOG o
    cola hallazgos justificada → WP nuevo si es grande)
  · cero código comentado muerto (bloques enteros “por si acaso”)
  · READMEs veraces (layout `packages/{engine,editor,mesh,games}`,
    contrato único, sin protocolo sesión muerto, sin rutas/carpetas
    antiguas `lib/ app/ platform/ mcp/ arg/` como si vivieran)
- Produce el **reporte de cierre de la refundación Ola 5** (no solo el
  reporte de WP): estado de U50–U54, tabla de paquetes, residuales
  demolicionados vs promovidos a WP nuevo, gates.
- CA:
  · reporte con la tabla paquete→consumidores completa
  · `npm run gates` verde (y lint/tests de matriz que toques — evidencia
    literal)
- Demolición (obligatoria):
  · todo lo que la auditoría encuentre y que quepa en este WP
  · si es grande → WP nuevo propuesto en §hallazgos (NO editar BACKLOG;
    el orquestador lo incorpora)

Alcance orientativo:
- Inventario de workspaces (`packages/engine|editor|mesh|games`,
  `examples/`) + scripts raíz que referencien paquetes.
- Grep sistemático de imports `@zeus/*` y paths relativos entre paquetes.
- Barrido TODO/FIXME/código comentado; READMEs desactualizados
  (p.ej. residuales `session:*` en mesh — cola U41; identidad «ARG»
  residual — cola U50; `file:` operator-ui — colas U50/U51).
- Demoler huérfanos/ruido; proponer WPs solo si el corte es grande.
- NO reabrir U50–U54 funcionales salvo para limpiar vías muertas
  que dejen.

Regla de los dos juegos (PRACTICAS §1.11):
- Engine sin nombres de juego; `gates` verde; delta Y pozo siguen vivos
  como consumidores (no demoler por “poco usados”).

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/ARQUITECTURA.md §2 (layout final) y §4 (límites de imports)
- plan/BACKLOG.md colas hallazgos ola 5 (U50/U51) + residuales U41
  (READMEs `session:*`)
- package.json workspaces + scripts raíz post-U51
- plan/REPORTES/WP-U50-*.md, WP-U51-*.md, WP-U53-*.md, WP-U54-*.md
  (contexto de cierre Ola 5)

Notas del orquestador:
- Último WP de Ola 5. U50–U54 ya ✅. Este WP **cierra la ola**.
- El reporte debe servir como acta de cierre Ola 5 (refundación
  monorepo publicable + layout), no solo checklist de higiene.
- Hallazgos diferidos que encajan aquí (demoler o WP nuevo):
  READMEs mesh `session:*`; `file:` operator-ui; game-engine «ARG»;
  basura comentada / TODOs sueltos; paquetes sin consumidores.
- NO tocar olas 6+ salvo proponer WPs desde §hallazgos.
- Pregunta obligatoria (CA): ¿tabla paquete→consumidores completa?
  ¿gates verdes? ¿huérfanos/TODO-sin-backlog/código-comentado = 0 o
  WP nuevo explícito? ¿READMEs veraces? ¿acta cierre Ola 5 en el
  reporte?
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
