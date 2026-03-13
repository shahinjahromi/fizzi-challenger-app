#!/bin/bash
set -e

echo "=== Fizzi Challenger Bank Startup ==="

# Look for the Prisma query engine binary in known locations
BINARY_NAME="libquery_engine-debian-openssl-3.0.x.so.node"
SEARCH_DIRS="/home/site/wwwroot/node_modules /node_modules"

for DIR in $SEARCH_DIRS; do
  # Check .prisma/client (standard location)
  if [ -f "$DIR/.prisma/client/$BINARY_NAME" ]; then
    ENGINE="$DIR/.prisma/client/$BINARY_NAME"
    break
  fi
  # Check prisma/ (alternative location)
  if [ -f "$DIR/prisma/$BINARY_NAME" ]; then
    ENGINE="$DIR/prisma/$BINARY_NAME"
    break
  fi
  # Quick find in dir (max depth 4)
  ENGINE=$(find "$DIR" -maxdepth 4 -name "$BINARY_NAME" -type f 2>/dev/null | head -1)
  if [ -n "$ENGINE" ]; then
    break
  fi
done

if [ -n "$ENGINE" ]; then
  export PRISMA_QUERY_ENGINE_LIBRARY="$ENGINE"
  echo "Prisma engine found at: $ENGINE"
else
  echo "WARNING: Prisma engine binary not found! DB queries will fail."
fi

cd /home/site/wwwroot
exec node dist/index.js
