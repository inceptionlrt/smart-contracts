const { ethers, upgrades } = require("hardhat");
const { BatchBuilder } = require("../../gnosis-safe/gnosis-safe");

// InstEthVault - "InVault_E2"
const InVault_E2 = "0x814CC6B8fd2555845541FB843f37418b05977d8d";

// InankrEthVault - "InVault_E1"
const InVault_E1 = "0x36B429439AB227fAB170A4dFb3321741c8815e55";

async function main() {
  await upgradeInceptionVault("m2_migration", InVault_E2, "InVault_E2");

  await upgradeInceptionVault("m2_migration", InVault_E1, "InVault_E1");
}

const upgradeInceptionVault = async (upgradeName, address, vaultImplContract) => {
  const [deployer] = await ethers.getSigners();
  console.log("Address of the Contract to be upgraded:", address);
  console.log("Upgrading with the account:", deployer.address);

  const iVaultFactory = await hre.ethers.getContractFactory(vaultImplContract);
  const impl = await upgrades.prepareUpgrade(address, iVaultFactory, { kind: "transparent" });
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
