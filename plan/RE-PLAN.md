# RE-PLAN — balance de cierre de la refundación zeus

> **Qué es:** retrospectiva propia del monorepo / swarm zeus, escrita desde
> `plan/REPORTES/`, `plan/BACKLOG.md` y `plan/DECISIONES.md` tras el cierre
> de Ola 9 (U70 · U86 · **U87 ✅**).
>
> **Qué no es:** no inventa WPs (viven en [BACKLOG.md](BACKLOG.md) vía
> capa B del orquestador). No importa ni traduce protocolo de vigilancia
> externo. No toca ops de registry/DNS/U55.

Fecha: 2026-07-18 · rama de referencia: `main` post-merge U87 (`bd5f46c`).
Addenda vigilante: `SCRIPT_SDK/VIGILANCIA/revisiones/registro-codereviews-2026-07-18.md`
(triaje orquestador → BACKLOG/RE-PLAN; sin importar protocolo externo).

---

## 1. Veredicto

La **refundación del SDK** (olas 0–10 + higiene vigilante + remate D-22 /
A-14–A-15) está **drenada en diseño y en código de producto**: 0 DA
abiertas post D-21/D-23; frentes D-22 en código ✅; Ola 6 y Ola 9 cerradas.

**Estado holón 2 (post-triaje registro):** micro ~~U109~~/~~U110~~ ✅;
frente editor ~~U111–U114~~ ✅; residual kit schema → **U115** 🔶
(AJV / schema-as-truth en carpeta; ver BACKLOG). Lo que queda no es
«terminar la refundación», sino que el mundo A **produzca juegos
reales** (sensor = U87). IDs/CAs solo en [BACKLOG.md](BACKLOG.md);
este documento explica *por qué* y *qué aprendimos*.

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
con smoke propio — ciclo de aceptación en su mejor forma (registro
vigilante 2026-07-18).

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
**tick remoto** en el remate. Registro vigilante: el patrón
temp-✅-sin-curl apareció **una** vez en ~50 WPs (tasa excelente) y se
corrigió con verificación de facto (curl / Settings); no bajar el listón.

### 3.4 El tercer juego es un sensor, no un trofeo

U87 recreó SOLVE ET COAGULA en la library con kits + mesh e2e + Release.
Cumplió CA. Y dejó §hallazgos 1–8: el editor solo materializa `sketch`;
la carpeta instancia plantilla vacía; los widgets son prompts sin
runtime; slots de puertos `solve*` ausentes; etc. Eso es el **sensor del
mundo A**: el juego existe *a pesar de* el editor, no *gracias a* él.
VISION §mundo A («que SOLVE lo cree un dramaturgo con el editor, no
nosotros a mano») sigue abierto — candidatura natural del holón 2.

### 3.5 Swarm drenado ≠ producto terminado

Olas de refundación cerradas significan: **no hay más WPs del plan
original pendientes**. No significan que el editor produzca juegos
narrativos, ni que linea-aleph vivo esté montado, ni que las skills de
network-engine vivan en zeus. Esas piezas se priorizan como
post-refundación (capa B / holón 2), no como «ola 11 fantasma» sin dueño.
(El swarm holón 2 ya tiene 🔶 — U111 — sin reabrir refundación.)

### 3.6 Holón 2 candidato = editor produce juegos

Tras U87, el siguiente arco de producto coherente es:

1. Higiene inmediata que PRACTICAS ya exige (puertos en presets-sdk;
   no copiar `loadStartPack`) — ~~U109~~/~~U110~~ ✅.
2. Frente editor / carpeta / story-board / widgets — para que un
   dramaturgo produzca un juego real sin armar a mano en la library
   (U111–U114; residual schema kit → U115).
3. Diferidos conscientes (linea-aleph vivo; skills stub) sin convertirlos
   en WPs ejecutables hasta que el usuario los active.

Los IDs y CAs concretos están **solo** en BACKLOG (lote higiene
post-U87 + lote editor produce juegos + notas de horizonte/DECISIONES).

### 3.7 CI limpio = «segundo consumidor» barato

U102 demostró que un runner hermético destapa bugs de producto
(`webrtc-viewer` ausente en stop:services; `ZEUS_SCRIPTORIUM_ROOM` que
nunca se aplicaba) sin inventar un segundo juego. Mantener la matriz CI
verde y honesta es sensor continuo — no solo gate de merge.

### 3.8 Anti-patrones se propagan si no se cortan

Registro vigilante: A-08 (doble validación) se replicó en U83; `loadStartPack`
llegó a ×4 antes del kit (U110). Cortar en el primer hallazgo (WP o cola
con dueño) sale más barato que rematar tras N copias. PRACTICAS §1.4 +
§hallazgos → WP nuevo, no «ya lo arreglamos luego».

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

---

## 5. Relación con BACKLOG / DECISIONES

- **Este archivo no enumera WPs nuevos** (salvo citar IDs ya en BACKLOG).
  Tras GO capa B + triaje registro vigilante 2026-07-18: micro U109–U110
  ✅; frente editor ~~U111–U114~~ ✅; residual schema kit **U115** 🔶;
  diferidos §5–6 en [DECISIONES.md](DECISIONES.md) (**sin GO** → sin
  WP). Detalle solo en [BACKLOG.md](BACKLOG.md).
- Horizontes previos (U71–U74) siguen en BACKLOG §Horizonte; no se
  reabren aquí.
- U55 permanece gated a publish real (ops); no forma parte del holón 2.

---

## 6. Cierre

Refundación: **cerrada como programa**. Producto mundo A: **abierto como
holón** (frente editor U111–U114 ✅; **U115** 🔶 schema kit). Siguiente
llenado del swarm = tras U115 o lote que el usuario autorice — brief +
worktree bajo PRACTICAS / roles.
