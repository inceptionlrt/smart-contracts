const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

const RESTAKER_ADDRESS = "0x02e2fcE3EFE6619Ad882b159E7d897A9c03a33f0";

const deployVault = async (addresses, inceptionTokenAddress, vaultName, tokenName, tokenSymbol) => {
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying ${vaultName} with the account: ${deployer.address}`);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  console.log(`InceptionRestaker address: ${RESTAKER_ADDRESS}`);

  // 1. Inception token
  const iTokenFactory = await hre.ethers.getContractFactory("InceptionToken");
  const iToken = iTokenFactory.attach(inceptionTokenAddress);
  const iTokenAddress = inceptionTokenAddress;
  console.log(`InceptionToken address: ${iTokenAddress}`);

  // const iTokenImplAddress = await upgrades.erc1967.getImplementationAddress(iTokenAddress);

  let strategyAddress, assetAddress;
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
    /// Basic Strategy Assets
    case "InEigenVault":
      vaultFactory = "InStrategyBaseVault_E1";
      assetAddress = addresses.EigenAddress;
      strategyAddress = addresses.EigenStrategy;
      break;
    case "InsFraxVault":
      vaultFactory = "InStrategyBaseVault_E1";
      assetAddress = addresses.sFraxAddress;
      strategyAddress = addresses.sFraxStrategy;
      break;
    case "InslisBnbVault":
      vaultFactory = "InStrategyBaseVault_E1";
      assetAddress = addresses.ListaAddress;
      strategyAddress = addresses.ListaStrategy;
      break;
    case "IntBtcVault":
      vaultFactory = "InStrategyBaseVault_E1";
      assetAddress = addresses.tBTCAddress;
      strategyAddress = addresses.tBTCStrategy;
      break;
  }

  // 2. Inception vault
  let iVault;
  const InceptionVaultFactory = await hre.ethers.getContractFactory(vaultFactory, {
    libraries: {
      InceptionLibrary: addresses.InceptionLibrary,
    },
  });
  if (vaultFactory === "InStrategyBaseVault_E1" || vaultFactory === "InStrategyBaseVault_E2") {
    iVault = await upgrades.deployProxy(
      InceptionVaultFactory,
      [vaultName, addresses.Operator, addresses.StrategyManager, iTokenAddress, strategyAddress, assetAddress],
      { kind: "transparent", unsafeAllowLinkedLibraries: true }
    );
  } else if (vaultFactory === "InVault_E1" || vaultFactory === "InVault_E2") {
    iVault = await upgrades.deployProxy(
      InceptionVaultFactory,
      [vaultName, addresses.Operator, addresses.StrategyManager, iTokenAddress, strategyAddress],
      { kind: "transparent", unsafeAllowLinkedLibraries: true }
    );
  } else {
    console.error("Wrong iVaultFactory: ", vaultFactory);
    return;
  }
  await iVault.deployed();
  const iVaultAddress = iVault.address;
  console.log(`InceptionVault address: ${iVaultAddress}`);

  //const iVaultImplAddress = await upgrades.erc1967.getImplementationAddress(iVaultAddress);

  // 3. set the vault
  tx = await iToken.setVault(iVaultAddress);
  await tx.wait();

  // 4. set the delegation Manager
  tx = await iVault.setDelegationManager(addresses.DelegationManager);
  await tx.wait();

  // 5. set the IRestaker Impl
  tx = await iVault.upgradeTo(RESTAKER_ADDRESS);
  await tx.wait();

  // 6. set RatioFeed
  tx = await iVault.setRatioFeed(addresses.RatioFeedAddress);
  await tx.wait();

  // 7. add an EigenLayer Operator
  tx = await iVault.addELOperator(addresses.P2POperator);
  await tx.wait();

  // 8. set Treasury
  tx = await iVault.setTreasuryAddress(addresses.TreasuryAddress);
  await tx.wait();

  // 9. transferOwnerShip
  tx = await iVault.transferOwnership(addresses.TreasuryAddress);
  await tx.wait();

  // 10. transferOwnerShip
  tx = await iToken.transferOwnership(addresses.TreasuryAddress);
  await tx.wait();

  const fininalBalance = await deployer.provider.getBalance(deployer.address);
  console.log(`deployed spent: ${initBalance - fininalBalance}`);

  // 4. save addresses localy
  const iAddresses = {
    iVaultAddress: iVaultAddress,
    //    iVaultImpl: iVaultImplAddress,
    iTokenAddress: iTokenAddress,
    //  iTokenImpl: iTokenImplAddress,
    RestakerImpl: RESTAKER_ADDRESS,
  };

  const json_addresses = JSON.stringify(iAddresses);
  fs.writeFileSync(`./scripts/migration/addresses/${network.name}_${vaultName}.json`, json_addresses);
};

module.exports = {
  deployVault,
};
