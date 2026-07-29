#!/usr/bin/env bash
set -euo pipefail

source_dir="/mnt/e/Websites/Luca 4"
deploy_dir="$(mktemp -d /tmp/luca4-deploy-XXXXXX)"

tar \
  --directory="$source_dir" \
  --exclude=.git \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.open-next \
  --exclude=output \
  --exclude='*.log' \
  --create \
  --file=- \
  . | tar --directory="$deploy_dir" --extract --file=-

cd "$deploy_dir"
npm ci
npx opennextjs-cloudflare build
tar --directory="$deploy_dir" --create --file="$source_dir/output/open-next-linux-current.tar" .open-next

XDG_CONFIG_HOME="/mnt/c/Users/NSome/AppData/Roaming/xdg.config" \
  npx wrangler deploy --name luca-pisanu-worker --keep-vars

printf 'Linux OpenNext bundle deployed from %s\n' "$deploy_dir"
