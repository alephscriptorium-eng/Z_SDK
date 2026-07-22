---
name: embajador
description: >-
  Entrar a la ciudad Zeus con peercard y mapa «dónde está cada cosa»:
  kits FOSS del registry vs apps private del monorepo; URLs de guía
  estables (anti-deprecated) y recetas C8 sin clavar semver muerto.
---

# Skill · embajador (lado usuario Zeus)

Ayudá a un amigo o agente a **entrar** (peercard) y a **orientarse**
(mapa de paquetes / guías / gaps de mesh) sin inventar onboarding ni
prometer mesh live que el canal no entrega.

## Cuándo aplicar

- Alguien pide «cómo entro», «peercard», «startpack», «federar».
- Hay que distinguir **kit publicado** vs **app private / 404**.
- Hay que citar versiones: usá el catálogo vivo + `npm view`, no inventes
  números.

## Lecturas canónicas (URLs estables)

| tema | URL |
| ---- | --- |
| Handshake / peercard | https://z-sdk.escrivivir.co/guide/external-handshake |
| Catálogo kits FOSS (versiones citables) | https://z-sdk.escrivivir.co/guide/kits-foss |
| Portal Zeus (tres puertas) | https://z-sdk.escrivivir.co/ |
| Startpacks / jugar | https://games.z-sdk.escrivivir.co/startpacks |
| Registry | https://npm.scriptorium.escrivivir.co |

**DRY semver:** no hardcodees una versión como «la verdad eterna». Apuntá
a `kits-foss` +:

```bash
npm view @zeus/<paquete> version --registry https://npm.scriptorium.escrivivir.co
```

Si citás un corte de sesión, etiquetalo con fecha («corte YYYY-MM-DD»).

## Peercard — cómo entra un amigo / agente

1. **Contrato seat** — API estable:
   - `@zeus/protocol/peer-card` — forma de la card
   - `@zeus/protocol/peer-card-seat` — firma / verificación de asiento (Node)
2. **Kit embajador** — `@zeus/embajador-kit`: `emitirCredencial` /
   `consumirCredencial` con startpack por defecto
   `startpack-ciudad-v0.1.0` (ref de producto; el tarball puede no estar
   en el registry — ver mapa).
3. **MCP actor** — `@zeus/player-mcp-kit` emite peercard al bootstrap
   cuando el mesh room responde.
4. **Deuda visible (no cerrar):**
   - https://github.com/alephscriptorium-eng/Z_SDK/issues/4 (ssbId / seat)
   - https://github.com/alephscriptorium-eng/Z_SDK/issues/5 (ACL)
   - https://github.com/alephscriptorium-eng/Z_SDK/issues/6 (federación)

Detalle operativo: `reference/donde-esta-cada-cosa.md`.

## Reglas duras

1. **No inventes fricciones** — el mapa destila evidencia de canal C8
   (registry + guías). Si no está en el mapa ni en `npm view`, marcá
   «sin verificar».
2. **Nombres reales npm** — usá `parte-kit` / `acta-kit` / `lifecycle-kit`.
   **No** prometas `@zeus/parte`, `@zeus/acta`, `@zeus/lifecycle` (404).
3. **Kits ≠ mesh ciudad** — instalar FOSS no levanta
   `socket-server` + `operator-ui` + `@zeus/ciudad`. Eso es monorepo /
   build / private.
4. **PowerShell** — citá `"@zeus/..."` entre comillas; `@zeus` se expande
   como variable.
5. **Ceguera de producto** — este skill no lleva ids de tracking de plan
   (`WP-…`) ni tokens de método de casa.

## Pasos sugeridos al ayudar

1. Abrí [external-handshake](https://z-sdk.escrivivir.co/guide/external-handshake)
   y [kits-foss](https://z-sdk.escrivivir.co/guide/kits-foss).
2. Clasificá el pedido: **puerta peercard**, **sensor campana (ledger)**,
   o **mesh live UI**.
3. Receta mínima según clase (ver reference).
4. Si piden audio «campana suena» en browser: explicá gap
   (`operator-ui` private + build); sensor C8 =
   `@zeus/parte-kit` + `@zeus/operator-bridge` (`campanasFromLedger`).
