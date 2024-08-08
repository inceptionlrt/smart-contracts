// Package gethwrappers provides tools for wrapping solidity contracts with
// golang packages, using abigen.
package abigen

// Make sure solidity compiler artifacts are up to date. Only output stdout on failure.
//go:generate ./generation/compile_contracts.sh

// custom contract
//go:generate go run ./generation/generate/wrap.go ../../../contracts/contracts/build/KeeperRegistry.abi ../../../contracts/contracts/build/KeeperRegistry.bin KeeperRegistry keeper_registry
