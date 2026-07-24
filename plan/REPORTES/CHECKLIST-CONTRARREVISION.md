# Checklist — contrarrevisión independiente (read-only)

Plantilla corta para el revisor. Norma completa: [PRACTICAS §9](../PRACTICAS.md).
Clasificación y campos del brief: `revision-adversarial.md` (paquete
`@alephscript/skills-scriptorium`).

| dato | valor |
| ---- | ----- |
| WP | _(id)_ |
| rama | `wp/…` |
| revisor | _(distinto de worker y orquestador que acepta)_ |
| fecha | _(YYYY-MM-DD)_ |

## Entrada recibida

- [ ] Brief con `RIESGO_REVISION: independiente` y los cuatro campos
- [ ] Reporte worker en la rama
- [ ] Base de diff acordada (`main` o tip del brief)

## Checklist (intentar refutar)

- [ ] **Falsos negativos:** casos inválidos/adversariales del brief no pasan
      en verde; probes rojos reproducidos
- [ ] **Deps no declaradas:** runtime directo declarado en manifest/lock
- [ ] **Install limpia:** resolución desde árbol limpio o probe; lock al día
      si manifests cambiaron
- [ ] **Prueba vs test:** automatizado (salida literal) ≠ manual ≠
      `⏳ sin verificar`
- [ ] **Fronteras publish:** allowlist, `private`, changesets; sin publish
      efectivo si el CA lo prohíbe
- [ ] **Alcance:** diff ⊆ `ALCANCE_DIFF` del brief

## Salida

| resultado | condición |
| --------- | --------- |
| `PASS` | No se refutaron los CA con lo ejecutado |
| `DEVUELTO` | Lista numerada de defectos o evidencia faltante |

Registrar en el reporte del WP (sección **Contrarrevisión** o anexo), con
comandos y salidas literales. `PASS` no autoriza ✅ ni merge.
