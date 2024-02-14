const { ethers, upgrades } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { readJsonFiles, getVaultImplAndStrategyAddress } = require("../../../utils");

async function main() {
  // get all current vaults
  vaults = await readJsonFiles("./scripts/migration/addresses");
  for (const [vaultName, vaultData] of vaults) {
    const vaultAddress = vaultData.iVaultAddress;

    await getTotalDeposited(vaultName, vaultAddress);
  }
}

const getTotalDeposited = async (vaultName, vaultAddress) => {
  const vault = await ethers.getContractAt("InVault_E2", vaultAddress);

  console.log(vaultName);
  const totalDelegated = (await vault.getTotalDeposited()) - (await vault.totalAmountToWithdraw());
  const totalDelegatedInETH = await getWayToCalculate(vaultName, totalDelegated);
  console.log(`TVL for ${vaultName}: ${totalDelegated.toString()} -> ${totalDelegatedInETH.toString()} in ETH`);

  return totalDelegated;
};

const getWayToCalculate = async (vaultName, amount) => {
  let token, ethAmount;
  switch (vaultName) {
    case "IncbEthVault":
      token = await ethers.getContractAt("WBEth", "0xBe9895146f7AF43049ca1c1AE358B0541Ea49704");
      ethAmount = (amount * token.exchangeRate()) / 1e18;
      return ethAmount;
    case "mainnet_InEthxVault":
      token = await ethers.getContractAt("StaderStakePoolsManager", "0xcf5ea1b38380f6af39068375516daf40ed70d299");
      ethAmount = await token.swETHToETHRate(amount);
      return ethAmount;
    case "InlsEthVault":
      token = await ethers.getContractAt("LsETH", "0x8c1bed5b9a0928467c9b1341da1d7bd5e10b6549");
      ethAmount = await token.underlyingBalanceFromShares(amount);
      return ethAmount;
    case "mainnet_InmEthVault":
      token = await ethers.getContractAt("StakingPool", "0xe3cBd06D7dadB3F4e6557bAb7EdD924CD1489E8f");
      ethAmount = await token.mETHToETH(amount);
      return ethAmount;
    case "mainnet_InoEthVault":
      return amount;
    case "mainnet_InosEthVault":
      token = await ethers.getContractAt("StaderStakePoolsManager", "0x64f2907F92631619ED7Ea510982835F9e1024767");
      ethAmount = (amount * token.exchangeRate()) / 1e18;
      return ethAmount;
    case "mainnet_InrEthVault":
      return "0x540529f2cf6b0ce1cd39c65815487afd54b61c2f";
    case "mainnet_InsfrxEthVault":
      token = await ethers.getContractAt("StaderStakePoolsManager", "0xac3e018457b222d93114458476f3e3416abbe38f");
      ethAmount = await token.convertToAssets(amount);
      return ethAmount;
    case "mainnet_InstEthVault":
      return "0x540529f2cf6b0ce1cd39c65815487afd54b61c2f";
    case "mainnet_InswEthVault":
      token = await ethers.getContractAt("SwEth", "0xf951e335afb289353dc249e82926178eac7ded78");
      ethAmount = await token.swETHToETHRate(amount);
      return ethAmount;
    case "mainnet_InwbEthVault":
      token = await ethers.getContractAt("WBEth", "0xa2e3356610840701bdf5611a53974510ae27e2e1");
      ethAmount = (amount * token.exchangeRate()) / 1e18;
      return ethAmount;
  }
  return "";
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
