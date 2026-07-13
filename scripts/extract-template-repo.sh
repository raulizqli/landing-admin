#!/usr/bin/env bash
# Genera una carpeta lista para convertir en repo Git independiente del template.
#
# Uso:
#   ./scripts/extract-template-repo.sh [directorio_salida]
#
# Por defecto escribe en ../landing-template-repo (hermano del monorepo).
#
# Después:
#   cd ../landing-template-repo
#   cp .firebaserc.example .firebaserc   # o copia .firebaserc del hub
#   cp .env.example .env.local
#   npm install
#   npm run dev
#   git init && git add . && git commit -m "Initial standalone landing-template"

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="${1:-$(dirname "$ROOT_DIR")/landing-template-repo}"

echo "→ Origen:  $ROOT_DIR"
echo "→ Destino: $OUTPUT_DIR"

if [[ -e "$OUTPUT_DIR" ]]; then
  echo "El directorio destino ya existe. Elimínalo o pasa otra ruta."
  exit 1
fi

mkdir -p "$OUTPUT_DIR/packages"

copy_tree() {
  local src="$1"
  local dest="$2"
  mkdir -p "$dest"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a \
      --exclude 'node_modules/' \
      --exclude 'dist/' \
      --exclude '.env.local' \
      --exclude '.env.production' \
      --exclude '.firebaserc' \
      --exclude 'Untitled' \
      "$src/" "$dest/"
  else
    tar -C "$src" \
      --exclude=node_modules \
      --exclude=dist \
      --exclude=.env.local \
      --exclude=.env.production \
      --exclude=.firebaserc \
      --exclude=Untitled \
      -cf - . | tar -C "$dest" -xf -
  fi
}

echo "→ Copiando packages/landing-core y packages/landing-ui"
copy_tree "$ROOT_DIR/packages/landing-core" "$OUTPUT_DIR/packages/landing-core"
copy_tree "$ROOT_DIR/packages/landing-ui" "$OUTPUT_DIR/packages/landing-ui"

echo "→ Copiando landing-template"
copy_tree "$ROOT_DIR/landing-template" "$OUTPUT_DIR"

echo "→ Ajustando dependencias locales (file:./packages/...)"
sed -i 's|file:../packages/|file:./packages/|g' "$OUTPUT_DIR/package.json"

echo "→ Copiando workflow de CI"
mkdir -p "$OUTPUT_DIR/.github/workflows"
cp "$ROOT_DIR/landing-template/.github/workflows/deploy.yml" "$OUTPUT_DIR/.github/workflows/deploy.yml"

cat > "$OUTPUT_DIR/README-STANDALONE.md" <<'EOF'
# landing-template (repositorio independiente)

Este árbol se generó con `scripts/extract-template-repo.sh` desde el monorepo `ecosistema-landings`.

## Estructura

```
landing-template-repo/
├── packages/
│   ├── landing-core/    # @raulizqli/landing-core
│   └── landing-ui/      # @raulizqli/landing-ui
├── src/
├── firebase.json
└── package.json
```

## Desarrollo

```bash
cp .env.example .env.local
cp .firebaserc.example .firebaserc   # edita TU_PROJECT_ID
npm install
npm run dev
```

## Deploy

```bash
cp .env.production.example .env.production
# completa VITE_FIREBASE_*
npm run deploy
```

En GitHub Actions, configura el secret `FIREBASE_SERVICE_ACCOUNT` (JSON de la service account con permiso de Hosting).

## Sincronizar cambios desde el monorepo

Vuelve a ejecutar el script de extracción en una carpeta nueva y compara, o publica `@raulizqli/landing-core` y `@raulizqli/landing-ui` en npm/GitHub Packages y cámbialos en `package.json` por versión semver.
EOF

echo ""
echo "✓ Repo standalone generado en: $OUTPUT_DIR"
echo ""
echo "Siguiente:"
echo "  cd $OUTPUT_DIR"
echo "  cp .firebaserc.example .firebaserc"
echo "  cp .env.example .env.local"
echo "  npm install && npm run dev"
echo "  git init && git add . && git commit -m 'Initial standalone landing-template'"
