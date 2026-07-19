# WP-U136 · c8-startpacks-residual — reporte

| dato | valor |
| ---- | ----- |
| agente | worker · WP-U136 (follow-up post-vigilante; worker e23d7a85 sin progreso) |
| fecha | 2026-07-19 |
| rama | `wp/u136-c8-startpacks-residual` (library + zeus) |
| commit(s) | library `b3efec1` · zeus (este reporte) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se alineó el bloque `### Registry` de `docs/startpacks.md` con el patrón 2c
de `releases.md` / CAPA §2c: doctrina + estado → [Futuros]; sin fence bash
copiable `npm install @zeus/startpack-*` (canal 404). Canal operativo sigue
siendo la sección Tarball / GitHub Release debajo. Diff acotado a
`startpacks.md` (+ este reporte). No se reabrió U132. No merge.

## Archivos tocados

- `docs/startpacks.md` (library) — modificado: Registry npm doctrinal C8
- `plan/REPORTES/WP-U136-c8-startpacks-residual.md` (zeus) — creado: este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- `npm run docs:build` (library worktree, tras `npm install`):

```
> z-sdk-games-library@0.0.0 docs:build
> vitepress build docs

  vitepress v1.6.4
✓ building client + server bundles...
✓ rendering pages...
build complete in 10.99s.
```

- CA — `rg -n 'npm install @zeus/startpack' docs/`:

```
docs/startpacks.md:40:Canal previsto para instalar por nombre (`npm install @zeus/startpack-<game>`).
docs/releases.md:19:Canal previsto para instalar por nombre (`npm install @zeus/startpack-<game>`).
```

  Ambos hits = prosa doctrinal inline (patrón 2c). **0** hits en fences
  ` ```bash ` / ` ```sh `.

- Multilínea fence ejecutable (0 hits):

```
rg -n --multiline '```(?:bash|sh)\n[^`]*npm install @zeus/startpack' docs/
→ (0 fence hits)
```

- `git diff --stat` (library, post-commit):

```
 docs/startpacks.md | 8 ++++----
 1 file changed, 4 insertions(+), 4 deletions(-)
```

### Evidencia CI

> Tras push de la rama. Canónico: `gh run list --branch <rama>`.

| campo | valor |
| ----- | ----- |
| branch | `wp/u136-c8-startpacks-residual` |
| run_id | **N/A** pendiente post-push (library: docs; zeus: solo `plan/**` → paths-ignore U104) |
| workflow | Docs (library) / N/A (zeus md) |
| conclusion | se rellena tras push |

```
(pegar gh run list tras push)
```

## Demolición

Fence operativo bajo `### Registry`:

```bash
npm install @zeus/startpack-delta
```

Sustituido por prosa doctrinal 2c. Grep post-fix: cero `npm install
@zeus/startpack` en fences bash/sh de `docs/` (salida arriba).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: N/A (solo docs)
- [x] Cadenas if/switch que debieron ser tabla: N/A
- [x] Duplicación con otros paquetes: alineado a propósito con releases.md 2c
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: no
- [x] Demolición completa (grep arriba): sí — fence Registry fuera
- [x] Tests prueban comportamiento, no solo «no explota»: N/A (docs); docs:build verde
- [x] Arranque real verificado: docs:build local; Pages/deploy no afirmados (C8 Pages ≠ local)
- [x] README/specs del paquete siguen siendo verdad: N/A
- [x] El diff contiene solo el alcance del WP: sí (`startpacks.md` + reporte)
- [x] C8/C9 (PRACTICAS §8): C8 — sin fence copiable contra npm 404; hits restantes doctrinales 2c documentados. C9 — no se añadió lista manual de releases/juegos.

## Hallazgos fuera de alcance

- Worker previo e23d7a85: worktrees en tip library `c55955b` / zeus stale
  `9e79198`, **0 commits** de entrega — se implementó aquí sin re-lanzar Task.
- U137 N/A: worktrees/ramas locales retirados en higiene post-vigilante
  (mismo follow-up).

## Dudas / bloqueos

Ninguno. Listo para revisión orquestador (NO merge desde worker).

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
