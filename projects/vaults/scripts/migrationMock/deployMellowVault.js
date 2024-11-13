const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

async function main() {
    const [deployer] = await ethers.getSigners();

    this.MellowVaultFactory = await ethers.getContractFactory("MockMellowVault");
    this.DepositWrapper = await ethers.getContractFactory("DepositWrapper");

    let mv = await this.MellowVaultFactory.deploy("MellowVault", "MV", await deployer.getAddress()); await mv.waitForDeployment();
    let dp = await this.DepositWrapper.deploy(await mv.getAddress(), "0x6Cc9397c3B38739daCbfaA68EaD5F5D77Ba5F455", "0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034", "0x8d09a4502Cc8Cf1547aD300E066060D043f6982D"); await dp.waitForDeployment();

    console.log(await mv.getAddress());
    console.log(await dp.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
