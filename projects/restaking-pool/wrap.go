package main

import (
	"fmt"
	"os"
	"path/filepath"

	gethParams "github.com/ethereum/go-ethereum/params"

	"github.com/TagusLabs/genesis-smart-contracts/abigen"
)

func main() {
	abiPath := os.Args[1]
	binPath := os.Args[2]
	className := os.Args[3]
	pkgName := os.Args[4]
	fmt.Println("Generating", pkgName, "contract wrapper")

	cwd, err := os.Getwd() // abigen directory
	if err != nil {
		abigen.Exit("could not get working directory", err)
	}
	outDir := filepath.Join(cwd, "pkg/sdk", pkgName)
	if mkdErr := os.MkdirAll(outDir, 0700); err != nil {
		abigen.Exit("failed to create wrapper dir", mkdErr)
	}
	outPath := filepath.Join(outDir, pkgName+".go")

	abigen.Abigen(abigen.AbigenArgs{
		Bin: binPath, ABI: abiPath, Out: outPath, Type: className, Pkg: pkgName,
	})

	// Build succeeded, so update the versions db with the new contract data
	versions, err := abigen.ReadVersionsDB()
	if err != nil {
		abigen.Exit("could not read current versions database", err)
	}
	versions.GethVersion = gethParams.Version
	versions.ContractVersions[pkgName] = abigen.ContractVersion{
		AbiPath:    abiPath,
		BinaryPath: binPath,
	}
	if err := abigen.WriteVersionsDB(versions); err != nil {
		abigen.Exit("could not save versions db", err)
	}
}
