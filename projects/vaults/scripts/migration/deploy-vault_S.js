const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

const deployVault = async (addresses, vaultName, tokenName, tokenSymbol, asset, ratioFeed) => {
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying ${vaultName} with the account: ${deployer.address}`);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());
  const multisig = "0x8e6C8799B542E507bfDDCA1a424867e885D96e79";

  // Load TUP code
  const artifactPath = path.join(
    __dirname,
    "../../node_modules/@openzeppelin/contracts/build/contracts/TransparentUpgradeableProxy.json"
  );

  if (!fs.existsSync(artifactPath)) {
      throw new Error("TransparentUpgradeableProxy artifact not found.");
  }
  const proxyArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const ProxyFactory = await ethers.getContractFactory(proxyArtifact.abi, proxyArtifact.bytecode, deployer); // logic/admin/data

  // 1. Inception token
  // const iTokenFactory = await hre.ethers.getContractFactory("InceptionToken");
  // const iToken = await upgrades.deployProxy(iTokenFactory, [tokenName, tokenSymbol], { kind: "transparent" });
  // await iToken.waitForDeployment();
  // const iTokenAddress = await iToken.getAddress();
  // console.log(`InceptionToken address: ${iTokenAddress}`);

  // const iTokenImplAddress = await upgrades.erc1967.getImplementationAddress(iTokenAddress); console.log(iTokenImplAddress);
  // let iface = new ethers.Interface(["function initialize(string name, string symbol)"]);
  // let token = await ProxyFactory.deploy("0xdcf8F9Db2A95e2A57E79cF9a6fCBf73d82637D91", "0x2A089327A9B17AEcb75132CF015f556F2046739c", iface.encodeFunctionData(
  //   "initialize",
  //   [
  //     tokenName, tokenSymbol
  //   ]
  // ));
  // console.log("Token: " + await token.getAddress());
  let token = await ethers.getContractAt("0xBdf1C9FfA7524A7281cA5D460f7d6F4786F4cB45", "InceptionToken");

  // 2. Mellow restaker
  // const mellowRestakerFactory = await hre.ethers.getContractFactory("IMellowRestaker");
  // const mr = await upgrades.deployProxy(mellowRestakerFactory, [[], asset, addresses.Operator, ethers.ZeroAddress], { kind: "transparent" });
  // await mr.waitForDeployment();
  // const mrAddress = await mr.getAddress();
  // console.log(`MellowRestaker address: ${mrAddress}`);

  // const mrImpAddress = await upgrades.erc1967.getImplementationAddress(mrAddress); console.log(mrImpAddress);
  // iface = new ethers.Interface(["function initialize(address[] _mellowVault, address asset, address trusteeManager,address vault)"]);
  // let mellowRestaker = await ProxyFactory.deploy("0xdd3A088D314020AF5f3C92a0681eD0B9Daa356C4", "0xAb31156bcDD9C280Bb7b0d8062EFeD26e5c725AF", iface.encodeFunctionData(
  //   "initialize",
  //   [
  //     [], asset, addresses.Operator, ethers.ZeroAddress
  //   ]
  // ));
  // console.log("MellowResatker: " + await mellowRestaker.getAddress());
  let mellowRestaker = await ethers.getContractAt("0x69Bd17DA89AcDf311246268D446E53CBA2Dc6b55", "IMellowRestaker");

  // 3. Symbiotic restaker
  // const symbioticRestakerFactory = await hre.ethers.getContractFactory("ISymbioticRestaker");
  // const sr = await upgrades.deployProxy(symbioticRestakerFactory, [[], ethers.ZeroAddress, asset, addresses.Operator], { kind: "transparent" });
  // await sr.waitForDeployment();
  // const srAddress = await sr.getAddress();
  // console.log(`SymbioticRestaker address: ${srAddress}`);

  // const srImpAddress = await upgrades.erc1967.getImplementationAddress(srAddress); console.log(srImpAddress);
  iface = new ethers.Interface(["function initialize(address[] memory vaults, address vault, address asset, address trusteeManager)"]);
  let symbioticRestaker = await ProxyFactory.deploy("0x6316De69B9E7D81A791Ece1cED621f4a1E1b8716", "0x316fA85a8EAa439a49196ce679c12F1d734122F8", iface.encodeFunctionData(
    "initialize",
    [
      ["0xEa0F2EA61998346aD39dddeF7513ae90915AFb3c"], ethers.ZeroAddress, asset, addresses.Operator
    ]
  ));
  await symbioticRestaker.waitForDeployment();
  console.log("SymbioticRestaker: " + await symbioticRestaker.getAddress());

  let vaultFactory = "InVault_S_E2";
  switch (vaultName) {
    case "InVault_S_E2":
      vaultFactory = "InVault_S_E2";
      break;
  }

//   4. Inception vault
//   const libFactory = await ethers.getContractFactory("InceptionLibrary");
//   const lib = await libFactory.deploy();
//   await lib.waitForDeployment();
//   const libAddress = await lib.getAddress();
//   console.log("InceptionLibrary address:", libAddress);

//   const InceptionVaultFactory = await hre.ethers.getContractFactory(vaultFactory, 
//     {
//     libraries: {
//       InceptionLibrary: libAddress
//     },
//   }
// );
//   const iVault = await upgrades.deployProxy(
//     InceptionVaultFactory,
//     [vaultName, addresses.Operator, asset, iTokenAddress, mrAddress, srAddress],
//     { kind: "transparent" , 
//       unsafeAllowLinkedLibraries: true,
//       unsafeSkipStorageCheck: true,
//     }
//   );
//   await iVault.waitForDeployment();
//   const iVaultAddress = await iVault.getAddress();
//   console.log(`InceptionVault address: ${iVaultAddress}`);
//   const iVaultImplAddress = await upgrades.erc1967.getImplementationAddress(iVaultAddress);console.log(iVaultImplAddress);
  let vaultv1 = await ethers.deployContract("InceptionVault_S"); await vaultv1.waitForDeployment();
  iface = new ethers.Interface(["function initialize(string vaultName, address operatorAddress, address assetAddress, address _inceptionToken, address _mellowRestaker, address _symbioticRestaker)"]);
  let vault = await ProxyFactory.deploy(await vaultv1.getAddress(), "0xC40F099e73aDB9b78a6c1AB22c520D635fFb4D53", iface.encodeFunctionData(
    "initialize",
    [
      vaultName, addresses.Operator, asset, await token.getAddress(), await mellowRestaker.getAddress(), await symbioticRestaker.getAddress()
    ]
  ));
  await vault.waitForDeployment();
  console.log("Vault: " + await vault.getAddress());
  console.log("VaultIMP:" + await vaultv1.getAddress());

  const iAddresses = {
    InceptionToken: await token.getAddress(),
    mRestaker: await mellowRestaker.getAddress(),
    sRestaker: await symbioticRestaker.getAddress(),
    iVault: await vault.getAddress()
  };

  const json_addresses = JSON.stringify(iAddresses);
  fs.writeFileSync(`./scripts/migration/addresses/${network.name}_${vaultName}.json`, json_addresses);

  // 5. Settings
  let loaded = await ethers.getContractAt("InceptionToken", await token.getAddress());
  tx = await loaded.setVault(await vault.getAddress());
  await tx.wait();
  console.log("iToken vault set");

  loaded = await ethers.getContractAt("IMellowRestaker", await mellowRestaker.getAddress());
  tx = await loaded.setVault(await vault.getAddress());
  await tx.wait();
  console.log("mrestaker vault set");

  loaded = await ethers.getContractAt("ISymbioticRestaker", await symbioticRestaker.getAddress());
  tx = await loaded.setVault(await vault.getAddress());
  await tx.wait();
  console.log("srestaker vault set");

  loaded = await ethers.getContractAt("InceptionVault_S", await vault.getAddress());
  tx = await loaded.setTargetFlashCapacity("5000000000000000000"); // 5%
  await tx.wait();
  console.log("iVault target flash capacity set");

  tx = await loaded.setRatioFeed(ratioFeed);
  await tx.wait();
  console.log("iVault ratioFeed set");

  // 6. Ownerships
  loaded = await ethers.getContractAt("InceptionToken", await token.getAddress());
  tx = await loaded.transferOwnership(multisig);
  await tx.wait();

  loaded = await ethers.getContractAt("InceptionToken", await mellowRestaker.getAddress());
  tx = await loaded.transferOwnership(multisig);
  await tx.wait();

  loaded = await ethers.getContractAt("InceptionToken", await symbioticRestaker.getAddress());
  tx = await loaded.transferOwnership(multisig);
  await tx.wait();

  loaded = await ethers.getContractAt("InceptionToken", await vault.getAddress());
  tx = await loaded.transferOwnership(multisig);
  await tx.wait();

  const fininalBalance = await deployer.provider.getBalance(deployer.address);
  console.log(`deployed spent: ${initBalance - fininalBalance}`);
};

module.exports = {
  deployVault,
};
