# Brief — WP-U141 · Enmascarar token en reporte U140

_Plantilla: `plan/roles/BRIEF.md`. Pegar con `plan/roles/WORKER.md`._

Origen: **D-32** · GO residual post-U140 (ceguera del reporte). Nota
externa recibida (temp-review, 2026-07-19). Repo: **zeus-sdk** (solo el
reporte U140; sin tocar código de paquetes).

Regla reforzada: ni notas ni reportes citan el token que mandan borrar —
la evidencia de grep se enmascara SIEMPRE.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U141 · Enmascarar token (nombre-repo-externo) en reporte U140
Rama: wp/u141-ceguera-reporte-u140
Worktree: (opcional; lote no paralelo) ../zeus-wp-u141
Reporte: plan/REPORTES/WP-U141-ceguera-reporte-u140.md

1 WP = este chat. NO editar plan/BACKLOG.md.
Leer plan/PRACTICAS.md entero.
Reporte desde plan/REPORTES/PLANTILLA.md.
Commits convencionales. NO merge a main. NO ✅ BACKLOG.

Fuente (ruta INTERNA; NO inventar rutas de máquina):
plan/REPORTES/entregas/ENTREGA-2026-07-19-ceguera-reporte-u140.md
(§Nota — esa es la orden).

Problema:
- U140 ✅ scrub de rutas absolutas OK en main.
- El reporte U140 reintroduce el token objetivo (nombre de repo externo)
  al citar evidencia de grep en claro («<token>=0» × N).
- Recursión: el informe de ausencia viola la ceguera.

Alcance (ÚNICO fichero de producto del WP):
- plan/REPORTES/WP-U140-scrub-rutas-locales.md
  Sustituir menciones literales del token por máscara neutra
  (p.ej. `<externo>` o «nombre-repo-externo»).
- Si al documentar el CA en TU reporte WP-U141 o al tocar brief/entrega
  harías reintroducir el token: NO. Usa circunloquio / máscara.
- NO reabrir scrub de rutas absolutas. NO tocar packages/, docs/ de
  producto, BACKLOG, ni otros reportes salvo lo estrictamente necesario
  para no reintroducir el token en artefactos nuevos que edites.

Fix:
- En WP-U140-scrub-rutas-locales.md: enmascarar el token en evidencia,
  prosa de CA y cualquier línea que lo cite en claro.
- En tu reporte WP-U141: al pegar evidencia de grep, muestra el comando
  con el needle si hace falta, pero en salidas/prosa usa máscara
  (`<externo>=0`) — no copies el token literal a prosa del plan.
- Preferible: documentar «grep del token (nombre-repo-externo) = 0»
  sin escribir el identificador.

CA verificables:
1. Grep del token (nombre-repo-externo) = 0 en TODO el repo,
   incluido plan/REPORTES/WP-U140-scrub-rutas-locales.md y tu reporte.
2. git diff acotado: esencialmente el reporte U140 (+ tu reporte WP-U141).
   Sin tocar packages/ ni código.
3. Patrones de rutas absolutas (clase U140) siguen en 0 — no regresionar.

Demolición: menciones literales del token objetivo en el reporte U140
(y en cualquier artefacto nuevo de este WP).

Evidencia CI: tras push, gh run list --branch wp/u141-ceguera-reporte-u140
→ run_id/conclusion o N/A (paths-ignore U104 si solo plan/**).
Protocolo Actions U135.

Empieza: rama/worktree, PRACTICAS, enmascara el reporte U140, verifica
CA (grep token = 0 en todo el árbol), reporta, push rama. NO merge.
```
