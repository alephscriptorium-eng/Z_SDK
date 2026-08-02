# WP-U231 · Invariante de secretos en los datos

Rama `wp/u231-secretos-en-datos`. Ficha original: *«GATE-O-CLAVES aplicado a
VOLUMES: un volumen que exige un secreto para leerse está mal diseñado. CA: el
gate falla si una identidad entra en un volumen o en el contexto de una
imagen.»* Prioridad P0.

**Resumen en una línea:** `GATE-O-CLAVES` no existía como código —lo confirmo—,
así que el invariante se ha **construido**: tres reglas nuevas dentro de
`npm run gates`, verdes sobre el árbol de hoy y rojas con vector plantado, más
el censo de la otra mitad del enunciado, que hoy da lista vacía. Una de las tres
está **armada y sin disparar**, y se dice por qué.

---

## 0 · Qué encontré antes de escribir nada, y en qué corrijo la medición previa

El brief decía que `GATE-O-CLAVES` estaba nombrado en **tres** sitios. Son
**nueve líneas en ocho ficheros** (y ninguna es código):

```
$ grep -rn "GATE-O-CLAVES" --include=*.md .
plan/BACKLOG.md:330                                          (dentro del reporte de U228)
plan/BACKLOG.md:333                                          (la propia ficha de U231)
plan/BACKLOG.md:403                                          (tabla «de mesa o de O»)
plan/GOBIERNO-EJECUCION-F2.md:478
plan/REPORTES/U228-cinco-datos-servicios-O.md:176
sincronia/notas/archivo/NOTA-Z-2026-07-26-R6-matriz-volumenes.md:57
sincronia/notas/NOTA-Z-2026-07-26-F2-backlog-proyectado.md:67
sincronia/notas/NOTA-Z-2026-07-26-R7-matriz-migracion-y-loadstartpack.md:73
```

(La novena, `VOLUMES/README.md`, la he añadido yo en este WP.)

Los dos sitios que el brief no listaba —las notas de `sincronia/`— son
justamente **los únicos que contienen doctrina utilizable**. Los otros tres la
nombran; éstos la escriben. Sin ellos habría implementado por analogía.

Confirmo lo demás: **no hay ningún script `GATE-O-CLAVES`**. Los gates que
existían eran `scripts/gates/{scan,reglas,exceptions,run,matriz-51}.mjs`, y
ninguno mira `VOLUMES/`. No hay ninguna otra herramienta de secretos en el
árbol: `grep -rln "BEGIN PRIVATE KEY\|gitleaks\|trufflehog\|secret-scan"` sobre
`*.mjs`/`*.yml` fuera de `node_modules` da **cero**.

### 0.1 · Qué parte es de O y qué parte puede vivir aquí

Es la primera pregunta del brief y determina el diseño entero.

**De O, y aquí no se toca** — `o-sdk` es de sólo lectura:

> `plan/GOBIERNO-EJECUCION-F2.md:478` — «deps ext.: GATE-O-CLAVES = doctrina de
> O (solo citada; grep en este árbol la sitúa únicamente en `plan/BACKLOG.md` y
> `sincronia/notas/`).»
>
> `plan/REPORTES/U228-cinco-datos-servicios-O.md:176` — «**Secretos jamás en
> volúmenes.** GATE-O-CLAVES es doctrina de O (solo se cita…). U231 lo
> convertirá en gate sobre `VOLUMES/**` y contexto de imagen: un volumen que
> exige secreto para leerse = mal diseñado. O no monta identidad ni claves
> dentro de un volumen.»

Es decir: la **política de build y de despliegue de O** —qué monta O, con qué
env, en qué imagen— la decide O. Este WP no la escribe ni la supone.

**De este mundo, y por eso puede vivir aquí** — la derivada al plano de datos,
escrita dos veces por Z:

