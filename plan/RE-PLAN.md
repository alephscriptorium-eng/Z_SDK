# RE-PLAN — balance de cierre de la refundación zeus

> **Qué es:** retrospectiva propia del monorepo / swarm zeus, escrita desde
> `plan/REPORTES/`, `plan/BACKLOG.md` y `plan/DECISIONES.md` tras el cierre
> de Ola 9 (U70 · U86 · **U87 ✅**).
>
> **Qué no es:** no inventa WPs (viven en [BACKLOG.md](BACKLOG.md) vía
> capa B del orquestador). No importa marco externo ni vocabulario ajeno.
> No toca ops de registry/DNS/U55.

Fecha: 2026-07-18 · rama de referencia: `main` post-merge U87 (`bd5f46c`).
Addendas propias: triaje schema/alias → U115–U117 · post-U114 (U116) ·
post-U115 (U117) · estabilización mesa plan (U118).

---

## 1. Veredicto

La **refundación del SDK** (olas 0–10 + higiene + remate D-22 /
A-14–A-15) está **drenada en diseño y en código de producto**: 0 DA
abiertas post D-21/D-23; frentes D-22 en código ✅; Ola 6 y Ola 9 cerradas.

**Estado frente post-refundación / capa B:** micro ~~U109~~/~~U110~~ ✅;
frente editor ~~U111–U114~~ ✅; residual kit schema → ~~**U115**~~ ✅
(AJV / schema-as-truth en carpeta; ver BACKLOG); residual view-kit
post-U114 → ~~**U116**~~ ✅ (**GO A** · alias `cast-table` +
`panel-elenco`); residual post-U115 → ~~**U117**~~ ✅
(`@zeus/story-board-schema` único en zeus; library+editor). Mesa plan
~~**U118**~~ ✅ (BACKLOG vivo + histórico). Swarm **0 🔶**. Lo que queda
no es «terminar la refundación», sino ops (publish/DNS) y residuales
**sin GO**. IDs/CAs solo en [BACKLOG.md](BACKLOG.md); cierre narrativo:
[ENTREGA-2026-07-18c.md](ENTREGA-2026-07-18c.md). Historia de olas:
[BACKLOG-HISTORICO.md](BACKLOG-HISTORICO.md).

Ops residuales (publish real → U55; DNS custom U106/U107; sidecar blob)
siguen fuera del swarm — no son deuda de diseño.

---

## 2. Qué cerró la refundación

| Eje | Evidencia en repo |
| --- | ----------------- |
| Contrato único + autoridad | U10–U13, U24, U98–U99 |
| Vistas / dos juegos | U20–U23 (delta + pozo) |
| Un solo juego mesh | U30–U32, U56 |
| Docs + layout + publish prep | U40–U41, U50–U54, U103–U105 |
| Games-library + start packs | U60–U62, U107–U108 |
| Plano de datos + feeds | U80–U85, U91–U92 |
| Mundo A (scaffold) | U70 editor sketch · U86 carpeta · **U87 tercer juego** |
| WebRTC + peer-card + blobs prep | U88–U93, U100–U101 (live ⏳ por diseño D-22) |
| Higiene PRACTICAS | U94–U99, U102 |
| Capa B (editor produce juegos) | U109–U117 |
| Mesa plan legible | U118 |

El swarm implementó; el orquestador planificó/revisó; el usuario cerró
DECISIONES. El protocolo en `plan/roles/` aguantó la cadencia.

---

## 3. Lecciones propias (zeus → zeus)

### 3.1 Devuelto duele menos que ✅ mentiroso

Cuando un WP vuelve, el coste es un ciclo CORRECCION. Cuando se marca ✅
con CA a medias, el coste es **deuda invisible** que el siguiente lote
hereda como «ya hecho». PRACTICAS §3 (evidencia literal / `⏳ sin
verificar`) y la revisión orquestador existen para eso: el patrón bueno
es aceptar con CA de código verde y anotar ops remoto como ⏳ explícito,
no como verde implícito. **Modelo U61:** «Devuelto» por bug real
(Windows symlink/realpath) → worker corrige → orquestador **re-verifica**
con smoke propio — ciclo de aceptación en su mejor forma.

### 3.2 CA-sin-curl / evidencia

