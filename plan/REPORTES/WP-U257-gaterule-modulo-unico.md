# WP-U257 · `GateRule` a módulo único — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U257) |
| fecha | 2026-08-01 |
| rama | `wp/u257-gaterule-modulo-unico` · base `bde9c12` |
| commit(s) | `ebb5374` obra · `b94499a` cierre de una fuga del guardián · reporte + BACKLOG |
| estado propuesto | listo para verificación de cierre |
| push | no intentado · sin merge |

**CA del BACKLOG:** *una sola definición · añadir una regla obliga a tocar un
solo sitio.* Cumplida, y con observador puesto: `test/gates/reglas-unicas.test.mjs`.

---

## 0 · Corrección de la cita del diagnóstico

El BACKLOG (`plan/BACKLOG.md:235`) y el brief citan `scripts/gates/scan.mjs:32`.
La línea 32 está **en blanco**; el `@typedef` vivía en **`scan.mjs:33`**. La otra
cita, `exceptions.mjs:16`, sí era exacta. Se anota porque la regla de oro de este
mundo es abrir el fichero antes de citar `fichero:línea`, y aquí el desfase era
de una línea en el propio enunciado.

---

## 1 · Por qué divergieron

El diagnóstico decía **dos** copias. Eran **cuatro**, y dos de ellas ni siquiera
eran código:

| # | dónde (en `HEAD` antes del WP) | forma | alternativas |
| - | ------------------------------ | ----- | ------------ |
| 1 | `scripts/gates/scan.mjs:33` | `@typedef` (unión de literales) | **7** |
| 2 | `scripts/gates/scan.mjs:892` | literal de `byRule` en `runAllGates` (claves de objeto) | **7** |
| 3 | `scripts/gates/exceptions.mjs:11` | **prosa de la cabecera** (`- \`rule\`: 'ports' \| …`) | **6** |
| 4 | `scripts/gates/exceptions.mjs:16` | `@typedef` (unión de literales) | **6** |

La historia de las cuatro, leída de `git log -L` sobre cada línea:

```
eed6855  feat(gates): instalar npm run gates (WP-U00 a–d)
         nacen las CUATRO a la vez, con 4 alternativas cada una
11bb3fd  feat(gates): rojo si aparece stun.l.google fuera de env
         alta de `google-stun` → se actualizan las CUATRO         ✓ sobrevivió
bd02d70  chore(ceguera): scrub foreign tracking ids + expand gates pattern
         alta de `tracking-id`  → se actualizan las CUATRO        ✓ sobrevivió
e7a608d  wp(U237-B3): la licencia viaja al lock — 51/51 …
         alta de `licencia`     → se actualiza SÓLO scan.mjs      ✗ se partió
```

**El mecanismo, dicho sin adornos: no había mecanismo.** Nada ataba las cuatro
copias entre sí y ningún `npm run` las miraba —no hay `tsconfig` en la raíz ni
typecheck en CI—, así que lo único que las mantuvo en sincronía durante dos altas
fue que quien las dio se acordó de todas. En la tercera no se acordó, y no pasó
nada: cero rojos, cero avisos, meses de latencia. Mover las líneas a un fichero
nuevo no cambia ese mecanismo ni un ápice; lo que lo cambia es que a partir de
ahora **haya alguien mirando**, y que ese alguien corra en el `npm run test:gates`
que CI ya bloquea.

Merece la pena nombrar la copia **#3** aparte: la prosa. No era código, no la
habría tocado ningún typecheck jamás, y llevaba dieciséis commits mintiendo sobre
qué valores admite el campo `rule`. Un guardián que sólo mirase `@typedef` la
habría dejado pasar; el de este WP la caza, porque busca **la lista**, no la
sintaxis.

---

## 2 · La obra

**`scripts/gates/reglas.mjs`** (nuevo, 48 líneas). Declara la lista y sólo eso:
la unión `GateRule` y el array `GATE_RULES`, congelado, en el orden del informe.

**`scripts/gates/scan.mjs`** · tres cambios:
- `import { GATE_RULES } from './reglas.mjs';`
- el `@typedef` pasa a `import('./reglas.mjs').GateRule` — nombre local, no definición;
- `byRule` se construye con `Object.fromEntries(GATE_RULES.map(…))` en vez del
  literal paralelo. **El orden de claves es idéntico** porque `GATE_RULES` lleva
  el mismo orden que tenía el literal (verificado en §3).

