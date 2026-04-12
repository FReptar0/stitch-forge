#!/bin/bash
# Setup demo environment, run VHS, then cleanup
cd "$(dirname "$0")/.."

# Create sample files
mkdir -p screens
cp tests/fixtures/screen-html.html screens/homepage.html
cp tests/fixtures/screen-html.html screens/about.html
cp tests/fixtures/screen-html.html screens/pricing.html
cp tests/fixtures/sample-design.md DESIGN.md

cat > .guardrc.json << 'CONF'
{"defaultModel":"GEMINI_2_5_FLASH","framework":"static","screens":[{"id":"scr-001","name":"homepage","route":"/","lastSynced":"2026-04-10"},{"id":"scr-002","name":"about","route":"/about","lastSynced":"2026-04-10"},{"id":"scr-003","name":"pricing","route":"/pricing","lastSynced":"2026-04-10"}],"quota":{"flashUsed":47,"proUsed":8,"resetDate":"2026-05-01"}}
CONF

# Record
vhs scripts/demo.tape

# Cleanup
rm -f DESIGN.md .guardrc.json
rm -rf screens/
