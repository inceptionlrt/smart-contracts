const { ethers, upgrades, network } = require("hardhat");
const { takeSnapshot } = require("@nomicfoundation/hardhat-network-helpers");

BigInt.prototype.format = function () {
  return this.toLocaleString("de-DE");
};

async function init() {
  console.log("- iToken");
  const iTokenFactory = await ethers.getContractFactory("InceptionToken");
  const iToken = await upgrades.deployProxy(iTokenFactory, ["TEST InceptionLRT Token", "tINt"]);
  iToken.address = await iToken.getAddress();

  console.log("- Omni vault");
  const iVaultFactory = await ethers.getContractFactory("InceptionOmniVault");
  const omniVault = await upgrades.deployProxy(iVaultFactory, [iToken.address]);
  omniVault.address = await omniVault.getAddress();

  await iToken.setVault(omniVault.address);

  return [iToken, omniVault];
}

describe("Inception omni vault", function() {
  this.timeout(150000);
  let omniVault, iToken;
  let owner, signer1, signer2, signer3;
  let snapshot;

   before(async function() {
     [owner, signer1, signer2, signer3] = await ethers.getSigners();
     [iToken, omniVault] = await init();
     snapshot = await takeSnapshot();
   })

  describe("Base flow", function() {





  })


})