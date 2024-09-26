import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployConfig, deployRatioFeed } from "./helpers/deploy";
import { ProtocolConfig, RatioFeed } from "../typechain-types";
import { _1E18 } from "./helpers/constants";
import { increaseChainTimeForSeconds } from "./helpers/evmutils";
import { randomBI, randomBIbyMax } from "./helpers/math";
import { HardhatEthersSigner, SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

const { ethers, network, upgrades } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

const RATIO_THRESHOLD = 10_000_000n; // 10%

let governance,
  operator: HardhatEthersSigner,
  signer1: HardhatEthersSigner,
  signer2,
  token1: HardhatEthersSigner,
  token2;

const init = async () => {
  [governance, operator, signer1, signer2, token1, token2] = await ethers.getSigners();

  const protocolConfig = await deployConfig([governance, operator, operator]);
  const ratioFeed = await deployRatioFeed(protocolConfig, RATIO_THRESHOLD);

  return [ratioFeed, protocolConfig];
};

describe("RatioFeed", function () {
  let ratioFeed: RatioFeed, protocolConfig: ProtocolConfig;

  describe("setRatioThreshold()", function () {
    before(async function () {
      [ratioFeed, protocolConfig] = await loadFixture(init);
    });

    it("Changes threshold value", async function () {
      const oldThreshold = await ratioFeed.ratioThreshold();
      const newThreshold = randomBI(7);

      await expect(ratioFeed.setRatioThreshold(newThreshold))
        .to.emit(ratioFeed, "RatioThresholdChanged")
        .withArgs(oldThreshold, newThreshold);

      expect(await ratioFeed.ratioThreshold()).to.be.eq(newThreshold);
    });

    it("Changes threshold one more time", async function () {
      const oldThreshold = await ratioFeed.ratioThreshold();
      const newThreshold = randomBI(7);
      await expect(ratioFeed.setRatioThreshold(newThreshold))
        .to.emit(ratioFeed, "RatioThresholdChanged")
        .withArgs(oldThreshold, newThreshold);

      expect(await ratioFeed.ratioThreshold()).to.be.eq(newThreshold);
    });

    it("Reverts: only governance can modify", async function () {
      const newThreshold = randomBI(7);
      await expect(ratioFeed.connect(signer1).setRatioThreshold(newThreshold)).to.be.revertedWithCustomError(
        ratioFeed,
        "OnlyGovernanceAllowed",
      );
    });

    it("Reverts: when threshold > MAX_THRESHOLD", async function () {
      await expect(ratioFeed.setRatioThreshold((await ratioFeed.MAX_THRESHOLD()) + 1n)).to.be.revertedWithCustomError(
        ratioFeed,
        "RatioThresholdNotInRange",
      );
    });

    it("Reverts: when threshold = 0", async function () {
      await expect(ratioFeed.setRatioThreshold("0")).to.be.revertedWithCustomError(
        ratioFeed,
        "RatioThresholdNotInRange",
      );
    });
  });

  describe("updateRatio(): publishes ratio for listed addresses", function () {
    before(async function () {
      [ratioFeed, protocolConfig] = await loadFixture(init);
    });

    it("Set threshold value", async function () {
      await ratioFeed.setRatioThreshold(randomBI(7));
    });

    it("Publish ratio for the first time", async function () {
      const ratioBefore = await ratioFeed.getRatio(token1.address);
      await expect(ratioFeed.connect(operator).updateRatio(token1.address, _1E18))
        .to.emit(ratioFeed, "RatioUpdated")
        .withArgs(token1.address, ratioBefore, _1E18);

      const ratioAfter = await ratioFeed.getRatio(token1.address);
      expect(ratioAfter).to.be.eq(_1E18);
    });

    it("Publish ratio within threshold", async function () {
      await increaseChainTimeForSeconds(60 * 60 * 12 + 1); //+12h
      const ratioBefore = await ratioFeed.getRatio(token1.address);
      const threshold = (ratioBefore * (await ratioFeed.ratioThreshold())) / (await ratioFeed.MAX_THRESHOLD());
      const newRatio = ratioBefore - randomBIbyMax(threshold);
      await expect(ratioFeed.connect(operator).updateRatio(token1.address, newRatio))
        .to.emit(ratioFeed, "RatioUpdated")
        .withArgs(token1.address, ratioBefore, newRatio);

      const ratioAfter = await ratioFeed.getRatio(token1.address);
      expect(ratioAfter).to.be.eq(newRatio);
    });

    it("Publish the same ratio", async function () {
      await increaseChainTimeForSeconds(60 * 60 * 12 + 1); //+12h
      const ratioBefore = await ratioFeed.getRatio(token1.address);
      await expect(ratioFeed.connect(operator).updateRatio(token1.address, ratioBefore))
        .to.emit(ratioFeed, "RatioUpdated")
        .withArgs(token1.address, ratioBefore, ratioBefore);

      expect(await ratioFeed.getRatio(token1.address)).to.be.eq(ratioBefore);
    });

    it("Reverts: when publish second time in less than 12h", async function () {
      await increaseChainTimeForSeconds(60 * 60 * 11.5);
      const ratioBefore = await ratioFeed.getRatio(token1.address);
      const newRatio = ratioBefore - 1n;
      await expect(ratioFeed.connect(operator).updateRatio(token1.address, newRatio))
        .to.be.revertedWithCustomError(ratioFeed, "RatioNotUpdated")
        .withArgs(1n);
      expect(await ratioFeed.getRatio(token1.address)).to.be.eq(ratioBefore);
    });

    it("Reverts: when new ratio > current ratio", async function () {
      await increaseChainTimeForSeconds(60 * 60 * 12);
      const ratioBefore = await ratioFeed.getRatio(token1.address);
      const newRatio = ratioBefore + 1n;
      await expect(ratioFeed.connect(operator).updateRatio(token1.address, newRatio))
        .to.be.revertedWithCustomError(ratioFeed, "RatioNotUpdated")
        .withArgs(2n);
    });

    it("Reverts: when current - new ratio > threshold", async function () {
      const ratioBefore = await ratioFeed.getRatio(token1.address);
      const threshold = (ratioBefore * (await ratioFeed.ratioThreshold())) / (await ratioFeed.MAX_THRESHOLD());
      const newRatio = ratioBefore - (threshold + 1n);
      await expect(ratioFeed.connect(operator).updateRatio(token1.address, newRatio))
        .to.be.revertedWithCustomError(ratioFeed, "RatioNotUpdated")
        .withArgs(3n);
      expect(await ratioFeed.getRatio(token1.address)).to.be.eq(ratioBefore);
    });

    it("Reverts: only operator can", async function () {
      const ratioBefore = await ratioFeed.getRatio(token1.address);
      const newRatio = ratioBefore - 1n;
      await expect(ratioFeed.connect(signer1).updateRatio(token1.address, newRatio)).to.be.revertedWithCustomError(
        ratioFeed,
        "OnlyOperatorAllowed",
      );
    });
  });

  describe("repairRatioFor(): sets specified value", function () {
    before(async function () {
      [ratioFeed, protocolConfig] = await loadFixture(init);

      await ratioFeed.setRatioThreshold(10000000n);
      await ratioFeed.connect(operator).updateRatio(token1.address, _1E18);
    });

    it("Decrease ratio", async function () {
      const ratioBefore = await ratioFeed.getRatio(token1.address);
      console.log(`Ratio before: ${ratioBefore}`);
      const newRatio = randomBI(18);

      await expect(ratioFeed.repairRatio(token1.address, newRatio))
        .to.emit(ratioFeed, "RatioUpdated")
        .withArgs(token1.address, ratioBefore, newRatio);

      const ratioAfter = await ratioFeed.getRatio(token1.address);
      expect(ratioAfter).to.be.eq(newRatio);
    });

    it("Increase ratio", async function () {
      const ratioBefore = await ratioFeed.getRatio(token1.address);
      console.log(`Ratio before: ${ratioBefore}`);
      const newRatio = ratioBefore + 1n;

      await expect(ratioFeed.repairRatio(token1.address, newRatio))
        .to.emit(ratioFeed, "RatioUpdated")
        .withArgs(token1.address, ratioBefore, newRatio);

      const ratioAfter = await ratioFeed.getRatio(token1.address);
      expect(ratioAfter).to.be.eq(newRatio);
    });

    it("Reverts: when new ratio = 0", async function () {
      await expect(ratioFeed.repairRatio(token1.address, "0"))
        .to.be.revertedWithCustomError(ratioFeed, "RatioNotUpdated")
        .withArgs(3n);
    });

    it("Reverts: only governance can", async function () {
      await expect(ratioFeed.connect(signer1).repairRatio(token1.address, randomBI(18))).to.be.revertedWithCustomError(
        ratioFeed,
        "OnlyGovernanceAllowed",
      );
    });
  });

  describe("averagePercentageRate()", function () {
    before(async function () {
      [ratioFeed, protocolConfig] = await loadFixture(init);

      await ratioFeed.setRatioThreshold(1000000n);
      await ratioFeed.connect(operator).updateRatio(token1.address, _1E18);
    });

    it("Publish ratio for 8days", async function () {
      for (let i = 1n; i < 8n; i++) {
        const ts = await increaseChainTimeForSeconds(60 * 60 * 24); //12h
        const ratioBefore = await ratioFeed.getRatio(token1.address);
        // const newRatio = ratioBefore.sub(randomBNbyMax(toBN(1000000)));
        const newRatio = ratioBefore - 27396509684666n * i;
        console.log(`${i}. Ratio:\t${ts?.timestamp}\t${ratioBefore}`);
        await ratioFeed.connect(operator).updateRatio(token1.address, newRatio);
      }
    });

    it("Get apr", async function () {
      for (let i = 1; i < 8; i++) {
        const apr = await ratioFeed.averagePercentageRate(token1.address, i);
        const aprPercent = apr / 1000000000n / 1000000000n;
        console.log(`${i}. APR: ${aprPercent}%`);
        //APR: 0.990287047%
      }
    });
  });
});
