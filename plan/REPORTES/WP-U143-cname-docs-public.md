# WP-U143 · cname-docs-public — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (WP-U143) |
| fecha | 2026-07-19 |
| rama | `wp/u143-cname-docs-public` (zeus + library) |
| commit(s) | zeus `bbad244` (CNAME) · `32aa266` `00b5c3b` + tip reporte · library `963841f` |
| estado propuesto | listo para revisión |

## Qué se hizo

Se creó `docs/public/CNAME` en el portal (zeus) con el dominio
`z-sdk.escrivivir.co` y en el catálogo (library) con
`games.z-sdk.escrivivir.co` (creando `docs/public/` que no existía).
Ambas ramas se pushearon. No se tocó DNS, Settings→Pages ni U144 /
workflows. Tras merge+deploy Pages, el custom domain debería persistir
en el artifact (verificación post-deploy: ⏳ — este chat no mergea).

## Archivos tocados

- `docs/public/CNAME` (zeus) — creado: dominio portal Pages
- `docs/public/CNAME` (library) — creado (+ dir `docs/public/`): dominio catálogo Pages
- `plan/REPORTES/WP-U143-cname-docs-public.md` (zeus) — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- CA `git ls-files` + contenido (blobs sin BOM; newline final OK):

```
# zeus (worktree wp-u143)
$ git ls-files docs/public/CNAME
docs/public/CNAME
$ git show HEAD:docs/public/CNAME | od -c
0000000   z   -   s   d   k   .   e   s   c   r   i   v   i   v   i   r
0000020   .   c   o  \n
0000024

# library (worktree wp-u143)
$ git ls-files docs/public/CNAME
docs/public/CNAME
$ git show HEAD:docs/public/CNAME | od -c
0000000   g   a   m   e   s   .   z   -   s   d   k   .   e   s   c   r
0000020   i   v   i   v   i   r   .   c   o  \n
0000032
```

- Diff acotado (solo CNAME en commits de alcance; reporte aparte en zeus):

```
# zeus origin/main...bbad244
 docs/public/CNAME | 1 +
 1 file changed, 1 insertion(+)

# library origin/main...963841f
 docs/public/CNAME | 1 +
 1 file changed, 1 insertion(+)
```

- Persistencia dominio post merge+deploy (Settings→Pages refleja
  custom domain): **⏳ sin verificar** — no merge en este chat; gate
  post-revisión orquestador/ops.

- Lint/tests unitarios: N/A (solo ficheros estáticos CNAME + reporte).

### Evidencia CI

> Tras push de la rama. Canónico: `gh run list --branch <rama>`. Verde local
> ≠ gate CI (PRACTICAS §5).

#### Zeus (`Z_SDK`) — push CNAME `bbad244`

| campo | valor |
| ----- | ----- |
| branch | `wp/u143-cname-docs-public` |
| run_id | Docs `29704100913` · CI `29704100883` |
| workflow | Docs / CI |
| conclusion | ambos `success` |

```
$ gh run list --repo alephscriptorium-eng/Z_SDK --branch wp/u143-cname-docs-public --limit 5
completed	success	docs(public): track CNAME for Pages custom domain	Docs	wp/u143-cname-docs-public	push	29704100913	1m27s	2026-07-19T21:17:59Z
completed	success	docs(public): track CNAME for Pages custom domain	CI	wp/u143-cname-docs-public	push	29704100883	2m19s	2026-07-19T21:17:59Z
```

#### Library (`Z_SDK-games-library`) — push CNAME `963841f`

| campo | valor |
| ----- | ----- |
| branch | `wp/u143-cname-docs-public` |
| run_id | Docs `29704102494` · CI `29704102478` |
| workflow | Docs / CI |
| conclusion | ambos `success` |

```
$ gh run list --repo alephscriptorium-eng/Z_SDK-games-library --branch wp/u143-cname-docs-public --limit 5
completed	success	docs(public): track CNAME for Pages custom domain	CI	wp/u143-cname-docs-public	push	29704102478	1m44s	2026-07-19T21:18:02Z
completed	success	docs(public): track CNAME for Pages custom domain	Docs	wp/u143-cname-docs-public	push	29704102494	1m20s	2026-07-19T21:18:02Z
```

Push posterior solo de este reporte (`plan/**`): CI esperado **N/A**
(paths-ignore U104) si no hay run asociado.

## Demolición

n/a (añadir ficheros; no había CNAME previo que sustituir).

```
(n/a)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: solo el hostname del CNAME
      (contenido canónico del fichero Pages; no es puerto/room de runtime).
- [x] Cadenas if/switch que debieron ser tabla: n/a (sin código).
- [x] Duplicación con otros paquetes: n/a.
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres fuera de glosario o de transición: no.
- [x] Demolición completa: n/a.
- [x] Tests prueban comportamiento: n/a (WP de artifact estático; CA =
      `ls-files` + contenido).
- [x] Arranque real verificado: n/a runtime; Docs workflow `success` en
      ambas ramas (build Pages con CNAME en artifact). Persistencia en
      Settings post-merge: ⏳.
- [x] README/specs del paquete siguen siendo verdad: no tocados.
- [x] El diff contiene solo el alcance del WP: sí (CNAME ×2 + reporte).
- [x] C8/C9: no hay comandos copiables ni listas de eventos futuros en
      docs públicas tocadas; CNAME es dato de deploy. C8 Pages: Docs run
      verde (no solo build local).

## Hallazgos fuera de alcance

Ninguno.

## Dudas / bloqueos

Ninguno. Persistencia Settings→Pages queda para verificación tras merge
(orquestador/ops).

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
