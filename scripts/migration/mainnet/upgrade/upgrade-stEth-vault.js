const { ethers, upgrades } = require("hardhat");
const { BatchBuilder } = require("../../gnosis-safe/gnosis-safe");

const InstETHAddress = "0x814cc6b8fd2555845541fb843f37418b05977d8d";

async function main() {
  await upgradeInceptionVault("m2_migration", InstETHAddress);
}

const upgradeInceptionVault = async (upgradeName, address) => {
  const [deployer] = await ethers.getSigners();
  console.log("Address of the Contract to be upgraded:", address);
  console.log("Upgrading with the account:", deployer.address);

  const iVaultFactory = await hre.ethers.getContractFactory("InVault_E2");
  const impl = await upgrades.prepareUpgrade(address, iVaultFactory);
  console.log(`New Impl of InceptionVault(${impl}) was deployed`);

  const proxyAdmin = await upgrades.erc1967.getAdminAddress(address);
  const provider = await deployer.provider.getNetwork();
  new BatchBuilder("", `${upgradeName}_${address}`, "added pausable functions", provider).addOzUpgrade(proxyAdmin, address, impl).save();
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
