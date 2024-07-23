const { ethers, upgrades } = require("hardhat");
const { BatchBuilder } = require("../../gnosis-safe/gnosis-safe");

const InstETHAddress = "0x814CC6B8fd2555845541FB843f37418b05977d8d",
  InrETHAddress = "0x1Aa53BC4Beb82aDf7f5EDEE9e3bBF3434aD59F12";

async function main() {
  // IstETH
  await upgradeInceptionVault("pausable", InstETHAddress, "InstEthVault");

  // InrETH
  await upgradeInceptionVault("pausable", InrETHAddress, "InrEthVault");
}

const upgradeInceptionVault = async (upgradeName, address, vaultName) => {
  const [deployer] = await ethers.getSigners();
  console.log("Address of the Contract to be upgraded:", address);
  console.log("Upgrading with the account:", deployer.address);

  const iVaultFactory = await hre.ethers.getContractFactory(vaultName);
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
