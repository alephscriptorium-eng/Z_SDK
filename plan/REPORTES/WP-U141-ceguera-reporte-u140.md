# WP-U141 · ceguera-reporte-u140 — reporte

| dato | valor |
| ---- | ----- |
| agente | worker swarm (chat U141) |
| fecha | 2026-07-19 |
| rama | `wp/u141-ceguera-reporte-u140` |
| commit(s) | `132d1a1` (enmascarado) · `06f0b0f` (reporte tip) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se enmascararon las 14 menciones literales del token objetivo
(nombre-repo-externo) en
`plan/REPORTES/WP-U140-scrub-rutas-locales.md`, sustituyéndolas por la
máscara neutra `<externo>` en evidencia CA, demolición y prosa de la
revisión del orquestador. No se reabrió el scrub de rutas absolutas ni
se tocó `packages/` ni docs de producto. Este reporte no reintroduce el
token en claro.

## Archivos tocados

- modificado `plan/REPORTES/WP-U140-scrub-rutas-locales.md` — 14× token
  literal → `<externo>`
- creado este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.
> Needle del token: solo en el comando de verificación; en salidas/prosa
> se cita como `<externo>` / «nombre-repo-externo».

- CA1 — grep del token (nombre-repo-externo) en todo el repo (skip
  `.git` / `node_modules`):

```
token_len=10
CA1_rg_count=0
CA1_rg_files=0
```

- CA2 — alcance del diff (solo reportes plan):

```
 plan/REPORTES/WP-U140-scrub-rutas-locales.md | 28 ++++++++++++++--------------
 1 file changed, 14 insertions(+), 14 deletions(-)
```

(tras añadir este reporte: 2 ficheros bajo `plan/REPORTES/`; sin
`packages/` ni código)

- CA3 — clase rutas absolutas U140 (patrones (1)/(2) de
  `ENTREGA-2026-07-19-higiene-rutas-locales.md`) no regresionó:

```
CA3_pat1=0
CA3_pat2=0
```

- Lint/tests de código: N/A (WP documental en `plan/REPORTES/`).

### Evidencia CI

> Tras push de la rama. Canónico: `gh run list --branch <rama>`. Verde local
> ≠ gate CI (PRACTICAS §5).

| campo | valor |
| ----- | ----- |
| branch | `wp/u141-ceguera-reporte-u140` |
| run_id | **N/A** (paths-ignore U104: solo `plan/**` / `**.md`) |
| workflow | — |
| conclusion | **N/A** |

```
$ gh run list --branch wp/u141-ceguera-reporte-u140 --limit 5
(sin runs — diff solo plan/**; CI no dispara por U104)
```

## Demolición

Menciones literales del token objetivo (nombre-repo-externo) en el
reporte U140 (evidencia `CA3 …=0`, listados por fichero, prosa de
demolición y revisión orquestador). Grep del token en todo el árbol = 0
tras el cambio (incluidos U140 y este reporte).

```
CA1_rg_count=0
CA1_rg_files=0
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no; solo máscara `<externo>`;
      clase rutas U140 sigue en 0
- [x] Cadenas if/switch que debieron ser tabla: N/A (docs)
- [x] Duplicación con otros paquetes: N/A
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: no
- [x] Demolición completa (grep arriba): sí, token = 0 en todo el repo
- [x] Tests prueban comportamiento: N/A (CA = grep)
- [x] Arranque real verificado: N/A
- [x] README/specs del paquete: N/A
- [x] El diff contiene solo el alcance del WP: sí (U140 reporte + este)
- [x] Docs públicas C8/C9: N/A (`plan/` interno)

## Hallazgos fuera de alcance

Ninguno.

## Dudas / bloqueos

Ninguno. Orquestador: revisar diff + CA; merge a `main` cuando toque.
Worker no marca ✅ ni mergea.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