**`scripts/gates/exceptions.mjs`** · dos cambios: el `@typedef` delega igual, y la
prosa de la cabecera apunta a `GATE_RULES` en vez de enumerar.

### El límite del diseño, escrito porque es real

Dentro de `reglas.mjs` la lista se escribe **dos veces**: la unión del `@typedef`
y el array de runtime. Una unión de literales JSDoc no se deriva de un array en
tiempo de ejecución. La vía que sí lo permitiría —una aserción `const` en JSDoc
sobre el array, con la unión derivada como `(typeof GATE_RULES)[number]`— depende
de una versión concreta de TypeScript que **este repo no puede ejercitar**: no hay
typecheck en CI y declarar la dependencia está fuera del ALCANCE_DIFF del WP.
Afirmar que compila sería una afirmación más ancha que la evidencia, así que no se
afirma. Se eligió lo que se puede **comprobar hoy con node a secas**: dos
escrituras adyacentes en el mismo fichero, atadas por un test que las compara
elemento a elemento y en orden. La CA se sostiene igual —**un solo fichero que
tocar**— y quien toque sólo la mitad se pone rojo.

---

## 3 · La equivalencia, medida

Con el gate en verde (`0 offenders`), decir «0 antes, 0 después» es evidencia
pobre: un refactor que rompiese un escáner entero daría exactamente el mismo
número. Así que la sonda mide además el gate **con la tabla `EXCEPTIONS` vaciada
en runtime**, que destapa todos los matches crudos de los siete escáneres: 94
ofensas con nombre, ruta, línea y detalle, resumidas en una huella SHA-256.

Sonda: `u257-medir.mjs` (scratchpad, no se commitea). Se ejecutó **antes** de tocar
nada, **después** del refactor, y **otra vez** con `node_modules` ya instalado.

| magnitud | ANTES | DESPUÉS |
| -------- | ----- | ------- |
| `npm run gates` | `gates: OK (0 offenders)` · exit 0 | **idéntico** |
| `runAllGates` en vivo · ofensas | 0 (`ok: true`) | **0** |
| claves de `byRule`, **en orden** | `ports, transition, arg-import, two-games, google-stun, tracking-id, licencia` | **idénticas, mismo orden** |
| ofensas crudas (sin `EXCEPTIONS`) | **94** | **94** |
| … por regla | ports 25 · transition 1 · arg-import 0 · two-games 68 · google-stun 0 · tracking-id 0 · licencia 0 | **idéntico** |
| … rutas distintas | 33 | **33** |
| … huella SHA-256 (16) | `c67cdd7220d4af0e` | **`c67cdd7220d4af0e`** |
| tabla `EXCEPTIONS` | 38 entradas (ports 27 · transition 2 · two-games 9) · huella `25cf9302b99f808c` | **idéntica** |
| exports de `scan.mjs` | 31 nombres | **31, los mismos** |
| exports de `exceptions.mjs` | 1 (`EXCEPTIONS`) | **1** |

`diff antes.json despues.json` → **vacío**. No hay una sola diferencia observable:
ni un offender, ni un número, ni un nombre exportado, ni el orden de las claves.

| suite | ANTES | DESPUÉS |
| ----- | ----- | ------- |
| `npm run test:gates` | **58 tests · 58 pass · 0 fail** | **69 tests · 69 pass · 0 fail** |
| `npm run lint` | (no medido antes de `npm ci`) | **0 errores**, 18 warnings — todos preexistentes, ninguno en ficheros de este WP |

Los 11 tests de más son exactamente el guardián nuevo (58 + 11 = 69). Los 58
preexistentes siguen los 58 en verde.

**Nota sobre `node_modules`.** No existía en el worktree. Como CI ejecuta
`npm run lint` como bloqueante (`.github/workflows/ci.yml:38`), hacía falta para
verificarlo: se instaló con **`npm ci`** (nunca `npm install`), exit 0. La tercera
pasada de la sonda —ya con `node_modules` en disco— da **el mismo JSON**, así que
los 94 crudos también son invariantes a que el árbol tenga dependencias o no.

