/**
 * WP-U269 — el detector deja de adivinar dónde acaba un valor y lo PARSEA.
 *
 * POR QUÉ ESTE FICHERO EXISTE. `claves.mjs` detecta por dos vías (lo dice su
 * cabecera §29-37): por FORMA —cabecera PEM, tres segmentos de JWT,
 * `usuario:clave@`— y por CLAVE —un campo cuyo NOMBRE es de identidad con un
 * valor que no es un hueco—. La vía de la FORMA está bien servida por una
 * expresión regular: busca una firma dentro del texto y no necesita saber en qué
 * fichero está. La vía de la CLAVE no: para decidir «este nombre lleva este
 * valor» hay que saber **dónde empieza y dónde acaba el valor**, y eso es
 * exactamente lo que una expresión regular sobre una línea suelta no puede
 * saber. U231 lo dejó escrito como límite 6 y abrió este WP.
 *
 * LAS TRES FORMAS QUE ESCAPABAN, y por qué escapaban:
 *
 *   1. `{"tokens": ["…"]}` — la clase del valor excluye la comilla, así que la
 *      captura moría en `[` y nunca veía el elemento del array.
 *   2. `api_key: |` con el valor en la línea siguiente — el barrido es de una
 *      línea; el valor está en otra. `VOLUMES/DISK_02/LINEAS/registry.yaml` es
 *      YAML real, así que no es un caso de laboratorio.
 *   3. `ENV API_KEY valor` sin `=` — el patrón exige `:` o `=` entre nombre y
 *      valor, y la forma de espacio de Dockerfile no tiene ninguno.
 *
 * Las tres se cierran con lo mismo: un analizador del formato. Ninguna con una
 * expresión regular nueva, y por una razón medida, no estética — la densidad de
 * falsos positivos YA ERA el problema (ver el reporte del WP), y cada patrón
 * nuevo la empeora.
 *
 * POR QUÉ NO HAY DEPENDENCIA, y en concreto por qué no hay una librería de YAML.
 * Este módulo entra por `npm run gates`, y U231 cerró un agujero que se abrió
 * exactamente por ahí: su guardián de espacios irregulares se escribió sin
 * `node_modules` porque el hueco por el que entró un lint no pasado fue depender
 * de que las dependencias estuvieran instaladas. Además, en esta máquina el
 * `npm ci` está incompleto, de modo que una suite roja en local puede estar
 * verde en CI y al revés: una dependencia de gate es un modo de fallo que no se
 * observa donde se trabaja. Aquí NO se implementa YAML: se implementa el
 * subconjunto de bloque que este árbol usa, con sus límites escritos abajo y con
 * **retirada a barrido crudo** cuando el analizador no está seguro. Un
 * analizador que no entiende algo no puede decir «limpio».
 *
 * LA RETIRADA ES LA PIEZA DE SEGURIDAD. Todo analizador de aquí LANZA cuando no
 * entiende, y quien llama (`hallazgosEnFichero`) vuelve al barrido crudo de
 * U231. O sea: parsear sólo puede quitar falsos positivos sobre lo que se
 * entiende; sobre lo que no se entiende se sigue mirando como antes. Un fallo de
 * este fichero degrada a la vigilancia anterior, no a silencio.
 *
 * ⚠ ESA FRASE FUE FALSA UNA VEZ, y la lección vale más que la frase. La primera
 * versión tenía una salida que devolvía `null` al NO entender en vez de lanzar
 * —el reparto de mapas de flujo de YAML—, y `null` no es una retirada: quien
 * llamaba se quedaba sin campos **y sin excepción**, así que nunca llegaba al
 * `catch`. Resultado: `{"api_key":"…"}` dentro de un `.yaml` salía VERDE con la
 * clave dentro. Ocho formas se perdían así, y JSON es YAML. De ahí la regla que
 * gobierna este fichero:
 *
 *   **`null` sólo puede significar información POSITIVA** («esto no es una
 *   colección de flujo», «este formato no lo encamino»). La DUDA se lanza,
 *   siempre. Si añades una salida a un analizador, pregúntate cuál de las dos
 *   es — y si es duda, `throw new NoEntiendo`.
 *
 * LO QUE NO SE ANALIZA SE MARCA `opaco` Y SE BARRE EN CRUDO. Es el segundo
 * mecanismo, y cubre lo que sí se ve pero no se entiende: comentarios (de YAML,
 * de Dockerfile y de código), el cuerpo de un escalar de bloque, y el argumento
 * de una instrucción de Dockerfile que no declara pares. Tirarlos era una
 * pérdida frente a U231 —«lo dejo comentado por si acaso» es donde se queda un
 * secreto— y encima una pérdida no declarada.
 *
 * LÍMITES DECLARADOS, y son reales:
 *   - YAML: anclas y alias (`&a` / `*a`), etiquetas (`!!tipo`), claves complejas
 *     (`? …`), colecciones de flujo repartidas en varias líneas y claves de
 *     fusión (`<<:`) NO se modelan. Cuando aparecen, el analizador se retira.
 *   - Código: no es un analizador sintáctico de JavaScript, es un LEXER —
 *     distingue comentario, cadena, plantilla y expresión regular, nada más—.
 *     No entiende el significado del código, y no lo necesita: lo que busca es
 *     dónde hay un literal de cadena. Sus TRES roturas posibles lanzan, y las
 *     tres tienen test: un lexer desincronizado no puede decir «limpio».
 *   - Markdown, `.env` y texto plano siguen en barrido crudo: no se han tocado.
 */

