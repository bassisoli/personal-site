#!/bin/bash
set -e

# Load env
source /Users/christian/Claude_code/.env

# Push to git
git add -A
git commit -m "${1:-Deploy}"
git push

# Purge Cloudflare cache
echo "Purging Cloudflare cache..."
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}' | python3 -c "import sys,json; r=json.load(sys.stdin); print('Cache purged.' if r['success'] else f'Error: {r[\"errors\"]}')"
