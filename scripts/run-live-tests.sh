#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
encrypted_env_file="${WEBUNTIS_LIVE_ENV_FILE:-$repo_root/secrets/webuntis-live.env}"
key_file="${SOPS_AGE_KEY_FILE:-$HOME/.config/sops/age/keys.txt}"

if ! command -v sops >/dev/null 2>&1; then
  echo "sops is required. Install it first, for example with: nix shell nixpkgs#sops nixpkgs#age" >&2
  exit 1
fi

if [ ! -f "$encrypted_env_file" ]; then
  echo "Encrypted live-test credentials not found at $encrypted_env_file" >&2
  exit 1
fi

if [ ! -f "$key_file" ]; then
  echo "No age private key found at $key_file" >&2
  echo "Set SOPS_AGE_KEY_FILE or provision ~/.config/sops/age/keys.txt before running live tests." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source <(SOPS_AGE_KEY_FILE="$key_file" sops decrypt "$encrypted_env_file")
set +a

cd "$repo_root"
bunx vitest run test/live "$@"
