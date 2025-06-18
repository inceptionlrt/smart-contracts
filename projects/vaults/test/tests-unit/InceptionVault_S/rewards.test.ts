// Tests for InceptionVault_S contract;
// The S in name does not mean only Symbiotic; this file contains tests for Symbiotic and Mellow adapters

import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hardhat from "hardhat";
import { stETH } from "../../data/assets/inception-vault-s";
import { vaults } from "../../data/vaults";
import { toWei } from "../../helpers/utils";
import { adapters, emptyBytes } from "../../src/constants";
import { abi, initVault } from "../../src/init-vault";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import exp from "node:constants";
import { ZeroAddress, ZeroHash } from "ethers";
import { eigenLayer } from "../../../typechain-types/contracts/vaults";

const { ethers, network } = hardhat;
const assetData = stETH;

describe("Farm rewards", function() {
  let iToken, iVault, asset, mellowAdapter, symbioticAdapter, withdrawalQueue;
  let iVaultOperator, staker, staker2, staker3;
  let ratioErr, transactErr;
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
          jsonRpcUrl: assetData.url ? assetData.url : network.config.forking.url,
          blockNumber: assetData.blockNumber ? assetData.blockNumber : network.config.forking.blockNumber,
        },
      },
    ]);

    ({ iToken, iVault, asset, iVaultOperator, mellowAdapter, symbioticAdapter, withdrawalQueue }
      = await initVault(assetData, { adapters: [adapters.Mellow, adapters.Symbiotic] }));

    ratioErr = assetData.ratioErr;
    transactErr = assetData.transactErr;

    [, staker, staker2, staker3] = await ethers.getSigners();

    staker = await assetData.impersonateStaker(staker, iVault);
    staker2 = await assetData.impersonateStaker(staker2, iVault);
    staker3 = await assetData.impersonateStaker(staker3, iVault);

    snapshot = await helpers.takeSnapshot();
  });

  describe("Symbiotic farm rewards", function() {
    let stakerRewardsContract, networkAddr, rewardsTreasury;

    it("Set rewards treasury address", async function() {
      rewardsTreasury = ethers.Wallet.createRandom().address;
      await expect(iVault.setRewardsTreasury(rewardsTreasury))
        .to.emit(iVault, "SetRewardsTreasury")
        .withArgs(rewardsTreasury);
    });

    it("Deposit and delegate to symbiotic vault", async function() {
      await iVault.setTargetFlashCapacity(1n);
      await iVault.connect(staker).deposit(toWei(100), staker.address);
      await iVault.connect(iVaultOperator).delegate(symbioticAdapter.address, vaults.symbiotic[0].vaultAddress, toWei(90), emptyBytes);
    });

    it("Add rewards to symbiotic", async function() {
      const [deployer] = await ethers.getSigners();
      networkAddr = await deployer.getAddress();

      // register network
      const networkRegistryAddr = "0xC773b1011461e7314CF05f97d95aa8e92C1Fd8aA";
      const networkRegistryABI = ["function registerNetwork() external"];
      const networkRegistry = new ethers.Contract(networkRegistryAddr, networkRegistryABI, deployer);
      await networkRegistry.registerNetwork();

      // set network middleware
      const networkMiddlewareServiceAddr = "0xD7dC9B366c027743D90761F71858BCa83C6899Ad";
      const networkMiddlewareServiceABI = ["function setMiddleware( address middleware ) external"];
      const networkMiddlewareService = new ethers.Contract(networkMiddlewareServiceAddr, networkMiddlewareServiceABI, deployer);
      await networkMiddlewareService.setMiddleware(deployer);

      // define and make factory
      const stakerRewardsFactoryAddr = "0xFEB871581C2ab2e1EEe6f7dDC7e6246cFa087A23";
      const stakerRewardsFactory = new ethers.Contract(stakerRewardsFactoryAddr, [
        "function create((address vault, uint256 adminFee, address defaultAdminRoleHolder, address adminFeeClaimRoleHolder, address adminFeeSetRoleHolder)) external returns (address)",
        "event AddEntity(address indexed entity)",
      ], deployer);

      // create new staker rewards contract by factory
      const tx = await stakerRewardsFactory.create({
        vault: vaults.symbiotic[0].vaultAddress,
        adminFee: 0n,
        defaultAdminRoleHolder: deployer.address,
        adminFeeClaimRoleHolder: deployer.address,
        adminFeeSetRoleHolder: deployer.address,
      });
      const receipt = await tx.wait();

      // define and make staker rewards contract based on created contract address
      const stakerRewardsContractAddr = receipt.logs.find((l) => l.eventName === "AddEntity").args.entity;
      stakerRewardsContract = new ethers.Contract(stakerRewardsContractAddr, [
        "function distributeRewards(address network, address token, uint256 amount, bytes calldata data) external",
        "function claimable( address token, address account, bytes calldata data ) external view override returns (uint256 amount)",
      ], deployer);

      // distribute rewards
      const rewardTimestamp = await time.latest();
      const rewardsAmount = toWei(100);
      await asset.connect(staker3).transfer(deployer, rewardsAmount);
      await asset.connect(deployer).approve(stakerRewardsContractAddr, rewardsAmount);

      await stakerRewardsContract.distributeRewards(networkAddr, assetData.assetAddress, rewardsAmount, abi.encode(
          ["uint48", "uint256", "bytes", "bytes"],
          [rewardTimestamp, 0n, "0x", "0x"],
        ),
      );
    });

    it("Claim symbiotic rewards", async function() {
      const claimData = abi.encode(["address", "uint256", "bytes"], [networkAddr, 1n, "0x"]);
      const farmData = abi.encode(["address", "bytes"], [await stakerRewardsContract.getAddress(), claimData]);

      const claimable = await stakerRewardsContract.claimable(assetData.assetAddress, symbioticAdapter.address, claimData);
      expect(claimable).to.greaterThan(0);

      await iVault.connect(iVaultOperator).claimAdapterRewards(symbioticAdapter.address, assetData.assetAddress, farmData);
      expect(await asset.balanceOf(rewardsTreasury)).to.eq(claimable);
    });
  });

  describe("Mellow farm rewards", function() {
    it("available to run only by trustee", async function() {
      await expect(mellowAdapter.connect(staker).claimRewards(ZeroAddress, "0x"))
        .to.be.revertedWithCustomError(mellowAdapter, "NotVaultOrTrusteeManager");
    });

    it("claim rewards reverts", async function() {
      await expect(mellowAdapter.connect(iVaultOperator).claimRewards(ZeroAddress, "0x"))
        .to.be.revertedWith("Mellow distribution rewards not implemented yet");
    });
  });

  describe("Add rewards to vault", function () {
    before(async function () {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
    });

    it("set rewards timeline", async function () {
      const timeline = 86400;

      await iVault.setRewardsTimeline(timeline);
      expect(await iVault.rewardsTimeline()).to.be.eq(timeline);
    });

    it("set rewards timeline: invalid data", async function() {
      await expect(iVault.setRewardsTimeline(3600n))
        .to.be.revertedWithCustomError(iVault, "InconsistentData");

      await expect(iVault.setRewardsTimeline(90000n))
        .to.be.revertedWithCustomError(iVault, "InconsistentData");
    });

    it("set rewards timeline: only owner", async function() {
      await expect(iVault.connect(staker).setRewardsTimeline(1n))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("set rewards treasury: only owner", async function() {
      await expect(iVault.connect(staker).setRewardsTreasury(ZeroAddress))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("add rewards for the first time", async function() {
      const rewardsAmount = toWei(10);

      const totalAssetsBefore = await iVault.totalAssets();
      await asset.connect(staker).transfer(iVaultOperator, rewardsAmount);
      await asset.connect(iVaultOperator).approve(iVault.address, rewardsAmount);
      await iVault.connect(iVaultOperator).addRewards(rewardsAmount);
      const totalAssetsAfter = await iVault.totalAssets();

      expect(await iVault.currentRewards()).to.eq(rewardsAmount);
      expect(totalAssetsBefore - totalAssetsAfter).to.be.eq(0);
    });

    it("add rewards not available while timeline not over", async function() {
      await expect(iVault.connect(iVaultOperator).addRewards(toWei(1)))
        .to.be.revertedWithCustomError(iVault, "TimelineNotOver");
    });

    it("add rewards: only operator", async function() {
      await expect(iVault.connect(staker).addRewards(toWei(1)))
        .to.be.revertedWithCustomError(iVault, "OnlyOperatorAllowed");
    });
  });

  describe("Claim rewards", function() {
    it("Can be called only by operator", async function() {
      await expect(iVault.connect(staker).claimAdapterRewards(symbioticAdapter.address, assetData.assetAddress, "0x"))
        .to.be.revertedWithCustomError(iVault, "OnlyOperatorAllowed");
    });

    it("Can be called only by trustee", async function() {
      await expect(symbioticAdapter.connect(staker).claimRewards(assetData.assetAddress, "0x"))
        .to.be.revertedWithCustomError(symbioticAdapter, "NotVaultOrTrusteeManager");

      await expect(mellowAdapter.connect(staker).claimRewards(assetData.assetAddress, "0x"))
        .to.be.revertedWithCustomError(mellowAdapter, "NotVaultOrTrusteeManager");
    });
  });
});
