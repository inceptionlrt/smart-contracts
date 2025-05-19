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
      await iVault.setRewardsTreasury(rewardsTreasury);
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
});
