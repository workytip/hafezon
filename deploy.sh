#!/bin/bash
set -e

echo "Building..."
node node_modules/vite/bin/vite.js build

echo "Deploying to gh-pages..."
rm -rf dist/.git
cd dist
touch .nojekyll
git init -q
git config user.email "workytip@gmail.com"
git config user.name "workytip"
git add -A
git commit -q -m "deploy: $(date '+%Y-%m-%d %H:%M')"
git push --force "$(git -C .. remote get-url origin)" HEAD:gh-pages
cd ..
rm -rf dist/.git

echo "Done! Site will be live in ~1 minute."
