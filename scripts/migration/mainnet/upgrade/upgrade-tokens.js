const { ethers, upgrades } = require("hardhat");
const { BatchBuilder } = require("../../gnosis-safe/gnosis-safe");

const InstETHAddress = "0x7FA768E035F956c41d6aeaa3Bd857e7E5141CAd5",
  InrETHAddress = "0x80d69e79258FE9D056c822461c4eb0B4ca8802E2";

async function main() {
  // IstETH
  await upgradeInceptionToken("pausable", InstETHAddress);

  // InrETH
  await upgradeInceptionToken("pausable", InrETHAddress);
}

const upgradeInceptionToken = async (upgradeName, address) => {
  const [deployer] = await ethers.getSigners();
  console.log("Address of the Contract to be upgraded:", address);
  console.log("Upgrading with the account:", deployer.address);

  const iTokenFactory = await hre.ethers.getContractFactory("InceptionToken");
  const impl = await upgrades.prepareUpgrade(address, iTokenFactory);
  console.log(`New Impl of InceptionToken(${impl}) was deployed`);

  const proxyAdmin = await upgrades.erc1967.getAdminAddress(address);
  const provider = await deployer.provider.getNetwork();
  new BatchBuilder("", `${upgradeName}_${address}`, "added pausable functions", provider).addOzUpgrade(proxyAdmin, address, impl).save();
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
