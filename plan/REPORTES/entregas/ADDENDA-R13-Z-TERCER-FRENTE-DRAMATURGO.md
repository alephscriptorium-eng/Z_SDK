# ADDENDA-R13-Z-TERCER-FRENTE-DRAMATURGO · tercer frente Dramaturgo + Zigurat

## §interna

Carril Z. Fuente: GO custodio 2026-07-24, con asiento DA-S21 pendiente en S,
y handoff
`plan/SPRINTS/PRUEBA-DE-DOS/HANDOFF-CARRIL-Z-dramaturgo-zigurat.md`,
commit `b515dc3`.

Camino A ratificado: absorber el concepto y archivar el editor narrativo
legado.

Interpretación de autoridad:

- GO custodio 2026-07-24 = autoridad recibida para planificar.
- DA-S21 no se considera consolidada hasta existir en `DECISIONES.md`.
- No es GO de implementación.
- Z no crea WPs para archivo legado, DAS-1 ni extensión VS Code: ownership
  a-sdk.
- Z no crea WPs para sidecar/pub: ownership o-sdk.
- Las rutas fuente del legado son solo lectura para diseñar el importador.

Secuencia recomendada:

1. terminar planificación R12;
2. adoptar y validar skills 0.10.0;
3. ejecutar/cerrar R12;
4. gate de planificación R13-Z;
5. GO de implementación del tercer frente.

Numeración U172–U177 estaba libre en el tip inspeccionado; el orquestador debe
revalidarla antes de persistir.

## §WP

### Autoridad actual

GO custodio 2026-07-24 para planificar el tercer frente Dramaturgo + Zigurat;
asiento formal de la decisión pendiente. Se permiten replan, briefs,
dependencias, olas y entradas ⬜. No se permiten workers, 🔶 ni código hasta
gate de planificación y GO de implementación aparte.

### Objetivo

Absorber el dominio narrativo en contratos y paquetes existentes, sin
reconstruir el editor legado:

1. proyectar mutaciones HTTP como herramientas MCP;
2. crear un kit de reparto y permisos de dominio;
3. extender story-board con referencias de personajes;
4. añadir autoría gateada sobre el editor de líneas existente;
5. importar corpus legado mediante tooling one-off;
6. definir consumo IDE opt-in y reactivar la épica Zigurat acotada.

### DRY

Extender antes de crear:

- proyector de rutas existente;
- identidad y seats existentes;
- story-board schema existente;
- `linea-editor`;
- componentes de reparto existentes;
- épica Zigurat histórica.

No reconstruir el editor legado, no duplicar schemas y no convertir Zigurat
en una capa federada completa.

### Olas candidatas

Validar numeración antes de persistir:

- **Ola A:** U172 proyector MCP de mutaciones ∥ U173 kit de reparto.
- **Ola B:** U174 personajes en story-board, después de U173.
- **Ola C:** U175 autoría gateada, después de U172–U174.
- **Ola D:** U176 importador de corpus, después de U173–U174.
- **Ola E:** U177 contrato IDE + cierre de diseño Zigurat; planificación
  paralela, implementación tras contratos U173–U175.

`linea-editor` publish-ready es una entrega distinta: no fusionarla con su
evolución funcional.

### Fronteras

- Solo planificar ahora.
- No tocar repositorios o productos externos al carril.
- No implementar extensión IDE, archivo del legado ni sidecar.
- No publicar paquetes.
- Corpus fuente: lectura; ningún vocabulario o artefacto legado se copia al
  código público.
- Contrarrevisión independiente para contratos, migración y ceguera.

### Salida pedida al orquestador

- REPLAN R13-Z;
- briefs con ownership exclusivo;
- reactivación de la épica Zigurat como ⬜;
- mapa de dependencias y puntos de contrarrevisión;
- handoff de vuelta al custodio;
- petición R13-Z a SOL, sin despacho.

## Prueba de ceguera

Cara comprobada: solo `§WP`.

Patrón prohibido:

```text
novelist|novela|mediación|marco|§interna|instancia-ejemplo
```

Comando ejecutado sobre la cara `§WP`:

```text
node -e "<extraer §WP y contar el patrón prohibido>"
```

Salida literal:

```text
ADDENDA-R13-Z-TERCER-FRENTE-DRAMATURGO.md=0
```
