---
'@zeus/linea-kit': minor
---

`isCuratedSidecarPath` se resuelve por FORMA: en un volumen LINEAS todo `*.md`
es sidecar curado, a cualquier profundidad y con cualquier nombre.

Antes el predicado combinaba dos nombres de fichero hardcodeados con «`*.md`
bajo `/registros/`». El cambio es un ENSANCHE ESTRICTO: ninguna ruta que
estuviera protegida deja de estarlo. Pasan a estarlo las que el predicado
anterior sólo cubría por accidente de posición —un `*.md` dentro de un
`registros/` que cuelgue de la raíz del volumen, caso que el JSDoc ya prometía
y el código no cumplía— y, a propósito, los markdown que no son curación
(DATOS §2 cita `raw/linea.md` como export crudo).

El precio queda acotado y declarado: dentro de `volumes-ops` el predicado sólo
elige el CAJÓN DEL REPORTE de un fichero ya presente en el destino
(`curacion_protegida` en lugar de `contenido_distinto`, perdiendo el par de
sha256 para ese fichero), nunca si se pisa o no — `merge` no mueve jamás sobre
un fichero existente. Un consumidor externo que use el predicado para decidir
escrituras protegerá de más, nunca de menos: el falso positivo se reclasifica,
el falso negativo pisaría curación humana y no se recupera.

Motivo: los literales de nombre de sidecar chocaban con el léxico del gate
`two-games` (D-8) bajo `packages/engine`, que llevaba dos olas en rojo.
`@zeus/volumes-ops` no necesita entrada propia (sólo cambió un comentario);
`updateInternalDependencies: "patch"` le da el bump por dependencia.