Los reportes que pasan son los que pegan salida real (`npm test`, e2e,
Notario, `docs:build`). Los que fallan el espíritu PRACTICAS inventan
observaciones o dejan «se debería…». Regla de casa reforzada post-olas:
**si no corriste el comando, escribe ⏳ y el motivo** — no un ✅ de
cortesía. U87 es el modelo del sensor: e2e C-01..C-03 + tarball Release
+ informe honesto de gaps.

### 3.3 ✅-vs-realidad (U106 / U107)

U106 y U107 están ✅ en BACKLOG por **CA de código** (base VitePress,
workflow, piel, cards). El **CA remoto** (Custom domain + HTTPS en
`z-sdk.escrivivir.co` / `games.z-sdk.escrivivir.co`) sigue ⏳ ops
usuario. Eso es correcto *si* el remate del BACKLOG lo dice en voz alta.
Anti-patrón a no repetir: leer un ✅ de plan como «la URL pública ya
vive». El orquestador debe seguir separando **aceptado de código** vs
**tick remoto** en el remate.

### 3.4 El tercer juego es un sensor, no un trofeo

U87 recreó SOLVE ET COAGULA en la library con kits + mesh e2e + Release.
Cumplió CA. Y dejó §hallazgos 1–8: el editor solo materializa `sketch`;
la carpeta instancia plantilla vacía; los widgets son prompts sin
runtime; slots de puertos `solve*` ausentes; etc. Eso es el **sensor del
mundo A**: el juego existe *a pesar de* el editor, no *gracias a* él.
VISION §mundo A («que SOLVE lo cree un dramaturgo con el editor, no
nosotros a mano») sigue abierto — candidatura natural del frente
post-refundación (capa B).

### 3.5 Swarm drenado ≠ producto terminado

Olas de refundación cerradas significan: **no hay más WPs del plan
original pendientes**. No significan que el editor produzca juegos
narrativos, ni que linea-aleph vivo esté montado, ni que las skills de
network-engine vivan en zeus. Esas piezas se priorizan como
post-refundación (capa B / frente editor), no como «ola 11 fantasma» sin
dueño. (Capa B cerrada en código U109–U117; mesa plan estabilizada U118;
swarm idle — sin reabrir refundación.)

### 3.6 Capa B = editor produce juegos

Tras U87, el arco de producto coherente fue:

1. Higiene inmediata que PRACTICAS ya exige (puertos en presets-sdk;
   no copiar `loadStartPack`) — ~~U109~~/~~U110~~ ✅.
2. Frente editor / carpeta / story-board / widgets — para que un
   dramaturgo produzca un juego real sin armar a mano en la library
   (U111–U114 ✅; residual schema kit → U115 ✅; residual id widget
   fábrica → U116 ✅ GO A; residual schema único zeus → U117 ✅).
3. Diferidos conscientes (linea-aleph vivo; skills stub) sin convertirlos
   en WPs ejecutables hasta que el usuario los active.
4. Estabilización de la mesa plan (colas/archivo) — ~~U118~~ ✅.

Los IDs y CAs concretos están **solo** en BACKLOG (vivo + histórico).

### 3.7 CI limpio = «segundo consumidor» barato

U102 demostró que un runner hermético destapa bugs de producto
(`webrtc-viewer` ausente en stop:services; `ZEUS_SCRIPTORIUM_ROOM` que
nunca se aplicaba) sin inventar un segundo juego. Mantener la matriz CI
verde y honesta es sensor continuo — no solo gate de merge.

### 3.8 Anti-patrones se propagan si no se cortan

A-08 (doble validación) se replicó en U83; `loadStartPack` llegó a ×4
antes del kit (U110). Cortar en el primer hallazgo (WP o cola con dueño)
sale más barato que rematar tras N copias. PRACTICAS §1.4 + §hallazgos →
WP nuevo, no «ya lo arreglamos luego».

---

## 4. Anti-patrones observados (para no repetir)