> `sincronia/notas/archivo/NOTA-Z-2026-07-26-R6-matriz-volumenes.md:55-59` —
> «**Invariante transversal, sin excepción:** ningún volumen aloja material de
> identidad —claves de pub, tokens de registry, credenciales de VPS—. Es la
> misma línea que O trazó con `GATE-O-CLAVES`, y aquí se aplica al plano de
> datos: **un volumen que necesita un secreto para leerse está mal diseñado**;
> el secreto va por env del operador, nunca en el árbol.»
>
> Y en la fila 4 de esa misma tabla (`:48`): «⛔ **la clave del pub NO entra**:
> exclusión absoluta.»
>
> `sincronia/notas/NOTA-Z-2026-07-26-R7-matriz-migracion-y-loadstartpack.md:71-74`
> — «**⑦ Root local único**: uno solo, **gitignored** y **fuera del contexto de
> build de Docker** — misma lección que el `GATE-O-CLAVES` de O: el
> `.dockerignore` es la segunda puerta y es la que falla.»

Tres consecuencias directas de esas citas, y las tres están en el código:

1. El objeto vigilado es `VOLUMES/**` y el contrato de lectura de un volumen.
2. **«Sin excepción»** es literal → las reglas no admiten lista de excepciones
   (§3.4).
3. La segunda puerta —`.dockerignore`— es un objeto de vigilancia por derecho
   propio, no un detalle del Dockerfile.

---

## 1 · Lo entregado

| Fichero | Qué |
|---|---|
| `scripts/gates/claves.mjs` | **nuevo** — las tres reglas, el censo y su CLI |
| `test/gates/claves.test.mjs` | **nuevo** — 38 tests: verde medido, vectores plantados, hostil-omite, censo de mutación |
| `scripts/gates/reglas.mjs` | +3 nombres de regla (unión del `@typedef` y array, las dos escrituras) |
| `scripts/gates/scan.mjs` | +1 import y +3 líneas en `runAllGates` |
| `VOLUMES/README.md` | +sección «Invariante de identidad» y el comando del censo |

Sin tocar: `plan/BACKLOG.md`, `scripts/gates/matriz-51.mjs`,
`packages/engine/volumes-ops/**`, `packages/mesh/ssb-system/**`, y **ningún dato
de `VOLUMES/DISK_*`**. Sin `git push`, sin `git stash`.

### 1.1 · Diseño elegido y por qué

**a) Módulo aparte, cableado en `runAllGates`.** No un binario suelto: si no
entra en `npm run gates` nadie lo ejecuta. Va en su propio fichero porque el
corpus es otro —`scan.mjs` filtra por `SOURCE_EXT` (`.mjs|.js|.ts|…`) y con ese
filtro **no ve ni uno** de los 16 ficheros de `VOLUMES/`, que son `.json`,
`.yaml`, `.md` y `.jsonl`—. Heredar aquel filtro habría dado un gate que no
vigila nada y sale verde. Hay un test que lo fija (`.yaml`, `.jsonl`,
`sin-extension`, `.md`, `.bin`).

**b) Importación en una sola dirección.** `scan.mjs → claves.mjs`, nunca al
revés, para que no haya ciclo ESM. El precio es recalcular la raíz del repo
(dos líneas derivadas de la posición del propio fichero, no una copia de una
política). El motivo está escrito en el código: un P0 no se apoya en sutilezas
de inicialización de módulos.

**c) Detección por FORMA o por NOMBRE, nunca por entropía.** Es la decisión que
más falsos positivos evita y va explicada en la cabecera del módulo:
`VOLUMES/volumes.json` y `VOLUMES/.ops-ledger.jsonl` están **llenos de sha256
legítimos** (`packHash`, `hashes`, `snapshot`, `manifestSha256`). Cualquier
umbral de entropía sobre hex/base64 los enrojece a todos en la primera pasada, y
un gate que enrojece en verde se desactiva a la semana. Hay un test con las
líneas reales del manifiesto y del ledger asegurando que pasan limpias.

**d) Las tres reglas:**

