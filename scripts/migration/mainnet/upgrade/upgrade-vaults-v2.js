const { ethers, upgrades } = require("hardhat");
const { BatchBuilder } = require("../../gnosis-safe/gnosis-safe");

// InstEthVault - "InVault_E2"
const InVault_E2 = "0x814CC6B8fd2555845541FB843f37418b05977d8d";

// InankrEthVault - "InVault_E1"
const InVault_E1 = "0x36B429439AB227fAB170A4dFb3321741c8815e55";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Upgrading with the account:", deployer.address);

  const libAddress = "0x8a6a8a7233b16d0ecaa7510bfd110464a0d69f66";
  console.log("InceptionLibrary deployed to:", libAddress);

  await upgradeInceptionVault(libAddress, "flash_withdrawal", InVault_E2, "InVault_E2");

  await upgradeInceptionVault(libAddress, "flash_withdrawal", InVault_E1, "InVault_E1");
}

const upgradeInceptionVault = async (libAddress, upgradeName, address, vaultImplContract) => {
  const iVaultFactory = await ethers.getContractFactory(vaultImplContract, {
    libraries: {
      InceptionLibrary: libAddress,
    },
  });
  const impl = await upgrades.prepareUpgrade(address, iVaultFactory, {
    kind: "transparent",
    unsafeAllowLinkedLibraries: true,
    unsafeSkipStorageCheck: true,
  });
  console.log(`New Impl of InceptionVault(${impl}) was deployed`);

  const proxyAdmin = await upgrades.erc1967.getAdminAddress(address);
  const provider = await deployer.provider.getNetwork();
  new BatchBuilder("", `${upgradeName}_${address}`, "added pausable functions", provider)
    .addOzUpgrade(proxyAdmin, address, impl)
    .save();
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
