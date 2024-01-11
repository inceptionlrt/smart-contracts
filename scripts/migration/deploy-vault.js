const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

const deployVault = async (addresses, vaultName, tokenName, tokenSymbol) => {
  const [deployer] = await ethers.getSigners();
  let initialNonce = await ethers.provider.getTransactionCount(deployer.address);

  console.log(`Deploying ${vaultName} with the account: ${deployer.address}`);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // 1. Inception token
  const iTokenFactory = await hre.ethers.getContractFactory("InceptionToken");
  const iToken = await upgrades.deployProxy(iTokenFactory, [tokenName, tokenSymbol]);
  await iToken.deployed();

  const iTokenAddress = iToken.address;
  console.log(`InceptionToken address: ${iTokenAddress}`);
  const iTokenImplAddress = await upgrades.erc1967.getImplementationAddress(iTokenAddress);

  let strategyAddress;
  switch (vaultName) {
    case "InstEthVault":
      strategyAddress = addresses.LidoStrategy;
      break;
    case "InrEthVault":
      strategyAddress = addresses.RocketStrategy;
      break;
  }

  // 2. Inception vault
  const InceptionVaultFactory = await hre.ethers.getContractFactory(vaultName);
  iVault = await upgrades.deployProxy(InceptionVaultFactory, [
    addresses.Operator,
    addresses.StrategyManager,
    iTokenAddress,
    strategyAddress,
  ]);
  await iVault.deployed();

  const iVaultAddress = iVault.address;
  console.log(`InceptionVault address: ${iVaultAddress}`);
  const iVaultImplAddress = await upgrades.erc1967.getImplementationAddress(iVaultAddress);

  // 3. set the vault
  await iToken.setVault(iVaultAddress);

  // 4. save addresses localy
  const iAddresses = {
    iVaultAddress: iVaultAddress,
    iVaultImpl: iVaultImplAddress,
    iTokenAddress: iTokenAddress,
    iTokenImpl: iTokenImplAddress,
    initialNonce: initialNonce,
  };

  const json_addresses = JSON.stringify(iAddresses);
  fs.writeFileSync(`./scripts/migration/addresses/${network.name}_${vaultName}.json`, json_addresses);
};

module.exports = {
  deployVault,
};