- `clave-en-volumen` — una identidad **dentro** de `VOLUMES/**`.
- `volumen-exige-secreto` — un volumen que **exige** una identidad para leerse.
- `contexto-imagen` — identidad en la receta de imagen, y la segunda puerta.

---

## 2 · Las mediciones, con la orden exacta y su salida literal

Todas ejecutadas en `C:/S_LAB/wt/z-u231`, rama `wp/u231-secretos-en-datos`.

### 2.1 · CA4 — cero falsos positivos sobre el árbol de hoy

```
$ node scripts/gates/run.mjs
gates: OK (0 offenders)
EXIT=0
```

```
$ time node scripts/gates/run.mjs > /dev/null
real    0m0.883s
```

Corpus realmente barrido (no supuesto):

```
$ node --input-type=module -e "const{recorrerVolumen}=await import('file:///C:/S_LAB/wt/z-u231/scripts/gates/claves.mjs');const r=recorrerVolumen('C:/S_LAB/wt/z-u231/VOLUMES','C:/S_LAB/wt/z-u231');console.log('ficheros:',r.ficheros.length,'| rarezas:',r.rarezas.length)"
ficheros: 16 | rarezas: 0
```

16 ficheros = todo lo que hay bajo `VOLUMES/` (`git ls-files VOLUMES | wc -l`
también da 16: hoy no hay nada sin trackear ahí).

### 2.2 · CA2 — el censo, con lista y no con impresión

```
$ node scripts/gates/claves.mjs --censo
manifiesto: VOLUMES/volumes.json (estado: ok)

volumen              | envs que exige su lectura            | veredicto
---------------------|--------------------------------------|----------
firehose             | ZEUS_FIREHOSE_REMOTE_PATH            | no exige identidad para leerse
lineas               | (ninguno)                            | no exige identidad para leerse
forces               | (ninguno)                            | no exige identidad para leerse
ssb                  | ZEUS_SSB_LOG_PATH, ZEUS_SSB_PUB_URL  | no exige identidad para leerse

contrato de lectura (packages/engine/presets-sdk/src/volumes) — process.env leídos:
  ZEUS_VOLUMES_ROOT — localizador — packages/engine/presets-sdk/src/volumes/resolve.mjs:31

problemas: 0

volúmenes que EXIGEN una identidad para leerse: 0 (lista vacía, no impresión)
```

**Respuesta a la pregunta de la ficha: hoy NO existe ningún volumen que exija un
secreto para leerse.** Los cuatro declarados dependen de **cuatro localizadores**
—un root, dos rutas y una URL de procedencia— y de ninguna credencial.

Cómo se deriva ese veredicto, en dos superficies porque un volumen puede exigir
un secreto por dos vías distintas:

1. **El manifiesto.** Se recorre entera la entrada de cada volumen recogiendo
   todo `${VAR}` y todo nombre de campo, y se clasifica contra el léxico de
   identidad. Es la superficie correcta porque es exactamente lo que
   `resolveVolume` expande en `packages/engine/presets-sdk/src/volumes/resolve.mjs:66-75`.
2. **El código de lectura.** Todo `process.env.X` de
   `packages/engine/presets-sdk/src/volumes/*.mjs`. Hoy hay **uno**, y es un
   localizador (`resolve.mjs:31`).

La segunda superficie importa: un manifiesto limpio con un resolver que pidiese
un token seguiría siendo un volumen que exige un secreto. Hay un test rojo que
planta exactamente eso (`process.env.ZEUS_VOLUMES_ACCESS_TOKEN` en el resolver)
y otro que fija la superficie real de hoy, de modo que si alguien añade un
`process.env` al contrato de lectura, este WP se entera.

### 2.3 · CA1 — vector plantado, por el gate real y con su salida real

Árbol sintético en `%TEMP%`, cuatro siembras, `runAllGates` completo. Ningún
secreto real: todas las cadenas se **componen por concatenación** en tiempo de
ejecución y los hosts son `.invalid` (TLD reservado, RFC 2606).

