const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time, loadFixture } = require(
  "@nomicfoundation/hardhat-network-helpers",
);

describe("InceptionOmniVault", function () {
  async function deployVaultFixture() {
    const [owner, user, treasury] = await ethers.getSigners();

    const iTokenFactory = await ethers.getContractFactory("InceptionToken");
    const inceptionToken = await upgrades.deployProxy(iTokenFactory, [
      "Test Token",
      "TT",
    ]);

    // Deploy InceptionOmniVault
    const iVaultFactory = await ethers.getContractFactory("InEthOmniVault");
    const inceptionOmniVault = await upgrades.deployProxy(iVaultFactory, [
      await inceptionToken.getAddress(),
    ]);
    const vaultAddr = await inceptionOmniVault.getAddress();

    await inceptionToken.setVault(vaultAddr);
    inceptionOmniVault.setTargetFlashCapacity(
      ethers.parseUnits("500", "ether"),
    );

    return { inceptionOmniVault, inceptionToken, owner, user, treasury };
  }

  describe("Deposit and Withdraw", function () {
    it("Should deposit successfully", async function () {
      const { inceptionOmniVault, user } = await loadFixture(
        deployVaultFixture,
      );

      await ethers.provider.send("hardhat_setBalance", [
        user.address,
        ethers.toBeHex(ethers.parseUnits("1000", "ether")),
      ]);

      const amountToDeposit = ethers.parseUnits("100", "ether");

      // Deposit
      await expect(
        await inceptionOmniVault.connect(user).deposit(user.address, {
          value: ethers.toBeHex(amountToDeposit),
        }),
      )
        .to.emit(inceptionOmniVault, "Deposit")
        .withArgs(user.address, user.address, amountToDeposit, anyValue);
    });
  });

  it("Should flash withdraw successfully", async function () {
    const { inceptionOmniVault, inceptionToken, user } = await loadFixture(
      deployVaultFixture,
    );

    await ethers.provider.send("hardhat_setBalance", [
      user.address,
      ethers.toBeHex(ethers.parseUnits("1000", "ether")),
    ]);
    const amountToDeposit = ethers.parseUnits("100", "ether");
    await inceptionOmniVault.connect(user).deposit(user.address, {
      value: ethers.toBeHex(amountToDeposit),
    });

    const userShares = await inceptionToken.balanceOf(user.address);

    // Withdraw
    await expect(
      inceptionOmniVault.connect(user).flashWithdraw(userShares, user.address),
    )
      .to.emit(inceptionOmniVault, "Withdraw")
      .withArgs(user.address, user.address, user.address, anyValue, userShares);
  });
});
