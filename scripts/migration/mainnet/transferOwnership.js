const { ethers, upgrades } = require("hardhat");

const transferOwnwership = async (_signer, contractAddress, newAdmin) => {
  console.log(contractAddress, newAdmin);
  await upgrades.admin.transferProxyAdminOwnership(contractAddress, newAdmin);
  console.log(`ProxyAdmin ownership of ${contractAddress} transferred to ${newAdmin}`);
};

const newOwnerAddress = "",
  InstEthVaultAddress = "",
  InrEthVaultAddress = "";

async function main() {
  const [deployer] = await ethers.getSigners();
  // InstEthVault
  await transferOwnwership(InstEthVaultAddress, newOwnerAddress);
  // InrEthVault
  await transferOwnwership(deployer, InrEthVaultAddress, newOwnerAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
