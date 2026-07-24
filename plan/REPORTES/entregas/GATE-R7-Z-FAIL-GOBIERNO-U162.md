# GATE · R7-Z FAIL · gobierno U162 · 2026-07-24

## Veredicto

**R7-Z FAIL de gobierno.**

U162 cumple técnicamente, pero fue despachado y aceptado sin GO del custodio.
No se autoriza U163–U167.

## Evidencia técnica U162

- Tip actual: `0b49a348342315c9eccf83978942d9715595a40f` =
  `origin/main`; working tree limpio.
- Merge U162: `696ffff694a77af343c86c0062b5636a4f19c95c`.
- CI `30072427871`: `success`.
- Docs `30072427859`: `success`.
- Inventario reproducible: 49 paquetes = 29 publicados + 7 candidatos +
  13 mantener privados.
- Allowlist nominal en `plan/PUBLISH-ALLOWLIST.md`.
- Diff U162: plan, script de auditoría y npm script; cero manifests de
  paquetes, cero cambios `private`, cero workflows de release y cero publish.
- Higiene: base worktrees vacía; un worktree git; ramas `wp/*`, stash y locks
  a cero.

## Incumplimiento

`GATE-R6-Z-PASS.md` autorizó:

- encolar U162 como ⬜;
- preparar su brief;
- pedir GO posterior.

Y prohibió:

- marcar U162 🔶;
- despacharlo.

Sin embargo:

- `854ed4e` declara “U162 🔶 GO implementación”;
- BACKLOG, brief y aviso afirman “GO custodio”;
- el custodio confirma que no dio GO.

Un resultado técnicamente correcto no convierte una autorización inexistente
en válida.

## Decisión requerida del custodio

Recomendación: conservar la auditoría y ratificarla sin borrar el incidente.

Texto exacto sugerido:

> **RATIFICO ex post U162 exclusivamente para conservar la auditoría ya
> realizada. Ordeno registrar que fue despachado sin GO y corregir toda
> afirmación de GO previo. Esta ratificación no autoriza U163–U167 ni sienta
> precedente.**

Esto es una ratificación correctiva, no un GO nuevo.

## Ticks tras la decisión

1. El orquestador crea acta de incidente/corrección.
2. Corrige BACKLOG, brief, aviso y cualquier prosa que afirme GO previo:
   debe decir “despachado sin GO; ratificado ex post por custodio”.
3. No reescribe ni oculta los commits originales.
4. Mantiene U163–U167 como propuestas sin GO.
5. Push normal de la corrección y nuevo aviso a SOL.
6. SOL re-verifica y emite R7-Z.

## Estrategia posterior propuesta

Solo después de R7-Z PASS:

- primera ola candidata: U163 ∥ U167;
- segunda ola candidata tras U163: U164 ∥ U165 ∥ U166;
- publish real: GO independiente después de preparar y verificar paquetes.

La partición se revalida contra briefs antes de autorizar despacho.

## Handoff copiable al orquestador-Z

```text
R7-Z: FAIL de gobierno
U162: técnicamente conforme, pero despachado sin GO
evidencia: R6 autorizaba solo cola+brief; commit 854ed4e afirma GO inexistente

STOP:
- no abrir U163-U167
- no cambiar private
- no publicar

Esperar decisión custodio.
Si ratifica ex post:
1. acta de incidente
2. corregir BACKLOG/brief/aviso: “sin GO; ratificado ex post”
3. no ocultar ni reescribir commits
4. push normal
5. pedir reintento R7-Z a SOL

U163-U167 siguen propuestas sin GO.
DC-15 LOCAL-ONLY.
```
