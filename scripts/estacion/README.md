# Estación de vigilancia (calibración local zeus)

Instancia del skill `vigilancia` (`@alephscript/skills-scriptorium`).
El **método** vive en `node_modules`; aquí solo arranque + checks.

| parámetro | valor local |
| --------- | ----------- |
| `WORLD_ROOT` | raíz de este repo |
| `OUT_DIR` | `.vigilancia/` (gitignorado; no ensucia el árbol) |
| `INTERVAL` | 45 s (default del watcher) |
| canal CI | `gh run list -R alephscriptorium-eng/Z_SDK` |

## Comandos

```bash
npm run vigilancia:check   # checks 0.3.1 ESTACION (regla 15 + CHANGELOG↔backlog)
npm run vigilancia         # un pulso del watcher → .vigilancia/watch.log
npm run vigilancia:watch   # bucle continuo
```

Sin datos de instancia en git (rutas de máquina, IDs de chat, tokens).
