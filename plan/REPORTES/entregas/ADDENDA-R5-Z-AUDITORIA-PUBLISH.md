# ADDENDA · R5-Z · auditoría de paquetes publicables

## Veredicto técnico

- Paquetes únicos bajo `packages/**`: 49.
- Publicados y resolubles por `npm view`: 29.
- No publicados: 20.
- Los 20 no publicados son privados o fixtures; ninguno con `private: true`
  aparece publicado.
- Política viva: engine publicable; mesh/editor privados por defecto.
  Excepciones requieren allowlist y pipeline explícitos.

No procede retirar `private` de forma masiva.

## Candidatos observados

### P0 · servicios con API exportada

- `@zeus/linea-system`
- `@zeus/linea-firehose`
- `@zeus/force-system`
- `@zeus/ssb-system`

Todos están privados, sin `publishConfig`, sin contrato completo de `files` /
`types` y con dependencias internas `@zeus/*` mediante `*`.

### P1 · requieren mayor triage

- `@zeus/linea-editor`
- `@zeus/console-monitor`
- `@zeus/blobstore-client`

### Mantener privados salvo decisión expresa

UIs, visores, Angular, monitores visuales, demos y harnesses: player/editor UI,
operator UI, threejs UI, WebRTC viewer, 3d-monitor, blob-sync-harness y
equivalentes. Publicarlos exige producto, peer dependencies y empaquetado
propios; no son residuos mecánicos.

## Propuesta de backlog

Después de U158, añadir un WP inicialmente ⬜:

**WP-U162 propuesto · Auditoría publish-ready y allowlist de paquetes Zeus**

Alcance:

1. fijar en una fuente única qué clases de mesh pueden publicarse;
2. cotejar los 49 paquetes contra registry;
3. clasificar `mantener privado | candidato | ya publicado`;
4. para cada candidato medir `publishConfig`, `files`, exports/types,
   dependencias internas, changeset, workflow y C8;
5. partir la implementación posterior en WPs pequeños.

CA:

- inventario 49/49 con comando reproducible;
- `npm view` literal por candidato;
- allowlist explícita, no inferida por ausencia de `private`;
- tarball/contents y tipos medidos antes de proponer publish;
- cero cambios de `private` y cero publish en U162;
- plan de WPs con dependencias y estimación.

Derivación recomendada, sujeta a GO posterior:

1. POC publish-ready con `@zeus/linea-system`;
2. replicación acotada a linea-firehose, force-system y ssb-system;
3. gate de pre-publicación: `files`, types, semver interno y canal registry.

## Estado de autorización

- Encolar y planificar U162: autorizado por el custodio.
- Cambiar `private`, manifests o workflows: no autorizado todavía.
- Publicar paquetes: no autorizado todavía.
- Implementación derivada: requiere GO tras aceptar el inventario U162.

## Handoff copiable al orquestador-Z

```text
Nueva cola autorizada, posterior a U158:

Proponer WP-U162 · Auditoría publish-ready y allowlist de paquetes Zeus (⬜).

Hechos del barrido:
- 49 paquetes únicos
- 29 publicados
- 20 privados/no publicados
- P0 candidatos: linea-system, linea-firehose, force-system, ssb-system
- P1: linea-editor, console-monitor, blobstore-client
- UIs/visores/Angular/demos/harnesses siguen privados salvo decisión expresa

U162 es auditoría y partición:
- inventario reproducible + npm view
- clasificación mantener privado/candidato/publicado
- publishConfig/files/exports/types/deps/changeset/workflow/C8
- allowlist de servicios mesh publicables
- cero cambios private
- cero publish

Después de U162, proponer WPs pequeños:
1. POC linea-system
2. replicación P0 restante
3. gate publish-readiness

La implementación y publicación requieren GO posterior.
DC-15 LOCAL-ONLY.
```
