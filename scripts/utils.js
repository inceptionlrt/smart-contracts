const hre = require("hardhat");
const { ethers } = require("hardhat");
const toBN = ethers.BigNumber.from;

const advanceBlock = async () => {
  hre.network.provider.send("evm_mine");
};

const advanceBlocks = async (count) => {
  for (let i = 0; i < count; i++) {
    await advanceBlock();
  }
};

module.exports = {
  advanceBlocks,
};
