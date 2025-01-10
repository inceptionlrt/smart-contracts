import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, network, upgrades } from "hardhat";
import { expect } from "chai";
import { deployEigenMocks, deployRestakerContacts } from "./helpers/deploy";
import { DelegationManagerMock, EigenPodManagerMock, RestakerDeployer, RestakerFacets } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { _1E18 } from "./helpers/constants";
import { AddressLike } from "ethers";

const ceilN = (n: bigint, d: bigint) => n / d + (n % d ? 1n : 0n);

let signer1: HardhatEthersSigner,
  owner: HardhatEthersSigner,
  treasury: HardhatEthersSigner,
  signer2: HardhatEthersSigner,
  signer3: HardhatEthersSigner;

const init = async () => {
  [signer1, owner, treasury, signer2, signer3] = await ethers.getSigners();

  // EigenLayr
  const el = await deployEigenMocks();

  // Restaker
  const { restakerDeployer, restakerFacets, beacon } = await deployRestakerContacts({
    ...el,
    owner: owner.address,
  });

  return [restakerDeployer, restakerFacets, beacon, el.eigenPodManager, el.delegationManager];
};

describe("RestakerDeployer", function () {
  let deployer: RestakerDeployer,
    facets: RestakerFacets,
    beacon: AddressLike,
    elPodManager: EigenPodManagerMock,
    elDelegationManager: DelegationManagerMock;

  describe("deploy", function () {
    before(async function () {
      [deployer, facets, beacon, elPodManager, elDelegationManager] = await loadFixture(init);
    });

    it("nonce is available", async () => {
      expect(await deployer.nonce()).to.be.eq("0");
    });

    it("restaker address calculated", async () => {
      expect(await deployer.getRestaker(0)).to.be.eq(
        "0xF767f5E202f7224e39cB983ff865Ae73E563599e", // TODO: calculate in test
      );
    });

    it("deploy()", async function () {
      const nonce = await deployer.nonce();
      const restaker = await deployer.getRestaker(nonce);
      await expect(deployer.deployRestaker())
        .to.emit(deployer, "RestakerDeployed")
        .withArgs(signer1.address, restaker, nonce);
    });
  });
});
