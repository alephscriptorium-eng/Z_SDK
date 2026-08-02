/**
 * WP-U257 — el nombre de las reglas de gate, declarado UNA vez.
 *
 * POR QUÉ EXISTE ESTE FICHERO. `GateRule` estaba escrito cuatro veces: el
 * `@typedef` de `scan.mjs`, el inicializador de `byRule` en `runAllGates`, el
 * `@typedef` de `exceptions.mjs` y la prosa de su cabecera. Sobrevivió a dos
 * altas de regla porque quien las dio se acordó de las cuatro copias
 * (`11bb3fd` google-stun, `bd02d70` tracking-id) y se partió en la tercera:
 * `e7a608d` (WP-U237-B3) añadió `licencia` sólo en `scan.mjs`. El mecanismo que
 * lo permitió no fue un descuido: era que NADA ataba las copias entre sí y
 * ningún `npm run` las miraba. Hoy las mira `test/gates/reglas-unicas.test.mjs`.
 *
 * DÓNDE ESTÁ EL LÍMITE, escrito porque es real. Aquí abajo la lista se escribe
 * DOS veces —la unión del `@typedef` y el array de runtime— porque una unión de
 * literales JSDoc no se deriva de un array en tiempo de ejecución. La vía que sí
 * lo permitiría —una aserción `const` en JSDoc sobre el array, con la unión
 * derivada como `(typeof GATE_RULES)[number]`— depende de una versión concreta
 * de TypeScript que este repo NO puede ejercitar: no hay typecheck en CI y
 * declarar la dependencia queda fuera del alcance del WP. Afirmar que compila
 * sería una afirmación más ancha que la evidencia. Se eligió lo que se puede
 * COMPROBAR hoy con node a secas: dos escrituras adyacentes en el mismo fichero,
 * atadas por un test que compara la unión con el array elemento a elemento y en
 * orden. Un solo sitio que tocar; y quien toque sólo la mitad, rojo.
 *
 * EL ORDEN IMPORTA: `runAllGates` construye `byRule` recorriendo `GATE_RULES`,
 * así que este array fija el orden de las claves del informe. Es el mismo que
 * tenía el objeto literal que sustituye.
 */

/**
 * Las reglas que `runAllGates` puede emitir y a las que una excepción se puede
 * acoger. Espejo declarado de `GATE_RULES` (ver límite en la cabecera).
 * @typedef {'ports'|'transition'|'arg-import'|'two-games'|'google-stun'|'tracking-id'|'licencia'|'clave-en-volumen'|'volumen-exige-secreto'|'contexto-imagen'} GateRule
 */

/**
 * Las mismas reglas, en runtime y en el orden del informe.
 * @type {readonly GateRule[]}
 */
export const GATE_RULES = Object.freeze([
  'ports',
  'transition',
  'arg-import',
  'two-games',
  'google-stun',
  'tracking-id',
  'licencia',
  'clave-en-volumen',
  'volumen-exige-secreto',
  'contexto-imagen'
]);