/**
 * @typedef {object} Campo
 * @property {string} nombre nombre del campo del que cuelga el valor
 * @property {string} valor valor LITERAL, ya desentrecomillado
 * @property {number} line línea (1-based) donde empieza el valor
 * @property {boolean} [multilinea] el valor ocupa VARIAS líneas del fichero, de
 *   modo que el salto de línea número `k` del valor está en `line + k`. Sólo lo
 *   pone el escalar de bloque de YAML; en los demás formatos un valor con
 *   saltos los lleva escapados y vive en una sola línea del fichero.
 * @property {boolean} [opaco] el valor es texto que este módulo NO analiza: el
 *   cuerpo de un escalar de bloque de YAML, un comentario (de YAML, Dockerfile o
 *   código) o el argumento de una instrucción de Dockerfile que no declara
 *   pares. Quien llama debe barrerlo ADEMÁS en crudo: no se puede afirmar que se
 *   entendió. Un campo opaco puede venir con `nombre` vacío — el barrido crudo no
 *   necesita nombre.
 */

/** Error de analizador. Quien llama lo traduce en «retírate al barrido crudo». */
export class NoEntiendo extends Error {
  /** @param {string} mensaje */
  constructor(mensaje) {
    super(mensaje);
    this.name = 'NoEntiendo';
  }
}

// ---------------------------------------------------------------------------
// Encaminamiento por formato
// ---------------------------------------------------------------------------

/**
 * Qué analizador le toca a un fichero, por su NOMBRE.
 *
 * Se decide por nombre y no por contenido a propósito: adivinar el formato
 * husmeando el contenido es otra heurística, y la retirada a barrido crudo ya
 * cubre el caso de que el nombre mienta (un `.json` que no es JSON se analiza
 * como antes, no se da por limpio).
 *
 * @param {string} nombre nombre de fichero, sin directorio
 * @returns {'json'|'jsonl'|'yaml'|'dockerfile'|'codigo'|null}
 */
export function formatoDe(nombre) {
  const n = nombre.toLowerCase();
  if (/^(?:dockerfile|containerfile)(?:\..+)?$/.test(n) || /\.(?:dockerfile|containerfile)$/.test(n)) {
    return 'dockerfile';
  }
  if (/\.jsonl$/.test(n)) return 'jsonl';
  if (/\.json$/.test(n)) return 'json';
  if (/\.ya?ml$/.test(n)) return 'yaml';
  if (/\.(?:mjs|cjs|js|jsx|mts|cts|ts|tsx)$/.test(n)) return 'codigo';
  return null;
}

/**
 * @param {'json'|'jsonl'|'yaml'|'dockerfile'|'codigo'} formato
 * @param {string} texto
 * @returns {Campo[]}
 */
export function camposDe(formato, texto) {
  switch (formato) {
    case 'json':
      return camposDeJson(texto);
    case 'jsonl':
      return camposDeJsonl(texto);
    case 'yaml':
      return camposDeYaml(texto);
    case 'dockerfile':
      return camposDeDockerfile(texto);
    case 'codigo':
      return camposDeCodigo(texto);
    default:
      throw new NoEntiendo(`formato desconocido: ${formato}`);
  }
}

// ---------------------------------------------------------------------------
// JSON — analizador descendente recursivo CON POSICIÓN
// ---------------------------------------------------------------------------

/**
 * Los campos de un documento JSON.
 *
 * NO se usa `JSON.parse`, y no es por gusto: `JSON.parse` tira la posición, y un
 * hallazgo sin número de línea obliga al operador a buscarlo a mano en un
 * fichero de mil líneas. Éste es el mismo análisis con la línea guardada.
 *
 * EL CASO 1 DEL WP ESTÁ AQUÍ: un elemento de array HEREDA el nombre de la clave
 * del array. `{"tokens": ["…"]}` cuelga de `tokens`, que es un nombre de
 * identidad, y por eso el elemento se juzga. Es la línea siguiente, y no hay
 * ninguna expresión regular en ella.
 *
 * @param {string} texto
 * @returns {Campo[]}
 */
