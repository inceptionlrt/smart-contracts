#!/bin/bash
SOLIDITY_CONTRACTS="./contracts"

contracts=$(find $SOLIDITY_CONTRACTS -name "*.sol")
pwd 
for contract in $contracts
do
  solc --optimize --abi --bin --base-path . --include-path ./node_modules/ -o $SOLIDITY_CONTRACTS/build --overwrite $contract
  pkg="${contract%.*}"
  lowercase=$(echo "$pkg" | awk '{print $0}' )

  go run ./wrap.go $SOLIDITY_CONTRACTS/build/"${lowercase##*/}".abi $SOLIDITY_CONTRACTS/build/"${lowercase##*/}".bin contract "${lowercase##*/}"
done;