Script ad-hoc en `%TEMP%`, **no versionado** (lo digo para que nadie lo busque
en el árbol): siembra el árbol, llama a `runAllGates({ repoRoot: <temp> })` e
imprime `formatOffenders`. El mismo camino —las tres reglas disparando a la vez
y aterrizando en su cubo de `byRule`— lo recorre, y ése sí es reejecutable, el
test `las tres reglas tienen cubo propio en el informe y las ofensas llegan a él`
de `test/gates/claves.test.mjs`.

```
ok = false
gates: FAIL (7 offender(s))
  [licencia] LICENSE.md — el puntero «SEE LICENSE IN LICENSE.md» apunta a un fichero que no existe
  [licencia] package-lock.json — no existe: la licencia declarada no viaja a una instalación reproducible
  [licencia] packages/mesh/operator-ui/projects/threejs-ui-lib/package.json — manifiesto ausente para una ruta que el gate vigila
  [clave-en-volumen] VOLUMES/DISK_02/LINEAS/registry.yaml:2 — cadena de conexión con contraseña embebida (esquema://usuario:clave@) [patrón url-con-credencial] — valor no transcrito a propósito
  [clave-en-volumen] VOLUMES/DISK_07/X/sync.json:1 — campo de identidad con valor literal (no es un hueco de plantilla) [patrón campo-identidad] — valor no transcrito a propósito
  [volumen-exige-secreto] VOLUMES/volumes.json:7 — volumen «cerrado» EXIGE identidad: env:ZEUS_PUB_PRIVATE_KEY (en cerrado.source.remotePath) — un volumen que exige un secreto para leerse está mal diseñado (NOTA-Z R6:58-59)
  [contexto-imagen] Dockerfile — no hay .dockerignore en el contexto (.dockerignore): sin él el contexto es el árbol entero, .env y los DISK vivos incluidos. «El .dockerignore es la segunda puerta y es la que falla» (NOTA-Z R7:73)
```

Las tres primeras líneas **no son mías**: son la regla `licencia` preexistente
reaccionando a que el árbol sintético no tiene `LICENSE.md` ni lock. Se dejan en
la transcripción en vez de recortarlas, porque recortar la salida es la forma
más fácil de que un reporte diga más de lo que midió.

Nótese que **el valor sembrado no aparece en el informe**. Es deliberado y hay
un test que lo fija: el informe del gate va a los logs de CI, y un gate que
imprime el secreto que caza lo publica una segunda vez.

### 2.4 · CA5 — censo de mutación

Dos censos, no uno, porque miden cosas distintas:

- **Sobre el detector puro:** para cada patrón, su vector es rojo con la lista
  completa y **verde** al quitar ese patrón. Prueba que el patrón es quien caza
  su caso y que no hay dos patrones tapándose el hueco mutuamente.
- **Por el camino real:** el mismo barrido pero sembrando un fichero en un
  volumen y llamando al escáner completo. Prueba que el patrón está cableado en
  el gate y no sólo en el helper.
- **Y para la regla de imagen:** cada ruta obligatoria de
  `RUTAS_FUERA_DEL_CONTEXTO`, omitida del `.dockerignore`, produce **exactamente
  una** ofensa, la suya.

Un test previo exige que **todo patrón tenga vector** (`PATRONES_IDENTIDAD` vs
las claves de `VECTORES`, comparadas elemento a elemento): sin él, dar de alta
un patrón sin vector dejaría el censo de mutación verde y vacío de contenido.

### 2.5 · La suite

```
$ node --test test/gates/claves.test.mjs
# tests 38
# pass 38
# fail 0

$ node --test test/gates/*.test.mjs
# tests 122
# pass 122
# fail 0
```

