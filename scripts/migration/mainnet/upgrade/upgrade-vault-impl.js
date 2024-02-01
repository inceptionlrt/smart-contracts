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
    let newImpl = await getNewImplFor(vaultAddress, implName);
    if (newImpl == "") {
      continue;
    }
    await upgradeVaultImpl(vaultAddress, newImpl);
  }
}

const upgradeVaultImpl = async (vaultAddress, newImpl) => {
  const timelock = await ethers.getContractAt("InceptionTimeLock", "0x650bd9dee50e3ee15cbb49749ff6abcf55a8fb1e");
  const delay = await timelock.getMinDelay();

  const proxyAdminAddress = await upgrades.erc1967.getAdminAddress(vaultAddress);
  const proxyAdmin = await ethers.getContractAt("ProxyAdminMock", proxyAdminAddress);
  const transaction = await proxyAdmin.upgradeAndCall.populateTransaction(vaultAddress, newImpl, "0x");

  const res = await timelock.schedule(transaction.to, transaction.value || "0", transaction.data, ethers.ZeroHash, ethers.ZeroHash, delay);
  await res.wait();
  console.log(`SHEDULE TX for ${vaultAddress}: ${res}`);
};

const getNewImplFor = async (vaultAddress, newImpl) => {
  try {
    const impl = await upgrades.prepareUpgrade(vaultAddress, await ethers.getContractFactory(newImpl));
    console.log(`New Impl of InceptionVault(${impl}) was deployed`);
    return impl;
  } catch (err) {
    console.log("===========================================================================");
    console.error("MISSED VAULT: ", vaultAddress);
    console.log("===========================================================================");
  }
  return "";
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
