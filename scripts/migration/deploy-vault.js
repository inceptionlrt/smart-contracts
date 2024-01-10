const { ethers, upgrades } = require("hardhat");

const deployVault = async (addresses, vaultName, tokenName, tokenSymbol) => {
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying ${vaultName} with the account: ${deployer.address}`);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // 1. Inception token
  const iTokenFactory = await hre.ethers.getContractFactory("InceptionToken");
  const iToken = await upgrades.deployProxy(iTokenFactory, [tokenName, tokenSymbol]);
  await iToken.deployed();

  const iTokenAddress = iToken.address;
  console.log(`InceptionToken address: ${iTokenAddress}`);

  let strategyAddress;
  switch (vaultName) {
    case "InstEthVault":
      strategyAddress = addresses.LidoStrategy;
      break;
    case "InrEthVault":
      strategyAddress = addresses.RocketStrategy;
      break;
  }

  console.log("strategyAddress: ", strategyAddress);
  // 2. Inception vault
  const InceptionVaultFactory = await hre.ethers.getContractFactory(vaultName);
  iVault = await upgrades.deployProxy(InceptionVaultFactory, [deployer.address, addresses.StrategyManager, iTokenAddress, strategyAddress]);
  await iVault.deployed();

  const iVaultAddress = iVault.address;
  console.log(`InceptionVault address: ${iVaultAddress}`);

  // 3. set the vault
  await iToken.setVault(iVaultAddress);
};

module.exports = {
  deployVault,
};