**Nota sobre CRLF.** Los `git checkout --` con que se revirtieron los ataques de
§5 dejaron la copia de trabajo de los cuatro ficheros en **CRLF** (los blobs
commiteados siguen en LF; `git diff` limpio). Es un accidente útil: la suite se
volvió a correr entera en ese estado y dio **69/69**, así que ni el guardián ni el
gate dependen del fin de línea.

---

## 4 · El guardián

`test/gates/reglas-unicas.test.mjs` — 11 tests. Vigila por tres frentes, y el
barrido **se incluye a sí mismo** (un guardián que se exime deja abierto el sitio
más cómodo para replantar la tabla).

1. **Coherencia interna** de `reglas.mjs`: la unión y `GATE_RULES` son la misma
   lista, elemento a elemento y **en orden** (el orden es el de las claves del
   informe, así que un reorden no es cosmético). Más `Object.isFrozen` y ausencia
   de repetidos.
2. **Exclusividad**: ningún otro `.mjs` de `scripts/gates/` ni de `test/gates/`
   vuelve a escribir la lista, **en ninguno de sus cuatro disfraces** —unión de
   tipo, array, claves de objeto o prosa entrecomillada—. El detector busca
   *rachas*: tres o más nombres de regla distintos seguidos, separados sólo por
   puntuación de lista. Y toda anotación de `GateRule` tiene que **delegar en el
   módulo único**, resuelto contra el disco.
3. **Efecto y extremos**: las claves vivas de `byRule` son `GATE_RULES` en su
   orden; y todo nombre citado como `rule:` en `scripts/gates/` —lo que un
   escáner emite y lo que una excepción invoca— pertenece a `GATE_RULES`, en los
   dos sentidos.

### Lo que el tercer frente cuesta, dicho

La aserción es **bidireccional**: no sobra ningún nombre citado que no esté
declarado, y no sobra ninguna regla declarada que nadie cite. La segunda mitad
tiene un precio: un WP que declare la regla antes de escribir su escáner verá
rojo a mitad de camino, y una regla cuyo `rule:` se escriba con una variable en
vez de un literal no la ve `reglasCitadas` y contaría como no emitida. Se acepta a
sabiendas: a cambio no puede haber declaraciones muertas ni —lo importante—
escáneres que emitan un nombre que nadie declaró, que es la forma en que este
mismo defecto reaparecería (`byRule[o.rule].push` sobre `undefined` tumba
`runAllGates` **entero**, las siete reglas, en la primera ofensa de la regla
nueva… y sólo ese día).

### El guardián contra el defecto histórico real

No sintético: los blobs de `HEAD` (o sea, los dos ficheros tal y como estaban
antes de este WP) pasados por el detector.

```
--- HEAD:scripts/gates/scan.mjs ---
  anotaciones que NO delegan : 1   {'ports'|…|'licencia'}
  rachas de >=3 reglas       : 2   línea 33 (7 nombres) · línea 892 (7 nombres)
  VEREDICTO: ROJO (cazado)
--- HEAD:scripts/gates/exceptions.mjs ---
  anotaciones que NO delegan : 1   {'ports'|…|'tracking-id'}
  rachas de >=3 reglas       : 2   línea 11 (6 nombres) · línea 16 (6 nombres)
  VEREDICTO: ROJO (cazado)
```

Caza **las cuatro copias**, incluida la #3 —la prosa del comentario—, que es la
que ningún typecheck habría mirado nunca.

---

## 5 · Mi intento de burlarlo

Siete ataques, ejecutados **sobre el disco** y revertidos con `git checkout --`
(nunca `git stash`: la pila es del repositorio y hay más worktrees vivos).

| # | ataque | resultado |
| - | ------ | --------- |
| 1 | dar de alta una regla **sólo en el array** de `reglas.mjs` | **ROJO** · fallan los tests 1 y 4 (9/11) |
| 2 | dar de alta una regla **sólo en la unión** | **ROJO** · falla el test 1 (10/11) |
| 3 | reintroducir la unión completa en `exceptions.mjs` (volver al estado que causó la deuda) | **ROJO** · falla el test 2 |
| 4 | la misma lista **bajo otro nombre de tipo** (`Regla`), para esquivar la búsqueda de `GateRule` | **ROJO** · falla el test 2 (la caza la racha, no el nombre) |
| 5 | delegar a `../fuera-del-barrido.mjs`, que sí reescribe la unión y **no lo barre nadie** | **VERDE — se escapó.** Ver abajo |
| 6 | replantar el literal de `byRule` en `runAllGates` con la lista rancia | **ROJO** · fallan los tests 2 y 3 |
| 7 | renombrar la séptima regla **coherentemente en las dos escrituras** de `reglas.mjs` | **ROJO** · falla el test 4 |

