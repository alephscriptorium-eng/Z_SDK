# NOTA · Z · `F2-Z` · backlog proyectado

| dato | valor |
| ---- | ----- |
| Emisor | vigía **Z** · `C:\S_LAB\z-sdk` |
| Fecha | 2026-07-26 |
| Tick | `F2-Z` · `INFORME-R4` §2 |

## Ruta

**`C:\S_LAB\z-sdk\plan\BACKLOG-F2.md`** · puente: `sincronia/DRAFT.md`

⚠️ **Decisión de método que declaro**: **no** he escrito sobre
`plan/BACKLOG.md`. Ese fichero es gobierno cerrado (WPs hasta `U178`,
épica U73 cerrada) y sobreescribirlo para «proyectar» habría destruido
historia aceptada. La proyección vive en fichero propio y espera aprobación.
Si el custodio prefiere fusión, la hace el orquestador, no el vigía.

⚠️ **Numeración**: ids `F2-Z-nn` **provisionales**. El número `U` definitivo lo
asigna el orquestador al aceptar — un vigía no numera backlog ajeno ni propio.

## Lanes

| lane | qué persigue | WPs |
| ---- | ------------ | --: |
| **A** · Superficie del runtime | de 2/51 a 51/51: ninguna pieza invisible | 7 |
| **B** · Identidad y permiso | el cable no pide credencial; la card concede acciones | 6 |
| **C** · Transporte y federación | relay transparente, sin autoridad por topología | 7 |
| **D** · Plano de datos local-first | 4 drivers, root cercado, arranque sin red | 12 |
| **E** · Canal y verdad de la doc | lo documentado funciona al ejecutarlo | 7 |
| **F** · Ciudad en el runtime | sostener el modelo de G sin decidirlo | 5 |
| **G** · Observabilidad y estación | nada declarado sin verificar | 6 |
| **H** · Fronteras con otros carriles | interfaces sin acoplamiento | 5 |

## Conteo

| prioridad | WPs |
| --------- | --: |
| **P0** | **16** |
| **P1** | **23** |
| **P2** | **15** |
| **total** | **54** |

Los 16 P0 no son «lo urgente»: son lo que **desbloquea a otros** — holón-7
(B), contrato de datos (D), los dos defectos de mi doc (E) y lo que O y V
necesitan de mí (H).

## Mi mundo acabado, en cinco frases

1. Las 51 piezas se usan: nada invisible para quien la consume.
2. Se entra sin permiso y se actúa con permiso.
3. Una ronda arranca con la red desconectada, sobre root cercado y sellado.
4. La federación no crea autoridad, y todo relay deja rastro de lo que cortó.
5. Doc, contrato y código dicen lo mismo.

## Lo que no encolé, y por qué

| qué | por qué |
| --- | ------- |
| **C-6 / P2P continuo** | segundo acto por consenso 6/6; encolarlo fingiría que su especificación existe |
| **Cambio 4(a)** | es obra de **G** (banda major en `startpack-kit`); yo encolo el puente documental, no el trabajo ajeno |
| **Modelo de Ciudad · federación por tramos · GATE-O-CLAVES como gate de build** | de mesa o de O; encolo lo que en mi mundo se derive, no la decisión |

He sido generoso donde el encargo lo pedía y me he contenido **solo** en la
obra de otros. Si algo sobra, sobra por decisión del custodio, no por que yo
lo haya podado antes de tiempo.

— vigía **Z**
