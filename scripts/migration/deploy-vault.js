const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

const RESTAKER_ADDRESS = "";

const deployVault = async (addresses, vaultName, tokenName, tokenSymbol) => {
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying ${vaultName} with the account: ${deployer.address}`);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  console.log(`InceptionRestaker address: ${RESTAKER_ADDRESS}`);

  // 1. Inception token
  const iTokenFactory = await hre.ethers.getContractFactory("InceptionToken");
  const iToken = await upgrades.deployProxy(iTokenFactory, [tokenName, tokenSymbol], { kind: "transparent" });
  await iToken.waitForDeployment();
  const iTokenAddress = await iToken.getAddress();
  console.log(`InceptionToken address: ${iTokenAddress}`);

  const iTokenImplAddress = await upgrades.erc1967.getImplementationAddress(iTokenAddress);

  let strategyAddress;
  let vaultFactory = "InVault_E1";
  switch (vaultName) {
    case "InstEthVault":
      vaultFactory = "InVault_E2";
      strategyAddress = addresses.LidoStrategy;
      break;
    case "InrEthVault":
      vaultFactory = "InVault_E2";
      strategyAddress = addresses.RocketStrategy;
      break;
    case "InosEthVault":
      strategyAddress = addresses.StakewiseStrategy;
      break;
    case "InoEthVault":
      strategyAddress = addresses.OriginStrategy;
      break;
    case "InankrEthVault":
      strategyAddress = addresses.AnkrStrategy;
      break;
    case "InwbEthVault":
      strategyAddress = addresses.BinanceStrategy;
      break;
    case "IncbEthVault":
      strategyAddress = addresses.CoinbaseStrategy;
      break;
    case "InswEthVault":
      strategyAddress = addresses.SwellStrategy;
      break;
    case "InEthxVault":
      strategyAddress = addresses.StaderStrategy;
      break;
    case "InsfrxEthVault":
      strategyAddress = addresses.FraxStrategy;
      break;
    case "InmEthVault":
      strategyAddress = addresses.MantleStrategy;
      break;
    case "InlsEthVault":
      strategyAddress = addresses.LiquidStrategy;
      break;
  }

  // 2. Inception vault
  const InceptionVaultFactory = await hre.ethers.getContractFactory(vaultFactory);
  const iVault = await upgrades.deployProxy(
    InceptionVaultFactory,
    [vaultName, addresses.Operator, addresses.StrategyManager, iTokenAddress, strategyAddress],
    { kind: "transparent" }
  );
  await iVault.waitForDeployment();
  const iVaultAddress = await iVault.getAddress();
  console.log(`InceptionVault address: ${iVaultAddress}`);
  const iVaultImplAddress = await upgrades.erc1967.getImplementationAddress(iVaultAddress);

  // 3. set the vault
  tx = await iToken.setVault(iVaultAddress);
  await tx.wait();

  // 4. set the delegation Manager
  tx = await iVault.setDelegationManager(addresses.DelegationManager);
  await tx.wait();

  // 5. set the IRestaker Impl
  tx = await iVault.upgradeTo(RESTAKER_ADDRESS);
  await tx.wait();

  // 6. add Ankr Operator
  tx = await iVault.addELOperator(addresses.AnkrOperator);
  await tx.wait();

  const fininalBalance = await deployer.provider.getBalance(deployer.address);
  console.log(`deployed spent: ${initBalance - fininalBalance}`);

  // 4. save addresses localy
  const iAddresses = {
    iVaultAddress: iVaultAddress,
    iVaultImpl: iVaultImplAddress,
    iTokenAddress: iTokenAddress,
    iTokenImpl: iTokenImplAddress,
    RestakerImpl: RESTAKER_ADDRESS,
  };

  const json_addresses = JSON.stringify(iAddresses);
  fs.writeFileSync(`./scripts/migration/addresses/${network.name}_${vaultName}.json`, json_addresses);
};

module.exports = {
  deployVault,
};
