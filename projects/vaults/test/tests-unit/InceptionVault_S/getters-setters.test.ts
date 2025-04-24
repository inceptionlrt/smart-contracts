// Tests for InceptionVault_S contract;
// The S in name does not mean only Symbiotic; this file contains tests for Symbiotic and Mellow adapters

import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hardhat from "hardhat";
import { adapters, emptyBytes } from "../../../constants";
import { stETH } from "../../data/assets/inception-vault-s";
import {
  e18,
  randomBI,
  toWei
} from "../../helpers/utils";
import { initVault, MAX_TARGET_PERCENT } from "../../src/init-vault";
import { vaults } from "../../data/vaults";

const { ethers, network } = hardhat;
const mellowVaults = vaults.mellow;

const assetData = stETH;
describe(`Inception Symbiotic Vault ${assetData.assetName}`, function () {
  let iVault, asset, mellowAdapter, symbioticAdapter, withdrawalQueue;
  let iVaultOperator, deployer, staker, staker2, staker3, treasury;
  let snapshot;

  before(async function () {
    if (process.env.ASSETS) {
      const assets = process.env.ASSETS.toLocaleLowerCase().split(",");
      if (!assets.includes(assetData.assetName.toLowerCase())) {
        console.log(`${assetData.assetName} is not in the list, going to skip`);
        this.skip();
      }
    }

    await network.provider.send("hardhat_reset", [{
      forking: {
        jsonRpcUrl: network.config.forking.url,
        blockNumber: assetData.blockNumber ? assetData.blockNumber : network.config.forking.blockNumber,
      },
    }]);

    ({ iVault, asset, iVaultOperator, mellowAdapter, symbioticAdapter, withdrawalQueue }
      = await initVault(assetData, { adapters: [adapters.Mellow, adapters.Symbiotic] }));

    [deployer, staker, staker2, staker3] = await ethers.getSigners();

    staker = await assetData.impersonateStaker(staker, iVault);
    staker2 = await assetData.impersonateStaker(staker2, iVault);
    staker3 = await assetData.impersonateStaker(staker3, iVault);
    treasury = await iVault.treasury(); //deployer

    snapshot = await helpers.takeSnapshot();
  });

  after(async function () {
    await iVault?.removeAllListeners();
  });

  describe("iVault getters and setters", function () {
    beforeEach(async function () {
      await snapshot.restore();
    });

    it("Assset", async function () {
      expect(await iVault.asset()).to.be.eq(asset.address);
    });

    it("Default epoch", async function () {
      expect(await withdrawalQueue.currentEpoch()).to.be.eq(1n);
    });

    it("setTreasuryAddress(): only owner can", async function () {
      const treasury = await iVault.treasury();
      const newTreasury = ethers.Wallet.createRandom().address;

      await expect(iVault.setTreasuryAddress(newTreasury))
        .to.emit(iVault, "TreasuryChanged")
        .withArgs(treasury, newTreasury);
      expect(await iVault.treasury()).to.be.eq(newTreasury);
    });

    it("setTreasuryAddress(): reverts when set to zero address", async function () {
      await expect(iVault.setTreasuryAddress(ethers.ZeroAddress)).to.be.revertedWithCustomError(iVault, "NullParams");
    });

    it("setTreasuryAddress(): reverts when caller is not an operator", async function () {
      await expect(iVault.connect(staker).setTreasuryAddress(staker2.address)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("setOperator(): only owner can", async function () {
      const newOperator = staker2;
      await expect(iVault.setOperator(newOperator.address))
        .to.emit(iVault, "OperatorChanged")
        .withArgs(iVaultOperator.address, newOperator);

      await iVault.setTargetFlashCapacity(1n);
      await iVault.connect(staker).deposit(toWei(2), staker.address);
      const amount = await iVault.getFreeBalance();
      await iVault
        .connect(newOperator)
        .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, amount, emptyBytes);
    });

    it("setOperator(): reverts when set to zero address", async function () {
      await expect(iVault.setOperator(ethers.ZeroAddress)).to.be.revertedWithCustomError(iVault, "NullParams");
    });

    it("setOperator(): reverts when caller is not an operator", async function () {
      await expect(iVault.connect(staker).setOperator(staker2.address)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("setRatioFeed(): only owner can", async function () {
      const ratioFeed = await iVault.ratioFeed();
      const newRatioFeed = ethers.Wallet.createRandom().address;
      await expect(iVault.setRatioFeed(newRatioFeed))
        .to.emit(iVault, "RatioFeedChanged")
        .withArgs(ratioFeed, newRatioFeed);
      expect(await iVault.ratioFeed()).to.be.eq(newRatioFeed);
    });

    it("setRatioFeed(): reverts when new value is zero address", async function () {
      await expect(iVault.setRatioFeed(ethers.ZeroAddress)).to.be.revertedWithCustomError(iVault, "NullParams");
    });

    it("setRatioFeed(): reverts when caller is not an owner", async function () {
      const newRatioFeed = ethers.Wallet.createRandom().address;
      await expect(iVault.connect(staker).setRatioFeed(newRatioFeed)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("setWithdrawMinAmount(): only owner can", async function () {
      const prevValue = await iVault.withdrawMinAmount();
      const newMinAmount = randomBI(3);
      await expect(iVault.setWithdrawMinAmount(newMinAmount))
        .to.emit(iVault, "WithdrawMinAmountChanged")
        .withArgs(prevValue, newMinAmount);
      expect(await iVault.withdrawMinAmount()).to.be.eq(newMinAmount);
    });

    it("setWithdrawMinAmount(): another address can not", async function () {
      await expect(iVault.connect(staker).setWithdrawMinAmount(randomBI(3))).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("setWithdrawMinAmount(): error if try to set 0", async function () {
      await expect(iVault.setWithdrawMinAmount(0)).to.be.revertedWithCustomError(iVault, "NullParams");
    });

    it("setName(): only owner can", async function () {
      const prevValue = await iVault.name();
      const newValue = "New name";
      await expect(iVault.setName(newValue)).to.emit(iVault, "NameChanged").withArgs(prevValue, newValue);
      expect(await iVault.name()).to.be.eq(newValue);
    });

    it("setName(): reverts when name is blank", async function () {
      await expect(iVault.setName("")).to.be.revertedWithCustomError(iVault, "NullParams");
    });

    it("setName(): another address can not", async function () {
      await expect(iVault.connect(staker).setName("New name")).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("pause(): only owner can", async function () {
      expect(await iVault.paused()).is.false;
      await iVault.pause();
      expect(await iVault.paused()).is.true;
    });

    it("pause(): another address can not", async function () {
      await expect(iVault.connect(staker).pause()).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("pause(): reverts when already paused", async function () {
      await iVault.pause();
      await expect(iVault.pause()).to.be.revertedWith("Pausable: paused");
    });

    it("unpause(): only owner can", async function () {
      await iVault.pause();
      expect(await iVault.paused()).is.true;

      await iVault.unpause();
      expect(await iVault.paused()).is.false;
    });

    it("unpause(): another address can not", async function () {
      await iVault.pause();
      expect(await iVault.paused()).is.true;
      await expect(iVault.connect(staker).unpause()).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("setTargetFlashCapacity(): only owner can", async function () {
      const prevValue = await iVault.targetCapacity();
      const newValue = randomBI(18);
      await expect(iVault.connect(deployer).setTargetFlashCapacity(newValue))
        .to.emit(iVault, "TargetCapacityChanged")
        .withArgs(prevValue, newValue);
      expect(await iVault.targetCapacity()).to.be.eq(newValue);
    });

    it("setTargetFlashCapacity(): reverts when caller is not an owner", async function () {
      const newValue = randomBI(18);
      await expect(iVault.connect(staker).setTargetFlashCapacity(newValue)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("setTargetFlashCapacity(): reverts when set to 0", async function () {
      await expect(iVault.connect(deployer).setTargetFlashCapacity(0n)).to.revertedWithCustomError(
        iVault,
        "InvalidTargetFlashCapacity",
      );
    });

    it("setTargetFlashCapacity(): reverts when set to 0", async function () {
      await expect(iVault.connect(deployer).setTargetFlashCapacity(MAX_TARGET_PERCENT + 1n)).to.revertedWithCustomError(
        iVault,
        "MoreThanMax",
      );
    });

    it("setProtocolFee(): sets share of flashWithdrawFee that goes to treasury", async function () {
      const prevValue = await iVault.protocolFee();
      const newValue = randomBI(10);

      await expect(iVault.setProtocolFee(newValue)).to.emit(iVault, "ProtocolFeeChanged").withArgs(prevValue, newValue);
      expect(await iVault.protocolFee()).to.be.eq(newValue);
    });

    it("setProtocolFee(): reverts when > MAX_PERCENT", async function () {
      const newValue = (await iVault.MAX_PERCENT()) + 1n;
      await expect(iVault.setProtocolFee(newValue))
        .to.be.revertedWithCustomError(iVault, "ParameterExceedsLimits")
        .withArgs(newValue);
    });

    it("setProtocolFee(): reverts when caller is not an owner", async function () {
      const newValue = randomBI(10);
      await expect(iVault.connect(staker).setProtocolFee(newValue)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
  });

  describe("Mellow adapter getters and setters", function () {
    beforeEach(async function () {
      await snapshot.restore();
    });

    it("delegateMellow reverts when called by not a trustee", async function () {
      await asset.connect(staker).approve(mellowAdapter.address, e18);

      let time = await helpers.time.latest();
      await expect(
        mellowAdapter.connect(staker).delegate(mellowVaults[0].vaultAddress, randomBI(9), emptyBytes),
      ).to.revertedWithCustomError(mellowAdapter, "NotVaultOrTrusteeManager");
    });

    it("delegateMellow reverts when called by not a trustee", async function () {
      await asset.connect(staker).approve(mellowAdapter.address, e18);

      let time = await helpers.time.latest();
      await expect(
        mellowAdapter.connect(staker).delegate(mellowVaults[0].vaultAddress, randomBI(9), emptyBytes),
      ).to.revertedWithCustomError(mellowAdapter, "NotVaultOrTrusteeManager");
    });

    it("delegate reverts when called by not a trustee", async function () {
      await iVault.setTargetFlashCapacity(1n);
      await iVault.connect(staker).deposit(e18, staker.address);
      await mellowAdapter.changeAllocation(mellowVaults[0].vaultAddress, 1n);

      let time = await helpers.time.latest();
      await expect(
        mellowAdapter
          .connect(staker)
          .delegate(mellowVaults[0].vaultAddress, randomBI(9), [
            "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001",
          ]),
      ).to.revertedWithCustomError(mellowAdapter, "NotVaultOrTrusteeManager");
    });

    it("withdrawMellow reverts when called by not a trustee", async function () {
      await iVault.setTargetFlashCapacity(1n);
      await iVault.connect(staker).deposit(randomBI(19), staker.address);
      const delegated = await iVault.getFreeBalance();
      await iVault
        .connect(iVaultOperator)
        .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, delegated, emptyBytes);

      await expect(
        mellowAdapter.connect(staker).withdraw(mellowVaults[0].vaultAddress, delegated, emptyBytes, false),
      ).to.revertedWithCustomError(mellowAdapter, "NotVaultOrTrusteeManager");
    });

    it("claimMellowWithdrawalCallback reverts when called by not a trustee", async function () {
      await asset.connect(staker).transfer(mellowAdapter.address, e18);

      await expect(mellowAdapter.connect(staker).claim(emptyBytes, false)).to.revertedWithCustomError(
        mellowAdapter,
        "NotVaultOrTrusteeManager",
      );
    });

    it("getVersion", async function () {
      expect(await mellowAdapter.getVersion()).to.be.eq(3n);
    });

    it("setVault(): only owner can", async function () {
      const prevValue = iVault.address;
      const newValue = await symbioticAdapter.getAddress();

      await expect(mellowAdapter.setInceptionVault(newValue))
        .to.emit(mellowAdapter, "InceptionVaultSet")
        .withArgs(prevValue, newValue);
    });

    it("setVault(): reverts when caller is not an owner", async function () {
      await expect(mellowAdapter.connect(staker).setInceptionVault(staker.address)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("setTrusteeManager(): only owner can", async function () {
      const prevValue = iVaultOperator.address;
      const newValue = staker.address;

      await expect(mellowAdapter.setTrusteeManager(newValue))
        .to.emit(mellowAdapter, "TrusteeManagerSet")
        .withArgs(prevValue, newValue);

      await iVault.setTargetFlashCapacity(1n);
      await iVault.connect(staker).deposit(randomBI(19), staker.address);
      const delegated = await iVault.getFreeBalance();
      await iVault
        .connect(iVaultOperator)
        .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, delegated, emptyBytes);

      await mellowAdapter.connect(staker).withdraw(mellowVaults[0].vaultAddress, delegated - 1n, emptyBytes, false);
    });

    it("setTrusteeManager(): reverts when caller is not an owner", async function () {
      await expect(mellowAdapter.connect(staker).setTrusteeManager(staker.address)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("pause(): reverts when caller is not an owner", async function () {
      await expect(mellowAdapter.connect(staker).pause()).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("unpause(): reverts when caller is not an owner", async function () {
      await mellowAdapter.pause();
      await expect(mellowAdapter.connect(staker).unpause()).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
