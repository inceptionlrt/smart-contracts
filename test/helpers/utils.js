const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, network } = require("hardhat");
const hre = require("hardhat");

const updateStrategyRatio = async (strategyAddress, amount, staker) => {
  const strategyFactory = await ethers.getContractFactory("StrategyBaseDummy");
  const strategy = strategyFactory.attach(strategyAddress);

  const assetAddress = await strategy.underlyingToken();
  const assetFactory = await ethers.getContractFactory("InceptionToken");
  const asset = assetFactory.attach(assetAddress);
  await asset.connect(staker).transfer(strategy.address, amount);
}

const withdrawDataFromTx = async (tx, iVault) => {
  const receipt = await tx.wait();
  if (receipt.events.length !== 3) {
    console.error("WRONG NUMBER OF EVENTS in withdrawFromEigenLayerEthAmount()", receipt.events.length);
    console.log(receipt.events);
  }

  const WithdrawalQueuedEvent = receipt.events[2].args;
  const withdrawalData = [
    WithdrawalQueuedEvent["strategies"],
    WithdrawalQueuedEvent["shares"],
    iVault.address,
    [iVault.address, WithdrawalQueuedEvent["nonce"]],
    WithdrawalQueuedEvent["withdrawalStartBlock"],
    WithdrawalQueuedEvent["delegatedAddress"],
  ];

  const assetsToWithdraw = [];
  const StrategyBaseFactory = await hre.ethers.getContractFactory("StrategyBaseDummy");
  for (const strategyAddress of WithdrawalQueuedEvent["strategies"]) {
    const strategy = StrategyBaseFactory.attach(strategyAddress);
    const assetAddress = await strategy.underlyingToken();
    assetsToWithdraw.push(assetAddress);
  }
  return [withdrawalData, assetsToWithdraw];
}

const impersonateWithEth = async (address, amount) => {
  await helpers.impersonateAccount(address);
  const account = await ethers.getSigner(address);

  //Deposit some Eth to account
  const [treasury] = await ethers.getSigners();
  await treasury.sendTransaction({ to: address, value: amount });

  console.log(`Account impersonated at address: ${account.address}`);
  // console.log(`Account balance Eth: ${format(await ethers.provider.getBalance(account.address))}`);
  return account;
}

const getStaker = async (address, iVault, asset, donor, amount= 100_000_000_000_000_000_000n) => {
  const staker = await impersonateWithEth(address, toWei(1));
  // console.log(`Donor asset balance: ${format(await asset.balanceOf(donor.address))}`);
  await asset.connect(donor).transfer(address, amount);
  const balanceAfter = await asset.balanceOf(address);
  // console.log(`Staker asset balance: ${format(balanceAfter)}`);
  await asset.connect(staker).approve(iVault.address, balanceAfter);
  return staker;
}

const getRandomStaker = async (iVault, asset, donor, amount) => {
  return await getStaker(randomAddress(), iVault, asset, donor, amount);
}

class Snapshotter {
  snapshotId;
  constructor() {
    this.snapshotId = 0;
  }
  async snapshot() {
    this.snapshotId = await network.provider.send("evm_snapshot", []);
    console.log(`... Hardhat snapshot #${this.snapshotId} was captured ...`);
  }
  async revert() {
    await network.provider.send("evm_revert", [this.snapshotId]);
    console.log(`... Hardhat snapshot #${this.snapshotId} was reverted ...`);
    this.snapshotId = await network.provider.send("evm_snapshot", []);
  }
}

const mineBlocks = async (count) => {
  console.log(`WAIT FOR ${count} BLOCKs`);
  for (let i = 0; i < count; i++) {
    await network.provider.send("evm_mine");
  }
}
const toWei = (ether) => ethers.utils.parseEther(ether.toString());
const randomBN = (length) => {
  if (length > 0) {
    let randomNum = "";
    randomNum += Math.floor(Math.random() * 9) + 1; // generates a random digit 1-9
    for (let i = 0; i < length - 1; i++) {
      randomNum += Math.floor(Math.random() * 10); // generates a random digit 0-9
    }
    return ethers.BigNumber.from(randomNum);
  } else {
    return ethers.BigNumber.from(0);
  }
}

const randomAddress  = () => ethers.Wallet.createRandom().address;
const format = (bn) => bn.toBigInt().toLocaleString("de-DE");

module.exports = {
  updateStrategyRatio,
  withdrawDataFromTx,
  impersonateWithEth,
  getStaker,
  getRandomStaker,
  Snapshotter,
  mineBlocks,
  toWei,
  randomBN,
  format,
  randomAddress
};