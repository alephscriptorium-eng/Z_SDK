# Brief — WP-U134 · Archivar ENTREGA-* + regla handoffs

_Plantilla: `plan/roles/BRIEF.md`. Pegar con `plan/roles/WORKER.md`._

Origen: **AMEND Sprint 2** · bloque **C** · **D-26**. **Paralelo con U132 ∥ U133.**

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U134 · Mover ENTREGA-* de raíz plan/ + regla de archivo
Rama: wp/u134-archivar-entregas
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u134-archivar-entregas
Reporte: plan/REPORTES/WP-U134-archivar-entregas.md

1 WP = este chat. NO editar plan/BACKLOG.md estados 🔶/✅ (sí actualizar
  links de rutas cuando muevas ficheros — orquestador aceptará el diff
  de paths; no cambies estados de WPs ajenos).
Leer plan/PRACTICAS.md entero + plan/roles/ORQUESTADOR.md + plan/README.md.

Política:
- Solo higiene plan/ (mover + links + regla). Sin código de producto.
- NO editar PRACTICAS.md (U133 porta C8/C9 ahí — conflicto).
- Commits + push OK. NO merge a main.
- Orquestador NO volverá a copiar handoffs WEBS a plan/ raíz.

Inventario a archivar (hoy en plan/ raíz):
1. plan/ENTREGA-2026-07-18c.md
2. plan/ENTREGA-2026-07-18d-sprint1.md
3. plan/ENTREGA-2026-07-19-sprint2/  (dir completo, incl. SUPERADA-)

Destino (patrón BACKLOG-HISTORICO / REPORTES):
- plan/REPORTES/entregas/
  (crear dir si no existe; mantener nombres de fichero/carpeta)

Tras mover:
- Actualizar TODOS los links relativos en plan/ (BACKLOG, DECISIONES,
  REPORTES, roles, RE-PLAN, etc.) que apunten a las rutas antiguas.
- Grep de `ENTREGA-2026-07-18` / `ENTREGA-2026-07-19` → cero rotos.

Regla nueva (escribir en plan/roles/ORQUESTADOR.md; puntero en README si cabe):
  «Los materiales de handoff/temporales (ENTREGA-*, paquetes WEBS copiados)
   se archivan a plan/REPORTES/entregas/ al aceptarse el lote. La raíz de
   plan/ queda solo con canónicos (doctrina + BACKLOG/RE-PLAN/README +
   dirs canónicos). El orquestador NO copia handoffs a plan/ raíz.»

CA:
- ls plan/ = solo canónicos + dirs (cero ENTREGA-* en raíz)
- cero links rotos (grep rutas)
- regla documentada en ORQUESTADOR.md

Demolición: ENTREGA-* en raíz de plan/.

Empieza: sitúate en el worktree, mueve, actualiza links, escribe regla, reporta.
```