export function camposDeJson(texto) {
  /** @type {Campo[]} */
  const campos = [];
  let i = 0;
  let linea = 1;

  /** @param {string} m */
  const err = (m) => {
    throw new NoEntiendo(`JSON: ${m} (linea ${linea})`);
  };

  const blancos = () => {
    while (i < texto.length) {
      const c = texto[i];
      if (c === '\n') {
        linea += 1;
        i += 1;
      } else if (c === ' ' || c === '\t' || c === '\r') {
        i += 1;
      } else {
        break;
      }
    }
  };

  const ESCAPES = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };

  /** @returns {{ v: string, line: number }} */
  const cadena = () => {
    if (texto[i] !== '"') err('se esperaba una cadena');
    const l0 = linea;
    i += 1;
    let out = '';
    for (;;) {
      if (i >= texto.length) err('cadena sin cerrar');
      const c = texto[i];
      if (c === '"') {
        i += 1;
        return { v: out, line: l0 };
      }
      if (c === '\n') err('salto de linea crudo dentro de una cadena');
      if (c === '\\') {
        const e = texto[i + 1];
        if (e === undefined) err('escape sin cerrar');
        if (e === 'u') {
          const hex = texto.slice(i + 2, i + 6);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) err('escape unicode malformado');
          out += String.fromCharCode(parseInt(hex, 16));
          i += 6;
          continue;
        }
        if (!(e in ESCAPES)) err(`escape desconocido \\${e}`);
        out += ESCAPES[e];
        i += 2;
        continue;
      }
      out += c;
      i += 1;
    }
  };

  /** @param {string|null} nombre nombre heredado (clave del objeto o del array) */
  const valor = (nombre) => {
    blancos();
    const c = texto[i];
    if (c === undefined) err('fin de documento inesperado');
    if (c === '{') {
      i += 1;
      blancos();
      if (texto[i] === '}') {
        i += 1;
        return;
      }
      for (;;) {
        blancos();
        const k = cadena();
        blancos();
        if (texto[i] !== ':') err('se esperaba `:` tras la clave');
        i += 1;
        valor(k.v);
        blancos();
        if (texto[i] === ',') {
          i += 1;
          continue;
        }
        if (texto[i] === '}') {
          i += 1;
          return;
        }
        err('se esperaba `,` o `}`');
      }
    }
    if (c === '[') {
      i += 1;
      blancos();
      if (texto[i] === ']') {
        i += 1;
        return;
      }
      for (;;) {
        // AQUÍ ESTÁ EL CASO 1: el elemento hereda el nombre del array.
        valor(nombre);
        blancos();
        if (texto[i] === ',') {
          i += 1;
          continue;
        }
        if (texto[i] === ']') {
          i += 1;
          return;
        }
        err('se esperaba `,` o `]`');
      }
    }
    if (c === '"') {
      const s = cadena();
      if (nombre !== null) campos.push({ nombre, valor: s.v, line: s.line });
      return;
    }
    for (const lit of ['true', 'false', 'null']) {
      if (texto.startsWith(lit, i)) {
        i += lit.length;
        return;
      }
    }
    const m = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(texto.slice(i, i + 40));
    if (m && m[0].length > 0) {
      // EL NÚMERO TAMBIÉN ES UN VALOR. Se empujaba sólo la cadena, así que
      // un campo de identidad con valor numérico largo no producía campo — y el
      // U231 sí lo cazaba. Un PIN, un identificador largo o una clave numérica
      // son material igual. El clasificador de huecos decide después (por
      // longitud mínima), que es donde tiene que decidirse.
      if (nombre !== null) campos.push({ nombre, valor: m[0], line: linea });
      i += m[0].length;
      return;
    }
    err(`valor no reconocido: ${JSON.stringify(texto.slice(i, i + 12))}`);
  };

  valor(null);
  blancos();
  if (i < texto.length) err('contenido sobrante tras el valor raiz');
  return campos;
}

/**
 * JSON por líneas (`.jsonl`). Cada línea es un documento independiente; una
 * línea vacía se salta. Si UNA línea no es JSON, se retira el fichero entero:
 * media lectura no es una lectura.
 *
 * @param {string} texto
 * @returns {Campo[]}
 */
export function camposDeJsonl(texto) {
  /** @type {Campo[]} */
  const campos = [];
  const lineas = texto.split('\n');
  for (let n = 0; n < lineas.length; n += 1) {
    const l = lineas[n].trim();
    if (l === '') continue;
    for (const c of camposDeJson(l)) campos.push({ ...c, line: n + 1 });
  }
  return campos;
}

// ---------------------------------------------------------------------------
// YAML — analizador del subconjunto de BLOQUE
// ---------------------------------------------------------------------------

/** Sintaxis de YAML que este analizador NO modela; al verlas se retira. */
const YAML_NO_MODELADO = [
  { re: /(?:^|\s)[&*][A-Za-z0-9_-]+(?:\s|$)/, que: 'ancla o alias' },
  { re: /(?:^|\s)!!?[A-Za-z0-9_/.-]+(?:\s|$)/, que: 'etiqueta' },
  { re: /^\s*\?\s/, que: 'clave compleja' },
  { re: /^\s*<<\s*:/, que: 'clave de fusion' }
];

/**
 * Parte una línea de YAML en código y comentario, respetando las comillas. Un
 * `#` sólo abre comentario si va a principio de línea o precedido de espacio;
 * dentro de comillas nunca.
 *
 * DEVUELVE EL COMENTARIO, no lo tira. Tirarlo era una pérdida frente al barrido
 * de U231, que sí miraba dentro: una clave de API comentada sigue siendo un
 * secreto igual —de hecho es el sitio donde más a menudo queda uno, «lo dejo
 * comentado por si acaso»—. El comentario sale marcado OPACO y se barre en
 * crudo, igual que el cuerpo de un escalar de bloque.
 *
 * @param {string} s
 * @returns {{ codigo: string, comentario: string }}
 */
function partirComentarioYaml(s) {
  let dentro = null;
  for (let k = 0; k < s.length; k += 1) {
    const c = s[k];
    if (dentro) {
      if (dentro === '"' && c === '\\') {
        k += 1;
        continue;
      }
      if (c === dentro) dentro = null;
      continue;
    }
    if (c === '"' || c === "'") {
      dentro = c;
      continue;
    }
    if (c === '#' && (k === 0 || /\s/.test(s[k - 1]))) {
      return { codigo: s.slice(0, k), comentario: s.slice(k) };
    }
  }
  return { codigo: s, comentario: '' };
}

/**
 * Desentrecomilla un escalar de YAML. Devuelve el literal.
 *
 * @param {string} s
 * @returns {string}
 */