Las 122 incluyen `reglas-unicas.test.mjs` (WP-U257), que verifica que las tres
reglas nuevas están declaradas en **un solo sitio** —`reglas.mjs`, unión del
`@typedef` y array en el mismo orden—, que ningún otro fichero de gates
reescribe la lista, que cada regla declarada la emite algún escáner, y que
`byRule` publica exactamente `GATE_RULES`. Y `arbol-inmutable.test.mjs`, cuyo
«guardián dinámico» relanza la suite entera en un hijo, también en verde.

---

## 3 · CA3 — hostil-omite: qué hace la ausencia

La CA lo dice y este programa ya lo pagó: *un gate fail-open costó una devolución
entera*. Los diez frentes de ausencia, cada uno con su test:

| Se omite… | Comportamiento | Por qué así |
|---|---|---|
| el árbol `VOLUMES/` entero | **ofensa** | «cero ficheros barridos» no es «cero secretos» |
| `VOLUMES/volumes.json` | **ofensa** | un censo sin sujeto no es un censo limpio |
| el manifiesto es ilegible | **ofensa** (`estado: ilegible`) | |
| el manifiesto no trae el mapa `volumes` | **ofensa** | es «un censo que no se hizo», no uno vacío |
| el contrato de lectura (`presets-sdk/src/volumes/`) | **ofensa** | no se puede afirmar lo que no se leyó |
| la lista de patrones llega **vacía** | helper **lanza** · escáner **ofensa** | cero patrones ⇒ cero hallazgos ⇒ se lee «limpio» |
| un patrón está malformado | **lanza** | |
| un fichero pasa del tope (8 MB) | **ofensa** | saltar es la forma barata de fallar en abierto |
| un enlace simbólico dentro de un volumen | **ofensa** | un enlace a `~/.ssh` es el vector exacto del WP |
| `.dockerignore` presente pero sin reglas | **ofensa** | la puerta puesta y abierta |

Dos precisiones sobre la elección **ofensa** vs **lanzar**, que no es cosmética:

- Las ausencias de **datos** producen ofensa, no excepción, siguiendo el
  precedente ya establecido en este mismo arnés: `scan.mjs:743` («sin esta
  guarda un `null` lanzaría TypeError y tumbaría runAllGates») y el test m1 de
  `licencia.test.mjs:350`, que exige `doesNotThrow` sobre un lock malformado. Un
  gate que revienta entero en la primera anomalía deja de informar de las demás.
- Las ausencias de **configuración del propio gate** (patrones vacíos o
  malformados) sí lanzan en el helper puro, porque ahí no hay nada que reportar:
  es el gate el que está roto.

### 3.4 · La excepción prohibida

`EXCEPTIONS` es el mecanismo del repo y la CA pide que, si se usa, cada entrada
lleve su razón escrita. **Estas tres reglas no lo usan**, y la razón está en la
doctrina citada, no en mi criterio: «Invariante transversal, **sin excepción**»
(R6:55) y «⛔ la clave del pub NO entra: **exclusión absoluta**» (R6:48). La
misma frase se repite en R7:76: «ningún volumen aloja identidad. Sin excepción,
en las 6 filas.»

No es una promesa: está **mecanizado**. Una entrada de `EXCEPTIONS` que nombre
una de estas reglas **no exime — se convierte ella misma en ofensa**, con su
fichero y su motivo. El test lo prueba con una excepción de motivo
impecablemente redactado: el hallazgo sigue en pie **y** la excepción se
denuncia, dos ofensas donde una lista permisiva habría dado cero. Y hay
contraprueba de que una excepción de otra regla (`ports`) no ensucia éstas.

Esto cierra por construcción el «agujero con permiso» de la CA: aquí no hay
agujero ni siquiera con razón escrita.

Los huecos legítimos —`"pubUrl": "${ZEUS_SSB_PUB_URL}"`— **no se resuelven con
excepciones sino con precisión del detector**: un `${VAR}`, un `<placeholder>` o
un `changeme` no son una credencial y el detector lo sabe. Tienen su propio test
de falsos positivos.

