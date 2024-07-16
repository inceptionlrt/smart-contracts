import { ethers, upgrades } from "hardhat";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { beforeEach } from "node:test";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { BaseContract, Contract } from "ethers";
import { deployConfig, deployEigenMocks } from "./helpers/deploy";
import { ERC20Mock, Restaker } from "../typechain-types";

let owner: HardhatEthersSigner, other: HardhatEthersSigner;

const init = async () => {
  [owner, other] = await ethers.getSigners();

  const protocolConfig = await deployConfig([owner, owner, owner]);

  const { eigenPodManager, delegationManager } = await deployEigenMocks();

  const ERC20 = await ethers.getContractFactory("ERC20Mock");
  const erc20 = await ERC20.deploy();
  await erc20.waitForDeployment();

  const restakerFacets = await upgrades.deployProxy(
    await ethers.getContractFactory("RestakerFacets"),
    [owner.address, await eigenPodManager.getAddress(), await delegationManager.getAddress()],
    { redeployImplementation: "always" },
  );
  await restakerFacets.waitForDeployment();

  const Restaker = await ethers.getContractFactory("Restaker");
  const beacon = await upgrades.deployBeacon(Restaker, {
    redeployImplementation: "always",
  });
  await beacon.waitForDeployment();

  const restaker = await upgrades.deployBeaconProxy(beacon, Restaker, [
    owner.address,
    await restakerFacets.getAddress(),
  ]);
  await restaker.waitForDeployment();

  await eigenPodManager.test_addPod(await restaker.getAddress(), await erc20.getAddress());
  await erc20.transfer(await restaker.getAddress(), 10n * 10n ** 18n);

  return [restaker, erc20.attach(await restaker.getAddress()), erc20];
};

describe("Restaker", function () {
  let restaker: Restaker, erc20Restaker: ERC20Mock, erc20: ERC20Mock;

  before(async function () {
    [restaker, erc20Restaker, erc20] = await helpers.loadFixture(init);
  });

  it("call from owner to transfer erc20 from restaker to other", async () => {
    await expect(erc20Restaker.transfer(other.address, "100"))
      .to.emit(erc20, "Transfer")
      .withArgs(await restaker.getAddress(), other.address, "100");

    expect(await erc20.balanceOf(other.address)).to.be.eq("100");
  });

  it("revert if not owner", async () => {
    await expect(erc20Restaker.connect(other).transfer(owner.address, "100")).to.be.revertedWithCustomError(
      restaker,
      "OwnableUnauthorizedAccount",
    );
  });
});
