#!/bin/bash
set -e

# Install Node dependencies
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

# Provide default environment file if needed
if [ ! -f .env.local ] && [ -f .env.local.example ]; then
  cp .env.local.example .env.local
fi
