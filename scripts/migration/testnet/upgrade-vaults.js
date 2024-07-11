// deplot proxy
const { ethers, upgrades } = require("hardhat");

const IVAULT_ADDRESS = "0x838a7fe80f1AF808Bc5ad0f9B1AC6e26B2475E17",
  treasuryAddress = "0xbdeea0b9d96b2d1a5c78c2562413073243d151a8",
  ratioFeedAddress = "0x90D5a4860e087462F8eE15B52D9b1914BdC977B5";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  /**********************************
   *********** DEPLOYMENT ***********
   **********************************/

  /// 1. InceptionLibrary

  const libFactory = await ethers.getContractFactory("InceptionLibrary");
  const lib = await libFactory.deploy();
  await lib.waitForDeployment();
  const libAddress = await lib.getAddress();
  console.log("InceptionLibrary deployed to:", libAddress);

  /// 2. InceptionVault

  const InceptionVaultFactory = await ethers.getContractFactory("InVault_E2", {
    libraries: {
      InceptionLibrary: "0x3022ad4552b5fb285F36C71Bdd1545c33a4937ca",
    },
  });

  await upgrades.upgradeProxy(IVAULT_ADDRESS, InceptionVaultFactory, {
    kind: "transparent",
    unsafeAllowLinkedLibraries: true,
    unsafeSkipStorageCheck: true,
  });
  console.log("InceptionVault upgraded");

  /********************************
   *********** SETTINGS ***********
   ********************************/

  const vault = InceptionVaultFactory.attach(IVAULT_ADDRESS);

  /// 1. ratioFeed address
  tx = await vault.setRatioFeed(ratioFeedAddress);
  await tx.wait();

  /// 2. treasury address
  tx = await vault.setTreasuryAddress(treasuryAddress);
  await tx.wait();

  /// 3. Flash Withdraw Params

  const newMaxFlashFeeRate = "300000000",
    newOptimalWithdrawalRate = "50000000",
    newWithdrawUtilizationKink = "2500000000";

  tx = await vault.setFlashWithdrawFeeParams(newMaxFlashFeeRate, newOptimalWithdrawalRate, newWithdrawUtilizationKink);
  await tx.wait();

  /// 1 ETH
  const targetCapacity = "1000000000000000000";
  tx = await vault.setTargetFlashCapacity(targetCapacity);
  await tx.wait();

  const protocolFee = "5000000000";
  tx = await vault.setProtocolFee(protocolFee);
  await tx.wait();

  /// 4. deposit bonus params

  const newMaxBonusRate = "150000000",
    newOptimalBonusRate = "25000000",
    newDepositUtilizationKink = "2500000000";

  tx = await vault.setDepositBonusParams(newMaxBonusRate, newOptimalBonusRate, newDepositUtilizationKink);
  await tx.wait();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
