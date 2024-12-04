const { ethers, upgrades } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { readJsonFiles, getVaultImplAndStrategyAddress } = require("../../../utils");

async function main() {
  // get all current vaults
  vaults = await readJsonFiles("./scripts/migration/addresses");
  for (const [vaultName, vaultData] of vaults) {
    const vaultAddress = vaultData.iVaultAddress;
    console.log(`Upgdading the InceptionVault:: ${vaultName} with the address: ${vaultAddress}`);

    const [implName] = await getVaultImplAndStrategyAddress(vaultName);
    let newImpl = getNewImplFor(implName);
    if (newImpl == "") {
      console.log("something went wrong");
      return;
    }
    await upgradeVaultImpl(vaultAddress, (await newImpl).toString());
  }
}

const upgradeVaultImpl = async (vaultAddress, newImpl) => {
  const timelock = await ethers.getContractAt("InceptionTimeLock", "0x650bd9dee50e3ee15cbb49749ff6abcf55a8fb1e");
  const delay = await timelock.getMinDelay();

  const proxyAdminAddress = await upgrades.erc1967.getAdminAddress(vaultAddress);
  const proxyAdmin = await ethers.getContractAt("ProxyAdminMock", proxyAdminAddress);
  const transaction = await proxyAdmin.upgrade.populateTransaction(vaultAddress, newImpl);

  const res = await timelock.schedule(
    transaction.to,
    transaction.value || "0",
    transaction.data,
    ethers.ZeroHash,
    ethers.ZeroHash,
    delay,
  );
  await res.wait();
  console.log(`SHEDULED TX for ${vaultAddress}`);
};

const getNewImplFor = async newImpl => {
  switch (newImpl) {
    case "InVault_E2":
      return "0x99d64871c9848FDA3B3FF1eC2Fc84033401CCd5B";
    case "InVault_E1":
      return "0x99d64871c9848FDA3B3FF1eC2Fc84033401CCd5B";
  }
  return "";
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

