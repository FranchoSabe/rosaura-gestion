#!/usr/bin/env bash
# This script installs project dependencies for Rosaura Reservas.
# Usage: bash setup.sh

set -e

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but was not found. Please install Node.js >=18." >&2
  exit 1
fi

npm install

echo "Dependencies installed successfully."