function escalarYaml(s) {
  const t = s.trim();
  if (t.length >= 2 && t[0] === '"' && t[t.length - 1] === '"') {
    return t
      .slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
  if (t.length >= 2 && t[0] === "'" && t[t.length - 1] === "'") {
    return t.slice(1, -1).replace(/''/g, "'");
  }
  return t;
}

/**
 * Parte `clave: valor` de una línea ya sin indentación ni comentario. Devuelve
 * `null` si la línea no es un par —entonces es un escalar suelto—.
 *
 * En YAML un `:` sólo separa clave de valor si le sigue un espacio o el fin de
 * línea: `url: http://x` tiene DOS puntos y sólo el primero separa. Eso no se
 * puede hacer con `split(':')`, y es justo el tipo de detalle por el que un
 * barrido de línea se equivoca.
 *
 * @param {string} s
 * @returns {{ clave: string, valor: string }|null}
 */
function parYaml(s) {
  let comilla = null;
  // Índice del carácter siguiente al cierre de una clave ENTRECOMILLADA, o -1.
  let trasComilla = -1;
  for (let k = 0; k < s.length; k += 1) {
    const c = s[k];
    if (comilla) {
      if (comilla === '"' && c === '\\') {
        k += 1;
        continue;
      }
      if (c === comilla) {
        comilla = null;
        trasComilla = k + 1;
      }
      continue;
    }
    if (k === 0 && (c === '"' || c === "'")) {
      comilla = c;
      continue;
    }
    // Un `:` separa si le sigue espacio o fin de línea. Y TAMBIÉN si va pegado
    // al cierre de una clave entrecomillada: `"api_key":"valor"` es YAML legal
    // —JSON es YAML, y eso es exactamente lo que escribe `JSON.stringify`—.
    // Faltaba esta rama, y el agujero que abrió no era un falso negativo
    // cualquiera: `{"api_key":"…"}` en un `.yaml` no producía campo NI
    // excepción, o sea que se perdía EN SILENCIO en vez de retirarse.
    if (c === ':' && (k + 1 >= s.length || /\s/.test(s[k + 1]) || k === trasComilla)) {
      return { clave: escalarYaml(s.slice(0, k)), valor: s.slice(k + 1).trim() };
    }
  }
  return null;
}

/**
 * Reparte una colección de flujo (`[a, b]` o `{k: v}`) en campos.
 *
 * EL CONTRATO DE ESTA FUNCIÓN ES LA PIEZA DE SEGURIDAD, y la primera versión lo
 * tenía mal. Sólo hay UNA salida `null`, y significa una cosa muy concreta:
 * **«esto no es una colección de flujo»** —no empieza por `[` ni por `{`—, que
 * es información positiva y deja al que llama tratarlo como escalar. Cualquier
 * otra cosa que este reparto no entienda **LANZA `NoEntiendo`**, para que
 * `hallazgosEnFichero` se retire al barrido crudo.
 *
 * ANTES DEVOLVÍA `null` TAMBIÉN AL NO ENTENDER, y eso no era una retirada sino
 * un silencio: quien llamaba se quedaba sin campos y **sin excepción**, así que
 * nunca llegaba al `catch`. `{"api_key":"…"}` dentro de un `.yaml` —que es la
 * salida literal de `JSON.stringify`, y JSON es YAML— salía VERDE con la clave
 * dentro. Ocho formas se perdían así. La lección es del tipo que este programa
 * ya ha pagado: **una retirada que no lanza no es una retirada**.
 *
 * @param {string} s
 * @param {string} nombre nombre heredado
 * @param {number} line
 * @returns {Campo[]|null} `null` SÓLO si no es una colección de flujo
 * @throws {NoEntiendo} si lo es y no se entiende
 */
function flujoYaml(s, nombre, line) {
  const t = s.trim();
  const abre = t[0];
  // La ÚNICA salida `null`: no es flujo. No es una duda, es un hecho.
  if (abre !== '[' && abre !== '{') return null;
  const cierra = abre === '[' ? ']' : '}';
  let prof = 0;
  let comilla = null;
  for (let k = 0; k < t.length; k += 1) {
    const c = t[k];
    if (comilla) {
      if (comilla === '"' && c === '\\') {
        k += 1;
        continue;
      }
      if (c === comilla) comilla = null;
      continue;
    }
    if (c === '"' || c === "'") {
      comilla = c;
      continue;
    }
    if (c === '[' || c === '{') prof += 1;
    else if (c === ']' || c === '}') {
      prof -= 1;
      if (prof === 0 && k !== t.length - 1) {
        throw new NoEntiendo(`YAML: cola tras el cierre de una coleccion de flujo (linea ${line})`);
      }
    }
  }
  if (prof !== 0 || comilla) {
    // Flujo multilínea, o comilla sin cerrar. Límite declarado: se RETIRA.
    throw new NoEntiendo(`YAML: coleccion de flujo sin equilibrar en la linea (linea ${line})`);
  }
  if (t[t.length - 1] !== cierra) {
    throw new NoEntiendo(`YAML: coleccion de flujo mal cerrada (linea ${line})`);
  }

  // reparto por comas de primer nivel
  const dentro = t.slice(1, -1);
  /** @type {string[]} */
  const trozos = [];
  let ini = 0;
  prof = 0;
  comilla = null;
  for (let k = 0; k < dentro.length; k += 1) {
    const c = dentro[k];
    if (comilla) {
      if (comilla === '"' && c === '\\') {
        k += 1;
        continue;
      }
      if (c === comilla) comilla = null;
      continue;
    }
    if (c === '"' || c === "'") {
      comilla = c;
      continue;
    }
    if (c === '[' || c === '{') prof += 1;
    else if (c === ']' || c === '}') prof -= 1;
    else if (c === ',' && prof === 0) {
      trozos.push(dentro.slice(ini, k));
      ini = k + 1;
    }
  }
  trozos.push(dentro.slice(ini));

  /** @type {Campo[]} */
  const out = [];
  for (const trozo of trozos) {
    const t2 = trozo.trim();
    if (t2 === '') continue;
    const par = parYaml(t2);
    // UN MAPA DE FLUJO SÓLO TIENE PAREJAS. Si un elemento de `{…}` no es
    // `clave: valor`, esto no se entiende: puede ser una CLAVE COMPLEJA (no
    // modelada) o, mucho más a menudo, no ser YAML en absoluto sino una
    // plantilla incrustada —`password: {{DB_PASSWORD}}` de Helm, Jinja o
    // Actions—. Repartirla como si fuera un mapa saca `DB_PASSWORD` de dentro y
    // lo denuncia: falso positivo sobre configuración correcta, uno de los siete
    // que U231 censó.
    //
    // SE LANZA, NO SE DEVUELVE `null`. Devolver `null` aquí era el agujero B1:
    // el que llamaba se quedaba sin campos y sin excepción, o sea en silencio.
    // Al lanzar, el fichero entero se retira al barrido crudo de U231 — que
    // sobre `{{DB_PASSWORD}}` da limpio (tiene rama propia de plantilla) y sobre
    // `{"api_key":"…"}` da el hallazgo. Las dos cosas correctas, y por el camino
    // conservador.
    if (abre === '{' && par === null) {
      throw new NoEntiendo(
        `YAML: elemento de mapa de flujo que no es \`clave: valor\` (linea ${line})`
      );
    }
    if (par) {
      if (par.valor !== '') {
        const anidado = flujoYaml(par.valor, par.clave, line);
        if (anidado) out.push(...anidado);
        else out.push({ nombre: par.clave, valor: escalarYaml(par.valor), line });
      }
      continue;
    }
    const anidado = flujoYaml(t2, nombre, line);
    if (anidado) {
      out.push(...anidado);
      continue;
    }
    // elemento suelto de una secuencia: HEREDA el nombre del contenedor
    // (mismo criterio que el array de JSON: es el caso 1 de este WP).
    out.push({ nombre, valor: escalarYaml(t2), line });
  }
  return out;
}

/**
 * Los campos de un documento YAML de bloque.
 *
 * EL CASO 2 DEL WP ESTÁ AQUÍ: `api_key: |` deja el valor en las líneas
 * SIGUIENTES, más indentadas. Se recogen y se devuelven como el valor de esa
 * clave. Ninguna expresión regular puede hacer eso mirando una línea.
 *
 * @param {string} texto
 * @returns {Campo[]}
 */
export function camposDeYaml(texto) {
  /** @type {Campo[]} */
  const campos = [];
  const lineas = texto.split('\n').map((l) => l.replace(/\r$/, ''));
  /** @type {{ indent: number, nombre: string }[]} */
  let pila = [];
  let i = 0;

  while (i < lineas.length) {
    const cruda = lineas[i];
    const numero = i + 1;
    if (/^\s*$/.test(cruda)) {
      i += 1;
      continue;
    }
    if (/\t/.test(cruda.match(/^\s*/)[0])) {
      throw new NoEntiendo(`YAML: tabulador en la indentacion (linea ${numero})`);
    }
    const { codigo: limpia, comentario } = partirComentarioYaml(cruda);
    // El comentario NO se tira: sale opaco y quien llama lo barre en crudo.
    if (comentario !== '') campos.push({ nombre: '', valor: comentario, line: numero, opaco: true });
    if (/^\s*$/.test(limpia)) {
      i += 1;
      continue;
    }
    const recortada = limpia.trim();
    if (recortada === '---' || recortada === '...') {
      pila = [];
      i += 1;
      continue;
    }
    if (recortada.startsWith('%')) {
      // directiva (%YAML, %TAG)
      i += 1;
      continue;
    }
    for (const { re, que } of YAML_NO_MODELADO) {
      if (re.test(limpia)) throw new NoEntiendo(`YAML: ${que} no modelado (linea ${numero})`);
    }

    let indent = limpia.match(/^ */)[0].length;
    let resto = limpia.slice(indent);
    // Items de secuencia, posiblemente anidados en la misma línea (`- - x`).
    while (resto === '-' || resto.startsWith('- ')) {
      const salto = resto === '-' ? 1 : 2;
      indent += salto;
      resto = resto.slice(salto);
    }
    if (resto === '') {
      i += 1;
      continue;
    }

    while (pila.length > 0 && pila[pila.length - 1].indent >= indent) pila.pop();
    const heredado = pila.length > 0 ? pila[pila.length - 1].nombre : '';

    const par = parYaml(resto);
    if (par === null) {
      // escalar suelto (elemento de secuencia): hereda el nombre del contenedor
      const flujo = flujoYaml(resto, heredado, numero);
      if (flujo) campos.push(...flujo);
      else if (heredado !== '') campos.push({ nombre: heredado, valor: escalarYaml(resto), line: numero });
      i += 1;
      continue;
    }

    const { clave, valor } = par;
    if (valor === '') {
      pila.push({ indent, nombre: clave });
      i += 1;
      continue;
    }

    // --- escalar de bloque: `|`, `>`, con sus indicadores --------------------
    const bloque = /^([|>])([+-]?)(\d*)([+-]?)\s*$/.exec(valor);
    if (bloque) {
      const cuerpo = [];
      let j = i + 1;
      let indentCuerpo = null;
      while (j < lineas.length) {
        const l = lineas[j];
        if (/^\s*$/.test(l)) {
          cuerpo.push('');
          j += 1;
          continue;
        }
        const ind = l.match(/^ */)[0].length;
        if (ind <= indent) break;
        if (indentCuerpo === null) indentCuerpo = ind;
        cuerpo.push(l.slice(Math.min(ind, indentCuerpo)));
        j += 1;
      }
      // EL VALOR ESTÁ EN OTRA LÍNEA, y ésa es la línea que se informa. El valor
      // se recorta por delante hasta la primera línea con contenido para que el
      // índice 0 del valor y `line` sean la MISMA línea: quien juzgue el valor
      // línea a línea puede entonces sumar el desplazamiento sin corregir nada.
      const primera = cuerpo.findIndex((l) => l.trim() !== '');
      if (primera >= 0) {
        campos.push({
          nombre: clave,
          valor: cuerpo.slice(primera).join('\n').replace(/\n+$/, ''),
          line: i + 1 + primera + 1,
          multilinea: true,
          // EL CUERPO DE UN BLOQUE NO ES YAML: es texto incrustado de un
          // lenguaje que este analizador no conoce —un `run: |` de Actions es
          // shell, y el shell de CI es justo donde viven los secretos—. Decir
          // «lo entendí» sobre él sería la mentira contra la que existe la
          // retirada. Se marca opaco para que quien llama lo barra ADEMÁS en
          // crudo: si el cuerpo lleva `API_KEY=…`, eso se sigue cazando aunque
          // la clave del bloque no sea un nombre de identidad.
          opaco: true
        });
      }
      i = j;
      continue;
    }

    const flujo = flujoYaml(valor, clave, numero);
    if (flujo) {
      campos.push(...flujo);
      i += 1;
      continue;
    }
    campos.push({ nombre: clave, valor: escalarYaml(valor), line: numero });
    pila.push({ indent, nombre: clave });
    i += 1;
  }
  return campos;
}

// ---------------------------------------------------------------------------
// Dockerfile — analizador de instrucciones
// ---------------------------------------------------------------------------

/**
 * Reparte los argumentos de una instrucción respetando comillas.
 *
 * @param {string} s
 * @returns {string[]}
 */
function trozosDocker(s) {
  /** @type {string[]} */
  const out = [];
  let act = '';
  let comilla = null;
  let hay = false;
  for (let k = 0; k < s.length; k += 1) {
    const c = s[k];
    if (comilla) {
      if (c === '\\' && comilla === '"') {
        act += s[k + 1] ?? '';
        k += 1;
        continue;
      }
      if (c === comilla) {
        comilla = null;
        continue;
      }
      act += c;
      continue;
    }
    if (c === '"' || c === "'") {
      comilla = c;
      hay = true;
      continue;
    }
    if (/\s/.test(c)) {
      if (hay || act !== '') out.push(act);
      act = '';
      hay = false;
      continue;
    }
    act += c;
  }
  if (hay || act !== '') out.push(act);
  return out;
}

/**
 * Los campos de una receta de imagen.
 *
 * EL CASO 3 DEL WP ESTÁ AQUÍ: `ENV API_KEY valor` **sin `=`**. Es la forma
 * antigua de `ENV`, sigue siendo válida, y el patrón de U231 no podía verla
 * porque exige `:` o `=` entre el nombre y el valor. Aquí no hace falta ningún
 * separador: lo dice la gramática de la instrucción.
 *
 * @param {string} texto
 * @returns {Campo[]}
 */
export function camposDeDockerfile(texto) {
  /** @type {Campo[]} */
  const campos = [];
  const lineas = texto.split('\n').map((l) => l.replace(/\r$/, ''));
  let escape = '\\';

  // Directivas de analizador: sólo válidas antes de cualquier instrucción.
  let inicio = 0;
  while (inicio < lineas.length) {
    const m = /^\s*#\s*([a-z]+)\s*=\s*(\S+)\s*$/i.exec(lineas[inicio]);
    if (!m) break;
    if (m[1].toLowerCase() === 'escape') escape = m[2];
    inicio += 1;
  }

  let i = inicio;
  while (i < lineas.length) {
    const numero = i + 1;
    const l = lineas[i];
    if (/^\s*$/.test(l)) {
      i += 1;
      continue;
    }
    // El comentario NO se tira: opaco y a barrido crudo. Un
    // `# ENV API_KEY <material>` comentado sigue siendo un secreto en el árbol.
    if (/^\s*#/.test(l)) {
      campos.push({ nombre: '', valor: l, line: numero, opaco: true });
      i += 1;
      continue;
    }
    // Continuaciones de línea. Un comentario DENTRO de una continuación se
    // salta (Docker lo hace así) sin romper la continuación.
    let acumulado = l;
    while (acumulado.trimEnd().endsWith(escape)) {
      acumulado = acumulado.trimEnd().slice(0, -escape.length);
      i += 1;
      if (i >= lineas.length) break;
      if (/^\s*#/.test(lineas[i])) {
        acumulado += escape; // el comentario no consume la continuación
        continue;
      }
      acumulado += ' ' + lineas[i].trim();
    }
    i += 1;

    const m = /^\s*([A-Za-z][A-Za-z0-9_]*)\s+([\s\S]+)$/.exec(acumulado);
    if (!m) {
      // Una línea que no es `INSTRUCCION argumentos` no es un Dockerfile que yo
      // entienda. No se salta en silencio: se retira el fichero entero.
      if (acumulado.trim() === '') continue;
      throw new NoEntiendo(`Dockerfile: linea que no es una instruccion (linea ${numero})`);
    }
    const instruccion = m[1].toUpperCase();
    const args = m[2].trim();

    // Instrucciones que NO declaran pares nombre/valor (`RUN`, `COPY`, `CMD`…).
    // Su argumento es texto de otro lenguaje —`RUN export API_KEY=…` es shell—,
    // así que se marca OPACO y se barre en crudo. Saltarlas en silencio era una
    // pérdida frente a U231, que sí miraba dentro.
    if (instruccion !== 'ENV' && instruccion !== 'ARG' && instruccion !== 'LABEL') {
      campos.push({ nombre: '', valor: args, line: numero, opaco: true });
      continue;
    }

    const trozos = trozosDocker(args);
    if (trozos.length === 0) continue;

    // Forma con `=`: una o varias parejas en la misma instrucción.
    if (/^[^\s=]+=/.test(args)) {
      for (const t of trozos) {
        const j = t.indexOf('=');
        if (j <= 0) {
          // Un trozo sin `=` dentro de la forma de `=` es una instrucción que
          // no sé leer. Retirada, no salto.
          throw new NoEntiendo(`Dockerfile: argumento sin \`=\` en forma de pares (linea ${numero})`);
        }
        campos.push({ nombre: t.slice(0, j), valor: t.slice(j + 1), line: numero });
      }
      continue;
    }
    // Forma de ESPACIO (`ENV clave valor…`): sólo `ENV` y `LABEL` la admiten;
    // `ARG` sin `=` es una declaración sin valor, y no hay valor que juzgar.
    if (instruccion === 'ARG') continue;
    if (trozos.length < 2) continue;
    campos.push({ nombre: trozos[0], valor: trozos.slice(1).join(' '), line: numero });
  }
  return campos;
}

// ---------------------------------------------------------------------------
// Código — LEXER de literales de cadena
// ---------------------------------------------------------------------------

/** Palabras tras las cuales una `/` abre una expresión regular, no una división. */
const ANTES_DE_REGEX = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void',
  'do', 'else', 'yield', 'await', 'case', 'throw'
]);

