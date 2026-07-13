# Paquetes compartidos (`@raulizqli/*`)

Publicados en **GitHub Packages** del repo [`raulizqli/landing-admin`](https://github.com/raulizqli/landing-admin).

| Paquete | Descripción |
|---------|-------------|
| `@raulizqli/landing-core` | Modelo de página, normalizadores, labels, secciones (sin React) |
| `@raulizqli/landing-ui` | Componentes React de la landing |

> El scope `@raulizqli` coincide con el dueño del repositorio en GitHub (requisito de GitHub Packages).

## Desarrollo local (monorepo)

```bash
npm install   # workspaces enlazan packages/* con workspace:*
```

## Publicar en GitHub Packages

### Desde GitHub Actions (recomendado)

1. Sube un tag: `git tag packages-v0.1.0 && git push origin packages-v0.1.0`
2. O ejecuta manualmente el workflow **Publish packages to GitHub Packages** en Actions.

### Desde tu máquina

```bash
cp .npmrc.example .npmrc
# Exporta un PAT con write:packages como GITHUB_TOKEN
export GITHUB_TOKEN=ghp_...

npm run publish:packages
```

Sube la versión en `packages/landing-core/package.json` y `packages/landing-ui/package.json` antes de cada release (mantén ambas en sync).

## Instalar en otro proyecto

`.npmrc` del proyecto consumidor:

```
@raulizqli:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`package.json`:

```json
{
  "dependencies": {
    "@raulizqli/landing-core": "^0.1.0",
    "@raulizqli/landing-ui": "^0.1.0"
  }
}
```

Token: [PAT clásico](https://github.com/settings/tokens) con `read:packages` (y `repo` si el paquete es privado).

## Extraer template standalone

El script `npm run extract:template-repo` copia `packages/` localmente. Para usar solo el registry, edita el `package.json` generado:

```json
"@raulizqli/landing-core": "^0.1.0",
"@raulizqli/landing-ui": "^0.1.0"
```

y añade `.npmrc` desde `.npmrc.example`.
