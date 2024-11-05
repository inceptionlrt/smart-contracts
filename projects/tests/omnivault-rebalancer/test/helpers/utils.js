const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");
const { keccak256, toUtf8Bytes, AbiCoder } = require("ethers");
BigInt.prototype.format = function () {
  return this.toLocaleString("de-DE");
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
  return account;
};

const getStaker = async (address, iVault, asset, donor, amount = 10n ** 21n) => {
  const staker = await impersonateWithEth(address, toWei(1));
  await asset.connect(donor).transfer(address, amount);
  const balanceAfter = await asset.balanceOf(address);
  await asset.connect(staker).approve(await iVault.getAddress(), balanceAfter);
  return staker;
};

const getRandomStaker = async (iVault, asset, donor, amount) => {
  return await getStaker(ethers.Wallet.createRandom().address, iVault, asset, donor, amount);
};

const toWei = ether => ethers.parseEther(ether.toString());

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
    random += BigInt(Math.random() * Number(max));
  }
  return random;
};

const e18 = 10n ** 18n;

/**
 * @return slot number for the value by its internal name for restaking balance ProtocolConfig
 */
function getSlotByName(name) {
  // Perform keccak256 hashing of the string
  const governanceHash = keccak256(toUtf8Bytes(name));

  // Convert the resulting hash to a BigInt
  const governanceUint = BigInt(governanceHash);

  // Subtract 1 from the hash
  const governanceUintMinus1 = governanceUint - 1n;

  // Use the AbiCoder to encode the uint256 type
  const abiCoder = new AbiCoder();
  const encodedValue = abiCoder.encode(["uint256"], [governanceUintMinus1]);

  // Re-hash the encoded result
  const finalHash = keccak256(encodedValue);

  // Perform bitwise AND operation with ~0xff (mask out the last byte)
  const mask = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00");
  const governanceSlot = BigInt(finalHash) & mask;

  // Return the result as a hex string (without '0x' prefix)
  return governanceSlot.toString(16);
}

module.exports = {
  impersonateWithEth,
  getStaker,
  getRandomStaker,
  toWei,
  randomBI,
  randomBIMax,
  e18,
  getSlotByName,
};
