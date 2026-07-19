# WP-U137 · Docs deploy saltado = fallo visible — N/A

**Estado:** N/A (orquestador / 2026-07-19). Sin entrega de worker.

## Premisa (hallazgo vigilante)

Workflow Docs `success` con job deploy saltado → tip AMEND en main sin
Pages servido («falso verde»).

## Hecho corregido

- Deploy saltado en **rama** / build-only = **correcto** (deploy solo-`main`).
- Causa real: library `main` local **ahead 1** tip `c55955b` **sin push**.
- **No** gate «skip=rojo» genérico (rompería builds de rama).

## Evidencia post-push (ritual U135)

```text
$ git push origin main
ffffb27..c55955b  main -> main
tip: c55955b docs(portal): W-B′ verdad de canales CAPA rev2 (WP-U132)

$ gh run list --branch main --limit 2
success  Docs  29689050539  (docs:build + deploy Pages success)
success  CI    29689050544

$ curl -sS -L -o /dev/null -w "%{http_code}\n" \
  https://games.z-sdk.escrivivir.co/games/solve-coagula
200

marcador tip en HTML: «tomá el asset `.tgz` (acta incluida) e instalalo»
```

## Revisión del orquestador

- **N/A** — premisa incorrecta; 0 commits útiles en
  `wp/u137-docs-deploy-gate` (zeus + library). Worker no reanudar.
- Opciones A (re-scope curl post-deploy) / B (N/A): elegida **B**.
- Gobernanza: hallazgo vigilante ≠ GO; amparo **D-28** usuario.

## Demolición

N/A (nada mergeado). Worktrees U137 a retirar en higiene.
