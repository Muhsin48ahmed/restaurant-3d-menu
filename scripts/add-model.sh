#!/usr/bin/env bash
# Compresses a photogrammetry export and installs it as a dish's 3D model.
#
#   npm run model:add -- ~/Downloads/burger-scan.glb ember-smash-burger
#
# The slug must match a menu item (see prisma/seed-data.ts). The file lands at
# public/models/<slug>.glb and the menu picks it up on the next page load.
set -euo pipefail

MAX_TEXTURE_SIZE="2048"

if [[ $# -ne 2 ]]; then
  echo "Usage: npm run model:add -- <path/to/scan.glb> <dish-slug>" >&2
  exit 1
fi

input="$1"
slug="$2"

if [[ ! -f "$input" ]]; then
  echo "Error: '$input' not found." >&2
  exit 1
fi
if [[ ! "$slug" =~ ^[a-z0-9-]+$ ]]; then
  echo "Error: slug must be lowercase letters, numbers and dashes (e.g. ember-smash-burger)." >&2
  exit 1
fi
extension="$(echo "${input##*.}" | tr "[:upper:]" "[:lower:]")"
case "$extension" in
  glb|gltf) ;;
  *) echo "Error: export your scan as .glb (or .gltf) from Polycam / Luma first." >&2; exit 1 ;;
esac

# Absolute path, so a file named like "--flag.glb" can't be read as an option.
input="$(cd "$(dirname "$input")" && pwd)/$(basename "$input")"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
output="$script_dir/../public/models/$slug.glb"
mkdir -p "$(dirname "$output")"

echo "Optimising $input → public/models/$slug.glb"
# Welds and simplifies the mesh, resizes textures to WebP and applies meshopt
# compression (decoded in the browser by drei's useGLTF).
# Uses the version pinned in package.json (devDependency), never a registry lookup.
npx --no-install gltf-transform optimize "$input" "$output" \
  --compress meshopt \
  --texture-compress webp \
  --texture-size "$MAX_TEXTURE_SIZE"


size=$(du -h "$output" | cut -f1)
echo "Done: public/models/$slug.glb ($size). Reload /menu to see it."
