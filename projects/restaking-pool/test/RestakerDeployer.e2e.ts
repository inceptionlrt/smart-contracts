import { ethers } from "hardhat";
import { expect } from "chai";
import { RestakerDeployer } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { _1E18 } from "./helpers/constants";

describe("RestakerDeployer forked", function () {
  let deployer: RestakerDeployer, caller: HardhatEthersSigner, upgrader: HardhatEthersSigner;

  console.log("skip");
  return;

  describe("deploy", function () {
    before(async function () {
      deployer = await ethers.getContractAt("RestakerDeployer", "0x10ccB7aFb5C2C20fffA38eAf1FbC99db571Bf57A");
      caller = await ethers.getImpersonatedSigner(
        "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8", // any rich EOA
      );
      upgrader = await ethers.getImpersonatedSigner(
        "0x7Ef94A8cb0De6eF9fBFA5602B9FBad4320dDDb80", // our deployer
      );

      // top up upgrader
      await caller.sendTransaction({
        to: await upgrader.getAddress(),
        value: _1E18 * 10n,
      });
    });

    it("Reverts: deploy() failes before upgrade", async function () {
      await expect(deployer.connect(caller).deployRestaker()).to.be.reverted;
    });

    it("upgrade", async () => {
      const newImpl = await ethers.deployContract("Restaker", caller);
      const upgradeableBeacon = await ethers.getContractAt(
        "SimpleBeacon",
        "0x82D87F4c7171CABb9Ac55Ae3F60F7d15f595A46a",
      );
      await upgradeableBeacon.connect(upgrader).upgradeTo(await newImpl.getAddress());
    });

    it("deploy()", async function () {
      const nonce = await deployer.nonce();
      const restaker = await deployer.getRestaker(nonce);
      await expect(deployer.connect(caller).deployRestaker())
        .to.emit(deployer, "RestakerDeployed")
        .withArgs(caller.address, restaker, nonce);
    });
  });
});
