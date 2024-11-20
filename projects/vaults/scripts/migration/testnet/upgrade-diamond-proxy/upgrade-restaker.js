const { ethers } = require("hardhat");
const { addresses } = require("../config-addresses");

const restakers = new Map(
  Object.entries({
    "0x4267Cf4df74C5cBDC2E97F0633f2caBFe9F999F2": ["0xCbC470a32E36Cb1116Eaa70c70FCdb92860d97fC"],
    "0x838a7fe80f1AF808Bc5ad0f9B1AC6e26B2475E17": ["0x96699421cD5142238514C2d2Ed934f23556ad4A8"],
  }),
);

const INCEPTION_LIBRARY = "0x3022ad4552b5fb285F36C71Bdd1545c33a4937ca";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  /// 1. deploy a new Restaker Implementation

  const BeaconProxyPatternV2 = await ethers.getContractFactory("InceptionEigenRestaker");
  const beaconImpl = await BeaconProxyPatternV2.deploy();
  await beaconImpl.waitForDeployment();
  const newRestakeImp = await beaconImpl.getAddress();
  console.log(`-------- Restaker has been deployed at the address: ${newRestakeImp}`);

  const iVaultOldFactory = await ethers.getContractFactory("EigenSetterFacet", {
    libraries: { InceptionLibrary: INCEPTION_LIBRARY },
  });

  /// 2. upgrade the Beacon's implementation for the vaults

  try {
    for (const [vaultAddress, vaultRestakers] of restakers.entries()) {
      if (!vaultAddress || !Array.isArray(vaultRestakers)) continue;

      const iVault = await iVaultOldFactory.attach(vaultAddress);
      let tx = await iVault.upgradeTo(newRestakeImp);
      await tx.wait();
      console.log("Inception Restaker Impl has been upgraded for the vault: ", vaultAddress);
    }
  } catch (error) {
    console.error("Error processing restakers:", error);
  }

  /// 3. set rewardsCoordinator

  console.log(
    `We're going to set rewardsCoordinator(${addresses.RewardsCoordinator}) for all previously deployed Restakers`,
  );

  try {
    for (const [vaultAddress, vaultRestakers] of restakers.entries()) {
      if (!vaultAddress || !Array.isArray(vaultRestakers)) continue;

      for (const restakerAddr of vaultRestakers) {
        if (!restakerAddr) continue;

        const restaker = BeaconProxyPatternV2.attach(restakerAddr);
        tx = await restaker.setRewardsCoordinator(addresses.RewardsCoordinator);
        await tx.wait();
        console.log(
          `Restaker(${await restaker.getAddress()}) for ${vaultAddress} was updated with the RewardsCoordinator:`,
        );
      }
    }
  } catch (error) {
    console.error("Error processing restakers:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

