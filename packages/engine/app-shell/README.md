# `@zeus/app-shell`

Factories compartidas de bootstrap para UIs Zeus (config de app, theme handler,
vistas shell, registro SSR de vistas 3D). Consumido por viewers/mesh; no es un
servidor.

```js
import { createAppConfig } from '@zeus/app-shell/create-app-config';
import { defineView, createViewRegistry, renderViewLayout } from '@zeus/app-shell/ssr-view-registry';
```

`ssr-view-registry` es el lado servidor de un portal de vistas (distincto de
`@zeus/view-kit`, que es browser-safe). Unifica lo que antes vivía duplicado
como `src/view-kit/` en arg-console y 3d-monitor.

## Tests

`npm test -w @zeus/app-shell`
