# Sprint 1 de bug-fixing — paquete para el orquestador

Ceguera verificada. Tres bloques: bugs reales (A), docs (B), release (C).
Los CA de B derivan del plan de prosa recibido por el usuario (auditado y
ajustado: los heros/lemas quedan EXENTOS — identidad de producto, decisión
del usuario, no criterio de estilo).

---

> **Sprint 1 — propuesta de lote**
>
> **(A) CI de main en rojo — 4 workspaces (PRIORIDAD, gate de todo publish).**
> Desde ~U116/U117, `test @zeus/http-contract`, `@zeus/linea-system`,
> `@zeus/firehose-browser` y `@zeus/editor-ui` fallan en CI y Release
> (runs 29656058145/29656058148). Los re-smokes locales de los WP salían
> verdes → sospecha: regresión de integración entre WPs de la racha
> U111–U117 (candidato obvio: `@zeus/story-board-schema` nuevo en U117 y
> sus consumidores; linea-system ya tuvo dependencia de entorno en U102) o
> deriva local-vs-runner. **WP-A: diagnosticar y dejar main verde.**
> **CA:** run de CI completo verde en main; causa raíz de cada workspace
> anotada en el reporte (no solo el fix); si algún fix es «test no
> hermético», aplicar el patrón U102 (fixture/env explícito/skip-⏳), nunca
> debilitar asserts.
>
> **(B) Refactor de prosa de los dos portales (2 WP, uno por portal).**
> Origen: auditoría de prosa externa (vía usuario). Principios: definir por
> lo ofrecido; separar doctrina/estado (nueva `guide/estado.md` en zeus;
> `futuros.md` declarada estado en library); números vivos o ninguno
> (puertos→`.env.example`, versiones/fechas→GitHub Releases); comandos que
> corren tal cual (anotaciones de repo FUERA de los bloques); la página de
> handshake externo como puerta madre del consumo público.
> **EXENCIÓN (decisión usuario):** heros y lemas de marca («Crear juegos,
> no dialectos») NO se tocan; P1-sin-negación aplica solo a páginas
> doctrinales.
> **WP-B1 (zeus/docs, 23 md):** mover todo WP-U##/D-##/«ola»/⏳/fechas a
> `guide/estado.md`; arreglar los comandos rotos (p.ej.
> `getting-started.md:23`); contador «dos juegos» → regla paramétrica;
> tabla de paquetes mínima con puntero a fuente viva.
> **WP-B2 (library/docs, 6 md):** `releases.md` describe el mecanismo y
> apunta a GitHub Releases como verdad viva (fuera fechas «consultado» y
> versiones a mano); `startpacks.md` separa pipeline de publish-⏳; el
> arreglo `file:`/`.deps` encajonado como «modo provisional».
> **CA (ambos):** `docs:build` verde; en páginas doctrinales (excluida la
> de estado): grep `WP-U|D-[0-9]|ola [0-9]|⏳|puede estar|consultado 20` →
> 0; los bloques de comando corren tal cual en su repo (spot-check de los
> marcados); heros intactos.
>
> **(C) Credencial durable del registry (micro, tick previo del usuario).**
> Verificado por ops: el token JWT guardado caducó (Verdaccio firma con
> `expiresIn: 7d`) y `release.yml` usa `_authToken` — mintear otro
> reproduce el problema en una semana. Modelo recomendado: **(a)**
> basic-auth no caducable (user+`_password` base64, como el propio
> `.npmrc.example` del registry indica) + ajuste de `release.yml` a ese
> esquema. **WP-C:** cambiar el bloque de auth de `release.yml` al patrón
> `_password`; el secret lo carga ops cuando (A) deje el gate verde.
> **CA:** con secret presente y tests verdes, `npm view @zeus/protocol
> --registry=…` devuelve versión publicada; sin secret, skip «⏳» limpio
> (hoy ni se evalúa: muere antes en test).
>
> Orden: **A primero** (desbloquea C y da suelo firme a B); B1∥B2 en
> paralelo; C al final del sprint. Tras C verde → GO U55 natural.

---

**Para el responsable de ops (respuesta a su pregunta):** los 4 tests rojos
son territorio del swarm (workspaces de zeus, gate de su CI) — van en este
sprint como bloque A; NO abrir parte aparte en su plan. Su PARTE-005 queda
como la pieza de decisión del modelo de credencial: con el tick en (a), el
wiring del secret es suyo cuando A esté verde, y el ajuste de release.yml es
el WP-C del swarm (cada uno su lado de la frontera).
