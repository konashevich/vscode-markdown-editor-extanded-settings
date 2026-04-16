#!/usr/bin/env bash
set -euo pipefail

git pull --ff-only origin master
npm version patch

version="$(node -p "require('./package.json').version")"

perl -0pi -e "s{code --install-extension ./artifacts/markdown-editor-extended-settings-[0-9]+\.[0-9]+\.[0-9]+\.vsix}{code --install-extension ./artifacts/markdown-editor-extended-settings-${version}.vsix}" README.md

npm exec foy build
npx @vscode/vsce package --out "artifacts/markdown-editor-extended-settings-${version}.vsix"
npm run publish:marketplace
git push origin master --tags
