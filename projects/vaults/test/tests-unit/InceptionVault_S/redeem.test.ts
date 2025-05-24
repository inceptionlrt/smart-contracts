import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hardhat from "hardhat";
import { skipEpoch, symbioticClaimParams, toWei } from "../../helpers/utils";
import { initVault } from "../../src/init-vault-new";
const { ethers, network } = hardhat;
import { testrunConfig } from '../../testrun.config';
import { adapters, emptyBytes } from "../../src/constants";

const assetData = testrunConfig.assetData;
const symbioticVaults = assetData.adapters.symbiotic;

describe('redeem with specified epoch', async function () {
  let iVault;
  let asset;
  let staker: HardhatEthersSigner, staker2: HardhatEthersSigner;
  let transactErr: bigint;
  let snapshot: helpers.SnapshotRestorer;
  let iToken;
  let iVaultOperator;
  let symbioticAdapter;
  let withdrawalQueue;
  let receipt;
  let events;
  const depositAmount = toWei(10);

  before(async function () {
    await network.provider.send("hardhat_reset", [{
      forking: {
        jsonRpcUrl: network.config.forking.url,
        blockNumber: assetData.blockNumber || network.config.forking.blockNumber,
      },
    }]);

    ({ iToken, iVault, iVaultOperator, asset, symbioticAdapter, withdrawalQueue } =
      await initVault(assetData, { adapters: [adapters.Symbiotic] }));
    transactErr = assetData.transactErr;

    [, staker, staker2] = await ethers.getSigners();

    staker = await assetData.impersonateStaker(staker, iVault);
    staker2 = await assetData.impersonateStaker(staker2, iVault);

    snapshot = await helpers.takeSnapshot();
  });

  beforeEach(async function () {
    await snapshot.restore();
    await iVault.setTargetFlashCapacity(2n);

    // Arrange: deposit > delegate > withdraw > undelegate > claim
    // deposit
    await (await iVault.connect(staker).deposit(depositAmount, staker.address))
      .wait();

    // delegate
    await (await iVault.connect(iVaultOperator)
      .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, depositAmount, emptyBytes))
      .wait();

    // withdraw
    const shares = await iToken.balanceOf(staker.address);
    await (await iVault.connect(staker).withdraw(shares, staker.address))
      .wait();

    // undelegate
    const epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
    receipt = await (await iVault.connect(iVaultOperator)
      .undelegate(await withdrawalQueue.currentEpoch(), [[symbioticAdapter.address, symbioticVaults[0].vaultAddress, epochShares, []]]))
      .wait();
    events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
    const adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
      .map(log => symbioticAdapter.interface.parseLog(log));
    let claimer = adapterEvents[0].args["claimer"];

    // claim
    await skipEpoch(symbioticVaults[0]);
    const params = await symbioticClaimParams(symbioticVaults[0], claimer);
    await (await iVault.connect(iVaultOperator)
      .claim(events[0].args["epoch"], [symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]]))
      .wait();
  });

  it("successful redeem with specified valid epoch", async function () {
    // Act: redeem
    const userBalanceBeforeRedeem = await asset.balanceOf(staker.address);

    // redeem with specifying epoch
    receipt = await (await iVault.connect(staker)["redeem(address,uint256)"](staker.address, 0))
      .wait();
    events = receipt.logs?.filter(e => e.eventName === "Redeem");

    // Assert: user balance increased by deposit/redeem amount
    expect(await withdrawalQueue.totalAmountRedeem()).to.be.eq(0);
    expect(events[0].args["amount"]).to.be.closeTo(depositAmount, transactErr);

    const userBalanceAfterRedeem = await asset.balanceOf(staker.address);
    expect(userBalanceAfterRedeem).to.be.closeTo(userBalanceBeforeRedeem + depositAmount, transactErr);
  });

  it('revert if invalid epoch specified', async function () {
    // Act/Assert: redeem with specifying epoch
    await expect(iVault.connect(staker)["redeem(address,uint256)"](staker.address, 2)).to.be.revertedWithCustomError(
      withdrawalQueue,
      "InvalidEpoch"
    );
  });
});
