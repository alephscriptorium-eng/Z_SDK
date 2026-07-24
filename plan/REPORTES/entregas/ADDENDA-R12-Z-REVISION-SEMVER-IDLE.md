# ADDENDA-Z-12 · R12-Z · revisión independiente, semver e idle

## §interna

Carril: Z. Fuente: hallazgos R11-Z sobre U165.

La mejora no consiste en abrir más workers sobre el mismo diff, sino en
introducir una contrarrevisión read-only independiente entre reporte worker y
aceptación del orquestador para WPs de riesgo. SOL puede ocuparla mediante
handoff, sin implementar, aceptar ni mergear. El gate Rn-Z post-merge se
conserva como verificación distinta.

Activación selectiva:

- validadores, gates y parsers;
- manifests, semver y publicación;
- CI/Release, auth y seguridad;
- contratos entre paquetes o repos;
- cambios donde un falso negativo sea peor que una devolución temprana.

No aplica por defecto a documentación rutinaria.

Política semver pedida por custodio: fijar la major y permitir minor/patch.
Forma propuesta por dependencia:

```text
>=M.m.p <(M+1).0.0
```

Para paquetes `0.x`, esto permite saltos de minor que SemVer considera
potencialmente incompatibles. Se respeta la decisión FOSS del custodio, pero
el CA debe declarar esta consecuencia y exigir test de integración. No
convertir silenciosamente a `^0.m.p`, porque pinnearía también la minor.

El próximo idle puede recibir un replan propuesto por SOL; solo el
orquestador persiste BACKLOG y solo el custodio da GO.

## §WP

Propuesta para el próximo idle de Sprint 8, sin abrir trabajo todavía.

### Regla de revisión para WPs de riesgo

Antes de aceptar/mergear un WP de gates, publicación, manifests, CI/Release,
auth o contratos cruzados:

1. Worker entrega reporte y evidencia.
2. Revisor independiente, read-only y sin tocar la rama, intenta refutar los
   CA:
   - falsos negativos y casos adversariales;
   - dependencias usadas pero no declaradas;
   - instalación limpia y reproducibilidad;
   - diferencia entre prueba manual y test automatizado;
   - alcance y fronteras de publicación.
3. Orquestador devuelve observaciones numeradas o acepta.
4. Merge solo tras PASS de revisión.
5. El gate de cierre post-merge permanece separado.

### Política semver propuesta

Para dependencias internas publicadas, sustituir pines exactos por una banda
de major con mínimo conocido:

```text
>=M.m.p <(M+1).0.0
```

CA:

- rango válido y acotado a una major;
- rechazo de `*`, tags, Git/URL, aliases y rutas locales;
- mínimo y versión resuelta existen en el registry;
- tests sobre la versión instalada por resolución normal;
- para major `0`, registrar expresamente que minor puede romper y demostrar
  integración antes de aceptar.

### Lotes candidatos para replan en idle

No asignar WP ni 🔶 hasta decisión del custodio.

**Lote A — robustez del gate**

- separar chequeo local determinista de consulta C8 online;
- declarar todas las dependencias directas del script;
- convertir probes adversariales en tests automatizados;
- exigir que todo WP que cambie manifests verifique y actualice el lock en
  el mismo alcance, sin acumular snapshots atrasados;
- cablear un check CI sin publicar.

**Lote B — migración semver P0**

- aplicar banda de major a los cuatro P0 preparados;
- adaptar el gate y sus casos verde/rojos;
- medir resolución e integración desde instalación limpia.

Puede correr en paralelo con un WP que solo toque `linea-editor`, pero no con
Lote A si ambos editan el mismo gate.

**Lote C — residual P1**

- completar publish-ready de `@zeus/linea-editor`;
- conservar `console-monitor` y `blobstore-client` privados;
- no reabrir candidatos democionados sin enmienda y GO.

**Lote D — higiene de workflows**

- revisar referencias de test a paquetes democionados;
- no confundir matriz de tests con allowlist de publicación;
- ejecutar después de cualquier cambio CI del Lote A.

**Publicación real**

- fase aparte;
- requiere revisión integrada, gate online verde y GO publish explícito;
- ningún lote anterior retira `private`, crea changesets de publicación ni
  publica.

### Salida requerida del replan

- briefs con propiedad de archivos y orden de merges;
- carriles máximos sin solapamiento;
- punto explícito de contrarrevisión independiente;
- runners requeridos;
- petición de gate SOL antes de cualquier GO de implementación.

## Prueba de ceguera

Cara comprobada: solo `§WP`.

Vocabulario prohibido local:

```text
mediación|marco|§interna|instancia-ejemplo
```

Resultado esperado y verificado: `0` coincidencias.
