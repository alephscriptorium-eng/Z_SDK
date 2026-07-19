# Criterios de aceptación y verificación (WP-W1 · WP-W2)

> El principio: la copy se acepta por **identidad con el paquete**, no por
> juicio de estilo. Si el diff aplicado no es el texto entregado, el WP no
> pasa — aunque «suene mejor».

---

## CA comunes (ambos WP)

1. **Aplicación literal.** Cada bloque `DESPUÉS` de `01`/`02` aparece en el
   fichero destino carácter a carácter. Verificación: diff del fragmento
   contra el paquete = 0.
2. **Alcance cerrado.** `git diff --stat` del WP lista **exactamente** los
   ficheros enumerados en su documento de copy — ni uno más. Los marcados
   «fuera de alcance / cero diff» no aparecen.
3. **Build verde.** `npm run docs:build` termina OK en el repo del WP
   (`ignoreDeadLinks: false` ya vigila los enlaces internos; un link roto es
   fallo de CA, y se resuelve por la regla 4 del paquete: reporte, no
   improvisación).
4. **Sin copy de cosecha propia.** El diff no introduce frases, contadores de
   juegos («N juegos», «3 títulos»…), exclamaciones ni términos promocionales
   que no estén en el paquete.
5. **Slugs e infra intactos.** El diff no toca `game:`, rooms, puertos,
   scripts ni nombres de paquete. `grep -rn "El Común\|El Aljibe"` en
   `packages/` de la library → 0 (los títulos de obra viven solo en docs).

## CA específicos — W1 (`zeus-sdk/docs`)

- `docs/index.md`: `hero.name: Zeus SDK` y `hero.text: Crear juegos, no
  dialectos` **idénticos** a los previos (el lema es intocable); `actions`
  sin cambios.
- Las 17 entradas de `01-COPY-WEB-A.md` aplicadas; en las de tipo
  «frase-marco», el cuerpo posterior (tablas, listas numeradas, bloques de
  comando) byte-idéntico al previo.
- `.vitepress/config.mjs`: **cero diff**.
- `guide/estado.md`, `contracts/*`: **cero diff**.

## CA específicos — W2 (`Z_SDK-games-library`)

- `docs/games/solve-coagula.md` existe con el contenido del §4 y queda
  enlazada desde: portada (card), nav «Juegos», sidebar «Juegos» y la fila
  de `futuros.md`. Build verde confirma que no queda huérfana.
- `npm run demo:solve-coagula` existe en `package.json` raíz (ya verificado
  al redactar el paquete — el comando citado en la ficha corre tal cual;
  re-confirmar con un grep del script en `package.json`).
- `docs/games/delta.md` y `docs/games/pozo.md`: desde la tabla
  `| Pieza | Ruta en el repo |` hasta el final, byte-idénticos a los previos
  (el anchor `#mesh-local-fallback-dev` que usa la portada depende de ello).
- `docs/releases.md`: **cero diff**; su disclaimer de verdad viva sigue.
- `futuros.md`: la tabla conserva sus filas previas (sketch, publish
  registry); solo cambia la fila SOLVE ET COAGULA (celda Estado ajustable a
  verdad viva) y se añaden las dos filas nuevas del §5c tal cual.
- `config.mjs`: solo los tres reemplazos del §7; `title`, `footer`, `base`,
  `socialLinks` intactos.

## Reporte esperado de cada WP

- Lista de entradas aplicadas / no aplicadas (con su ancla) y por qué.
- Salida de `docs:build`.
- `git diff --stat`.
- Cualquier conflicto texto↔repo, citado literal, **sin resolución propia**
  (lo resuelve la siguiente entrega de marketing).
