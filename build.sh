#!/bin/sh
# Vercel runs this before publishing the site (see vercel.json).
# It copies the app into dist/ and creates dist/config.js from the Supabase
# environment variables, so no keys need to be stored in GitHub.
# Only the public URL and anon/publishable key are used, never secret keys.
set -e

URL="${SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}"
KEY="${SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-${SUPABASE_PUBLISHABLE_KEY:-$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}}}"

if [ -z "$URL" ] || [ -z "$KEY" ]; then
  echo "Missing Supabase settings." >&2
  echo "In Vercel, connect Supabase from the Marketplace (it adds the variables for you)," >&2
  echo "or add SUPABASE_URL and SUPABASE_ANON_KEY under Settings → Environment Variables." >&2
  exit 1
fi

rm -rf dist
mkdir dist
cp index.html style.css script.js dist/
printf 'window.APP_CONFIG = {\n  supabaseUrl: "%s",\n  supabaseAnonKey: "%s",\n};\n' "$URL" "$KEY" > dist/config.js

echo "Built dist/ for Supabase project $URL"
