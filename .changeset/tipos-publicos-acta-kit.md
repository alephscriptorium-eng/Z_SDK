---
'@zeus/acta-kit': patch
---

`@zeus/acta-kit` publica tipos: los SIETE subpaths de `exports` resuelven su
condición `types` y las declaraciones viajan en el tarball.

El paquete llevaba `0.1.1` con CERO ficheros `.d.ts`. Ahora hay declaraciones
bajo `types/` para raíz, `./tipos`, `./emitir`, `./validar`, `./publicar`,
`./adoptar` y `./huella`. `isActaDeBarrioShaped` estrecha `unknown` al shape
`acta/1` exacto; campos inventados no ganan contrato. Diff de runtime cero.
