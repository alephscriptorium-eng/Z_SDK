# WP-U126 · release-startpack-yml — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok) |
| fecha | 2026-07-19 |
| rama zeus | `wp/u126-release-startpack-yml` |
| rama library | `wp/u126-release-startpack-yml` |
| commit(s) library | `6c5241a` |
| estado propuesto | listo para revisión |

## Qué se hizo

Se eligió **(a) corregir YAML** (no demoler): el workflow es el entrypoint CI que
invoca `scripts/notario-release.mjs` (vía canónica de pack/acta/tarball). La
prosa de cabecera sin `#` (líneas 3–4) hacía fallar el parser; se comentó y se
añadió nota de que el Notario es la vía canónica. Parser YAML pasa.

## Archivos tocados

- `Z_SDK-games-library/.github/workflows/release-startpack.yml` — modificado:
  prosa de cabecera convertida a comentarios YAML válidos + nota Notario.

## Evidencia

Antes (fallo):

```
yaml.scanner.ScannerError: mapping values are not allowed here
  in ".github/workflows/release-startpack.yml", line 6, column 5
```

Después:

```
$ python -c "import yaml; d=yaml.safe_load(open('.github/workflows/release-startpack.yml')); print('YAML OK'); print('name=', d.get('name'))"
YAML OK
name= Release startpack
```

Nota: PyYAML 1.1 trata la clave `on` como booleano (`True`); GitHub Actions usa
su propio parser. El fallo de ScannerError (prosa sin `#`) quedó resuelto.

Notario presente y referenciado por el workflow:

```
scripts/notario-release.mjs  (existe; invocado en step «Notario pack + GitHub Release»)
docs/startpacks.md menciona scripts/notario-release.mjs como vía de pack
```

Push library:

```
branch 'wp/u126-release-startpack-yml' set up to track 'origin/wp/u126-release-startpack-yml'
* [new branch] HEAD -> wp/u126-release-startpack-yml
commit 6c5241a fix(ci): comentar prosa inválida en release-startpack.yml
```

## Demolición

No aplica (opción a). No se borró el workflow.

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: N/A (solo comentarios YAML)
- [x] Cadenas if/switch que debieron ser tabla: N/A
- [x] Duplicación con otros paquetes: N/A
- [x] console.log / código comentado / TODO sin backlog: solo comentarios de
      cabecera del workflow
- [x] Nombres fuera de glosario o de transición: no
- [x] Demolición completa: N/A (opción a)
- [x] Tests prueban comportamiento: parser YAML como CA
- [x] Arranque real verificado: ⏳ sin verificar ejecución Actions (CA = parser)
- [x] README/specs: docs/startpacks.md ya apunta al Notario; sin cambio
- [x] El diff contiene solo el alcance del WP: sí (1 fichero workflow)

## Hallazgos fuera de alcance

- El workflow solo ofrece `delta|pozo` en `workflow_dispatch`, pero el catálogo
  Notario incluye también sketch/solve-coagula/plaza — candidato a WP aparte.
- PyYAML mapea `on:` → clave booleana; no afecta a Actions, pero confunde
  validadores genéricos.

## Dudas / bloqueos

Ninguno.

---

## Revisión del orquestador

**Aceptado ✅** — orquestador / 2026-07-19.

Verificado:
- Diff library `main...wp/u126-release-startpack-yml` = solo
  `.github/workflows/release-startpack.yml` (commit `6c5241a`). Zeus = solo
  este reporte (`97089cf`). No tocó CAPA ni `package.json` (U128).
- Opción **(a)** correcta: workflow invoca Notario; no demoler.
- CA: `yaml.safe_load` → `YAML OK` / `name= Release startpack` (reproducido
  en revisión). Prosa de cabecera comentada + nota vía canónica.
- PRACTICAS §1–3/§6 OK (micro CI; evidencia literal; commit convencional).
- Hallazgo catálogo `delta|pozo` vs sketch/solve/plaza → cola residual, no
  bloquea.

**Merge:** library `wp/u126-release-startpack-yml` + reporte zeus → `main`.
Orden: tras U129, antes de U128.
