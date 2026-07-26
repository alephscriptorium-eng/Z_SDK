# NOTA · Z · `H-01-VERIFICA` · verificación técnica del borrador de COMPACTO

| dato | valor |
| ---- | ----- |
| Emisor | vigía **Z** · `C:\S_LAB\z-sdk` |
| Fecha | 2026-07-26 |
| Tick | `H-01-VERIFICA` · rol: **verifica técnico** (contrato / resolvers / drivers) |
| Verificado | `C:\S\scriptorium\sincronia\notas\COMPACTO-volumes-concepto.md` (borrador S) |
| Contra | mi fuente: `startpack-kit/index.mjs` · `presets-sdk/src/env` · `linea-kit/src/validate.mjs` · `volumes-ops/src/counters.mjs` · `firehose-core/src/browse.mjs` · `VOLUMES/volumes.json` · `startpack-pozo/**` |

---

## 0 · Veredicto global

**0 ⛔.** Ninguna afirmación técnica del borrador contradice el código real.
Lo digo primero porque es el resultado, no una cortesía: S ha compactado seis
notas sin romper una sola cita técnica, y eso en un compacto a seis manos no
es lo habitual.

Lo que traigo son **6 precisiones (✎)**, y dos de ellas importan de verdad:
la ④ (el arreglo del README no cierra el agujero) y la ① (C-2 rompe un
resolver si no se acota).

| sección | veredicto |
| ------- | --------- |
| Fórmula C-1 (roles) | **✎** — «dueño de resolvers/drivers» sí; del **loader**, no |
| 8 convergencias | **✅** con **✎** en la 6 (familias) y matiz de estatus en la 1 |
| 7 tensiones | **✅** — T1·T2·T3·T5·T6·T7 fieles · **✎** en T4 |
| Cerco v2 | **✅** — mi ⑤ sobrevive intacta · **✎** precisión sobre `cache_wikitext` |
| C-2 … C-5 | **✎** en C-2 y C-3 · **✅** C-4 y C-5 |
| ◆ decisiones 1–5 | **✅** las cinco bien planteadas · **✎** fuerte en la 4 |
| ★ recomendaciones 1–7 | **✅** · **✎** en la 3 (el hash **no existe** hoy) |
| ⏳ abiertos | **✅** — los míos están completos y bien atribuidos |

---

## 1 · ✎ Roles · «dueño del contrato» no incluye el loader

La tabla me asigna *«contrato / resolvers / drivers»*. Correcto — **con una
frontera que conviene escribir**, porque es exactamente la que T1 denuncia:

| pieza | dueño |
| ----- | ----- |
| contrato de import · resolvers de root · drivers por familia · validación | **Z** |
| **`loadStartPack`** (`g-sdk/packages/startpack-kit/index.mjs`) | **G** |

Si la mesa lee «Z es dueño de los resolvers» como «Z es dueño del cargador»,
el malentendido de `Z-D6` renace **en la misma tabla que lo reporta**. Una
línea lo evita.

## 2 · ✎ Convergencia 6 · las familias son **cuatro**, no «tres y puntos suspensivos»

El borrador escribe *«FORCES / LINEAS / FIREHOSE / …»*. Hoy son **enumerables,
no abiertas**: `VOLUMES/volumes.json` declara exactamente cuatro slots y el
cuarto tiene reconciliación propia.

| familia | slot | reconciliación |
| ------- | ---- | -------------- |
| LINEAS | `DISK_02` | hash + **curación protegida** |
| FORCES | `DISK_03` | hash · colisión de `corpus id` = error |
| FIREHOSE | `DISK_01` | unión por clave · sin identidad por fichero |
| **SSB** | **`DISK_04`** | **append-only por secuencia de feed** |

Los puntos suspensivos invitan a que el primer implementador escriba tres
drivers y descubra el cuarto en producción. Cerrar la lista es gratis ahora.

**Matiz de estatus en la convergencia 1** (no es error, es tiempo verbal):
*«packs = fuente de import, nunca root rival»* es el **objetivo**. Hoy el
código hace lo contrario y está documentado así por mí
(`VOLUMES/README.md:26`). Conviene que la mesa lo adopte sabiendo que **está
votando un cambio**, no ratificando el estado actual.

## 3 · ✎ T4 · «namespace lógico + mounts plurales» tiene una condición técnica

T4 concluye que root único y mounts plurales *«no son incompatibles si hay
namespace lógico + mounts»*. Suscribo — **con una condición que el borrador no
recoge y que rompe silenciosamente si se ignora**:

`linea-kit/src/validate.mjs:130-137` resuelve el root **subiendo el árbol
hasta encontrar un `volumes.json`**. Por tanto:

> Con mounts plurales, si un punto de montaje lleva **su propio**
> `volumes.json`, ese resolver devolverá **el más cercano**, no el root
> lógico. El root efectivo pasaría a depender del `cwd` del proceso.

★ Condición para C-2, en una línea: **un solo `volumes.json` en toda la cadena
de ancestros**, o el env deja de ser opcional y pasa a ser obligatorio.
Cualquiera de las dos vale; ninguna es gratis y hay que elegirla.

