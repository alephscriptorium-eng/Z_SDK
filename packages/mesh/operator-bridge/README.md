# `@zeus/operator-bridge`

Puente puro de protocolo: slice `state`/`ledger` del contrato único →
mensajes `AlephMessage` del hub gamify-ui. Sin Angular, sin three, sin red.

```js
import {
  createOperatorBridge,
  projectOperatorSlice,
  makeOperatorIntent
} from '@zeus/operator-bridge';
```

Detalle de mapeo: [INTEGRATION.md](./INTEGRATION.md).
