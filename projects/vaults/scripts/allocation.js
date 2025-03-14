const { ethers, network, upgrades } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { toWei, impersonateWithEth, e18 } = require("../test/helpers/utils");

async function slashOperator() {
  const allocationManagerAddr = "0x78469728304326CBc65f8f95FA756B0B73164462";

  const ownerAddress = "0xba7cda36abeb28ad200591e6e4a963359b1f43df";
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [ownerAddress],
  });


  await impersonateWithEth(ownerAddress, toWei(1000));

  const ownerSigner = await ethers.getSigner(ownerAddress);
  const allocationManager = await ethers.getContractAt("AllocationManager", allocationManagerAddr);

  await allocationManager.connect(ownerSigner).slashOperator("0xba7cda36abeb28ad200591e6e4a963359b1f43df", [
    "0xd9322bb31f42c7caa12daad49699d655393f9524",
    0,
    ["0x7d704507b76571a51d9cae8addabbfd0ba0e63d3"],
    [1e18],
    "test",
  ]);


  // address operator;
  // uint32 operatorSetId;
  // IStrategy[] strategies;
  // uint256[] wadsToSlash;
  // string description;

}

async function main() {
  const vault = await deployVault();
  const result = await vault.getTotalDelegatedV2(100, 30, 17);
  console.log(result);

  const result2 = await vault.getTotalDelegatedV2(100, 30, 14);
  console.log(result2);

  // console.log("totalDelegated", ethers.formatEther(await vault.getTotalDelegated()));
}

async function deployVault() {
  let a = {
    assetName: "rETH",
    assetAddress: "0x7322c24752f79c05FFD1E2a6FCB97020C1C264F1",
    assetPoolName: "RocketMockPool",
    assetPool: "0x320f3aAB9405e38b955178BBe75c477dECBA0C27",
    vaultName: "InrEthVault",
    vaultFactory: "ERC4626Facet_EL_E2",
    strategyManager: "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6",
    assetStrategy: "0x3A8fBdf9e77DFc25d09741f51d3E181b25d0c4E0",
    iVaultOperator: "0xa4341b5Cf43afD2993e1ae47d956F44A2d6Fc08D",
    delegationManager: "0xA44151489861Fe9e3055d95adC98FbD462B948e7",
    rewardsCoordinator: "0xAcc1fb458a1317E886dB376Fc8141540537E68fE",
    withdrawalDelayBlocks: 400,
    ratioErr: 2n,
    transactErr: 5n
  };

  // 1. Inception token
  const iTokenFactory = await ethers.getContractFactory("InceptionToken");
  const iToken = await upgrades.deployProxy(iTokenFactory, ["TEST InceptionLRT Token", "tINt"]);
  iToken.address = await iToken.getAddress();

  // 6. Inception library
  const iLibrary = await ethers.deployContract("InceptionLibrary");
  await iLibrary.waitForDeployment();

  // 7. Inception vault
  const iVaultFactory = await ethers.getContractFactory("InceptionVault_EL", {
    libraries: { InceptionLibrary: await iLibrary.getAddress() },
  });

  const iVault = await upgrades.deployProxy(
    iVaultFactory,
    [a.vaultName, a.iVaultOperator, a.strategyManager, iToken.address, a.assetStrategy],
    { unsafeAllowLinkedLibraries: true },
  );
  iVault.address = await iVault.getAddress();

  console.log("iVault address", iVault.address);

  return iVault;
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });