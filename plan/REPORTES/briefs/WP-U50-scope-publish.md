# Brief — WP-U50 · Scope y publicación

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U50 · Scope y publicación
Rama: wp/u50-scope-publish
Worktree: .worktrees/wp-u50-scope-publish
Reporte: plan/REPORTES/WP-U50-scope-publish.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U50-scope-publish.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md (features delta; otro backlog).

Política de publicación (swarm, dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- NO configurar credenciales de registry / tokens de publish.
- Solo: preparar `.npmrc` (línea `@zeus:registry=…`),
  `publishConfig` / `files` / `exports` / READMEs / `private: true`,
  y verificar con `npm run release:dry` (= npm pack + chequeo de
  contenido de tarballs) y/o pack local.
- Si el CA pide «npm install desde el registry propio en directorio
  limpio»: sin credenciales de swarm → marcar ⏳ honesto en el reporte,
  O documentar dry-run equivalente (p.ej. instalar desde tarballs
  `npm pack` en dir limpio fuera del workspace). NO inventar publish.

WP completo (de plan/BACKLOG.md) — abre Ola 5; D-7:
- Scope `@zeus` al registry propio:
  añadir `@zeus:registry=https://npm.scriptorium.escrivivir.co` al
  `.npmrc` (junto a la línea `@alephscript` ya existente).
- Todos los paquetes **engine** (layout objetivo `engine/*`; hoy viven
  bajo `packages/lib/` — U51 aún no mueve carpetas):
  `publishConfig.registry` al registry propio, `files`, `exports`
  completos, README, versión lockstep 0.x.
- `private: true` explícito en lo NO publicable (demos, launchers,
  juegos, mesh/apps que no deban salir al registry).
- Los juegos NO se publican desde aquí (ola 6 / games-library).
- Script raíz `release:dry` (npm pack + verificación de contenido
  de tarballs).
- CA:
  · `release:dry` verde
  · un `npm install` de prueba desde el registry propio en un
    directorio limpio resuelve el engine
    → en swarm: ⏳ honesto o dry-run con tarballs locales documentado
- Demolición (obligatoria, D-3 / PRACTICAS §1 — cero vías muertas):
  · dependencias `file:` que queden (operator-ui y threejs-ui-lib)
    SI el registry / workspace las cubre tras preparar publishables;
    si no se puede sin publish real, documentar residual ⏳ y no
    dejar half-migrated sin evidencia

Alcance publicable vs privado (orientación; alinear con ARQUITECTURA §2/§5):
- Publicables (engine, hoy en packages/lib/): p.ej. protocol,
  authority-kit, player-mcp-kit, view-kit, playbook-kit, game-engine,
  rooms, presets-sdk, http-contract, ui-kit, ui-3d-kit, app-shell,
  firehose-core, room-client-browser, test-utils (si se decide
  publicarlo — justificar en reporte).
- NO publicables (private: true): games (arg/*, pozo), demos/launchers,
  mesh apps (player-ui, editor-ui, socket-server, browsers, etc.) salvo
  justificación explícita. operator-bridge hoy es mesh — no mezclar
  con engine sin evidencia.

Regla de los dos juegos (PRACTICAS §1.11):
- No introducir nombres de juego en paquetes engine al tocar
  package.json / README; `gates` verde si se toca código.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/ARQUITECTURA.md §2 (layout objetivo), §5 (monorepo publicable)
- plan/DECISIONES.md D-7 (scope @zeus + registry), D-10/D-11 (juegos
  fuera; operator-ui file: → registry)
- .npmrc actual (solo @alephscript → mismo host)
- packages/lib/*/package.json (estado: sin publishConfig/files)
- packages/operator-ui/package.json (deps file: a demoler si procede)
- root package.json (añadir script release:dry)

Notas del orquestador:
- Ola 5 inicio. Solo U50 ahora. U51/U54/U53 dependen de U50;
  U52 es la última — NO tocar esos WPs.
- U51 (move físico a packages/{engine,editor,mesh,games}) NO está
  en alcance: preparar publicación sobre el layout actual.
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir (default headless para
  swarm/CI).
- Pregunta obligatoria (CA): ¿`release:dry` verde? ¿`.npmrc` lleva
  `@zeus:registry=…`? ¿engine packs tienen publishConfig/files/
  exports/README/lockstep? ¿private:true en no-publicables? ¿CA
  install-from-registry = ⏳ o dry-run documentado (NO publish)?
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
