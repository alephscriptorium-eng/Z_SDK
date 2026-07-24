# Brief — WP-U177 · Contrato consumo IDE opt-in + cierre diseño Zigurat

(rol) plan/roles/README.md → WORKER (skill swarm-orquestacion)

WP: WP-U177 · Contrato de consumo IDE opt-in + cierre de diseño épica U73
Rama: wp/u177-contrato-ide-cierre-zigurat
Worktree: C:\S_LAB\.worktrees\z\wp-u177-contrato-ide-cierre-zigurat
Reporte: plan/REPORTES/WP-U177-contrato-ide-cierre-zigurat.md

## Lecturas
- plan/REPORTES/entregas/REPLAN-2026-07-24-r13-dramaturgo-zigurat.md
- plan/REPORTES/entregas/ADDENDA-R13-Z-TERCER-FRENTE-DRAMATURGO.md (§WP)
- BACKLOG § R13-Z (épica U73) · D-20/D-43 (hook SSB · acotación)
- contratos U172–U175 (cuando existan sus reportes)

## Tarea
1. **Contrato de consumo IDE opt-in** documentado: cómo un IDE/editor
   externo consume las tools MCP (U172) y la autoría gateada (U175) —
   contrato/spec, **sin implementar extensión** (ownership externo).
2. **Cierre de diseño de la épica U73 · Zigurat acotada:** qué entra
   (reparto, permisos, autoría, import) / qué NO entra (capa federada
   completa, identidad nueva) / puntos de extensión (hook SSB D-20).
3. El diseño puede redactarse en paralelo; el **cierre** exige
   contratos U173–U175 aceptados.

## CA
- Contrato IDE opt-in citable y verificable contra los contratos
  reales U172/U175 (no especulativo).
- Cierre de diseño de la épica con fronteras explícitas; U73 pasa de
  épica ⬜ a cerrada-por-diseño solo con este WP ✅.
- Cero código de extensión IDE; cero publish.

## ALCANCE_DIFF
- documento(s) de contrato/diseño bajo `plan/REPORTES/` (o `docs/` si
  el orquestador lo indica en despacho)
- reporte bajo `plan/REPORTES/`
- **Prohibido:** código de extensión IDE · paquetes nuevos · publish ·
  editar BACKLOG

## Notas
- Estado planificado: **⬜** — NO despachar hasta: **DA-S21 · `2eb4784` asentada** (hecho) + R12 cerrado + **R13-Z PASS** + GO implementación
  (cierre requiere además U173–U175 ✅).
- Estimación: M · Eje IV (diseño/contrato) · Ola E
- Runner despacho futuro: preferir Fable; si no, GPT-5.6 Sol; si no,
  el mejor disponible (anotar cascada en el aviso).
- MUNDO_RAIZ = C:\S_LAB\z-sdk · WORKTREE_BASE = C:\S_LAB\.worktrees\z
- DC-15 LOCAL-ONLY · No editar `plan/BACKLOG.md` (solo orquestador)
