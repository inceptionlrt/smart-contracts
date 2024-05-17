const { ethers, upgrades } = require("hardhat");
const { BatchBuilder } = require("../../gnosis-safe/gnosis-safe");

// InEthxVault - "InVault_E1"
const vaultAddress = "0x90E80E25ABDB6205B08DeBa29a87f7eb039023C2";

// // InmEthVault - "InVault_E1"
// const vaultAddress = "0xd0ee89d82183D7Ddaef14C6b4fC0AA742F426355";
// // InsfrxEthVault - "InVault_E1"
// const vaultAddress = "0x295234B7E370a5Db2D2447aCA83bc7448f151161";
// // InswEthVault - "InVault_E1"
// const vaultAddress = "0xc4181dC7BB31453C4A48689ce0CBe975e495321c";

async function main() {
  // await upgradeInceptionVault("m2_migration", vaultAddress, "InVault_E2");

  await upgradeInceptionVault("m2_migration", vaultAddress, "InVault_E1");
}

const upgradeInceptionVault = async (upgradeName, address, vaultImplContract) => {
  const [deployer] = await ethers.getSigners();
  console.log("Address of the Contract to be upgraded:", address);
  console.log("Upgrading with the account:", deployer.address);

  const iVaultFactory = await hre.ethers.getContractFactory(vaultImplContract);
  const impl = await upgrades.prepareUpgrade(address, iVaultFactory, { unsafeSkipStorageCheck: true, kind: "transparent" });
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
