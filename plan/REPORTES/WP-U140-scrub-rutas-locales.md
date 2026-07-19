# WP-U140 · scrub-rutas-locales — reporte

| dato | valor |
| ---- | ----- |
| agente | worker swarm (chat U140) |
| fecha | 2026-07-19 |
| rama | `wp/u140-scrub-rutas-locales` |
| commit(s) | `7a334f2` (scrub) · `2ac7624` (reporte tip/CI) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se scrubearon rutas absolutas de máquina local y procedencias con nombre
de repo externo en `plan/` (clase completa, no solo lista mínima). Cada
cita de procedencia pasó a «nota externa recibida (temp-review, \<fecha\>)»
conservando el leaf del documento cuando aportaba; worktrees de briefs
pasaron a rutas relativas (`.worktrees/…` / `(library)/.worktrees/…`).
Evidencias literales con prefijo Git-Bash se redactaron
(`\<ruta-local-redactada\>/…`). La entrega archivada
`plan/REPORTES/entregas/ENTREGA-2026-07-19-higiene-rutas-locales.md` ya
estaba en forma pedagógica partida/neutra — sin diff; CA corrido **sin
eximirla**. No se tocaron estados 🔶/✅ de BACKLOG (solo prosa de
procedencia, alcance explícito del WP). Diff acotado a `plan/**`.

## Archivos tocados

- modificado `plan/BACKLOG.md` — procedencias WEBS/ADDENDA → nota neutra
- modificado `plan/DECISIONES.md` — idem D-26/D-29/D-30
- modificado `plan/BACKLOG-HISTORICO.md` — procedencias vigilante → nota
- modificado `plan/REPORTES/briefs/WP-U108-volumes-gitignore.md` (+ ~90
  briefs más) — Worktree absoluto → relativo; fuentes externas → nota
- modificado `plan/REPORTES/briefs/WP-U138-api-nav-spa.md` ·
  `WP-U139-api-nav-cuerpo.md` — fuente + worktree
- modificado `plan/REPORTES/entregas/ENTREGA-2026-07-19-sprint2/00-INDICE.md`
- modificado `plan/REPORTES/temp-review-2026-07-17.md`
- modificado `plan/REPORTES/WP-U122-registry-password-auth.md` — evidencia
  Git-Bash redactada (hit de clase citado en brief)
- modificado reportes auxiliares con hits de clase (U61, U80, U91, U124,
  U127)
- sin cambio `…/ENTREGA-2026-07-19-higiene-rutas-locales.md` (ya limpia;
  incluida en verificación)
- creado este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.
> Needles de clase: solo en el comando; aquí se cita «patrón (1)/(2) de la §Nota»
> (`plan/REPORTES/entregas/ENTREGA-2026-07-19-higiene-rutas-locales.md`).

- Verificación CA (Python walk del repo, skip `.git`/`node_modules`/…):

```
CA1 (patron 1): hits=0 files=[]
CA2 (patron 2): hits=0 files=[]
CA3 SCRIPT_SDK en plan/: hits=0
--- lista minima + U122 + entrega ---
plan/BACKLOG.md: pat1=0 pat2=0 SCRIPT_SDK=0
plan/DECISIONES.md: pat1=0 pat2=0 SCRIPT_SDK=0
plan/BACKLOG-HISTORICO.md: pat1=0 pat2=0 SCRIPT_SDK=0
plan/REPORTES/briefs/WP-U108-volumes-gitignore.md: pat1=0 pat2=0 SCRIPT_SDK=0
plan/REPORTES/briefs/WP-U138-api-nav-spa.md: pat1=0 pat2=0 SCRIPT_SDK=0
plan/REPORTES/briefs/WP-U139-api-nav-cuerpo.md: pat1=0 pat2=0 SCRIPT_SDK=0
plan/REPORTES/entregas/ENTREGA-2026-07-19-sprint2/00-INDICE.md: pat1=0 pat2=0 SCRIPT_SDK=0
plan/REPORTES/temp-review-2026-07-17.md: pat1=0 pat2=0 SCRIPT_SDK=0
plan/REPORTES/entregas/ENTREGA-2026-07-19-higiene-rutas-locales.md: pat1=0 pat2=0 SCRIPT_SDK=0
plan/REPORTES/WP-U122-registry-password-auth.md: pat1=0 pat2=0 SCRIPT_SDK=0
```

- Alcance diff: solo `plan/**` (≈98 ficheros de prosa/reportes/briefs).
  Sin `packages/`, sin docs de producto, sin código.
- Lint/tests de código: N/A (WP de higiene documental en `plan/`).

### Evidencia CI

> Tras push de la rama. Canónico: `gh run list --branch <rama>`. Verde local
> ≠ gate CI (PRACTICAS §5).

| campo | valor |
| ----- | ----- |
| branch | `wp/u140-scrub-rutas-locales` |
| run_id | **N/A** (paths-ignore U104: solo `plan/**` / `**.md`) |
| workflow | — |
| conclusion | **N/A** |

```
$ gh run list --branch wp/u140-scrub-rutas-locales --limit 5
(sin runs — diff solo plan/**; CI no dispara por U104)
```

## Demolición

Rutas absolutas de máquina local como procedencia y nombres de repo
externos usados como procedencia en el árbol público `plan/`. Grep de
clase (patrones (1)/(2) de la §Nota) = 0 en todo el repo; `SCRIPT_SDK`
como token de procedencia en `plan/` = 0. Entrega archivada incluida en
el barrido.

```
CA1 (patron 1): hits=0
CA2 (patron 2): hits=0
CA3 SCRIPT_SDK en plan/: hits=0
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: rutas absolutas locales
      demolidas; worktrees relativos; sin reintroducir needles en prosa
- [x] Cadenas if/switch que debieron ser tabla: N/A (docs)
- [x] Duplicación con otros paquetes: N/A
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: no
- [x] Demolición completa (grep arriba): sí, clase = 0
- [x] Tests prueban comportamiento: N/A (CA = grep de clase)
- [x] Arranque real verificado: N/A
- [x] README/specs del paquete: N/A
- [x] El diff contiene solo el alcance del WP: sí (`plan/**` + reporte)
- [x] Docs públicas C8/C9: N/A (no docs de producto; `plan/` interno)

## Hallazgos fuera de alcance

- Muchos briefs históricos tenían worktree absoluto; scrub de clase los
  tocó todos (esperado). Posible residual futuro: otras formas de path
  local no cubiertas por (1)/(2) (p. ej. `~/…`, UNC) — no vistas hoy.
- `plan/DATOS.md` cita rutas relativas tipo `SCRIPTORIUM_V0/…` (sin
  prefijo Users) — fuera de patrones (1)/(2); no tocado.

## Dudas / bloqueos

Ninguno. Orquestador: revisar diff + CA; merge a `main` cuando toque.
Worker no marca ✅ ni mergea.

---

## Revisión del orquestador

**Aceptado ✅** (2026-07-19) — tip `465ba99`.

Verificado: CA (1)/(2) = 0 en tip; SCRIPT_SDK solo meta en este reporte;
entrega `ENTREGA-2026-07-19-higiene-rutas-locales.md` sin exención, ejemplo
partido/neutro, 0 hits; diff 99 ficheros solo `plan/**`; BACKLOG sin cambio
de estados 🔶/✅ por el worker; CI N/A (paths-ignore U104). Auto-revisión
PRACTICAS §3 OK.

Residual menor: lista de commits del reporte no incluye el tip `465ba99`.

Merge autorizado → main. Aviso canal externo: higiene rutas locales cerrada
en Z_SDK (cierra CA de entrega I52 en el otro plan).
