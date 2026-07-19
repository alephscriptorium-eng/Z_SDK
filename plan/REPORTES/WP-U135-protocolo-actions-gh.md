# WP-U135 · protocolo-actions-gh — reporte

| dato | valor |
| ---- | ----- |
| agente | swarm-worker (orquestador→worker mismo chat · GO D-27) |
| fecha | 2026-07-19 |
| rama | `wp/u135-protocolo-actions-gh` |
| commit(s) | `b720307` · `e2bb84a` (tip) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se adoptó Fase 0 + (b) ligera del GO protocolo Actions: solo gobernanza
`plan/`. Se documentó el ritual `gh run list` / evidencia CI en ORQUESTADOR,
REVISION, WORKER, BRIEF, roles/README, PRACTICAS (§ evidencia, §5, §7, §8 C8
Pages vs local) y PLANTILLA (subsección Evidencia CI). Canónico = CLI `gh`;
prohibidos secrets y `workflow_dispatch` publish/release al worker; N/A
explícito bajo paths-ignore U104. No se tocaron workflows ni se impuso MCP/
Automations/Cursor-in-CI.

## Archivos tocados

- `plan/roles/ORQUESTADOR.md` — modificado: ritual Actions, post-merge, límites
- `plan/roles/REVISION.md` — modificado: check tip Actions; N/A U104; devolución
- `plan/roles/WORKER.md` — modificado: evidencia post-push; verde≠CI; prohibidos
- `plan/roles/BRIEF.md` — modificado: nota evidencia CI / adaptador `gh`
- `plan/roles/README.md` — modificado: línea evidencia CI / `gh`
- `plan/PRACTICAS.md` — modificado: evidencia Actions; §5 CI wp/*; §7; §8 C8
- `plan/REPORTES/PLANTILLA.md` — modificado: subsección Evidencia CI
- `plan/REPORTES/WP-U135-protocolo-actions-gh.md` — creado: este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- Comandos ejecutados y su salida relevante (tests, e2e, lint, gates):

```
# WP solo plan/ gobernanza — sin lint/gates de producto
git diff --stat main...HEAD
 plan/PRACTICAS.md                             | 24 ++++++-
 plan/REPORTES/PLANTILLA.md                    | 16 +++++
 plan/REPORTES/WP-U135-protocolo-actions-gh.md | 99 +++++++++++++++++++++++++++
 plan/roles/BRIEF.md                           |  2 +
 plan/roles/ORQUESTADOR.md                     | 26 ++++++-
 plan/roles/README.md                          |  4 ++
 plan/roles/REVISION.md                        | 13 +++-
 plan/roles/WORKER.md                          | 14 +++-
 8 files changed, 188 insertions(+), 10 deletions(-)
```

- Efecto visible: N/A (gobernanza texto).

### Evidencia CI

> Tras push de la rama. Canónico: `gh run list --branch <rama>`. Verde local
> ≠ gate CI (PRACTICAS §5).

| campo | valor |
| ----- | ----- |
| branch | `wp/u135-protocolo-actions-gh` |
| run_id | **N/A** (paths-ignore U104: solo `plan/**` / markdown) |
| workflow | CI |
| conclusion | **N/A** |

```
# Diff solo plan/ → CI no dispara (ci.yml paths-ignore plan/** + **.md)
gh run list --branch wp/u135-protocolo-actions-gh --limit 5
# (salida vacía = ningún run en la rama → N/A confirmado)
```

## Demolición

N/A (gobernanza; no se borró símbolo de producto).

```
# N/A
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: N/A (solo plan/)
- [x] Cadenas if/switch que debieron ser tabla: N/A
- [x] Duplicación con otros paquetes: N/A
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: no
- [x] Demolición completa: N/A
- [x] Tests prueban comportamiento: N/A (gobernanza)
- [x] Arranque real verificado: N/A
- [x] README/specs del paquete siguen siendo verdad: N/A
- [x] El diff contiene solo el alcance del WP: sí (plan/ roles + PRACTICAS + PLANTILLA + reporte)
- [x] Si docs públicas: C8/C9 — N/A (no docs públicas de producto; nota C8 Pages en PRACTICAS)

## Hallazgos fuera de alcance

- Ninguno bloqueante. Futuro (sin GO): modos (a)→(c) Cursor-in-CI / MCP
  opcionales quedan fuera de este micro, como pedía el informe.

## Dudas / bloqueos

Ninguno. Listo para revisión orquestador (✅ + merge usuario).

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
