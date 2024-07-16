/** @var web3 {Web3} */

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { deployConfig, deployFeeCollector } from "./helpers/deploy";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { FeeCollector } from "../typechain-types";
import { expect } from "chai";

const COMMISSION = 100;

let governance: HardhatEthersSigner,
  operator: HardhatEthersSigner,
  treasury: HardhatEthersSigner,
  signer1: HardhatEthersSigner,
  signer2: HardhatEthersSigner,
  signer3: HardhatEthersSigner;

const init = async () => {
  [governance, operator, treasury, signer1, signer2, signer3] = await ethers.getSigners();

  const protocolConfig = await deployConfig([governance, operator, treasury]);

  const feeCollector = await deployFeeCollector(protocolConfig, COMMISSION);

  return [feeCollector, protocolConfig];
};

describe("FeeCollector", function () {
  let collector: FeeCollector, config;

  describe("Getter and Setter", () => {
    before(async function () {
      [collector, config] = await loadFixture(init);
    });

    it("commission()", async () => {
      expect(await collector.commission()).to.be.eq(COMMISSION);
    });

    it("changeCommission", async () => {
      const newCommission = 1;
      await expect(collector.setCommission(newCommission))
        .to.emit(collector, "CommissionChanged")
        .withArgs(COMMISSION, newCommission);
    });

    it("Reverts: new commission too big", async () => {
      await expect(collector.setCommission(10001)).to.be.revertedWithCustomError(collector, "CommissionNotInRange");
    });

    it("Reverts: when caller not governance", async () => {
      await expect(collector.connect(operator).setCommission(1)).to.be.revertedWithCustomError(
        collector,
        "OnlyGovernanceAllowed",
      );
    });
  });

  describe("withdraw", () => {
    const amount = ethers.parseEther("1");

    before(async function () {
      [collector, config] = await loadFixture(init);
    });

    it("collector can receive", async () => {
      await expect(
        signer1.sendTransaction({
          to: await collector.getAddress(),
          value: amount,
        }),
      )
        .to.emit(collector, "Received")
        .withArgs(signer1.address, amount);
    });

    it("withdraw()", async () => {
      const contractBalanceBefore = await ethers.provider.getBalance(await collector.getAddress());
      const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);

      const rewards = await collector.getRewards();
      const fee = (amount * (await collector.commission())) / (await collector.MAX_COMMISSION());

      expect(rewards).to.be.eq(amount - fee);

      await expect(collector.withdraw())
        .to.emit(collector, "Withdrawn")
        .withArgs(ethers.ZeroAddress, treasury.address, rewards, fee);

      const contractBalanceAfter = await ethers.provider.getBalance(await collector.getAddress());
      const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);

      expect(contractBalanceBefore - contractBalanceAfter).to.be.eq(amount);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.be.eq(fee);
    });

    it("nothing to withdraw", async () => {
      const contractBalanceBefore = await ethers.provider.getBalance(await collector.getAddress());
      const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);

      expect(await collector.getRewards()).to.be.eq("0");

      await collector.withdraw();

      const contractBalanceAfter = await ethers.provider.getBalance(await collector.getAddress());
      const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);

      expect(contractBalanceBefore - contractBalanceAfter).to.be.eq(0);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.be.eq(0);
    });
  });
});
