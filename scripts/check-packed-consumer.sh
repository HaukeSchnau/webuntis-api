#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
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

cat >"$temp_dir/tsconfig.json" <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022", "DOM", "ESNext.Disposable"],
    "strict": true,
    "skipLibCheck": false,
    "outDir": "out"
  },
  "include": ["static.ts", "live.ts"]
}
EOF

pnpm --dir "$temp_dir" install --ignore-scripts --frozen-lockfile=false
pnpm exec tsc --project "$temp_dir/tsconfig.json"
node "$temp_dir/out/static.js"

if [ "${1:-}" = "--live" ]; then
  node "$temp_dir/out/live.js"
fi
