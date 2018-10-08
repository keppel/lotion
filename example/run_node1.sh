#!/bin/sh
echo "Running node-1"
node ./app.js validator_key_1.json genesis.json 'localhost:46660' 46656 46661 3001
