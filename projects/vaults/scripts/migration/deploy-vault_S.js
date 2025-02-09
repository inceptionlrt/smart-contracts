const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

const deployVault = async (addresses, vaultName, tokenName, tokenSymbol, mellowWrappers, mellowVaults, asset, ratioFeed) => {
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

  // 2. Mellow adapter
  const mellowAdapterFactory = await hre.ethers.getContractFactory("IMellowAdapter");
  const mr = await upgrades.deployProxy(mellowAdapterFactory, [mellowWrappers, mellowVaults, asset, addresses.Operator], { kind: "transparent" });
  await mr.waitForDeployment();
  const mrAddress = await mr.getAddress();
  console.log(`MellowAdapter address: ${mrAddress}`);

  const mrImpAddress = await upgrades.erc1967.getImplementationAddress(mrAddress);

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
    [vaultName, addresses.Operator, asset, iTokenAddress, mrAddress],
    { kind: "transparent" , 
      unsafeAllowLinkedLibraries: true,
      unsafeSkipStorageCheck: true,
    }
  );
  await iVault.waitForDeployment();
  const iVaultAddress = await iVault.getAddress();
  console.log(`InceptionVault address: ${iVaultAddress}`);
  const iVaultImplAddress = await upgrades.erc1967.getImplementationAddress(iVaultAddress);

  const iAddresses = {
    iVaultAddress: iVaultAddress,
    iVaultImpl: iVaultImplAddress,
    iTokenAddress: iTokenAddress,
    iTokenImpl: iTokenImplAddress,
    Adapter: mrAddress,
    AdapterImpl: mrImpAddress,
  };

  const json_addresses = JSON.stringify(iAddresses);
  fs.writeFileSync(`./scripts/migration/addresses/${network.name}_${vaultName}.json`, json_addresses);

  // 4. set the vault
  tx = await iToken.setVault(iVaultAddress);
  await tx.wait();
  console.log("iToken vault set");

  tx = await mr.setVault(await iVault.getAddress());
  await tx.wait();
  console.log("adapter vault set");

  tx = await iVault.setTargetFlashCapacity("5000000000000000000"); // 5%
  await tx.wait();
  console.log("iVault target flash capacity set");

  tx = await iVault.setRatioFeed(ratioFeed);
  await tx.wait();
  console.log("iVault ratioFeed set");

  const fininalBalance = await deployer.provider.getBalance(deployer.address);
  console.log(`deployed spent: ${initBalance - fininalBalance}`);
};

module.exports = {
  deployVault,
};
