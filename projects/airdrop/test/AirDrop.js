const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const initialSupply = ethers.parseEther("10000");

const init = async (ownerAddress) => {
  const TokenFactory = await ethers.getContractFactory("Token");
  const token = await upgrades.deployProxy(TokenFactory, ["TestToken", "TTK", initialSupply]);

  const AirdropFactory = await ethers.getContractFactory("InceptionAirdrop");
  const airdrop = await upgrades.deployProxy(AirdropFactory, [ownerAddress, ownerAddress, await token.getAddress()]);

  await token.transfer(await airdrop.getAddress(), ethers.parseEther("1000"));

  return [token, airdrop];
};

describe("Inception AirDrop", function () {
  let token;
  let airdrop;
  let owner, addr1, addr2, addr3;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    [token, airdrop] = await init(await owner.getAddress());
  });

  it("Should set initial airdrop balances and not overwrite existing balances", async function () {
    await airdrop.setAirdropBalances([addr1.address, addr2.address], [ethers.parseEther("100"), ethers.parseEther("200")]);

    expect(await airdrop.airdropBalances(addr1.address)).to.equal(ethers.parseEther("100"));
    expect(await airdrop.airdropBalances(addr2.address)).to.equal(ethers.parseEther("200"));

    await airdrop.setAirdropBalances([addr1.address], [ethers.parseEther("300")]);

    // Should remain the same
    expect(await airdrop.airdropBalances(addr1.address)).to.equal(ethers.parseEther("100"));
  });

  it("Should allow a user to claim their airdrop", async function () {
    await airdrop.setAirdropBalances([addr1.address], [ethers.parseEther("100")]);

    const initialBalance = await token.balanceOf(addr1.address);

    await airdrop.connect(addr1).claimAirdrop();

    const finalBalance = await token.balanceOf(addr1.address);
    expect(finalBalance - initialBalance).to.equal(ethers.parseEther("100"));

    expect(await airdrop.claimed(addr1.address)).to.be.true;
  });

  it("Should fail if a user tries to claim twice with AirdropAlreadyClaimed custom error", async function () {
    await airdrop.setAirdropBalances([addr1.address], [ethers.parseEther("100")]);

    await airdrop.connect(addr1).claimAirdrop();

    await expect(airdrop.connect(addr1).claimAirdrop()).to.be.revertedWithCustomError(airdrop, "AirdropAlreadyClaimed");
  });

  it("Should fail if a user tries to claim with no available balance with NoAirdropAvailable custom error", async function () {
    expect(await airdrop.airdropBalances(addr3.address)).to.equal(0);

    await expect(airdrop.connect(addr3).claimAirdrop()).to.be.revertedWithCustomError(airdrop, "NoAirdropAvailable");
  });

  it("Should update airdrop balances", async function () {
    await airdrop.setAirdropBalances([addr1.address, addr2.address], [ethers.parseEther("100"), ethers.parseEther("200")]);

    await airdrop.updateAirdrop([addr1.address], [ethers.parseEther("150")]);

    expect(await airdrop.airdropBalances(addr1.address)).to.equal(ethers.parseEther("150"));

    await airdrop.connect(addr1).claimAirdrop();

    await airdrop.updateAirdrop([addr1.address], [ethers.parseEther("200")]);
    expect(await airdrop.airdropBalances(addr1.address)).to.equal(ethers.parseEther("200"));
  });

  it("Should revert if array lengths don't match in setAirdropBalances with ArrayLengthsMismatch custom error", async function () {
    await expect(airdrop.setAirdropBalances([addr1.address, addr2.address], [ethers.parseEther("100")])).to.be.revertedWithCustomError(
      airdrop,
      "ArrayLengthsMismatch"
    );
  });

  it("Should withdraw tokens after the airdrop", async function () {
    const initialOwnerBalance = await token.balanceOf(owner.address);

    await airdrop.withdrawTokens(ethers.parseEther("500"));

    const finalOwnerBalance = await token.balanceOf(owner.address);
    expect(finalOwnerBalance - initialOwnerBalance).to.equal(ethers.parseEther("500"));
  });

  it("Should emit events for airdrop claimed and updated", async function () {
    await airdrop.setAirdropBalances([addr1.address], [ethers.parseEther("100")]);

    await expect(airdrop.updateAirdrop([addr1.address], [ethers.parseEther("150")]))
      .to.emit(airdrop, "AirdropUpdated")
      .withArgs(addr1.address, ethers.parseEther("100"), ethers.parseEther("150"));

    await expect(airdrop.connect(addr1).claimAirdrop())
      .to.emit(airdrop, "AirdropClaimed")
      .withArgs(addr1.address, ethers.parseEther("150"));
  });

  it("Should estimate gas for setAirdropBalances with 2700 addresses", async function () {
    const numAddresses = 1200;

    // Generate numAddresses dummy addresses and corresponding balances
    const addresses = [];
    const balances = [];
    const balancePerAddress = ethers.parseEther("1");

    for (let i = 0; i < numAddresses; i++) {
      const newWallet = ethers.Wallet.createRandom(); // Create random address
      addresses.push(newWallet.address);
      balances.push(balancePerAddress);
    }

    // Estimate the gas cost for setting airdrop balances
    const tx = await airdrop.setAirdropBalances(addresses, balances);
    const receipt = await tx.wait();

    // Output the gas used by the transaction
    console.log("Gas used for setAirdropBalances with 2700 addresses:", receipt.gasUsed.toString());
  });
});