**El ataque 5 funcionó, y ése es el hallazgo del apartado.** La primera versión del
guardián se conformaba con que la anotación *delegase en algo*; bastaba apuntar a
un fichero fuera de `scripts/gates/` y de `test/gates/` y escribir allí la unión.
El guardián daba **11/11 en verde con la lista otra vez partida en dos**. Se cerró
(`b94499a`) resolviendo el especificador contra el disco y exigiendo que sea *el*
módulo único; repetido el mismo ataque, ahora es **ROJO**. Tres señuelos
(`../fuera-del-barrido.mjs`, `./scan.mjs`, `@zeus/lo-que-sea`) quedan aseverados
como cazados, y las dos formas legítimas de escribir la delegación —desde
`scripts/gates/` y desde `test/gates/`— como limpias.

**El ataque 7 es el que mejor retrata la clase de defecto.** Renombrar `licencia`
de forma perfectamente coherente dentro del módulo único deja **`npm run gates` en
verde: `0 offenders`**. Claro: en este repo la regla `licencia` no encuentra
ninguna ofensa, así que su cubo de `byRule` no se toca nunca y el desfase no se
manifiesta. Es exactamente el mismo patrón que la deuda original —latente hasta el
día que dispare— y sólo lo delata el tercer frente del guardián.

**El guardián se denunció a sí mismo dos veces**, y las dos veces la salida fue
cambiar mi idioma, no desafilar la regla (que es lo que el brief pedía y lo que
`arbol-inmutable.test.mjs` ya documenta para su propia sonda de procedencia):

- una frase de mi JSDoc escribía la anotación con su cuerpo entre llaves y el
  barrido la leyó como redefinición → reescrita la frase;
- los vectores de ataque llevaban la anotación escrita en claro → se componen
  ahora con un helper, con el motivo escrito al lado.

### Límites declarados, aseverados como fuga en el propio test

- **Lista construida en runtime** (`'por' + 'ts'`) o **partida en dos rachas de
  menos de tres nombres**: el barrido es textual y no las ve. Aseverado como
  fuga; el día que se cierre, hay un test que dar la vuelta.
- **Alcance del barrido**: `scripts/gates/` y `test/gates/`. Una copia plantada
  fuera de esos dos árboles no la ve nadie. Cerrarlo es barrer el repo entero,
  que es otro WP. (El ataque 5 explotaba justo esto por el flanco de la
  delegación; ese flanco sí está cerrado.)

---

## 6 · Los gemelos que encontré y NO toqué

Barrido de `scripts/gates/**` y `test/gates/**` buscando **la operación** —el
mismo conjunto de nombres declarado dos veces, la misma tabla, el mismo literal
repartido—, no sólo el tipo del WP. Ninguno se ha tocado: están fuera del
ALCANCE_DIFF de U257 y cambiarlos movería comportamiento.

### G1 · `SKIP_DIRS` — **triple, y ya divergido** (hermano directo del WP)

| dónde | entradas | contenido |
| ----- | -------- | --------- |
| `scripts/gates/scan.mjs:23-32` | **8** | sin `.angular` |
| `scripts/gates/matriz-51.mjs:67-77` | **9** | con `.angular` |
| `test/gates/conjunto-lectura.mjs:42-45` (`DIRS_IGNORADOS`) | **9** | con `.angular` |

Es el **mismo defecto que U257, en el mismo directorio y ya consumado**: tres
declaraciones de la misma tabla y una de ellas descolgada. `conjunto-lectura.mjs`
documenta su copia como «espejo… acoplamiento declarado, no invisible» y dice
seguir a `matriz-51.mjs`; nadie declara la relación con la de `scan.mjs`, que es
justo la que difiere. Consecuencia real: `scanHardcodedPorts` y compañía **sí
descienden** a `packages/mesh/operator-ui/.angular/` si existe, y `matriz-51` no.
Candidato natural a un U257-bis; **no tocado**.