Sobre la ausencia del **fichero** de excepciones: si `exceptions.mjs`
desapareciera, el `import` estático revienta y `npm run gates` muere — ruidoso
por construcción, no hay nada que diseñar. Lo que sí había que poder demostrar
es lo otro: una lista **presente pero inservible** (`null`, `{}`, un string, un
número) devuelve motivo de ofensa y no silencio. Hay test.

---

## 4 · La regla que está armada y NO ha disparado — dicho antes de que lo pregunten

`contexto-imagen` **no ha encontrado nada, porque hoy no hay nada que
encontrar**:

```
$ node --input-type=module -e "const{buscarDockerfiles}=await import('file:///C:/S_LAB/wt/z-u231/scripts/gates/claves.mjs');console.log('Dockerfiles encontrados:',buscarDockerfiles('C:/S_LAB/wt/z-u231').length)"
Dockerfiles encontrados: 0

$ git ls-files | grep -iE "dockerfile|docker-compose|compose\.ya?ml|\.dockerignore"
(vacío, exit 1)
```

Coincide con lo que ya decía `plan/GOBIERNO-EJECUCION-F2.md:480-483` («gate
**(nuevo)** en `scripts/gates/` … objetivo `VOLUMES/**` y contexto de imagen
(cuando exista Dockerfile — hoy no hay `.dockerignore`, ver U209)»).

O sea: **de la CA1 sólo la mitad de volúmenes tiene hoy evidencia sobre el árbol
real**. La mitad de imagen tiene la regla escrita, cableada en `npm run gates` y
probada con **seis** vectores plantados sobre árboles sintéticos —identidad
dentro de la receta, `Dockerfile` sin `.dockerignore`, `.dockerignore` vacío,
`.dockerignore` que no cubre las rutas, `.dockerignore` que re-incluye con `!`, y
la contraprueba de uno bien escrito, más el reconocimiento de cinco nombres de
receta—, pero **cero disparos sobre este árbol**. No afirmo que vigile el
contexto de imagen de O: afirmo que el día que aparezca la primera receta aquí,
la segunda puerta ya está mirada. Es la lección de R7:73 puesta a esperar.

Qué exige exactamente cuando haya receta: que exista `.dockerignore` en el
contexto y que excluya `.env`, `VOLUMES/DISK_01` y `VOLUMES/DISK_04` —las tres
que este árbol ya mantiene fuera de git por la misma razón
(`.gitignore:74`, `:51`, `:52`)— sin re-incluirlas después con `!`.

**Contexto asumido = el directorio del Dockerfile**, que es el convenio por
defecto. Un `docker build` lanzado con otro contexto no lo ve este gate.

---

## 5 · Lo que este gate NO cubre

Escrito largo a propósito. Un gate es lo más fácil de sobrevender y aquí el
coste de una frase más ancha que la evidencia ya está tarifado.

1. **El árbol de datos VIVO — el límite grande.** Los DISK reales viven **fuera
   del monorepo** (`ZEUS_VOLUMES_ROOT`, `VOLUMES/README.md:6-8`). Por defecto
   esto barre `VOLUMES/` **en el repo**: 16 ficheros de fixture sintético. Un
   secreto en el root del operador **no lo ve nadie** salvo que se le apunte:
   `node scripts/gates/claves.mjs --censo --root <ruta>` y `volumesDir` en el
   escáner. No se hace por defecto porque haría CI dependiente de la máquina.
   **Este es el punto por el que el invariante puede fallar en producción y no
   enterarnos.**
2. **El historial de git.** Lo pregunta la CA6 explícitamente: un secreto ya
   commiteado y luego borrado no lo ve esto, que mira el árbol de trabajo. **Y
   es otra cosa con otro coste**: reescritura de historial en 6 worktrees vivos
   **más** rotación de la credencial —que es lo caro y lo que de verdad
   importa—. No lo he auditado y no afirmo nada sobre él en ninguna dirección.
