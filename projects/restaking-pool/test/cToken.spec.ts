import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { deployConfig, deployCToken } from "./helpers/deploy";
import { expect } from "chai";
import { CToken } from "../typechain-types";

describe("cToken", function () {
  let cToken: CToken;

  let initialName = "initialName";
  let initialSymbol = "InitSYMBOL";

  let governance: HardhatEthersSigner, operator: HardhatEthersSigner, treasury: HardhatEthersSigner;

  beforeEach(async function () {
    [governance, operator, treasury] = await ethers.getSigners();

    const protocolConfig = await deployConfig([governance, operator, treasury]);
    cToken = await deployCToken(protocolConfig, initialName, initialSymbol);
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

  it("should return correct name", async function () {
    expect(await cToken.name()).to.equal(initialName);
  });

  it("should return correct symbol", async function () {
    expect(await cToken.symbol()).to.equal(initialSymbol);
  });
});
