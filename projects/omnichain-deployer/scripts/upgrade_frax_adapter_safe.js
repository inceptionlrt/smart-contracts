// deplot proxy
const { ethers, upgrades } = require("hardhat");
const { BatchBuilder } = require("./gnosis-safe/gnosis-safe");

const ADAPTER_ADDRESS = "0x7EEd6897D9F032AbccffD2f6AAFCfb59b24BD58E";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  const adapterFactory = await hre.ethers.getContractFactory("FraxFerryLZCrossChainAdapterL2");
  const impl = await upgrades.prepareUpgrade(ADAPTER_ADDRESS, adapterFactory);
  console.log(`New Impl of FraxFeryLZCrosschainAdapterL2(${impl}) was deployed`);

  const proxyAdmin = await upgrades.erc1967.getAdminAddress(ADAPTER_ADDRESS);
  const provider = await deployer.provider.getNetwork();
  new BatchBuilder("", `LZDelegate_${ADAPTER_ADDRESS}`, "added LZ delegate setting", provider).addOzUpgrade(proxyAdmin, ADAPTER_ADDRESS, impl).save();
  console.log("Frax LZ adapter upgrade ready");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

