const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, network } = require("hardhat");
BigInt.prototype.format = function() {
  return this.toLocaleString("de-DE");
};

const addRewardsToStrategyWrap = async (strategyAddress, assetAddres, amount, staker) => {
  const strategy = await ethers.getContractAt("IStrategy", strategyAddress);

  console.log("await strategy.underlyingToken(): ", await strategy.underlyingToken());
  console.log("assetAddres: ", assetAddres);

  const asset = await ethers.getContractAt("Eigen", assetAddres);
  console.log("assetAddres: ", await asset.balanceOf(await staker.getAddress()));

  await asset.connect(staker).unwrap(amount);

  const bEigen = await ethers.getContractAt("Eigen", await strategy.underlyingToken());

  await bEigen.connect(staker).transfer(strategyAddress, amount);
};

const addRewardsToStrategy = async (strategyAddress, amount, staker) => {
  const strategy = await ethers.getContractAt("IStrategy", strategyAddress);
  const asset = await ethers.getContractAt("IERC20", await strategy.underlyingToken());
  await asset.connect(staker).transfer(strategyAddress, amount);

  //const strategy = await ethers.getContractAt("IStrategy", strategyAddress);
  // const asset = await ethers.getContractAt("Eigen", "0xec53bf9167f50cdeb3ae105f56099aaab9061f83");
  // await asset.connect(staker).unwrap(amount);
  // const bEigen = await ethers.getContractAt("BackingEigen", "0x83E9115d334D248Ce39a6f36144aEaB5b3456e75");

  // await bEigen.connect(staker).transfer(strategyAddress, amount);
};

const calculateRatio = async (vault, token, queue) => {
  const totalDelegated = await vault.getTotalDelegated();
  const totalAssets = await vault.totalAssets();
  const depositBonusAmount = await vault.depositBonusAmount();
  // const pendingWithdrawals = await vault.getTotalPendingWithdrawals();
  const emergencyPendingWithdrawals = await vault.getTotalPendingEmergencyWithdrawals();
  const totalDeposited = totalDelegated + totalAssets + emergencyPendingWithdrawals + depositBonusAmount;
  const totalSharesToWithdraw = await vault.totalSharesToWithdraw();
  const redeemReservedAmount = await vault.redeemReservedAmount();
  const totalSupply = await token.totalSupply();

  const numeral = totalSupply + totalSharesToWithdraw;
  const denominator = totalDelegated + totalAssets + emergencyPendingWithdrawals + depositBonusAmount - redeemReservedAmount;

  console.log("ratio{");
  console.log("totalSupply: " + totalSupply);
  console.log("totalSharesToWithdraw: " + totalSharesToWithdraw);
  console.log("totalDelegated: ", totalDelegated);
  console.log("totalAssets: " + totalAssets);
  console.log("emergencyPendingWithdrawals: " + emergencyPendingWithdrawals);
  console.log("depositBonusAmount: " + depositBonusAmount);
  console.log("redeemReservedAmount: " + redeemReservedAmount);
  console.log("}");

  if (denominator === 0n || numeral === 0n || (totalSupply === 0n && totalDelegated <= 0n)) {
    console.log("iToken supply is 0, so the ration is going to be 1e18");
    return e18;
  }

  // if(emergencyPendingWithdrawals === 0n && totalSupply === 0n) {
  //   return e18;
  // }

  const ratio = (numeral * e18) / denominator;
  // if ((numeral * e18) % denominator !== 0n) {
  //   return ratio + 1n;
  // }

  return ratio;
};

const withdrawDataFromTx = async (tx, operatorAddress, adapter) => {
  const receipt = await tx.wait();
  if (receipt.logs.length !== 3) {
    console.error("WRONG NUMBER OF EVENTS in withdrawFromEigenLayerEthAmount()", receipt.logs.length);
    console.log(receipt.logs);
  }

  console.log(receipt.logs[receipt.logs.length - 2]);
  const WithdrawalQueuedEvent = receipt.logs?.find((e) => e.eventName === "StartWithdrawal").args;
  return [
    WithdrawalQueuedEvent["stakerAddress"],
    operatorAddress,
    adapter,
    WithdrawalQueuedEvent["nonce"],
    WithdrawalQueuedEvent["withdrawalStartBlock"],
    [WithdrawalQueuedEvent["strategy"]],
    [WithdrawalQueuedEvent["shares"]],
  ];
};

const impersonateWithEth = async (address, amount) => {
  await helpers.impersonateAccount(address);
  const account = await ethers.getSigner(address);

  //Deposit some Eth to account
  if (amount > 0n) {
    const [treasury] = await ethers.getSigners();
    await treasury.sendTransaction({ to: address, value: amount });
  }

  console.log(`Account impersonated at address: ${account.address}`);
  // console.log(`Account balance Eth: ${format(await ethers.provider.getBalance(account.address))}`);
  return account;
};

const getStaker = async (address, iVault, asset, donor, amount = 100_000_000_000_000_000_000n) => {
  const staker = await impersonateWithEth(address, toWei(1));
  // console.log(`Donor asset balance: ${format(await asset.balanceOf(donor.address))}`);
  await asset.connect(donor).transfer(address, amount);
  const balanceAfter = await asset.balanceOf(address);
  // console.log(`Staker asset balance: ${format(balanceAfter)}`);
  await asset.connect(staker).approve(await iVault.getAddress(), balanceAfter);
  return staker;
};

const getRandomStaker = async (iVault, asset, donor, amount) => {
  return await getStaker(randomAddress(), iVault, asset, donor, amount);
};

async function setBlockTimestamp(timestamp) {
  await network.provider.send("evm_setNextBlockTimestamp", [timestamp]);
  await network.provider.send("evm_mine");
}

const mineBlocks = async (count) => {
  console.log(`WAIT FOR ${count} BLOCKs`);
  for (let i = 0; i < count; i++) {
    await network.provider.send("evm_mine");
  }
};
const toWei = (ether) => ethers.parseEther(ether.toString());

const toBN = (n) => BigInt(n);
const randomBI = (length) => {
  if (length > 0) {
    let randomNum = "";
    randomNum += Math.floor(Math.random() * 9) + 1; // generates a random digit 1-9
    for (let i = 0; i < length - 1; i++) {
      randomNum += Math.floor(Math.random() * 10); // generates a random digit 0-9
    }
    return BigInt(randomNum);
  } else {
    return 0n;
  }
};

const randomBIMax = (max) => {
  let random = 0n;
  if (max > 0n) {
    random += BigInt(Math.floor(Math.random() * Number(max)));
  }
  return random;
};

async function sleep(msec) {
  return new Promise((resolve) => setTimeout(resolve, msec));
}

const randomAddress = () => ethers.Wallet.createRandom().address;
const format = (bi) => bi.toLocaleString("de-DE");

const e18 = 1000_000_000_000_000_000n;
const e9 = 1000_000_000n;
const zeroWithdrawalData = [ethers.ZeroAddress, ethers.ZeroAddress, ethers.ZeroAddress, 0, 1, [ethers.ZeroAddress], [0]];

const day = 86400n;

module.exports = {
  addRewardsToStrategy,
  addRewardsToStrategyWrap,
  withdrawDataFromTx,
  impersonateWithEth,
  setBlockTimestamp,
  calculateRatio,
  getStaker,
  getRandomStaker,
  mineBlocks,
  toWei,
  toBN,
  randomBI,
  randomBIMax,
  sleep,
  randomAddress,
  format,
  e18,
  day,
};
