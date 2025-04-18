const { addresses } = require("../config-addresses");
const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

// ===================VAULT CONFIGURATION===================

const
  VaultFactory = "InVault_S_E1",
  VaultName = "inUSBDVault_S",
  TokenName = "Inception Symbiotic Restaked USBD",
  TokenSymbol = "inUSBDs",
  MellowVaults = ["0x7DD12E437C226018A374Bfa2BdAf48340B9942bC"],
  FlashCap = "500000000000000000"; // 0.5%

const Asset = "0x6bedE1c6009a78c222D9BDb7974bb67847fdB68c";
const RatioFeed = "0xFd73Be536503B5Aa80Bf99D1Fd65b1306c69B191";
const MellowV3Claimer = "0x25024a3017B8da7161d8c5DCcF768F8678fB5802";

let InceptionTokenAddr = ""; // to deploy the new one leave empty
let InceptionLibrary = "0xA2aeaf634aD12c51aAC17E656C155866ad9423b1"; // to deploy the new one leave empty
let InceptionVault = ""; // to deploy the new one leave empty
let MellowAdapter = ""; // to deploy the new one leave empty


// =========================================================

async function main() {
  // 1. deployer
  const deployer = await getDeployer();

  // 2. deploy inception token
  const iToken = await deployInceptionToken();

  // 3. deploy inception vault
  const iVault = await deployVault(iToken);

  // 4. deploy mellow adapter, map to iVault
  const mellowAdapter = await deployMellowAdapterV3(iVault);

  // 5. save deployed addresses
  await saveAddresses(deployer, iVault, iToken, mellowAdapter);
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

  console.log("================Inception Token================");
  console.log(`InceptionToken address: ${await iToken.getAddress()}`);
  console.log(`InceptionToken symbol: `, await iToken.symbol());
  console.log(`InceptionToken name: `, await iToken.name());
  console.log(`InceptionToken decimals: `, await iToken.decimals());
  console.log("==============================================");

  return iToken;
}

async function deployVault(iToken) {
  console.log("================Inception Vault================");

  let iVault;
  if (!InceptionVault) {
    // deploy library if not exists
    const inceptionLibAddress = InceptionLibrary || await deployInceptionLib();

    const InceptionVaultFactory = await hre.ethers.getContractFactory(VaultFactory, {
      libraries: { InceptionLibrary: inceptionLibAddress },
    });

    iVault = await upgrades.deployProxy(
      InceptionVaultFactory,
      [VaultName, addresses.Operator, Asset, await iToken.getAddress()],
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
  } else {
    iVault = await ethers.getContractAt(VaultFactory, InceptionVault);
  }

  console.log("InceptionVault address:", await iVault.getAddress());
  console.log("InceptionVault ratio feed address:", await iVault.ratioFeed());
  console.log("InceptionVault target flash cap:", await iVault.targetCapacity());

  console.log("==============================================");
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

async function deployMellowAdapterV3(iVault) {
  console.log("================MellowV3 Adapter================");

  const iVaultAddress = await iVault.getAddress();

  let mellowAdapter;
  if (MellowAdapter) {
    mellowAdapter = await ethers.getContractAt("InceptionMellowAdapterV3", MellowAdapter);

    let tx = await mellowAdapter.setInceptionVault(iVaultAddress);
    await tx.wait();
    console.log("MellowAdapter vault set");
  } else {
    const mellowAdapterFactory = await ethers.getContractFactory("InceptionMellowAdapterV3");
    mellowAdapter = await upgrades.deployProxy(mellowAdapterFactory, [
      MellowVaults, Asset, addresses.Operator,
    ]);

    await mellowAdapter.waitForDeployment();
    const mellowAdapterAddress = await mellowAdapter.getAddress();
    console.log(`Deployed MellowAdapterV3 address: ${mellowAdapterAddress}`);

    let tx = await mellowAdapter.setClaimer(MellowV3Claimer);
    await tx.wait();
    console.log("MellowAdapter claimer set");
  }

  let tx = await mellowAdapter.setInceptionVault(await iVault.getAddress());
  await tx.wait();
  console.log("MellowAdapter iVault set");

  tx = await iVault.addAdapter(await mellowAdapter.getAddress());
  await tx.wait();
  console.log("iVault mellowAdapter added");

  console.log("==============================================");
  return mellowAdapter;
}

async function saveAddresses(deployer, iVault, iToken, mellowAdapter) {
  const iAddresses = {
    iVaultAddress: await iVault.getAddress(),
    iVaultImpl: await upgrades.erc1967.getImplementationAddress(await iVault.getAddress()),
    iTokenAddress: await iToken.getAddress(),
    iTokenImpl: await upgrades.erc1967.getImplementationAddress(await iToken.getAddress()),
    MellowAdapterV3: await mellowAdapter.getAddress(),
    MellowAdapterV3Impl: await upgrades.erc1967.getImplementationAddress(await mellowAdapter.getAddress()),
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