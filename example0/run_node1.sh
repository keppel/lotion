#!/bin/sh
echo "Running node-1"
node ./app.js validator_key_1.json genesis.json 46658 46661 3001 '["localhost:46660"]'
