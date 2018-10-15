#!/bin/sh
echo "Running node-0"
node ./app.js validator_key_0.json genesis.json 46657 46660 3000 '["localhost:46660"]'
