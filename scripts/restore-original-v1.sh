#!/usr/bin/env bash
set -euo pipefail
echo "Restoring FarmSetu original V1 (229 source files)..."
cat source_archive/part01.b64 source_archive/part02.b64 source_archive/part03.b64 source_archive/part04.b64 | base64 --decode > /tmp/farmsetu-original-v1.zip
unzip -oq /tmp/farmsetu-original-v1.zip -d .
test -f src/router.tsx && test -f src/routes/index.tsx
echo "Original FarmSetu V1 source restored."
