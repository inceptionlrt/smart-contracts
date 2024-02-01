const { ethers, upgrades } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { readJsonFiles, getVaultImplAndStrategyAddress } = require("../../../utils");

const notScheduled = [
  "0xC0660932C5dCaD4A1409b7975d147203B1e9A2B6",
  "0xA9F8c770661BeE8DF2D026edB1Cb6FF763C780FF",
  "0x4878F636A9Aa314B776Ac51A25021C44CAF86bEd",
  "0xfE715358368416E01d3A961D3a037b7359735d5e",
  "0x36B429439AB227fAB170A4dFb3321741c8815e55",
];

async function main() {
  // get all current vaults
  vaults = await readJsonFiles("./scripts/migration/addresses");
  for (const [vaultName, vaultData] of vaults) {
    const vaultAddress = vaultData.iVaultAddress;
    if (!notScheduled.includes(vaultAddress)) {
      continue;
    }
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
  const receipt = await res.wait();
  console.log(`SHEDULED TX for ${vaultAddress}: ${receipt}`);
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
