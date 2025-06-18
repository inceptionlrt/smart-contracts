// Tests for InceptionVault_S contract;
// The S in name does not mean only Symbiotic; this file contains tests for Symbiotic and Mellow adapters

import { expect } from "chai";
import hardhat from "hardhat";
import { stETH } from "../../data/assets/inception-vault-s";
import { vaults } from "../../data/vaults";
import { adapters, emptyBytes } from "../../src/constants";
import { initVault, abi } from "../../src/init-vault";
import { calculateRatio, toWei } from "../../helpers/utils";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { ZeroAddress } from "ethers";

const { ethers, network } = hardhat;

const symbioticVaults = vaults.symbiotic;
const mellowVaults = vaults.mellow;
const assetData = stETH;
describe(`Inception Symbiotic Vault ${assetData.assetName}`, function() {
  let iToken, iVault, mellowAdapter, symbioticAdapter, withdrawalQueue;
  let iVaultOperator, staker, staker2, staker3;
  let snapshot;

  before(async function() {
    if (process.env.ASSETS) {
      const assets = process.env.ASSETS.toLocaleLowerCase().split(",");
      if (!assets.includes(assetData.assetName.toLowerCase())) {
        console.log(`${assetData.assetName} is not in the list, going to skip`);
        this.skip();
      }
    }

    await network.provider.send("hardhat_reset", [
      {
        forking: {
          jsonRpcUrl: network.config.forking.url,
          blockNumber: assetData.blockNumber ? assetData.blockNumber : network.config.forking.blockNumber,
        },
      },
    ]);

    ({ iToken, iVault, iVaultOperator, mellowAdapter, symbioticAdapter, withdrawalQueue }
      = await initVault(assetData, { adapters: [adapters.Mellow, adapters.Symbiotic] }));

    [, staker, staker2, staker3] = await ethers.getSigners();

    staker = await assetData.impersonateStaker(staker, iVault);
    staker2 = await assetData.impersonateStaker(staker2, iVault);
    staker3 = await assetData.impersonateStaker(staker3, iVault);

    snapshot = await helpers.takeSnapshot();
  });

  after(async function() {
    await iVault?.removeAllListeners();
  });

  describe("AdapterHandler negative cases", function() {
    it("null adapter delegation", async function() {
      await expect(
        iVault
          .connect(iVaultOperator)
          .delegate("0x0000000000000000000000000000000000000000", symbioticVaults[0].vaultAddress, 0, emptyBytes),
      ).to.be.revertedWithCustomError(iVault, "NullParams");
    });

    it("adapter not exists", async function() {
      await expect(
        iVault.connect(iVaultOperator).delegate(staker.address, symbioticVaults[0].vaultAddress, 0, emptyBytes),
      ).to.be.revertedWithCustomError(iVault, "AdapterNotFound");
    });

    it("undelegate input args", async function() {
      await expect(
        iVault
          .connect(iVaultOperator)
          .undelegate(await withdrawalQueue.currentEpoch(),
            [
              ["0x0000000000000000000000000000000000000000", mellowVaults[0].vaultAddress, 1n, emptyBytes],
            ],
          ),
      ).to.be.revertedWithCustomError(iVault, "AdapterNotFound");

      await expect(
        iVault
          .connect(iVaultOperator)
          .undelegate(await withdrawalQueue.currentEpoch(), [[await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, 0n, emptyBytes]]),
      ).to.be.revertedWithCustomError(iVault, "ValueZero");
    });

    it("undelegateVault input args", async function() {
      await expect(
        iVault
          .connect(iVaultOperator)
          .emergencyUndelegate([[staker.address, mellowVaults[0].vaultAddress, 1n, []]]),
      ).to.be.revertedWithCustomError(iVault, "AdapterNotFound");

      await expect(
        iVault.connect(iVaultOperator)
          .emergencyUndelegate([[mellowAdapter.address, "0x0000000000000000000000000000000000000000", 1n, []]]),
      ).to.be.revertedWithCustomError(iVault, "InvalidAddress");

      await expect(
        iVault
          .connect(iVaultOperator)
          .emergencyUndelegate([[mellowAdapter.address, mellowVaults[0].vaultAddress, 0n, []]]),
      ).to.be.revertedWithCustomError(iVault, "ValueZero");

      await expect(
        iVault
          .connect(staker)
          .emergencyUndelegate([[mellowAdapter.address, mellowVaults[0].vaultAddress, 0n, []]]),
      ).to.be.revertedWithCustomError(iVault, "OnlyOperatorAllowed");
    });

    it("claim input args", async function() {
      await expect(
        iVault.connect(staker).claim(0, [mellowAdapter.address], [mellowVaults[0].vaultAddress], [emptyBytes]),
      ).to.be.revertedWithCustomError(iVault, "OnlyOperatorAllowed");

      await expect(
        iVault.connect(iVaultOperator).claim(0, [staker.address], [mellowVaults[0].vaultAddress], [emptyBytes]),
      ).to.be.revertedWithCustomError(iVault, "AdapterNotFound");

      await expect(iVault.connect(iVaultOperator).claim(0, [], [], []))
        .to.be.revertedWithCustomError(iVault, "ValueZero");
    });

    it("addAdapter input args", async function() {
      await expect(iVault.addAdapter(ethers.Wallet.createRandom().address))
        .to.be.revertedWithCustomError(iVault, "NotContract");

      await expect(iVault.addAdapter(mellowAdapter.address)).to.be.revertedWithCustomError(
        iVault,
        "AdapterAlreadyAdded",
      );

      await expect(iVault.connect(iVaultOperator).addAdapter(mellowAdapter.address)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("removeAdapter input args", async function() {
      await expect(iVault.removeAdapter(iToken.address, false))
        .to.be.revertedWithCustomError(iVault, "AdapterNotFound");

      await expect(iVault.connect(staker)
        .removeAdapter(mellowAdapter.address, false),
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await iVault.removeAdapter(mellowAdapter.address, false);
    });

    it("emergencyClaim input args", async function() {
      await expect(iVault.connect(staker).emergencyClaim([], [], []))
        .to.be.revertedWithCustomError(iVault, "OnlyOperatorAllowed");

      await iVault.pause();
      await expect(iVault.connect(iVaultOperator).emergencyClaim([], [], []))
        .to.be.revertedWith("Pausable: paused");
      await iVault.unpause();

      await expect(iVault.connect(iVaultOperator).emergencyClaim([], [], []))
        .to.be.revertedWithCustomError(iVault, "ValueZero");
    });

    it("unavailable to set empty inception vault", async function() {
      await expect(mellowAdapter.setInceptionVault(ZeroAddress))
        .to.be.revertedWithCustomError(mellowAdapter, "NotContract");

      await expect(symbioticAdapter.setInceptionVault(ZeroAddress))
        .to.be.revertedWithCustomError(symbioticAdapter, "NotContract");
    });
  });

  describe("SymbioticAdapter input args", function() {
    it("withdraw input args", async function() {
      await expect(
        iVault
          .connect(iVaultOperator)
          .undelegate(await withdrawalQueue.currentEpoch(), [[await symbioticAdapter.getAddress(), staker.address, 1n, emptyBytes]]),
      ).to.be.revertedWithCustomError(symbioticAdapter, "InvalidVault");

      await expect(symbioticAdapter.connect(staker).withdraw(ZeroAddress, 0n, [], false))
        .to.be.revertedWithCustomError(symbioticAdapter, "NotVaultOrTrusteeManager");

      await expect(symbioticAdapter.setClaimerImplementation(ZeroAddress));
      await expect(symbioticAdapter.connect(iVaultOperator).withdraw(symbioticVaults[0].vaultAddress, 1n, [], false))
        .to.be.revertedWithCustomError(symbioticAdapter, "ClaimerImplementationNotSet");
      await snapshot.restore();
    });

    it("claim input args", async function() {
      await expect(symbioticAdapter.connect(staker).claim(["0x", "0x"], false))
        .to.be.revertedWithCustomError(symbioticAdapter, "NotVaultOrTrusteeManager");

      await expect(symbioticAdapter.connect(iVaultOperator).claim(["0x", "0x"], false))
        .to.be.revertedWithCustomError(symbioticAdapter, "InvalidDataLength");

      await expect(symbioticAdapter.connect(iVaultOperator).claim(
        [abi.encode(["address", "address"], [symbioticVaults[0].vaultAddress, ethers.Wallet.createRandom().address])], true),
      ).to.be.revertedWithCustomError(symbioticAdapter, "OnlyEmergency");
    });

    it("add & remove vaults input args", async function() {
      await expect(symbioticAdapter.connect(iVaultOperator).addVault(staker.address))
        .to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        symbioticAdapter.connect(iVaultOperator).removeVault(symbioticVaults[0].vaultAddress, false),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("unavailable to while paused", async function() {
      await symbioticAdapter.pause();

      await expect(symbioticAdapter.connect(iVaultOperator).delegate(ethers.ZeroAddress, 0n, []))
        .to.be.revertedWith("Pausable: paused");

      await expect(symbioticAdapter.connect(iVaultOperator).withdraw(ethers.ZeroAddress, 0n, [], false))
        .to.be.revertedWith("Pausable: paused");

      await expect(symbioticAdapter.connect(iVaultOperator).claim([], false))
        .to.be.revertedWith("Pausable: paused");

      await symbioticAdapter.unpause();
    });

    it("set claimer implementation", async function() {
      await expect(symbioticAdapter.connect(staker).setClaimerImplementation(ZeroAddress))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("MellowAdapter input args", function() {
    it("claim input args", async function() {
      await expect(mellowAdapter.connect(iVaultOperator).claim([], false))
        .to.be.revertedWithCustomError(mellowAdapter, "ValueZero");

      await expect(mellowAdapter.connect(iVaultOperator).claim(
        [abi.encode(["address", "address"], [mellowVaults[0].vaultAddress, ethers.Wallet.createRandom().address])], true),
      ).to.be.revertedWithCustomError(mellowAdapter, "OnlyEmergency");

      await expect(mellowAdapter.connect(iVaultOperator).claim(
        [abi.encode(["address", "address"], [mellowVaults[0].vaultAddress, ethers.Wallet.createRandom().address])], false),
      ).to.be.revertedWithCustomError(mellowAdapter, "InvalidVault");
    });

    it("setEthWrapper input args", async function() {
      await expect(mellowAdapter.connect(iVaultOperator).setEthWrapper(staker.address))
        .to.be.revertedWith("Ownable: caller is not the owner");

      await expect(mellowAdapter.setEthWrapper(ethers.Wallet.createRandom().address))
        .to.be.revertedWithCustomError(mellowAdapter, "NotContract");
    });

    it("unable to run while paused", async function() {
      await mellowAdapter.pause();

      await expect(mellowAdapter.connect(iVaultOperator).delegate(ethers.ZeroAddress, 0n, []))
        .to.be.revertedWith("Pausable: paused");

      await expect(mellowAdapter.connect(iVaultOperator).withdraw(ethers.ZeroAddress, 0n, [], false))
        .to.be.revertedWith("Pausable: paused");

      await expect(mellowAdapter.connect(iVaultOperator).claim([], false))
        .to.be.revertedWith("Pausable: paused");

      await mellowAdapter.unpause();
    });

    it("change allocation input args", async function() {
      await expect(mellowAdapter.connect(staker).changeAllocation(ZeroAddress, 0n))
        .to.be.revertedWith("Ownable: caller is not the owner");

      await expect(mellowAdapter.changeAllocation(ZeroAddress, 0n))
        .to.be.revertedWithCustomError(mellowAdapter, "ZeroAddress");

      await expect(mellowAdapter.changeAllocation(ethers.Wallet.createRandom().address, 0n))
        .to.be.revertedWithCustomError(mellowAdapter, "InvalidVault");
    });

    it("mellow input args", async function() {
      await expect(mellowAdapter.setClaimerImplementation(ZeroAddress));
      await expect(mellowAdapter.connect(iVaultOperator).withdraw(mellowVaults[0].vaultAddress, 1n, [], false))
        .to.be.revertedWithCustomError(mellowAdapter, "ClaimerImplementationNotSet");
      await snapshot.restore();
    });
  });

  describe("Adapter claimers", function() {
    let mellowClaimerAddr, symbioticClaimerAddr;

    before(async function() {
      await snapshot.restore();

      iVault.setTargetFlashCapacity(1n);
      // deposit
      await iVault.connect(staker).deposit(toWei(100), staker.address);
      // delegate mellow
      await iVault.connect(iVaultOperator)
        .delegate(mellowAdapter.address, mellowVaults[0].vaultAddress, toWei(5), emptyBytes);
      // delegate symbiotic
      await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(5), emptyBytes);
      // withdraw
      await iVault.connect(staker).withdraw(toWei(2), staker.address);
      // undelegate
      const tx = await iVault.connect(iVaultOperator)
        .undelegate(await withdrawalQueue.currentEpoch(), [
          [await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, toWei(1), emptyBytes],
          [await symbioticAdapter.getAddress(), symbioticVaults[0].vaultAddress, toWei(1), emptyBytes],
        ]);
      const receipt = await tx.wait();
      let adapterEvents = receipt.logs?.filter(log => log.address === mellowAdapter.address).map(log => mellowAdapter.interface.parseLog(log));
      mellowClaimerAddr = adapterEvents[0].args["claimer"];
      adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address).map(log => symbioticAdapter.interface.parseLog(log));
      symbioticClaimerAddr = adapterEvents[0].args["claimer"];
    });

    it("mellow claimer: only adapter claim", async function() {
      const mellowClaimer = await ethers.getContractAt("MellowAdapterClaimer", mellowClaimerAddr);
      await expect(mellowClaimer.claim(ethers.ZeroAddress, ethers.ZeroAddress, 0n))
        .to.be.revertedWithCustomError(mellowClaimer, "OnlyAdapter");
    });

    it("symbiotic claimer: only adapter claim", async function() {
      const symbioticClaimer = await ethers.getContractAt("SymbioticAdapterClaimer", symbioticClaimerAddr);
      await expect(symbioticClaimer.claim(ethers.ZeroAddress, ethers.ZeroAddress, 0n))
        .to.be.revertedWithCustomError(symbioticClaimer, "OnlyAdapter");
    });
  });
});
