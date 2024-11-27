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

  before(async function () {
    [governance, operator, treasury, signer1, signer2] = await ethers.getSigners();
  });

  beforeEach(async function () {
    [config] = await helpers.loadFixture(init);
  });

  const setters = [
    {
      name: "operator",
      setter: "setOperator",
      getter: "getOperator",
      event: "OperatorChanged",
    },
    {
      name: "governance",
      setter: "setGovernance",
      getter: "getGovernance",
      event: "GovernanceChanged",
    },
    {
      name: "ratio feed",
      setter: "setRatioFeed",
      getter: "getRatioFeed",
      event: "RatioFeedChanged",
    },
    {
      name: "treasury",
      setter: "setTreasury",
      getter: "getTreasury",
      event: "TreasuryChanged",
    },
    {
      name: "restaking pool",
      setter: "setRestakingPool",
      getter: "getRestakingPool",
      event: "RestakingPoolChanged",
    },
    {
      name: "cToken",
      setter: "setCToken",
      getter: "getCToken",
      event: "CTokenChanged",
    },
    {
      name: "rebalancer",
      setter: "setRebalancer",
      getter: "getRebalancer",
      event: "RebalancerChanged",
    },
  ];

  setters.forEach(function (arg) {
    it(`${arg.name}: set new`, async function () {
      const prevValue = await config[arg.getter]();
      const newValue = ethers.Wallet.createRandom().address;
      await expect(config[arg.setter](newValue)).to.emit(config, arg.event).withArgs(prevValue, newValue);

      expect(await config[arg.getter]()).to.be.eq(newValue);
    });

    it(`${arg.setter} reverts when called by not a governance`, async function () {
      const newValue = ethers.Wallet.createRandom().address;
      await expect(config.connect(signer1)[arg.setter](newValue)).to.be.revertedWithCustomError(
        config,
        "OnlyGovernanceAllowed",
      );
    });

    it(`${arg.setter} reverts new value is 0 address`, async function () {
      const newValue = ethers.ZeroAddress;
      await expect(config[arg.setter](newValue)).to.be.revertedWithCustomError(config, "ZeroAddress");
    });
  });
});
