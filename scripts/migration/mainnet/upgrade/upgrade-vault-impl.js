const { ethers, upgrades } = require("hardhat");
const { BatchBuilder } = require("../../gnosis-safe/gnosis-safe");

const InstETHAddress = "0x814CC6B8fd2555845541FB843f37418b05977d8d",
  InrETHAddress = "0x1Aa53BC4Beb82aDf7f5EDEE9e3bBF3434aD59F12";

async function main() {
  // IstETH
  let newImlp = await getNewImplFor(InstETHAddress, "InVault_E2");
  await upgradeVaultImpl(InstETHAddress, newImlp);
  // InrETH
  newImlp = await getNewImplFor(InrETHAddress, "InVault_E2");
  await upgradeVaultImpl(InrETHAddress, newImlp);
}

const upgradeVaultImpl = async (vaultAddress, newImpl) => {
  const timelock = await ethers.getContractAt("InceptionTimeLock", "0x650bd9dee50e3ee15cbb49749ff6abcf55a8fb1e");
  const delay = await timelock.getMinDelay();
  console.log(delay);

  const proxyAdminAddress = await upgrades.erc1967.getAdminAddress(vaultAddress);
  console.log(proxyAdminAddress);
  const proxyAdmin = await ethers.getContractAt("ProxyAdminMock", proxyAdminAddress);
  const transaction = await proxyAdmin.upgradeAndCall.populateTransaction(vaultAddress, newImpl, "0x");

  const res = await timelock.schedule(transaction.to, transaction.value || "0", transaction.data, ethers.ZeroHash, ethers.ZeroHash, delay);
  await res.wait();
  console.log(res.hash);
};

const getNewImplFor = async (vaultAddress, newImpl) => {
  const impl = await upgrades.prepareUpgrade(vaultAddress, await ethers.getContractFactory(newImpl));
  console.log(`New Impl of InceptionVault(${impl}) was deployed`);
  return impl;
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
