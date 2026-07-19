# WP-U133 · practicas-c8-c9 — reporte

| dato | valor |
| ---- | ----- |
| agente | worker · chat WP-U133 |
| fecha | 2026-07-19 |
| rama | `wp/u133-practicas-c8-c9` |
| commit(s) | `1a45bf79d0a9066da57d37f8591f6de20c738599`, `4988fb089b6b053c487592bb7706ecec7ca04031`, `f27c2af8bfc2616946270e23ba8111ba91d0dc3a`, `3e4085be1ebf2bd157710da3a7020e2bc69ce297` |
| estado propuesto | listo para revisión |

## Qué se hizo

Se portaron C8 y C9 desde WEBS/ENTREGA-CAPA `00-NOTA.md` §(B) a
`plan/PRACTICAS.md` como **§8 Docs — C8 / C9 (criterio de aceptación
estándar)**, citables por workers y criterio de devolución en revisión.
Se añadió el ítem C8/C9 al checklist de auto-revisión §3 y a
`REPORTES/PLANTILLA.md`. Puntero mínimo en `roles/WORKER.md` y
`roles/REVISION.md`. Se valoró (propuesta en prosa, sin tooling) la
auditoría CANTERA/01 rev1 como candidata a práctica periódica o gate de
`docs:build` — no instalada. No se tocó library/docs ni ENTREGA-* ni
BACKLOG.

## Archivos tocados

- `plan/PRACTICAS.md` — modificado: §3 checklist + §8 C8/C9 + candidata auditoría
- `plan/REPORTES/PLANTILLA.md` — modificado: ítem C8/C9 en auto-revisión
- `plan/roles/WORKER.md` — modificado: puntero a §8 si WP de docs
- `plan/roles/REVISION.md` — modificado: comprobar §8 en WPs de docs
- `plan/REPORTES/WP-U133-practicas-c8-c9.md` — creado: este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- Diff acotado al alcance (gobernanza plan/):

```
$ git diff main...HEAD --stat
 plan/PRACTICAS.md          | 46 ++++++++++++++++++++++++++++++++++++++++++++++
 plan/REPORTES/PLANTILLA.md |  2 ++
 plan/roles/REVISION.md     |  3 ++-
 plan/roles/WORKER.md       |  2 +-
 4 files changed, 51 insertions(+), 2 deletions(-)
```

- C8 y C9 citables en PRACTICAS:

```
$ rg -n 'C8|C9|## 8\. Docs' plan/PRACTICAS.md
95:- [ ] Si el WP toca docs públicas con comandos o listas de canal: ¿C8 y C9
188:## 8. Docs — C8 / C9 (criterio de aceptación estándar)
192:contra C8 y C9. Son citables por workers y por el orquestador en revisión
196:### C8 — Canal real de cada comando
208:### C9 — Listas manuales dependientes de eventos futuros
219:estado es C9 incumplido.
227:`docs:build` — hoy no es gate instalado ni checklist obligatorio; C8 y C9
```

- Solo ficheros de gobernanza en el diff (cero library/docs, cero ENTREGA,
  cero BACKLOG):

```
$ git diff main...HEAD --name-only
plan/PRACTICAS.md
plan/REPORTES/PLANTILLA.md
plan/roles/REVISION.md
plan/roles/WORKER.md
```

- Alineación con fuente `00-NOTA.md` §(B): C8 = comando copiable se ejecuta
  contra su canal; «publicado» ambiguo (Release ≠ npm ≠ tarball); gated solo
  en página de estado. C9 = lista manual de eventos futuros = rot en potencia
  → generar / borrar+link / caducidad. Candidata CANTERA/01 en §8 (propuesta,
  no gate).
- `npm run lint` / tests: N/A (WP de gobernanza; sin código de producto).

## Demolición

N/A (gobernanza; no se sustituyó código ni paquetes).

```
(N/A)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: N/A (solo markdown de plan/)
- [x] Cadenas if/switch que debieron ser tabla: N/A
- [x] Duplicación con otros paquetes (busqué antes de responder): no se copió
      ENTREGA a plan/; se portó el sentido a PRACTICAS
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: no (C8/C9 son ids del método)
- [x] Demolición completa (grep arriba): N/A
- [x] Tests prueban comportamiento, no solo «no explota»: N/A
- [x] Arranque real verificado (qué levanté y miré): N/A
- [x] README/specs del paquete siguen siendo verdad: N/A (no paquetes)
- [x] El diff contiene solo el alcance del WP: sí (4 ficheros plan/ + reporte)
- [x] Si docs públicas: C8/C9 — este WP *define* C8/C9; no edita docs públicas

## Hallazgos fuera de alcance

- Formalizar la auditoría CANTERA/01 como gate de `docs:build` queda como
  residual/WP futuro (ya enunciado en §8 como candidata).
- U132 (correctivo library docs) y U134 (higiene ENTREGA en plan/) son
  paralelos; no se tocaron aquí.

## Dudas / bloqueos

Ninguno.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
