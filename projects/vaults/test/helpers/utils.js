const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, network } = require("hardhat");
BigInt.prototype.format = function () {
  return this.toLocaleString("de-DE");
};

const addRewardsToStrategyEigen = async (strategyAddress, amount, staker) => {
  //const strategy = await ethers.getContractAt("IStrategy", strategyAddress);
  const asset = await ethers.getContractAt("Eigen", "0x3B78576F7D6837500bA3De27A60c7f594934027E");
  await asset.connect(staker).unwrap(amount);
  const bEigen = await ethers.getContractAt("BackingEigen", "0x275cCf9Be51f4a6C94aBa6114cdf2a4c45B9cb27");

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

const calculateRatio = async (vault, token) => {
  const totalSupply = await token.totalSupply();
  const totalDeposited = await vault.getTotalDeposited();
  const totalAmountToWithdraw = await vault.totalAmountToWithdraw();

  console.log(" ============ RATIO DEBUG ============");
  console.log("totalSupply: ", totalSupply);
  console.log("totalDeposited: ", totalDeposited);
  console.log("totalAmountToWithdraw: ", totalAmountToWithdraw);

  let denominator;
  if (totalDeposited < totalAmountToWithdraw) {
    denominator = 0n;
  } else {
    denominator = totalDeposited - totalAmountToWithdraw;
  }

  // const e28 = 10000_000_000_000_000_000_000_000_000n;

  if (denominator === 0n || totalSupply === 0n) {
    console.log("iToken supply is 0, so the ration is going to be 1e18");
    return e18;
  }

  const ratio = (totalSupply * e18) / denominator;
  if ((totalSupply * e18) % denominator !== 0n) {
    return ratio + 1n;
  }
  // console.log(`Current ratio is:\t\t\t\t${ratio.format()}`);
  return ratio;
};

const withdrawDataFromTx = async (tx, operatorAddress, restaker) => {
  const receipt = await tx.wait();
  if (receipt.logs.length !== 3) {
    console.error("WRONG NUMBER OF EVENTS in withdrawFromEigenLayerEthAmount()", receipt.logs.length);
    console.log(receipt.logs);
  }

  const WithdrawalQueuedEvent = receipt.logs?.find(e => e.eventName === "StartWithdrawal").args;
  return [
    WithdrawalQueuedEvent["stakerAddress"],
    operatorAddress,
    restaker,
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

const mineBlocks = async count => {
  console.log(`WAIT FOR ${count} BLOCKs`);
  for (let i = 0; i < count; i++) {
    await network.provider.send("evm_mine");
  }
};
const toWei = ether => ethers.parseEther(ether.toString());

const toBN = n => BigInt(n);
const randomBI = length => {
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

const randomBIMax = max => {
  let random = 0n;
  if (max > 0n) {
    random += BigInt(Math.floor(Math.random() * Number(max)));
  }
  return random;
};

async function sleep(msec) {
  return new Promise(resolve => setTimeout(resolve, msec));
}
const randomAddress = () => ethers.Wallet.createRandom().address;
const format = bi => bi.toLocaleString("de-DE");

const e28 = 10000_000_000_000_000_000_000_000_000n;
const e18 = 1000_000_000_000_000_000n;
const e9 = 1000_000_000n;
const zeroWithdrawalData = [
  ethers.ZeroAddress,
  ethers.ZeroAddress,
  ethers.ZeroAddress,
  0,
  1,
  [ethers.ZeroAddress],
  [0],
];

const day = 86400n;

module.exports = {
  addRewardsToStrategy,
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
  e28,
  day,
};

