const { ethers, upgrades } = require("hardhat");

const { InstEthVault } = require("../../addresses/mainnet_InstEthVault.json");
const { InrEthVault } = require("../../addresses/mainnet_InrEthVault.json");

const InstETHAddress = InstEthVault.iTokenAddress,
  InrETHAddress = InrEthVault.iTokenAddress;

async function main() {
  // IstETH
  await upgradeInceptionToken(InstETHAddress);

  // InrETH
  await upgradeInceptionToken(InrETHAddress);
}

const upgradeInceptionToken = async (address) => {
  console.log("Address of the Contract to be upgraded:", address);
  console.log("Upgrading with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const iTokenFactory = await hre.ethers.getContractFactory("InceptionToken");
  const tx = await upgrades.upgradeProxy(address, iTokenFactory);
  await tx.wait();
  console.log("InceptionToken was upgraded");
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