/**
 * Los literales de cadena de un fichero de código, con el nombre que los
 * precede.
 *
 * POR QUÉ ESTO ES LO QUE MÁS FALSOS POSITIVOS QUITA. Sobre este árbol, 100 de
 * los 125 hallazgos del barrido crudo caen en `.mjs` y `.ts`, y NINGUNO es una
 * credencial: son la asignación de una llamada a una variable llamada `token`,
 * la de `assertIntentRole(...)` a una llamada `auth`, y una anotación JSDoc de
 * de un comentario JSDoc. Todos tienen la misma forma y el mismo defecto: **el
 * valor no es un literal**, es una expresión o es prosa dentro de un
 * comentario. Un secreto escrito en el código ES un literal de cadena; una
 * llamada a función no lo es. Distinguirlos no se puede por expresión regular
 * sobre una línea —hace falta saber si estás dentro de un comentario, de una
 * plantilla o de una expresión regular— y sí se puede lexando.
 *
 * NO es un analizador sintáctico: no entiende el código. Reconoce cuatro
 * estados —comentario de línea, comentario de bloque, cadena y expresión
 * regular— y con eso sabe dónde hay un literal. Si termina en un estado que no
 * es el inicial, LANZA: un lexer desincronizado no puede decir «limpio».
 *
 * @param {string} texto
 * @returns {Campo[]}
 */
