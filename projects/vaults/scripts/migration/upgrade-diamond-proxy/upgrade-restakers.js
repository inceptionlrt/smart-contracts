const { ethers, network } = require("hardhat");
const { addresses } = require("../config-addresses");

async function main() {
  ///
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

  if (network.name === "mainnet") {
    await createGnosisBatch();
  } else {
    await upgradeOnTestnet();
  }

  if (network.name === "mainnet") {
    return;
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

async function createGnosisBatch() {}

async function upgradeOnTestnet(iVaultAddress) {
  try {
    for (const [vaultAddress, vaultRestakers] of restakers.entries()) {
      if (!vaultAddress || !Array.isArray(vaultRestakers)) continue;

      const iVault = await ethers.getContractAt("EigenSetterFacet", vaultAddress);
      let tx = await iVault.upgradeTo(newRestakeImp);
      await tx.wait();
      console.log("Inception Restaker Impl has been upgraded for the vault: ", vaultAddress);
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

