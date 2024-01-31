/////////////////////////////////////////////////
///// Run with the default network, hardhat ////
///////////////////////////////////////////////

const { ethers, network, upgrades } = require("hardhat");
const { expect } = require("chai");

const e18 = "1000000000000000000",
  amount = "10000000";

let iToken, staker1, staker2;

const initInceptionToken = async () => {
  console.log(`... Initialization of Inception Token ...`);

  [owner, staker1, staker2] = await ethers.getSigners();

  const iTokenFactory = await ethers.getContractFactory("InceptionToken");
  iToken = await upgrades.deployProxy(iTokenFactory, ["Test Token", "TT"]);

  await iToken.setVault(owner.address);
  console.log(`... iToken initialization completed ....`);
};

describe("Inception token", function () {
  this.timeout(150000);

  before(async function () {
    await initInceptionToken();
  });

  describe("Pausable functionality", function () {
    it("base functions work properly", async function () {
      // 'vault' mints some tokens to staker_1
      await iToken.connect(owner).mint(staker1.address, e18);

      // approve
      await iToken.connect(staker1).approve(staker2.address, e18);

      // staker_1 transfers to staker_2
      await iToken.connect(staker1).transfer(staker2.address, amount);
      await iToken.connect(staker2).transferFrom(staker1.address, staker2.address, amount);

      // 'vault' burns tokens from staker_2
      await iToken.connect(owner).burn(staker2.address, amount);
    });

    it("set on pause", async function () {
      expect(await iToken.paused()).equal(false);
      await expect(iToken.connect(staker1).pause()).to.be.revertedWith("Ownable: caller is not the owner");
      await iToken.connect(owner).pause();
      await expect(iToken.connect(owner).pause()).to.be.revertedWith("InceptionToken: paused");
      expect(await iToken.paused()).equal(true);
    });

    it("mint && burn are paused", async function () {
      await expect(iToken.connect(owner).mint(staker1.address, e18)).to.be.revertedWith("InceptionToken: token transfer while paused");
      await expect(iToken.connect(owner).burn(staker1.address, e18)).to.be.revertedWith("InceptionToken: token transfer while paused");
    });

    it("transfer && transferFrom are paused", async function () {
      await expect(iToken.connect(staker1).transfer(staker1.address, amount)).to.be.revertedWith(
        "InceptionToken: token transfer while paused"
      );
      await expect(iToken.connect(staker2).transferFrom(staker1.address, staker2.address, amount)).to.be.revertedWith(
        "InceptionToken: token transfer while paused"
      );
    });

    it("unpause", async function () {
      expect(await iToken.paused()).equal(true);
      await expect(iToken.connect(staker1).unpause()).to.be.revertedWith("Ownable: caller is not the owner");
      await iToken.connect(owner).unpause();
      await expect(iToken.connect(owner).unpause()).to.be.revertedWith("InceptionToken: not paused");
      expect(await iToken.paused()).equal(false);
    });

    it("base functions work properly after unpause", async function () {
      // 'vault' mints some tokens to staker_1
      await iToken.connect(owner).mint(staker1.address, e18);

      // staker_1 transfers to staker_2
      await iToken.connect(staker1).transfer(staker2.address, amount);
      await iToken.connect(staker2).transferFrom(staker1.address, staker2.address, amount);

      // 'vault' burns tokens from staker_2
      await iToken.connect(owner).burn(staker2.address, amount);
    });
  });
});
