# Entrega de marketing — copy final de los dos portales (paquete Sprint 2)

> **Para el orquestador del swarm.** Origen: dpto. de marketing (vía usuario).
> Fecha: 2026-07-19. Los textos llegan **finales y cerrados**: el trabajo del
> swarm es **aplicarlos verbatim** y verificar build/links — **no redactar,
> no parafrasear, no completar**. Autocontenido: no depende de ningún otro
> documento.

---

## Qué contiene

| Fichero | Qué es |
|---------|--------|
| `00-PAQUETE.md` | Este índice + reglas de aplicación + lote de WPs propuesto. |
| `01-COPY-WEB-A.md` | Copy final para `zeus-sdk/docs` (portal Zeus SDK). Reemplazos quirúrgicos ANTES→DESPUÉS. |
| `02-COPY-WEB-B.md` | Copy final para `Z_SDK-games-library/docs` (catálogo). Incluye **una página nueva** (`games/solve-coagula.md`) y ajustes de `config.mjs`. |
| `03-VERIFICACION.md` | Criterios de aceptación y cómo verificarlos. |

## Reglas de aplicación (duras — leerlas es parte del WP)

1. **Verbatim.** Cada bloque `DESPUÉS` se aplica **carácter a carácter**
   (incluye tildes, voseo, cursivas, guiones largos). No se "mejora", no se
   acorta, no se armoniza estilo. El estilo ES la entrega.
2. **Anclas de texto, no números de línea.** Localizá cada reemplazo por su
   bloque `ANTES` literal. Si otro WP movió el texto, el ancla sigue valiendo;
   si el ancla **no existe** en el fichero, ver regla 4.
3. **Nada fuera de la lista.** Solo se tocan los ficheros/campos enumerados en
   `01`/`02`. Cuerpos técnicos (tablas de rutas, bloques de comandos, notas de
   fallback), páginas generadas (`contracts/*`, `api/`, `dist/`),
   `guide/estado.md` y `releases.md` quedan **con cero diff**.
4. **Conflicto = reporte, no improvisación.** Si un texto entregado choca con
   la realidad del repo (ancla ausente, link que rompería `docs:build`,
   comando citado que no existe), **NO se re-redacta ni se adapta**: se deja
   ese campo como está, se anota en el reporte del WP y marketing corrige en
   la siguiente entrega. Un hueco honesto vale más que una frase inventada.
5. **No añadir copy propia.** Ni una frase de cosecha del worker: ni contadores
   de juegos («el catálogo tiene N…» está vetado), ni sinónimos de marca, ni
   signos de exclamación, ni jerga promocional (revolucionar / potenciá /
   engagement / onboarding / seamless…). Si parece que falta texto, aplica la
   regla 4.
6. **Slugs e infraestructura intactos.** `delta`, `pozo`, `solve-coagula`,
   rooms, puertos, nombres de paquete y scripts **no se renombran**. Los
   títulos públicos (El Común, El Aljibe, SOLVE ET COAGULA) son una capa
   editorial *encima* del slug, nunca un reemplazo del slug.

## Lote propuesto — Sprint 2

> **(W1) Copy portal Zeus SDK** — aplicar `01-COPY-WEB-A.md` sobre
> `zeus-sdk/docs`. Solo markdown; `config.mjs` de A **no se toca**.
> **CA:** ver `03-VERIFICACION.md` §W1.
>
> **(W2) Copy catálogo + ficha nueva** — aplicar `02-COPY-WEB-B.md` sobre
> `Z_SDK-games-library`: portada, fichas `delta`/`pozo`, página nueva
> `games/solve-coagula.md`, marco de `futuros`, intro de `startpacks`,
> `docs/.vitepress/config.mjs` (nav/sidebar/description).
> **CA:** ver `03-VERIFICACION.md` §W2.
>
> W1 ∥ W2 (repos distintos, sin dependencia entre sí ni con otros bloques).
> Si el sprint de prosa anterior (B1/B2) aún no corrió, este paquete no lo
> pisa: las superficies son disjuntas (aquí: heros, marcos capa-1, fichas;
> allá: limpieza doctrinal y comandos). Las anclas de texto absorben el orden.

## Contexto mínimo (para entender el tono, no para reescribirlo)

Las dos webs son las dos caras de **Scriptorium**: el portal Zeus SDK es **el
aparato** (quien viene, viene a operar) y el catálogo es **las obras** (quien
viene, viene a jugar y a llevárselo a su comunidad). Registro: voseo, español,
sin lenguaje de startup. Los tres juegos jugables reciben **título de obra**
público — **El Común** (`delta`), **El Aljibe** (`pozo`), **SOLVE ET COAGULA**
(`solve-coagula`) — con el slug técnico intacto. El lema del portal A,
«Crear juegos, no dialectos», **se conserva** (exención vigente de heros/lemas).
