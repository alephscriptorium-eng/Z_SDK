# @zeus/acta-kit

## 0.1.2

### Patch Changes

- 54a886b: `@zeus/acta-kit` publica tipos: los SIETE subpaths de `exports` resuelven su
  condición `types` y las declaraciones viajan en el tarball.

  El paquete llevaba `0.1.1` con CERO ficheros `.d.ts`. Ahora hay declaraciones
  bajo `types/` para raíz, `./tipos`, `./emitir`, `./validar`, `./publicar`,
  `./adoptar` y `./huella`. `isActaDeBarrioShaped` estrecha `unknown` al shape
  `acta/1` exacto; campos inventados no ganan contrato. Diff de runtime cero.

## 0.1.1

### Patch Changes

- 62b25cc: Initial public release of game/contract kits. Packages were 0.1.0 private and unpublished; first registry versions via this changeset are 0.1.1.
- Updated dependencies [1df2fd2]
  - @zeus/protocol@0.4.0
