const { upgrades } = require("hardhat");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const transferOwnwership = async (contractAddress, newAdmin) => {
  await upgrades.admin.transferProxyAdminOwnership(contractAddress, newAdmin);
  console.log(`ProxyAdmin ownership of ${contractAddress} transferred to ${newAdmin}`);
  await sleep(15_000);
};

const newOwnerAddress = "",
  InstEthTokenAddress = "",
  InstEthVaultAddress = "",
  InrEthTokenAddress = "",
  InrEthVaultAddress = "";

async function main() {
  // InstEthVault
  // iToken
  await transferOwnwership(InstEthTokenAddress, newOwnerAddress);
  // iVault
  await transferOwnwership(InstEthVaultAddress, newOwnerAddress);
  // InrEthVault
  // iToken
  await transferOwnwership(InrEthTokenAddress, newOwnerAddress);
  // iVault
  await transferOwnwership(InrEthVaultAddress, newOwnerAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
