#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Override to exercise the floor declared in package.json#engines, e.g.
#   NODE_BIN="$(nix build --no-link --print-out-paths nixpkgs#nodejs_22)/bin/node"
node_bin="${NODE_BIN:-node}"
temp_dir="$(mktemp -d)"
trap 'rm -rf "$temp_dir"' EXIT

package_path="$(pnpm pack --pack-destination "$temp_dir" | tail -n 1)"
effect_peer_range="$(
  node -p 'JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8")).peerDependencies.effect' \
    "$repo_root/package.json"
)"

cp "$repo_root/test/consumer/static.ts" "$temp_dir/static.ts"
cp "$repo_root/test/consumer/live.ts" "$temp_dir/live.ts"

cat >"$temp_dir/package.json" <<EOF
{
  "private": true,
  "type": "module",
  "dependencies": {
    "effect": "$effect_peer_range",
    "webuntis-api": "file:$package_path"
  }
}
EOF

# The published types have to survive more than one consumer setup, so compile
# them under both module-resolution modes and under the strictest options a
# consumer is likely to have on.
write_tsconfig() {
  cat >"$temp_dir/tsconfig.json" <<EOF
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "$1",
    "moduleResolution": "$2",
    "lib": ["ES2022", "DOM", "ESNext.Disposable"],
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": false,
    "outDir": "out"
  },
  "include": ["static.ts", "live.ts"]
}
EOF
}

pnpm --dir "$temp_dir" install --ignore-scripts --frozen-lockfile=false

echo "==> consumer: module=NodeNext moduleResolution=NodeNext"
write_tsconfig NodeNext NodeNext
pnpm exec tsc --project "$temp_dir/tsconfig.json"
"$node_bin" "$temp_dir/out/static.js"

echo "==> consumer: module=Preserve moduleResolution=bundler"
write_tsconfig Preserve bundler
pnpm exec tsc --project "$temp_dir/tsconfig.json" --noEmit

if [ "${1:-}" = "--live" ]; then
  echo "==> consumer: live smoke"
  "$node_bin" "$temp_dir/out/live.js"
fi

echo "==> packed consumer checks passed on $("$node_bin" --version)"
