const { addresses } = require("../config-addresses");
const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

// ===================VAULT CONFIGURATION===================

const
  VaultFactory = "InVault_S_E1",
  VaultName = "inLBTCVault_S",
  TokenName = "Inception Symbiotic Restaked LBTC",
  TokenSymbol = "inBTCs",
  SymbioticVaults = ["0xdC47953c816531a8CA9E1D461AB53687d48EEA26"],
  MellowVaults = [],
  FlashCap = "500000000000000000";

const Asset = "0x8236a87084f8b84306f72007f36f2618a5634494";
const RatioFeed = "0xFd73Be536503B5Aa80Bf99D1Fd65b1306c69B191";
let InceptionTokenAddr = ""; // to deploy the new one leave empty
let InceptionLibrary = "0xA2aeaf634aD12c51aAC17E656C155866ad9423b1"; // to deploy the new one leave empty
let MellowRestakerAddr = "0xa50299e123f6d18fa64B53c5fCA1E1e08bA2251b"; // to deploy the new one leave empty
let SymbioticRestakerAddr = "0x8Fe10F5E170DE85dD0AB1b69e5Ce522a625cA137"; // to deploy the new one leave empty

// =========================================================

async function main() {
  // 1. deployer
  const deployer = await getDeployer();

  // 2. deploy inception token
  const iToken = await deployInceptionToken();

  // 3. deploy inception vault
  const iVault = await deployVault(iToken);

  // 4. deploy mellow restaker, map to iVault
  const mellowRestaker = await deployMellowRestaker(iVault);

  // 5. deploy symbiotic restaker, map to iVault
  const symbioticRestaker = await deploySymbioticRestaker(iVault);

  // 6. save deployed addresses
  await saveAddresses(deployer, iVault, iToken, mellowRestaker, symbioticRestaker);
}

async function getDeployer() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying ${VaultName} with the account: ${deployer.address}`);

  deployer.initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", deployer.initBalance.toString());

  return deployer;
}

async function deployInceptionToken() {
  let iToken;

  if (InceptionTokenAddr) {
    iToken = await ethers.getContractAt("InceptionToken", InceptionTokenAddr);
  } else {
    // deploy new inception token
    const iTokenFactory = await hre.ethers.getContractFactory("InceptionToken");
    iToken = await upgrades.deployProxy(iTokenFactory, [TokenName, TokenSymbol], { kind: "transparent" });
    await iToken.waitForDeployment();
  }

  const iTokenAddress = await iToken.getAddress();
  console.log(`InceptionToken address: ${iTokenAddress}`);
  console.log(`InceptionToken decimals: `, await iToken.decimals());

  return iToken;
}

async function deployVault(iToken) {
  // deploy library if not exists
  const inceptionLibAddress = InceptionLibrary || await deployInceptionLib();
  const mellowRestakerAddr = MellowRestakerAddr || ethers.ZeroAddress;
  const symbioticRestakerAddr = SymbioticRestakerAddr || ethers.ZeroAddress;

  const InceptionVaultFactory = await hre.ethers.getContractFactory(VaultFactory, {
    libraries: { InceptionLibrary: inceptionLibAddress },
  });

  const iVault = await upgrades.deployProxy(
    InceptionVaultFactory,
    [VaultName, addresses.Operator, Asset, await iToken.getAddress(), mellowRestakerAddr, symbioticRestakerAddr],
    {
      kind: "transparent",
      unsafeAllowLinkedLibraries: true,
      unsafeSkipStorageCheck: true,
    },
  );

  await iVault.waitForDeployment();
  const iVaultAddress = await iVault.getAddress();
  console.log(`Deployed InceptionVault address: ${iVaultAddress}`);

  // set flash cap
  let tx = await iVault.setTargetFlashCapacity(FlashCap);
  await tx.wait();
  console.log("iVault target flash capacity set");

  // set ratio feed
  tx = await iVault.setRatioFeed(RatioFeed);
  await tx.wait();
  console.log("iVault ratioFeed set");

  tx = await iToken.setVault(iVaultAddress);
  await tx.wait();
  console.log("iToken vault set");

  return iVault;
}

async function deployInceptionLib() {
  const libFactory = await ethers.getContractFactory("InceptionLibrary");
  const lib = await libFactory.deploy();
  await lib.waitForDeployment();
  const libAddress = await lib.getAddress();

  console.log("Deployed InceptionLibrary address:", libAddress);
  return libAddress;
}

async function deployMellowRestaker(iVault) {
  const iVaultAddress = await iVault.getAddress();

  if (MellowRestakerAddr) {
    const mr = await ethers.getContractAt("IMellowRestaker", MellowRestakerAddr);

    let tx = await mr.setVault(iVaultAddress);
    await tx.wait();
    console.log("MellowRestaker vault set");

    return mr;
  } else {
    const mellowRestakerFactory = await hre.ethers.getContractFactory("IMellowRestaker");
    const mr = await upgrades.deployProxy(mellowRestakerFactory,
      [MellowVaults, Asset, addresses.Operator, iVaultAddress], { kind: "transparent" },
    );

    await mr.waitForDeployment();
    const mrAddress = await mr.getAddress();
    console.log(`Deployed MellowRestaker address: ${mrAddress}`);

    let tx = await iVault.setMellowRestaker(mrAddress);
    await tx.wait();
    console.log("iVault mellow restaker set");

    return mr;
  }
}

async function deploySymbioticRestaker(iVault) {
  const iVaultAddress = await iVault.getAddress();

  if (SymbioticRestakerAddr) {
    const sr = await ethers.getContractAt("ISymbioticRestaker", SymbioticRestakerAddr);

    let tx = await sr.setVault(iVaultAddress);
    await tx.wait();
    console.log("SymbioticRestaker vault set");

    return sr;
  } else {
    const symbioticRestakerFactory = await hre.ethers.getContractFactory("ISymbioticRestaker");
    const sr = await upgrades.deployProxy(symbioticRestakerFactory,
      [SymbioticVaults, iVaultAddress, Asset, addresses.Operator], { kind: "transparent" },
    );

    await sr.waitForDeployment();
    const srAddress = await sr.getAddress();
    console.log(`Deployed SymbioticRestaker address: ${srAddress}`);

    let tx = await iVault.setSymbioticRestaker(srAddress);
    await tx.wait();
    console.log("iVault symbiotic restaker set");

    return sr;
  }
}

async function saveAddresses(deployer, iVault, iToken, mellowRestaker, symbioticRestaker) {
  const iAddresses = {
    iVaultAddress: await iVault.getAddress(),
    iVaultImpl: await upgrades.erc1967.getImplementationAddress(await iVault.getAddress()),
    iTokenAddress: await iToken.getAddress(),
    iTokenImpl: await upgrades.erc1967.getImplementationAddress(await iToken.getAddress()),
    MellowRestaker: await mellowRestaker.getAddress(),
    MellowRestakerImpl: await upgrades.erc1967.getImplementationAddress(await mellowRestaker.getAddress()),
    SymbioticRestaker: await symbioticRestaker.getAddress(),
    SymbioticRestakerImpl: await upgrades.erc1967.getImplementationAddress(await symbioticRestaker.getAddress()),
  };

  const json_addresses = JSON.stringify(iAddresses);
  fs.writeFileSync(`./scripts/migration/addresses/${network.name}_${VaultName}.json`, json_addresses);

  console.log("\n\n");
  console.log("================DEPLOYED DATA================");
  console.log(iAddresses);
  console.log("=============================================");
  console.log(`deployed spent: ${ethers.formatEther(deployer.initBalance - await deployer.provider.getBalance(deployer.address))} ETH`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });