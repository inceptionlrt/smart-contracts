// deplot proxy
const { ethers, upgrades } = require("hardhat");
const { BatchBuilder } = require("./gnosis-safe/gnosis-safe");

const L1_ADAPTER_ADDRESS = "0x53207e057E8cc72312F6981a889FC286fAFa59Dc";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  const adapterFactory = await hre.ethers.getContractFactory("LZCrossChainAdapterL1");
  const impl = await upgrades.prepareUpgrade(L1_ADAPTER_ADDRESS, adapterFactory);
  console.log(`New Impl of LZCrossChainAdapterL1(${impl}) was deployed`);

  const proxyAdmin = await upgrades.erc1967.getAdminAddress(L1_ADAPTER_ADDRESS);
  const provider = await deployer.provider.getNetwork();
  new BatchBuilder("", `LZDelegate_${L1_ADAPTER_ADDRESS}`, "added LZ delegate setting", provider).addOzUpgrade(proxyAdmin, L1_ADAPTER_ADDRESS, impl).save();
  console.log("LZCrossChainAdapterL1 upgrade ready");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

