const { ethers, upgrades } = require("hardhat");

const InstETHAddress = "0x7FA768E035F956c41d6aeaa3Bd857e7E5141CAd5",
  InrETHAddress = "0x80d69e79258FE9D056c822461c4eb0B4ca8802E2";

async function main() {
  // IstETH
  await upgradeInceptionToken(InstETHAddress);

  // InrETH
  await upgradeInceptionToken(InrETHAddress);
}

const upgradeInceptionToken = async (address) => {
  const [deployer] = await ethers.getSigners();
  console.log("Address of the Contract to be upgraded:", address);
  console.log("Upgrading with the account:", deployer.address);

  const iTokenFactory = await hre.ethers.getContractFactory("InceptionToken");
  const tx = await upgrades.upgradeProxy(address, iTokenFactory);
  await tx.waitForDeployment();
  console.log(`InceptionToken(${address}) was upgraded`);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
