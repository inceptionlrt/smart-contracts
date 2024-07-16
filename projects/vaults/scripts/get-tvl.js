const { ethers, upgrades } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { readJsonFiles, getVaultImplAndStrategyAddress } = require("./utils");

async function main() {
  // get all current vaults
  vaults = await readJsonFiles("./scripts/migration/addresses");
  let totalETH = BigInt(0);
  for (const [vaultName, vaultData] of vaults) {
    const vaultAddress = vaultData.iVaultAddress;

    const delegatedETH = await getTotalDeposited(vaultName, vaultAddress);
    totalETH += delegatedETH;
  }
  console.log(`total ETH: ${totalETH.toString()}`);
}

const getTotalDeposited = async (vaultName, vaultAddress) => {
  const vault = await ethers.getContractAt("InVault_E2", vaultAddress);

  // console.log(vaultName);
  const totalDelegated = (await vault.getTotalDeposited()) - (await vault.totalAmountToWithdraw());
  const totalDelegatedInETH = await getWayToCalculate(vaultName, totalDelegated);
  console.log(
    `TVL for ${vaultName}: ${totalDelegated.toString()} -> ${totalDelegatedInETH.toString()} in ETH | RATE: ${
      (totalDelegated * BigInt(1e18)) / totalDelegatedInETH
    }`,
  );

  return totalDelegatedInETH;
};

const getWayToCalculate = async (vaultName, amount) => {
  let token, ethAmount;

  switch (vaultName) {
    case "InankrEthVault":
      token = await ethers.getContractAt("AETHC", "0xe95a203b1a91a908f9b9ce46459d101078c2c3cb");
      ethAmount = (amount * BigInt(1e18)) / (await token.ratio());
      return ethAmount;
    case "IncbEthVault":
      token = await ethers.getContractAt("WBEth", "0xBe9895146f7AF43049ca1c1AE358B0541Ea49704");
      ethAmount = (amount * (await token.exchangeRate())) / BigInt(1e18);
      return ethAmount;
    case "InEthxVault":
      token = await ethers.getContractAt("StaderStakePoolsManager", "0xcf5ea1b38380f6af39068375516daf40ed70d299");
      ethAmount = await token.convertToAssets(amount);
      return ethAmount;
    case "InlsEthVault":
      token = await ethers.getContractAt("LsETH", "0x8c1bed5b9a0928467c9b1341da1d7bd5e10b6549");
      ethAmount = await token.underlyingBalanceFromShares(amount);
      return ethAmount;
    case "InmEthVault":
      token = await ethers.getContractAt("StakingPool", "0xe3cBd06D7dadB3F4e6557bAb7EdD924CD1489E8f");
      ethAmount = await token.mETHToETH(amount);
      return ethAmount;
    case "InoEthVault":
      return amount;
    case "InosEthVault":
      token = await ethers.getContractAt("StaderStakePoolsManager", "0x64f2907F92631619ED7Ea510982835F9e1024767");
      ethAmount = await token.convertToAssets(amount);
      return ethAmount;
    case "InrEthVault":
      token = await ethers.getContractAt("rETH", "0xae78736cd615f374d3085123a210448e74fc6393");
      ethAmount = await token.getEthValue(amount);
      return ethAmount;
    case "InsfrxEthVault":
      token = await ethers.getContractAt("StaderStakePoolsManager", "0xac3e018457b222d93114458476f3e3416abbe38f");
      ethAmount = await token.convertToAssets(amount);
      return ethAmount;
    case "InstEthVault":
      return amount;
    case "InswEthVault":
      token = await ethers.getContractAt("SwEth", "0xf951e335afb289353dc249e82926178eac7ded78");
      const rate_ = await token.swETHToETHRate();
      ethAmount = (amount * rate_) / BigInt(1e18);
      return ethAmount;
    case "InwbEthVault":
      token = await ethers.getContractAt("WBEth", "0xa2e3356610840701bdf5611a53974510ae27e2e1");
      ethAmount = (amount * (await token.exchangeRate())) / BigInt(1e18);
      return ethAmount;
  }
  return "";
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
