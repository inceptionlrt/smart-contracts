import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { takeSnapshot } from "@nomicfoundation/hardhat-network-helpers";
import { SnapshotRestorer } from "@nomicfoundation/hardhat-network-helpers/src/helpers/takeSnapshot";
import { deployConfig, deployCToken } from "./helpers/deploy";
import { expect } from "chai";
import { CToken, ProtocolConfig } from "../typechain-types";
import { randomBI } from "./helpers/math";

describe("cToken", function () {
  let cToken: CToken;
  let protocolConfig: ProtocolConfig;

  let initialName = "initialName";
  let initialSymbol = "InitSYMBOL";

  let governance: HardhatEthersSigner, operator: HardhatEthersSigner, treasury: HardhatEthersSigner;
  let pool: HardhatEthersSigner, rebalancer: HardhatEthersSigner, signer: HardhatEthersSigner;
  let snapshot: SnapshotRestorer;
  before(async function () {
    [governance, operator, treasury, pool, rebalancer, signer] = await ethers.getSigners();

    protocolConfig = await deployConfig([governance, operator, treasury]);
    cToken = await deployCToken(protocolConfig, initialName, initialSymbol);
    await protocolConfig.connect(governance).setRestakingPool(pool.address);
    await protocolConfig.connect(governance).setRebalancer(rebalancer.address);

    snapshot = await takeSnapshot();
  });

  describe("Setters", function () {
    before(async function () {
      await snapshot.restore();
    });

    it("should return correct name", async function () {
      expect(await cToken.name()).to.equal(initialName);
    });

    it("should return correct symbol", async function () {
      expect(await cToken.symbol()).to.equal(initialSymbol);
    });

    it("should change symbol", async function () {
      const newSymbol = "NEWSYM";
      await expect(cToken.connect(governance).changeSymbol(newSymbol))
        .to.emit(cToken, "SymbolChanged")
        .withArgs(newSymbol);
      expect(await cToken.symbol()).to.equal(newSymbol);
    });

    it("should change name", async function () {
      const newName = "NewName";
      await expect(cToken.connect(governance).changeName(newName)).to.emit(cToken, "NameChanged").withArgs(newName);
      expect(await cToken.name()).to.equal(newName);
    });
  });

  describe("Mint", function () {
    before(async function () {
      await snapshot.restore();
    });

    it("mint restaking pool can", async function () {
      const amount = randomBI(18);
      const tx = await cToken.connect(pool).mint(signer.address, amount);
      await expect(tx).changeTokenBalance(cToken, signer, amount);
    });

    it("mint rebalancer can", async function () {
      const amount = randomBI(18);
      const tx = await cToken.connect(rebalancer).mint(signer.address, amount);
      await expect(tx).changeTokenBalance(cToken, signer, amount);
    });

    it("mint reverts when called not by pool or rebalancer", async function () {
      const amount = randomBI(18);
      await expect(cToken.connect(signer).mint(signer.address, amount)).to.be.revertedWithCustomError(
        cToken,
        "OnlyMinterAllowed",
      );
    });
  });

  describe("Burn", function () {
    before(async function () {
      await snapshot.restore();
      await cToken.connect(pool).mint(signer.address, randomBI(18));
    });

    it("burn restaking pool can", async function () {
      const amount = randomBI(16);
      const tx = await cToken.connect(pool).burn(signer.address, amount);
      await expect(tx).changeTokenBalance(cToken, signer, -amount);
    });

    it("burn rebalancer can", async function () {
      const amount = randomBI(16);
      const tx = await cToken.connect(rebalancer).burn(signer.address, amount);
      await expect(tx).changeTokenBalance(cToken, signer, -amount);
    });

    it("burn reverts when called not by pool or rebalancer", async function () {
      const amount = randomBI(16);
      await expect(cToken.connect(signer).burn(signer.address, amount)).to.be.revertedWithCustomError(
        cToken,
        "OnlyMinterAllowed",
      );
    });
  });
});
