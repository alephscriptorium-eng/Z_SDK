# ADDENDA-R12-Z-GO-PUBLICACION-ALLOWLIST · GO condicionado de publicación

## §interna

Carril Z. Autoridad del custodio: publicar paquetes aún ausentes del registry
cuando su ausencia no responda a una decisión de privacidad de producto.

Interpretación:

- `private: true` operativo no excluye un nombre presente en allowlist §3.
- P0×4 reciben GO publish condicionado.
- `linea-editor` permanece allowlisted P1: recibe GO para ser preparado en
  un WP independiente y GO publish condicionado tras su propio PASS; no se
  mezcla con U171/P0.
- Demociones U166/U167 y clases D/E/F/G quedan fuera por decisión de
  producto, no por carencia técnica accidental.

Activación del GO P0:

1. skills 0.10.0 adoptado y validado en Z;
2. R12-Z PASS y GO de implementación;
3. U168–U171 aceptados;
4. major-band y gate adaptado;
5. contrarrevisión independiente;
6. changesets y matriz CI/Release completas;
7. gate online/C8 pre-publicación verde.

Cumplidas esas condiciones, no hace falta un nuevo GO del custodio para el
publish P0×4. El orquestador conserva secuencia y evidencia de release.

## §WP

### Autoridad

GO condicionado para preparar y publicar únicamente candidatos nominales de
la allowlist que sigan ausentes del registry y no estén clasificados como
privados por decisión de producto.

### Lote P0 autorizado

- `@zeus/linea-system`
- `@zeus/linea-firehose`
- `@zeus/force-system`
- `@zeus/ssb-system`

El flag `private: true` no los excluye: se mantiene hasta la fase de
publicación.

Antes de publicar:

1. aplicar política major-band;
2. adaptar y pasar el gate semver;
3. completar contrarrevisión independiente;
4. crear changesets;
5. completar cobertura CI/Release de los cuatro paquetes;
6. pasar comprobación online del registry;
7. conservar tarballs limpios y contratos JS-only documentados.

Tras cumplir todos los CA y cerrar la implementación R12, el GO condicionado
autoriza retirar `private`, ejecutar Release y verificar instalación desde el
registry para P0×4.

### P1 encolado aparte

`@zeus/linea-editor` sigue siendo candidato, no privado por producto, pero aún
no está preparado. Encolar un WP independiente que complete:

- `publishConfig` y `files`;
- major-band para dependencias internas;
- tarball limpio;
- decisión JS-only;
- matriz CI/Release;
- contrarrevisión y gate online.

Su publicación solo se activa después del PASS de ese WP. No mezclarlo con el
primer lote P0.

### Excluidos por decisión de producto

- `@zeus/console-monitor`;
- `@zeus/blobstore-client`;
- UIs, visores y monitores visuales;
- demos, fixtures y harnesses;
- aplicaciones editor;
- mesh no incluido nominalmente en allowlist.

No retirar `private`, preparar changesets ni publicar esos paquetes sin
enmienda explícita de allowlist y nueva decisión del custodio.

## Prueba de ceguera

Cara comprobada: solo `§WP`.

Patrón prohibido:

```text
mediación|marco|§interna|instancia-ejemplo
```

Resultado requerido: `0` coincidencias.