### G2 · `REPO_ROOT` — misma fórmula, tres veces

`path.resolve(<dirname>, '../..')` en `scripts/gates/scan.mjs:13-14`,
`scripts/gates/matriz-51.mjs:51-52` y `test/gates/arbol-inmutable.test.mjs:51`.
Coherentes hoy. La tercera no puede importar de las otras dos sin acoplar el test
al gate, así que no está claro que sea deuda; se anota como observación.

### G3 · escape de regex — misma fórmula, dos veces

`matriz-51.mjs:86` (`escapeRe`, con nombre) y `scan.mjs:822` (la misma expresión
`/[.*+?^${}()|[\]\\]/g` **en línea**, dentro de `findLockKeyLine`). Idénticas.

### G4 · la terna de ficheros de arranque MCP — tres veces

`['src/server.mjs', 'src/mcp-server.mjs', 'src/start.mjs']` en `matriz-51.mjs:429`;
como pathspecs de git en `conjunto-lectura.mjs:50-52`; y como regex
`/\/src\/(server|mcp-server|start)\.mjs$/` en `conjunto-lectura.mjs:74`. Las dos
últimas conviven **en el mismo fichero**, en dos sintaxis.

### G5 · el bloque «esto es un test» — cinco/tres veces en `scan.mjs`

`startsWith('scripts/gates/') || startsWith('test/gates/')` aparece **seis** veces
(líneas 98, 195, 269, 308, 364, 424): cinco idénticas con `n.`/`return true` y una
variante con `rel.`/`continue` en la 269. Y el bloque `includes('/test/') ||
includes('/tests/') || /\.test\./ || /\.spec\./ || startsWith('e2e/')` **tres**
veces (líneas 89-96, 299-306, 355-362 — en
`isPortsPathExempt`, `isTwoGamesPathExempt`, `isGoogleStunPathExempt`). Es la
misma clase de ruta escrita a mano una y otra vez; unificarla **cambiaría
comportamiento** —los tres exentos no son idénticos— así que es un WP con su
propia medición de offenders, no un movimiento de líneas.

### Fuera de alcance, confirmado y no tocado

`hashTree` / `hashUnitTree` viven en **`packages/engine/volumes-ops/`**
(`driver-forces.mjs:72,81` — donde `hashTree` es un alias de `hashUnitTree`— y una
**segunda implementación independiente** en `import.mjs:111`). Está enrutado a P2
y fuera de `scripts/gates/**`: **no tocado**, sólo verificado dónde vive.

---

## 7 · Higiene

- **`git stash`: no usado.** Los ataques se revirtieron con `git checkout --`
  sobre ficheros concretos de mi worktree.
- **`npx`: no usado.** Faltaba `node_modules`; se instaló con **`npm ci`** (exit 0),
  como manda el método.
- **Nada escrito fuera del worktree.** Las sondas y los scripts de ataque viven en
  el scratchpad de sesión y no se commitean.
- **Rastreados sucios, comprobados antes de acusar.** Tras `npm ci`, `git status`
  marca tres ficheros de `packages/engine/*/bin/*.mjs`. **No es contrabando**: el
  blob del disco es byte a byte el del índice (`git hash-object` == `git ls-files -s`
  en los tres) y `git diff` es vacío; es el artefacto de `npm ci` sobre los `bin`.
  No se han tocado ni staged.
- **Sin merge y sin push**, como pide el brief.

## 8 · Alcance del diff

| fichero | estado |
| ------- | ------ |
| `scripts/gates/reglas.mjs` | **nuevo** |
| `scripts/gates/scan.mjs` | 3 cambios (import · typedef · `byRule`) |
| `scripts/gates/exceptions.mjs` | 2 cambios (typedef · prosa) |
| `test/gates/reglas-unicas.test.mjs` | **nuevo** — el guardián |
| `plan/REPORTES/WP-U257-gaterule-modulo-unico.md` | **nuevo** — este reporte |
| `plan/BACKLOG.md` | sólo la fila U257 |

Nada de `packages/**`, `package.json`, el lockfile, `.github/workflows/` ni
`VOLUMES/**`. **Ningún offender cambió**: §3 lo mide, no lo afirma.