export function camposDeCodigo(texto) {
  /** @type {Campo[]} */
  const campos = [];
  const n = texto.length;
  let i = 0;
  let linea = 1;
  /** último carácter significativo (ni blanco ni comentario) */
  let ultimo = '';
  /** última palabra significativa, para decidir `/` */
  let ultimaPalabra = '';

  /**
   * Mira hacia atrás desde el literal a ver si cuelga de un nombre
   * (`nombre: "…"` o `nombre = "…"`). Se hace hacia atrás y sobre el texto
   * crudo porque en ese tramo corto ya sabemos que no estamos en un comentario:
   * el lexer acaba de pasar por ahí en estado de código.
   *
   * @param {number} fin índice del carácter que abre el literal
   * @returns {string}
   */
  const nombreAntesDe = (fin) => {
    let k = fin - 1;
    while (k >= 0 && /\s/.test(texto[k])) k -= 1;
    if (k < 0) return '';
    if (texto[k] === ':') {
      k -= 1;
    } else if (texto[k] === '=') {
      // `==`, `===`, `=>`, `!=`, `>=`, `<=` no son asignación
      if (texto[k - 1] === '=' || texto[k - 1] === '!' || texto[k - 1] === '>' || texto[k - 1] === '<') return '';
      k -= 1;
    } else {
      return '';
    }
    while (k >= 0 && /\s/.test(texto[k])) k -= 1;
    if (k < 0) return '';
    // nombre entrecomillado: `"api_key": "…"`
    if (texto[k] === '"' || texto[k] === "'") {
      const q = texto[k];
      let j = k - 1;
      while (j >= 0 && texto[j] !== q) j -= 1;
      if (j < 0) return '';
      return texto.slice(j + 1, k);
    }
    let j = k;
    while (j >= 0 && /[A-Za-z0-9_$]/.test(texto[j])) j -= 1;
    return texto.slice(j + 1, k + 1);
  };

  while (i < n) {
    const c = texto[i];
    if (c === '\n') {
      linea += 1;
      i += 1;
      continue;
    }
    if (/\s/.test(c)) {
      i += 1;
      continue;
    }
    // Comentarios. NO se tiran: salen OPACOS y quien llama los barre en crudo.
    // Tirarlos era una pérdida frente a U231 —«lo dejo comentado por si acaso»
    // es justo donde se queda un secreto— y ademas era una perdida NO declarada.
    if (c === '/' && texto[i + 1] === '/') {
      const ini = i;
      while (i < n && texto[i] !== '\n') i += 1;
      campos.push({ nombre: '', valor: texto.slice(ini, i), line: linea, opaco: true });
      continue;
    }
    if (c === '/' && texto[i + 1] === '*') {
      const cierre = texto.indexOf('*/', i + 2);
      if (cierre < 0) throw new NoEntiendo(`codigo: comentario de bloque sin cerrar (linea ${linea})`);
      campos.push({ nombre: '', valor: texto.slice(i, cierre + 2), line: linea, opaco: true });
      for (let k = i; k < cierre; k += 1) if (texto[k] === '\n') linea += 1;
      i = cierre + 2;
      continue;
    }
    // expresión regular
    if (c === '/') {
      const abreRegex =
        ultimo === '' ||
        '(,=:[!&|?{};+-*%~^<>'.includes(ultimo) ||
        ANTES_DE_REGEX.has(ultimaPalabra);
      if (abreRegex) {
        let k = i + 1;
        let clase = false;
        let cerrada = false;
        while (k < n) {
          const d = texto[k];
          if (d === '\\') {
            k += 2;
            continue;
          }
          if (d === '\n') break;
          if (d === '[') clase = true;
          else if (d === ']') clase = false;
          else if (d === '/' && !clase) {
            cerrada = true;
            k += 1;
            break;
          }
          k += 1;
        }
        if (!cerrada) throw new NoEntiendo(`codigo: expresion regular sin cerrar (linea ${linea})`);
        while (k < n && /[a-z]/.test(texto[k])) k += 1; // banderas
        i = k;
        ultimo = '/';
        ultimaPalabra = '';
        continue;
      }
      ultimo = '/';
      ultimaPalabra = '';
      i += 1;
      continue;
    }
    // literales de cadena y plantillas
    if (c === '"' || c === "'" || c === '`') {
      const l0 = linea;
      const nombre = nombreAntesDe(i);
      let k = i + 1;
      let out = '';
      let cerrada = false;
      let prof = 0; // anidamiento de `${…}` en plantillas
      while (k < n) {
        const d = texto[k];
        if (d === '\\') {
          out += texto[k + 1] ?? '';
          if (texto[k + 1] === '\n') linea += 1;
          k += 2;
          continue;
        }
        if (d === '\n') {
          if (c !== '`') break; // cadena normal sin cerrar en su línea
          linea += 1;
          out += d;
          k += 1;
          continue;
        }
        if (c === '`' && d === '$' && texto[k + 1] === '{') {
          prof += 1;
          out += '${';
          k += 2;
          continue;
        }
        if (c === '`' && prof > 0 && d === '}') {
          prof -= 1;
          out += d;
          k += 1;
          continue;
        }
        if (d === c && prof === 0) {
          cerrada = true;
          k += 1;
          break;
        }
        out += d;
        k += 1;
      }
      if (!cerrada) throw new NoEntiendo(`codigo: literal de cadena sin cerrar (linea ${l0})`);
      if (nombre !== '') campos.push({ nombre, valor: out, line: l0 });
      // UN LITERAL QUE ES UN DOCUMENTO JSON ES UN DOCUMENTO JSON. El caso real
      // es `const cfg = '{"api_key":"…"}'`: el nombre que ve el lexer es `cfg`,
      // que no es léxico de identidad, así que sin esto el blob entero pasaba
      // —y el barrido de U231 sí lo cazaba—. Se intenta analizar; si no es JSON,
      // no era un blob y no se pierde nada. La línea es la del literal: un
      // documento incrustado no tiene líneas propias en este fichero.
      if (/^\s*[{[]/.test(out)) {
        try {
          for (const c2 of camposDeJson(out)) campos.push({ ...c2, line: l0 });
        } catch (e) {
          if (!(e instanceof NoEntiendo)) throw e;
          // No era JSON. El literal ya se juzgó arriba por su propio nombre.
        }
      }
      i = k;
      ultimo = '"';
      ultimaPalabra = '';
      continue;
    }
    if (/[A-Za-z0-9_$]/.test(c)) {
      let k = i;
      while (k < n && /[A-Za-z0-9_$]/.test(texto[k])) k += 1;
      ultimaPalabra = texto.slice(i, k);
      ultimo = texto[k - 1];
      i = k;
      continue;
    }
    ultimo = c;
    ultimaPalabra = '';
    i += 1;
  }
  return campos;
}
