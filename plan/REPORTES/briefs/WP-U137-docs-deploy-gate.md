# Brief — WP-U137 · Docs deploy saltado = fallo visible

**STOP / N/A · 2026-07-19 (orquestador).** No implementar. No reanudar
worker con esta premisa (`f92b3a9b`).

Origen hallazgo: vigilante (hallazgo ≠ GO). Amparo lote: **D-28** usuario
(AMEND D-26–D-28).

---

## Cierre N/A

La premisa «deploy saltado con run verde = falso verde» era **incorrecta**
para builds de rama: deploy solo corre en `main`; skip en `wp/*` es
correcto. Causa real del tip U132 no servido en Pages = **`git push`
faltante** (`main` local `ahead 1` tip `c55955b`).

Tras push (2026-07-19): Docs run `29689050539` success + deploy Pages
success; curl público muestra marcador tip «tomá el asset».

**Prohibido:** gate genérico «skip=rojo» (rompería builds de rama).

**Decisión orquestador:** cerrar **N/A** (sin código útil en ramas;
preferencia sobre re-scope a verificación post-deploy). Ver reporte
[WP-U137-docs-deploy-gate.md](../WP-U137-docs-deploy-gate.md).

---

~~Brief original (archivado — no ejecutar)~~

```text
(rol) plan/roles/WORKER.md

WP: WP-U137 · Deploy saltado en main+docs/** no puede ser verde
… gate skip=rojo en docs.yml …
```
