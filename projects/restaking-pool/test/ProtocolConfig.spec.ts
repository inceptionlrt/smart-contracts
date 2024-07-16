import { ethers, upgrades } from "hardhat";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Contract } from "ethers";

let governance: HardhatEthersSigner,
  operator: HardhatEthersSigner,
  treasury: HardhatEthersSigner,
  signer1: HardhatEthersSigner,
  signer2: HardhatEthersSigner;

const init = async () => {
  [governance, operator, treasury, signer1, signer2] = await ethers.getSigners();

  const config = await upgrades.deployProxy(
    await ethers.getContractFactory("ProtocolConfig"),
    [governance.address, operator.address, treasury.address],
    { redeployImplementation: "always" },
  );
  await config.waitForDeployment();

  return [config];
};

describe("ProtocolConfig", function () {
  let config: Contract;

  describe("Operator", function () {
    before(async function () {
      [config] = await helpers.loadFixture(init);
    });

    it("getOperator()", async () => {
      expect(await config.getOperator()).to.be.eq(operator.address);
    });

    it("setOperator()", async function () {
      await expect(config.setOperator(signer1.address))
        .to.emit(config, "OperatorChanged")
        .withArgs(operator.address, signer1.address);

      expect(await config.getOperator()).to.be.eq(signer1.address);
    });

    it("setOperator(): only governance can", async function () {
      await expect(config.connect(signer1).setOperator(signer2.address)).to.be.revertedWithCustomError(
        config,
        "OnlyGovernanceAllowed",
      );
    });

    it("setOperator(): reverts: when change to zero address", async function () {
      await expect(config.setOperator(ethers.ZeroAddress)).to.be.revertedWithCustomError(config, "ZeroAddress");
    });
  });

  describe("Governance", function () {
    before(async function () {
      [config] = await helpers.loadFixture(init);
    });

    it("getGovernance()", async function () {
      expect(await config.getGovernance()).to.be.eq(governance.address);
    });

    it("setGovernance(): only governance can", async function () {
      await expect(config.connect(signer1).setGovernance(signer1.address)).to.be.revertedWithCustomError(
        config,
        "OnlyGovernanceAllowed",
      );
    });

    it("setGovernance(): reverts: when change to zero address", async function () {
      await expect(config.setGovernance(ethers.ZeroAddress)).to.be.revertedWithCustomError(config, "ZeroAddress");
    });

    it("setGovernance()", async function () {
      await expect(config.setGovernance(signer1.address))
        .to.emit(config, "GovernanceChanged")
        .withArgs(governance.address, signer1.address);

      expect(await config.getGovernance()).to.be.eq(signer1.address);
    });
  });

  describe("RatioFeed", function () {
    before(async function () {
      [config] = await helpers.loadFixture(init);
    });

    it("getRatioFeed()", async function () {
      expect(await config.getRatioFeed()).to.be.eq(ethers.ZeroAddress);
    });

    it("setRatioFeed(): only governance can", async function () {
      await expect(config.connect(signer1).setRatioFeed(signer2.address)).to.be.revertedWithCustomError(
        config,
        "OnlyGovernanceAllowed",
      );
    });

    it("setRatioFeed(): reverts: when change to zero address", async function () {
      await expect(config.setRatioFeed(ethers.ZeroAddress)).to.be.revertedWithCustomError(config, "ZeroAddress");
    });

    it("setRatioFeed()", async function () {
      await expect(config.setRatioFeed(signer1.address))
        .to.emit(config, "RatioFeedChanged")
        .withArgs(ethers.ZeroAddress, signer1.address);

      expect(await config.getRatioFeed()).to.be.eq(signer1.address);
    });
  });

  describe("Treasury", function () {
    before(async function () {
      [config] = await helpers.loadFixture(init);
    });

    it("getTreasury()", async function () {
      expect(await config.getTreasury()).to.be.eq(treasury.address);
    });

    it("setTreasury(): only governance can", async function () {
      await expect(config.connect(signer1).setTreasury(signer1.address)).to.be.revertedWithCustomError(
        config,
        "OnlyGovernanceAllowed",
      );
    });

    it("setTreasury(): reverts: when change to zero address", async function () {
      await expect(config.setTreasury(ethers.ZeroAddress)).to.be.revertedWithCustomError(config, "ZeroAddress");
    });

    it("setTreasury()", async function () {
      await expect(config.setTreasury(signer1.address))
        .to.emit(config, "TreasuryChanged")
        .withArgs(treasury.address, signer1.address);

      expect(await config.getTreasury()).to.be.eq(signer1.address);
    });
  });

  describe("RestakingPool", function () {
    before(async function () {
      [config] = await helpers.loadFixture(init);
    });

    it("getRestakingPool()", async function () {
      expect(await config.getRestakingPool()).to.be.eq(ethers.ZeroAddress);
    });

    it("setRestakingPool(): only governance can", async function () {
      await expect(config.connect(signer1).setRestakingPool(signer2.address)).to.be.revertedWithCustomError(
        config,
        "OnlyGovernanceAllowed",
      );
    });

    it("setRestakingPool(): reverts: when change to zero address", async function () {
      await expect(config.setRestakingPool(ethers.ZeroAddress)).to.be.revertedWithCustomError(config, "ZeroAddress");
    });

    it("setRestakingPool()", async function () {
      await expect(config.setRestakingPool(signer1.address))
        .to.emit(config, "RestakingPoolChanged")
        .withArgs(ethers.ZeroAddress, signer1.address);

      expect(await config.getRestakingPool()).to.be.eq(signer1.address);
    });
  });

  describe("cToken", function () {
    before(async function () {
      [config] = await helpers.loadFixture(init);
    });

    it("getCToken()", async function () {
      expect(await config.getCToken()).to.be.eq(ethers.ZeroAddress);
    });

    it("setCToken(): only governance can", async function () {
      await expect(config.connect(signer1).setCToken(signer2.address)).to.be.revertedWithCustomError(
        config,
        "OnlyGovernanceAllowed",
      );
    });

    it("setCToken(): reverts: when change to zero address", async function () {
      await expect(config.setCToken(ethers.ZeroAddress)).to.be.revertedWithCustomError(config, "ZeroAddress");
    });

    it("setCToken()", async function () {
      await expect(config.setCToken(signer1.address))
        .to.emit(config, "CTokenChanged")
        .withArgs(ethers.ZeroAddress, signer1.address);

      expect(await config.getCToken()).to.be.eq(signer1.address);
    });
  });
});
