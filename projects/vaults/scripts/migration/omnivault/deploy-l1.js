const { ethers, upgrades } = require("hardhat");

const UNDERLYING_ASSET = "0xffA312b35306f7076C0093DdeE93cdC07F3f9C59";

const deployMockBox = async tokenAddress => {
  const boxFactory = await ethers.getContractFactory("MockBox");
  const box = await boxFactory.deploy(tokenAddress);
  await box.waitForDeployment();

  return box.getAddress();
};

const deployVault = async (operatorAddress, strategyAddress) => {
  // 1. Inception token
  const iTokenFactory = await hre.ethers.getContractFactory("InceptionToken");
  const iToken = await upgrades.deployProxy(iTokenFactory, ["InsfrxETH", "InsfrxETH"], { kind: "transparent" });
  await iToken.waitForDeployment();
  const iTokenAddress = await iToken.getAddress();
  console.log(`InceptionToken address: ${iTokenAddress}`);

  // 2. Inception vault
  const InceptionVaultFactory = await hre.ethers.getContractFactory("InceptionVaultMock", {
    libraries: {
      InceptionLibrary: "0x3022ad4552b5fb285F36C71Bdd1545c33a4937ca",
    },
  });
  const iVault = await upgrades.deployProxy(
    InceptionVaultFactory,
    ["InceptionSfrxEthVault", operatorAddress, UNDERLYING_ASSET, iTokenAddress, strategyAddress],
    { unsafeAllowLinkedLibraries: true, kind: "transparent" },
  );
  await iVault.waitForDeployment();
  const iVaultAddress = await iVault.getAddress();
  console.log(`InceptionVault address: ${iVaultAddress}`);

  // 3. set the vault
  tx = await iToken.setVault(iVaultAddress);
  await tx.wait();

  // 6. set RatioFeed
  tx = await iVault.setRatioFeed("0x90D5a4860e087462F8eE15B52D9b1914BdC977B5");
  await tx.wait();

  return iVaultAddress;
};

async function main() {
  const [deployer] = await ethers.getSigners();

  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log(`Account(${await deployer.getAddress()}) balance: ${initBalance.toString()}`);
  /// deploy mock LockBox
  //   const lockBoxAddress = await deployMockBox(UNDERLYING_ASSET);
  //   console.log("lockBoxAddress: ", lockBoxAddress);
  //   /// deploy mock Strategy
  //   const strategyAddress = await deployMockBox(UNDERLYING_ASSET);
  //   console.log("strategyAddress : ", strategyAddress);
  //   return;

  /// deploy mock InceptionVault
  const vaultAddress = await deployVault(await deployer.getAddress(), "0xEb0b9578CDA5bcD08307744258B7D8aFAaF402c8");
  console.log(vaultAddress);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
