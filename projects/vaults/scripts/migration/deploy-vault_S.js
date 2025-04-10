const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

const deployVault = async (
  addresses, vaultName, tokenName, tokenSymbol,
  mellowWrappers, mellowVaults,
  symbioticVaults,
  asset, ratioFeed,
  flashCap
) => {
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

  let vaultFactory = "InVault_S_E2";
  switch (vaultName) {
    case "InVault_S_E2":
      vaultFactory = "InVault_S_E2";
      break;
  }

  // 3. Inception vault
  const libFactory = await ethers.getContractFactory("InceptionLibrary");
  const lib = await libFactory.deploy();
  await lib.waitForDeployment();
  const libAddress = await lib.getAddress();
  console.log("InceptionLibrary address:", libAddress);

  const InceptionVaultFactory = await hre.ethers.getContractFactory(vaultFactory,
    {
    libraries: {
      InceptionLibrary: libAddress
    },
  }
);
  const iVault = await upgrades.deployProxy(
    InceptionVaultFactory,
    [vaultName, addresses.Operator, asset, iTokenAddress, ethers.ZeroAddress, ethers.ZeroAddress],
    { kind: "transparent" ,
      unsafeAllowLinkedLibraries: true,
      unsafeSkipStorageCheck: true,
    }
  );

  await iVault.waitForDeployment();
  const iVaultAddress = await iVault.getAddress();
  console.log(`InceptionVault address: ${iVaultAddress}`);
  const iVaultImplAddress = await upgrades.erc1967.getImplementationAddress(iVaultAddress);

  if (mellowVaults.length > 0) {
    // 2. Mellow restaker
    const mellowRestakerFactory = await hre.ethers.getContractFactory("IMellowRestaker");
    const mr = await upgrades.deployProxy(mellowRestakerFactory, [mellowVaults, asset, addresses.Operator, iVaultAddress], { kind: "transparent" });
    await mr.waitForDeployment();
    const mrAddress = await mr.getAddress();
    console.log(`MellowRestaker address: ${mrAddress}`);
    const mrImpAddress = await upgrades.erc1967.getImplementationAddress(mrAddress);
  }

  // 2.1 Symbiotic restaker
  const symbioticRestakerFactory = await hre.ethers.getContractFactory("ISymbioticRestaker");
  const sr = await upgrades.deployProxy(symbioticRestakerFactory, [symbioticVaults, iVaultAddress, asset, addresses.Operator], { kind: "transparent" });
  await sr.waitForDeployment();
  const srAddress = await sr.getAddress();
  console.log(`SymbioticRestaker address: ${srAddress}`);
  const srImpAddress = await upgrades.erc1967.getImplementationAddress(srAddress);

  if (mellowVaults.length > 0) {
    tx = await iVault.setMellowRestaker(mrAddress);
    await tx.wait();
    console.log("mellow restaker set");
  }

  tx = await iVault.setSymbioticRestaker(srAddress);
  await tx.wait();
  console.log("symbiotic restaker set");

  const iAddresses = {
    iVaultAddress: iVaultAddress,
    iVaultImpl: iVaultImplAddress,
    iTokenAddress: iTokenAddress,
    iTokenImpl: iTokenImplAddress,
    // MellowRestaker: mrAddress,
    // MellowRestakerImpl: mrImpAddress,
    SymbioticRestaker: srAddress,
    SymbioticRestakerImpl: srImpAddress
  };

  const json_addresses = JSON.stringify(iAddresses);
  fs.writeFileSync(`./scripts/migration/addresses/${network.name}_${vaultName}.json`, json_addresses);

  // 4. set the vault
  tx = await iToken.setVault(iVaultAddress);
  await tx.wait();
  console.log("iToken vault set");

  if (mellowVaults.length > 0) {
    tx = await mr.setVault(await iVault.getAddress());
    await tx.wait();
    console.log("mellow restaker vault set");
  }

  tx = await sr.setVault(await iVault.getAddress());
  await tx.wait();
  console.log("symbiotic restaker vault set");

  tx = await iVault.setTargetFlashCapacity(flashCap); // 5%
  await tx.wait();
  console.log("iVault target flash capacity set");

  tx = await iVault.setRatioFeed(ratioFeed);
  await tx.wait();
  console.log("iVault ratioFeed set");

  const finalBalance = await deployer.provider.getBalance(deployer.address);
  console.log(`deployed spent: ${initBalance - finalBalance}`);
};

module.exports = {
  deployVault,
};