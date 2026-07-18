# Changesets (WP-U53)

Cada WP que toque un paquete **publicable** (`packages/engine/*` sin
`private: true`) debe añadir un changeset:

```bash
npx changeset
```

Elige el bump (`patch` / `minor` / `major`) y una nota de changelog.
Commits convencionales (PRACTICAS §6) siguen siendo obligatorios; el
changeset es la declaración de release.

En `main`, el workflow `.github/workflows/release.yml` consume los
changesets pendientes: bump por paquete → changelog → `npm publish` al
registry propio (si hay `NPM_USERNAME` + `NPM_PASSWORD` / `_password`) →
tag + GitHub Release.

Verificación local sin publish:

```bash
npm run release:changeset-dry
```

Los juegos (`packages/games/**`) y el mesh/editor siguen `private` y no
se publican desde este pipeline.
