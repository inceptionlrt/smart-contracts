const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    let VaultSFactory = await ethers.getContractFactory("InVault_S_E2",
        {
            libraries: {
              InceptionLibrary: "0xF6940A8e7334Ab2a7781AF6f9E5aeD8EFB55116A"
            },
          }
    );
    let MRestakerFactory = await ethers.getContractFactory("IMellowRestaker");


    let vault = await VaultSFactory.deploy(); await vault.waitForDeployment();
    let restaker = await MRestakerFactory.deploy(); await restaker.waitForDeployment();

    console.log(await vault.getAddress());
    console.log(await restaker.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
