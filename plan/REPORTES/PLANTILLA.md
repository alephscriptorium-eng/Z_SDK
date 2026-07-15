# WP-U?? · <slug> — reporte

| dato | valor |
| ---- | ----- |
| agente | _(identificador)_ |
| fecha | _(YYYY-MM-DD)_ |
| rama | `wp/<id>-<slug>` |
| commit(s) | _(hashes)_ |
| estado propuesto | listo para revisión / bloqueado / devuelto-corregido |

## Qué se hizo

_(3–8 líneas, en pasado y en indicativo: hechos, no intenciones. Si el WP se
desvió de lo especificado, decir dónde y por qué ANTES de nada más.)_

## Archivos tocados

_(lista con una línea por archivo: creado/modificado/borrado + para qué)_

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- Comandos ejecutados y su salida relevante (tests, e2e, lint, gates):

```
(pegar aquí)
```

- Si el WP tiene efecto visible (vistas, demo): qué se levantó y qué se vio
  (captura o descripción honesta; `⏳ sin verificar` si nadie lo miró).

## Demolición

_(qué se borró; para cada símbolo/paquete borrado, el grep que demuestra cero
referencias vivas)_

```
(pegar grep)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [ ] Puertos/URLs/rutas/rooms hardcodeados: …
- [ ] Cadenas if/switch que debieron ser tabla: …
- [ ] Duplicación con otros paquetes (busqué antes de responder): …
- [ ] console.log / código comentado / TODO sin backlog: …
- [ ] Nombres fuera de glosario o de transición: …
- [ ] Demolición completa (grep arriba): …
- [ ] Tests prueban comportamiento, no solo «no explota»: …
- [ ] Arranque real verificado (qué levanté y miré): …
- [ ] README/specs del paquete siguen siendo verdad: …
- [ ] El diff contiene solo el alcance del WP: …

## Hallazgos fuera de alcance

_(bugs ajenos, código muerto, ideas — candidatos a WP; NO se arreglaron aquí)_

## Dudas / bloqueos

_(preguntas concretas al orquestador; si el WP quedó bloqueado, por qué)_

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
