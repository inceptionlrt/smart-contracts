const { ethers, upgrades } = require("hardhat");

const vaults = [
  "0x814CC6B8fd2555845541FB843f37418b05977d8d",
  "0x1Aa53BC4Beb82aDf7f5EDEE9e3bBF3434aD59F12",
  "0x4878F636A9Aa314B776Ac51A25021C44CAF86bEd",
  "0xA9F8c770661BeE8DF2D026edB1Cb6FF763C780FF",
  "0x36B429439AB227fAB170A4dFb3321741c8815e55",
  "0xC0660932C5dCaD4A1409b7975d147203B1e9A2B6",
  "0x90E80E25ABDB6205B08DeBa29a87f7eb039023C2",
  "0x295234B7E370a5Db2D2447aCA83bc7448f151161",
  "0xd0ee89d82183D7Ddaef14C6b4fC0AA742F426355",
];

async function main() {
  [deployer] = await ethers.getSigners();
  console.log("Scheduling with the account:", deployer.address);
  // get all current vaults
  for (const vaultAddress of vaults) {
    console.log(`Upgdading the InceptionVault with the address: ${vaultAddress}`);

    let newImpl = "0xAA95D02E9C75804E6C7ba03fBD420A5D7F5fEA5a";
    console.log(vaultAddress, newImpl);
    await upgradeVaultImpl(vaultAddress, newImpl);
  }
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