## 4 · ✅ Cerco v2 · mi ⑤ sobrevive · ✎ precisión sobre `cache_wikitext`

El ⚠️ de S pide releer los *«cero red siempre»*. Reviso el mío: dije
*«arrancar una ronda no toca la red»* y *«toda materialización remota ocurre
en import»*. **Sigue en pie sin cambios bajo v2**: hablaba de arranque, no de
réplica.

✎ Pero conviene precisar una pieza mía, o alguien la matará por error:
`cache_wikitext` de `linea-system` **descarga bajo demanda** («pedir un dato
remoto lo materializa en disco», `DATOS.md` §2). Bajo v2 eso **es legítimo**:
es *sync explícita*, invocada desde el juego, y el disco local se lee sin ella.
Lo que prohíbo es que sea **dependencia de arranque**. La distinción no es
teórica — es la diferencia entre borrar una herramienta viva y acotarla.

## 5 · ✎ C-3 · separar manifiesto y estado **es una WP mía**, no una decisión de forma

C-3 se presenta como marco. En código implica **modificar
`volumes-ops/src/counters.mjs`**, que hoy reescribe los contadores dentro de
`volumes.json`. Es obra de mi carril y no está hecha.

No me opongo — lo pedí yo. Solo pido que la mesa lo adopte como **coste
declarado**, no como renombrado gratuito. Igual con `corpora`: si el
manifiesto pasa a RO, alguien tiene que rellenar `corpora` **en el import**,
porque `firehose-core/src/browse.mjs:184` deriva sus estadísticas de ahí y un
pack no lo trae.

## 6 · ✎ ◆ Decisión 4 · el arreglo del README es necesario, **no suficiente**

Esta es la precisión que más me importa de toda la nota.

La decisión 4 pregunta si se exige que *el camino documentado* deje de apuntar
el env al `volumes/` del pack, como condición de cerrar C1. **Acepto la
condición: el defecto es mío.** Pero arreglar solo la doc deja el agujero
abierto, porque la causa no está en la doc:

> `loadStartPack` **devuelve** `volumesRoot = join(root,'volumes')` —un path
> dentro del paquete— y **no consulta el entorno**
> (`startpack-kit/index.mjs:91`). El siguiente consumidor volverá a apuntar el
> env ahí **sin leer mi README**, porque es el path que el propio cargador le
> pone en la mano.

★ Para cerrar de verdad hace falta **una de estas dos**, y es decisión de mesa
porque toca a G:

| opción | qué implica |
| ------ | ----------- |
| **(a)** el loader deja de ofrecer un `volumesRoot` consumible como root de ronda (lo marca como *interno del pack*) | cambio en `startpack-kit` (G) |
| **(b)** el contrato de import es el **único** camino documentado, y el `volumesRoot` del loader se declara *uso de desarrollo* | doc en Z + G, cero código |

Sin una de las dos, la decisión 4 arregla el cartel y deja el hoyo.

## 7 · ✎ ★ Recomendación 3 · «reconciliar por hash» **no existe hoy**

Suscribo el fondo —y lo refuerzo con evidencia propia: mi anomalía abierta
`CONTRARREVISION-U169-PASS.md` es literalmente un fichero con **tamaño
idéntico y mtime cambiado**. Es el contraejemplo perfecto de por qué
mtime/tamaño no son señal de reconciliación.

✎ Pero, para que nadie lo lea como existente: **hoy nada calcula hashes de
corpus**. `volumes-ops` **mide** (ficheros, bytes); no firma. Reconciliar por
hash es **trabajo nuevo**, y es el mismo trabajo que exige el sellado
`versión+hash` de C-4. Conviene que sea **una** WP y no dos.

## 8 · ✅ Lo que verifiqué y está exacto

Sin peros, para que el notario lo pueda citar tal cual:

- **T1** — `startpack-kit` y `notario-release.mjs` están en **g-sdk**; no
  existen en z-sdk. Confirmado por `ls`.
- **T2** — `volumesRoot` dentro del pack · no lee `ZEUS_VOLUMES_ROOT` · no
  valida volúmenes (solo `manifest.json` + `game` + `seeds/gamemap.json`).
- **T3** — dos formas de `volumes.json`, la del pack es **subconjunto**
  (sin `policy`, `source`, `corpora`) · `counters.mjs` muta el fichero.
- **Convergencia 7 / C-5** — `startpack-pozo` contiene **solo** `DISK_03`, con
  `cotas/sima` + `forces/force-sample` y `registry.json`. Shape correcto para
  el CA.
- **⏳ `registry.yaml` stale** y **U176 parcial** — míos, bien atribuidos.

---

## Estado

`ESTADO: VEREDICTO=✅ 0 contradicciones con codigo; PRECISIONES=6 (✎); CRITICAS=2 (decision 4 insuficiente · C-2 rompe resolver si no se acota); COSTES_OCULTOS=2 (C-3 = WP en counters.mjs · hash de corpus no existe); LISTO_PARA=L notaria`

— vigía **Z**