| Anti-patrón | Mitigación en plan/ |
| ----------- | ------------------- |
| Worker edita BACKLOG | Solo orquestador en `main` |
| Arreglos de pasada desde hallazgos | §hallazgos → WP nuevo; no patch en el mismo chat |
| ✅ sin evidencia literal | Devolver; PRACTICAS §3 |
| Confundir CA código con CA remoto | Remate BACKLOG + DECISIONES ops |
| Canonizar el ejemplo en engine | Regla de los dos juegos + gate U00.d |
| Abrir frentes sin priorización | Usuario autoriza lotes; orquestador no 🔶 solo |
| Dejar duplicación «por ahora» | Cortar en el 1.er hallazgo (§3.8); kit antes de ×N |
| Importar vocabulario / marco externo | Idioma zeus: ola, frente, estación, capa B, mediación |

---

## 5. Relación con BACKLOG / DECISIONES

- **Este archivo no enumera WPs nuevos** (salvo citar IDs ya en BACKLOG).
  Tras GO capa B + triaje schema/alias: micro U109–U110 ✅; frente editor
  ~~U111–U114~~ ✅; residual schema kit ~~**U115**~~ ✅; residual view-kit
  alias ~~**U116**~~ ✅ (GO A); residual schema único ~~**U117**~~ ✅;
  mesa plan ~~**U118**~~ ✅; diferidos §5–6 en
  [DECISIONES.md](DECISIONES.md) (**sin GO** → sin WP). Detalle vivo en
  [BACKLOG.md](BACKLOG.md); historia en
  [BACKLOG-HISTORICO.md](BACKLOG-HISTORICO.md); entrega:
  [ENTREGA-2026-07-18c.md](ENTREGA-2026-07-18c.md).
- Horizontes previos (U71–U74) siguen en BACKLOG §Horizonte; no se
  reabren aquí.
- U55 permanece gated a publish real (ops); no forma parte de la capa B.

---

## 5bis. Addenda post-U114 (view-kit alias)

Observación (2026-07-18): la fábrica `createDefaultWidgetRegistry`
solo traía `panel-elenco` (convención solve-inline) aunque el renderer
ya era neutro (`cast-table`). Riesgo: canonizar el ejemplo en keys de
engine (PRACTICAS §1.11 / §3.8). Triaje → **WP-U116** → ✅
(**GO A** alias factory; merge `d4f9ad3`). No solapó U115 (AJV carpeta).
Micros previos sin GO (peer-card viewer, STOP_SERVICES) siguen en cola
sin activar.

---

## 5ter. Addenda post-U115 (schema único)

Observación (2026-07-18): U115 dejó AJV+schema como verdad en
library (`kits/carpeta-dramaturgo`); el editor U114 seguía con regex a
mano en `story-board-dialects.mjs` (`ACT_ID` / `WIDGET_ID`). Misma
forma, dos tecnologías — §3.8 otra vez. Triaje → **WP-U117** → ✅
(`@zeus/story-board-schema`; merge `8096775`; library importa; editor
valida contra él). No solapó U116.

---

## 5quater. Addenda estabilización mesa plan (U118)

GO usuario (2026-07-18): compactar BACKLOG (~1552 líneas / ~33 colas) sin
borrar historia útil. Resultado: tablero vivo +
[BACKLOG-HISTORICO.md](BACKLOG-HISTORICO.md); scrub de vocabulario
externo ajeno → frente / capa B / ola (idioma zeus). Sin activar U55 ni
residuales sin GO.

---

## 5quinquies. Addenda Sprint 1 bug-fixing (ENTREGA-18d)

GO usuario (2026-07-18): [ENTREGA-2026-07-18d-sprint1.md](ENTREGA-2026-07-18d-sprint1.md)
· **D-24**. No es «ola 11»: es bug-fixing post-idle. Orden **U119 →
U120∥U121 → U122** → GO U55 natural. IDs/CAs solo en
[BACKLOG.md](BACKLOG.md). Heros/lemas exentos; auth registry = basic
`_password` (no JWT 7d).

---

## 6. Cierre

Refundación: **cerrada como programa**. Capa B (editor produce juegos +
higiene schema/alias): **cerrada en código** (U109–U117 ✅). Mesa plan:
**estabilizada** (U118 ✅). Sprint 1 (D-24): en curso desde U119.
Producto mundo A sigue abierto como *horizonte* (diferidos §5–6,
residuales sin GO, ops publish/DNS). Siguiente llenado del swarm = GO
explícito + brief + worktree bajo PRACTICAS / roles.
