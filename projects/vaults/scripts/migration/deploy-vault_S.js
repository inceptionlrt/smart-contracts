const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

const deployVault = async (addresses, vaultName, tokenName, tokenSymbol, mellowWrappers, mellowVaults, asset, trusteeManager) => {
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying ${vaultName} with the account: ${deployer.address}`);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  // 1. Inception token
  const iTokenFactory = await hre.ethers.getContractFactory("InceptionToken");
  const iToken = await upgrades.deployProxy(iTokenFactory, [tokenName, tokenSymbol], { kind: "transparent" });
  await iToken.waitForDeployment();
  const iTokenAddress = await iToken.getAddress();
  console.log(`InceptionToken address: ${iTokenAddress}`);

  const iTokenImplAddress = await upgrades.erc1967.getImplementationAddress(iTokenAddress);

  // 2. Mellow restaker
  const mellowRestakerFactory = await hre.ethers.getContractFactory("IMellowRestaker");
  const mr = await upgrades.deployProxy(mellowRestakerFactory, [mellowWrappers, mellowVaults, asset, trusteeManager], { kind: "transparent" });
  await mr.waitForDeployment();
  const mrAddress = await iToken.getAddress();
  console.log(`MellowRestaker address: ${mrAddress}`);

  const mrImpAddress = await upgrades.erc1967.getImplementationAddress(mrAddress);

  let vaultFactory = "InVault_S_E2";
  switch (vaultName) {
    case "InVault_S_E2":
      vaultFactory = "InVault_S_E2";
      break;
  }

  // 3. Inception vault
  const InceptionVaultFactory = await hre.ethers.getContractFactory(vaultFactory);
  const iVault = await upgrades.deployProxy(
    InceptionVaultFactory,
    [vaultName, addresses.Operator, asset, iTokenAddress, mrAddress],
    { kind: "transparent" }
  );
  await iVault.waitForDeployment();
  const iVaultAddress = await iVault.getAddress();
  console.log(`InceptionVault address: ${iVaultAddress}`);
  const iVaultImplAddress = await upgrades.erc1967.getImplementationAddress(iVaultAddress);

  // 4. set the vault
  tx = await iToken.setVault(iVaultAddress);
  await tx.wait();

  const fininalBalance = await deployer.provider.getBalance(deployer.address);
  console.log(`deployed spent: ${initBalance - fininalBalance}`);

  const iAddresses = {
    iVaultAddress: iVaultAddress,
    iVaultImpl: iVaultImplAddress,
    iTokenAddress: iTokenAddress,
    iTokenImpl: iTokenImplAddress,
    Restaker: mrAddress,
    RestakerImpl: mrImpAddress,
  };

  const json_addresses = JSON.stringify(iAddresses);
  fs.writeFileSync(`./scripts/migration/addresses/${network.name}_${vaultName}.json`, json_addresses);
};

module.exports = {
  deployVault,
};
