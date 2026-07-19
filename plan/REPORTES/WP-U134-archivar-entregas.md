# WP-U134 · archivar-entregas — reporte

| dato | valor |
| ---- | ----- |
| agente | worker-u134 (Cursor Grok) |
| fecha | 2026-07-19 |
| rama | `wp/u134-archivar-entregas` |
| commit(s) | `316fbaf` · `261c52b` |
| estado propuesto | listo para revisión |

## Qué se hizo

Se archivaron los handoffs `ENTREGA-*` de la raíz de `plan/` a
`plan/REPORTES/entregas/` (patrón BACKLOG-HISTORICO / REPORTES): dos ficheros
y la carpeta Sprint 2 completa (incl. `SUPERADA-`). Se actualizaron los links
relativos en BACKLOG/DECISIONES/RE-PLAN/README/HISTORICO, briefs y reportes
que apuntaban a las rutas antiguas; se corrigieron links internos de las
ENTREGA movidas (`../../` / `../../../`). Se documentó la regla de archivo en
`plan/roles/ORQUESTADOR.md` con puntero en `roles/README.md` y mapa en
`plan/README.md`. No se tocó `PRACTICAS.md` (conflicto U133). No se
cambiaron estados 🔶/✅ de BACKLOG (solo paths). No se copió WEBS a plan/.

## Archivos tocados

- `git mv` → `plan/REPORTES/entregas/ENTREGA-2026-07-18c.md` (creado dir +
  links internos `../../`)
- `git mv` → `plan/REPORTES/entregas/ENTREGA-2026-07-18d-sprint1.md`
- `git mv` → `plan/REPORTES/entregas/ENTREGA-2026-07-19-sprint2/` (dir
  completo; `02-ACTA-CIERRE.md` links `../../../`)
- modificado `plan/BACKLOG.md` — solo hrefs a nueva ubicación
- modificado `plan/DECISIONES.md`, `RE-PLAN.md`, `BACKLOG-HISTORICO.md` —
  hrefs
- modificado `plan/README.md` — mapa: fila ENTREGA raíz →
  `REPORTES/entregas/`
- modificado `plan/roles/ORQUESTADOR.md` — §Handoffs / ENTREGA-*
- modificado `plan/roles/README.md` — puntero ciclo sprint
- modificado briefs/reportes con paths `plan/ENTREGA-*` o
  `../../ENTREGA-*`
- creado `plan/REPORTES/WP-U134-archivar-entregas.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- CA vigilante — `ls plan/` sin ENTREGA-*:

```
$ ls plan/
ARQUITECTURA.md
BACKLOG.md
BACKLOG-HISTORICO.md
DATOS.md
DECISIONES.md
PRACTICAS.md
README.md
recursos/
RE-PLAN.md
REPORTES/
roles/
VISION.md

$ ls plan/ENTREGA-*
ls: cannot access 'plan/ENTREGA-*': No such file or directory
```

- Destino:

```
$ ls plan/REPORTES/entregas/
ENTREGA-2026-07-18c.md
ENTREGA-2026-07-18d-sprint1.md
ENTREGA-2026-07-19-sprint2/
```

- Links rotos (markdown `](...ENTREGA-2026-07-18|19...)` → target existe):

```
OK: all ENTREGA markdown links resolve
```

- Leftovers de hrefs antiguos `](ENTREGA-2026-07-18…)` / `plan/ENTREGA-…`
  (fuera del brief inventario histórico):

```
(cero leftovers antiguos)
```

- `PRACTICAS.md` no tocado: `git diff HEAD -- plan/PRACTICAS.md` → 0 líneas.
- Lint/tests producto: N/A (higiene plan/ solamente).

## Demolición

`ENTREGA-*` fuera de la raíz de `plan/`. Grep de presencia en raíz:

```
$ ls plan/ENTREGA-*
ls: cannot access 'plan/ENTREGA-*': No such file or directory
```

Contenido conservado bajo `plan/REPORTES/entregas/` (no borrado; archivo).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: N/A (solo plan/); paths
      relativos corregidos post-move
- [x] Cadenas if/switch que debieron ser tabla: N/A
- [x] Duplicación con otros paquetes: N/A (movimiento, no copia WEBS)
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: no (`entregas/` canónico
      del brief)
- [x] Demolición completa (grep/ls arriba): sí — cero ENTREGA-* en raíz
- [x] Tests prueban comportamiento: N/A (WP higiene docs); CA = ls + links
- [x] Arranque real verificado: N/A
- [x] README/specs del paquete siguen siendo verdad: `plan/README.md`
      mapa actualizado
- [x] El diff contiene solo el alcance del WP: sí (paths + regla; sin
      estados BACKLOG; sin PRACTICAS)

## Hallazgos fuera de alcance

- Briefs históricos (U119–U131) y reporte U130 llevan paths actualizados;
  evidencia literal antigua en U130 sigue siendo el mismo contenido de
  acta, solo con ruta nueva — acceptable para no dejar hrefs muertos.
- `PRACTICAS.md` §7 sigue citando `ENTREGA-…` genérico (sin path a raíz);
  U133 porta C8/C9 ahí — no se tocó, per brief.

## Dudas / bloqueos

Ninguno. Listo para revisión orquestador (NO merge desde este chat).

---

## Revisión del orquestador

**Aceptado ✅** (orquestador / 2026-07-19). Tip worker `aed60e7`.

### CA verificados
- [x] `ls plan/` sin `ENTREGA-*` (solo canónicos + dirs)
- [x] Destino `plan/REPORTES/entregas/` con 18c, 18d y sprint2 (+ SUPERADA-)
- [x] Links markdown a ENTREGA: 18 OK / 0 rotos / 0 leftovers a raíz
- [x] Regla handoffs en `roles/ORQUESTADOR.md` + mapa README / puntero roles
- [x] `PRACTICAS.md` no tocado (U133 paralelo ya ✅ en main)
- [x] Diff acotado a higiene plan/ (sin producto; sin estados BACKLOG ajenos)

### PRACTICAS
§2 alcance OK · §3 auto-revisión honesta · §6 commits convencionales · N/A tests producto.

### Merge
Tras U133 ✅ en main: merge limpio resolviendo BACKLOG (paths U134 + estados U133). No tocar U132. Orden: U134 ahora; U132 sigue en vuelo.
