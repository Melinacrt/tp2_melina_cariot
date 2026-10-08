#!/usr/bin/env bash
# Checks post-ecriture. Bloquant : un check rouge interrompt (exit != 0).
set -e

echo "--- typecheck"
npm run --silent typecheck
echo "--- lint"
npm run --silent lint
echo "--- tests"
npm run --silent test:unit

echo "--- tous les checks sont verts"
