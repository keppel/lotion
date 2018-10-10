#!/bin/sh
echo "Running node-0"
node ./app.js validator_key_0.json genesis.json
node ./app.js validator_key_0.json genesis.json 46657 46660 3000 '["192.168.1.100:46660","192.168.1.101:46660","192.168.1.102:46660"]'