3. **Un `.env` trackeado en git.** No lo cubre ninguna de las tres reglas: no es
   ni un volumen ni un contexto de imagen. Hoy `.env` está gitignorado
   (`.gitignore:74`) pero nada impide un `git add -f`. Es el agujero adyacente
   más barato de cerrar (`git ls-files .env` en un gate) y queda **fuera del
   alcance declarado de este WP**, no cerrado en silencio.
4. **El tarball de npm.** Otro contexto de publicación; lo mira
   `test/gates/paridad-publicacion.test.mjs`.
5. **`compose` y contextos de build no convencionales** (§4).
6. **Secreto cifrado, comprimido o en UTF-16.** El barrido es byte a byte sobre
   `latin1`: caza ASCII. Un `.tar.gz` con una clave dentro pasa.
7. **Secretos cortos.** Un valor de menos de 8 caracteres se trata como hueco.
   `password: hunter7` (7) escapa; `password: hunter77` (8) no.
8. **Un campo llamado `key` a secas**, fuera del léxico a propósito: en
   YAML/JSON `key:` es vocabulario general y meterlo enrojece el árbol. Se
   exigen `api_key`, `secret_key`, `private_key`, `access_key`. Igual
   `access_key_id: …` no lo caza `campo-identidad` (el sufijo rompe el ancla),
   aunque si el valor es un `AKIA…` lo caza `token-de-proveedor`.
9. **Identidad sin forma ni nombre.** Una cadena de alta entropía en un campo
   llamado `blob` no la caza nada, y es el precio consciente de no usar entropía
   (§1.1c). El detector es de **forma** o de **nombre**; lo que no tiene
   ninguna de las dos, pasa.
10. **`o-sdk`.** No se ha leído ni tocado. La política de build de O sigue
    siendo de O.

---

## 6 · Notas de ejecución

- **Sin `git push`, sin `git stash`, sin tocar `plan/BACKLOG.md`** ni
  `scripts/gates/matriz-51.mjs` ni `packages/engine/volumes-ops/**` ni
  `packages/mesh/ssb-system/**`. `packages/engine/presets-sdk/**` sólo **leído**
  (el censo lo inspecciona; no lo modifica).
- **Ningún dato de `VOLUMES/DISK_*` ha sido editado.** Todos los vectores viven
  en árboles temporales de `%TEMP%` que el test borra en `finally`.
- **Ningún secreto real, en ningún sitio.** Todos los vectores se componen por
  concatenación en tiempo de ejecución, de modo que la cadena con forma de
  credencial no queda escrita ni en el árbol ni en el historial; los hosts son
  `.invalid` y los cuerpos, relleno de una sola letra.
- **`npx`:** ejecutado **una vez** y declarado —`npx --no-install eslint …`—.
  Rehusó por diseño (`npm error npx canceled due to missing packages`) y **no
  instaló nada**. Este worktree no tiene `node_modules`, así que **el lint no se
  ha pasado**; no lo doy por verde. El gate y sus tests son node puro sin
  dependencias, que es por lo que sí corren aquí.
- **Tres bugs propios los encontraron los tests, no la lectura**, y están
  anotados en el código donde ocurrieron, porque los tres eran fallo en abierto
  o falso positivo:
  1. `campo-identidad` capturaba `${ZEUS_ALGO_TOKEN` **sin cerrar** —`}` está
     fuera de la clase de caracteres por ser delimitador JSON—, así que dejaba
     de parecer un hueco y **enrojecía `volumes.json`**. Falso positivo sobre el
     árbol real, justo lo que CA4 prohíbe.
  2. `**/` traducido a `.*/` exigía una barra, así que un `.dockerignore` con
     `**/.env` **no se reconocía como cobertura de `.env`**. Cerrado: `**`
     matchea cero o más directorios.
  3. La comprobación de re-inclusión miraba en una sola dirección:
     `!VOLUMES/DISK_01/semillas` —un **trozo** de un disco vivo devuelto al
     contexto— se escapaba. Ahora se mira en las dos.
