const { ethers, upgrades } = require("hardhat");

async function main() {
  [deployer] = await ethers.getSigners();
  console.log("Scheduling with the account:", deployer.address);

  const vaultAddress = "0x295234B7E370a5Db2D2447aCA83bc7448f151161";
  let newImpl = "0x13e4a6a36b61bef57f2f4b6032da945a33af144e";
  console.log(vaultAddress, newImpl);

  await upgradeVaultImpl(vaultAddress, newImpl);
}

const upgradeVaultImpl = async (vaultAddress, newImpl) => {
  const timelockAbi = [
    "function schedule(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt, uint256 delay) external",
    "function getMinDelay() public view returns (uint256)",
  ];
  const timelock = await ethers.getContractAt(timelockAbi, "0x650bd9dee50e3ee15cbb49749ff6abcf55a8fb1e");

  const delay = await timelock.getMinDelay();

  const proxyAdminAddress = await upgrades.erc1967.getAdminAddress(vaultAddress);
  console.log(`proxyAdminAddress: ${proxyAdminAddress} || delay: ${delay}`);

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
      return "0x4fbF33A215861e2BFe01C90760Ad5C58921dEF36";
    case "InVault_E1":
      return "0x6bb087367a5d2F5ac35a25AD69d97a3FBF663495";
  }
  return "";
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

