const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

const deployVault = async (addresses, vaultName, tokenName, tokenSymbol, asset, ratioFeed) => {
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying ${vaultName} with the account: ${deployer.address}`);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());
  const multisig = "0x8e6C8799B542E507bfDDCA1a424867e885D96e79";

  // 1. Inception token
  const iTokenFactory = await hre.ethers.getContractFactory("InceptionToken");
  const iToken = await upgrades.deployProxy(iTokenFactory, [tokenName, tokenSymbol], { kind: "transparent" });
  await iToken.waitForDeployment();
  const iTokenAddress = await iToken.getAddress();
  console.log(`InceptionToken address: ${iTokenAddress}`);
  const iTokenImplAddress = await upgrades.erc1967.getImplementationAddress(iTokenAddress);

  // 2. Mellow restaker
  const mellowRestakerFactory = await hre.ethers.getContractFactory("IMellowRestaker");
  const mr = await upgrades.deployProxy(mellowRestakerFactory, [[], asset, addresses.Operator, ethers.ZeroAddress], { kind: "transparent" });
  await mr.waitForDeployment();
  const mrAddress = await mr.getAddress();
  console.log(`MellowRestaker address: ${mrAddress}`);
  const mrImpAddress = await upgrades.erc1967.getImplementationAddress(mrAddress);

  // 3. Symbiotic restaker
  const symbioticRestakerFactory = await hre.ethers.getContractFactory("ISymbioticRestaker");
  const sr = await upgrades.deployProxy(symbioticRestakerFactory, [[], ethers.ZeroAddress, asset, addresses.Operator], { kind: "transparent" });
  await sr.waitForDeployment();
  const srAddress = await sr.getAddress();
  console.log(`SymbioticRestaker address: ${srAddress}`);
  const srImpAddress = await upgrades.erc1967.getImplementationAddress(srAddress);

  let vaultFactory = "InVault_S_E1";
  switch (vaultName) {
    case "inLsETHVault_S":
      vaultFactory = "InVault_S_E1";
      break;
  }

  // 4. Inception vault
  // const libFactory = await ethers.getContractFactory("InceptionLibrary");
  // const lib = await libFactory.deploy();
  // await lib.waitForDeployment();
  const libAddress = "0x313d6c1B075077Ce10b3229EE75e0Af453CB7D07";
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
    [vaultName, addresses.Operator, asset, iTokenAddress, mrAddress, srAddress],
    { kind: "transparent" , 
      unsafeAllowLinkedLibraries: true,
      unsafeSkipStorageCheck: true,
    }
  );
  await iVault.waitForDeployment();
  const iVaultAddress = await iVault.getAddress();
  console.log(`InceptionVault address: ${iVaultAddress}`);
  const iVaultImplAddress = await upgrades.erc1967.getImplementationAddress(iVaultAddress);console.log(iVaultImplAddress);

  const iAddresses = {
    iVaultAddress: iVaultAddress,
    iVaultImpl: iVaultImplAddress,
    iTokenAddress: iTokenAddress,
    iTokenImpl: iTokenImplAddress,
    mRestaker: mrAddress,
    mRestakerImpl: mrImpAddress,
    sRestaker: srAddress,
    sRestakerImpl: srImpAddress,
  };

  const json_addresses = JSON.stringify(iAddresses);
  fs.writeFileSync(`./scripts/migration/addresses/${network.name}_${vaultName}.json`, json_addresses);

  // 5. Settings
  let loaded = await ethers.getContractAt("InceptionToken", await iToken.getAddress());
  tx = await loaded.setVault(await iVault.getAddress());
  await tx.wait();
  console.log("iToken vault set");

  loaded = await ethers.getContractAt("IMellowRestaker", await mr.getAddress());
  tx = await loaded.setVault(await iVault.getAddress());
  await tx.wait();
  console.log("mrestaker vault set");

  loaded = await ethers.getContractAt("ISymbioticRestaker", await sr.getAddress());
  tx = await loaded.setVault(await iVault.getAddress());
  await tx.wait();
  console.log("srestaker vault set");

  loaded = await ethers.getContractAt("InceptionVault_S", await iVault.getAddress());
  tx = await loaded.setTargetFlashCapacity("5000000000000000000"); // 5%
  await tx.wait();
  console.log("iVault target flash capacity set");

  tx = await loaded.setRatioFeed(ratioFeed);
  await tx.wait();
  console.log("iVault ratioFeed set");

  // 6. Ownerships
  loaded = await ethers.getContractAt("InceptionToken", await iToken.getAddress());
  tx = await loaded.transferOwnership(multisig); console.log("1");
  await tx.wait();

  loaded = await ethers.getContractAt("InceptionToken", await mr.getAddress());
  tx = await loaded.transferOwnership(multisig); console.log("2");
  await tx.wait();

  loaded = await ethers.getContractAt("InceptionToken", await sr.getAddress());
  tx = await loaded.transferOwnership(multisig); console.log("3");
  await tx.wait();

  loaded = await ethers.getContractAt("InceptionToken", await iVault.getAddress());
  tx = await loaded.transferOwnership(multisig); console.log("4");
  await tx.wait();

  const fininalBalance = await deployer.provider.getBalance(deployer.address);
  console.log(`deployed spent: ${initBalance - fininalBalance}`);
};

module.exports = {
  deployVault,
};
