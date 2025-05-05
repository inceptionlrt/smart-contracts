import 'dotenv/config';
import importSync from 'import-sync';
import { stETH } from './stETH';
import { impersonateWithEth, toWei } from '../../../helpers/utils';
import hardhat from "hardhat";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";

const { ethers } = hardhat;

const assetName = process.env.ASSET_NAME;
if (!assetName) throw new Error("ASSET_NAME variable is required. Please set it in your .env file");

type AssetData = typeof stETH & {
  impersonateStaker: (staker: any, iVault: any) => Promise<any>;
  addRewardsMellowVault: (amount: any, mellowVault: any) => Promise<void>;
  applySymbioticSlash: (symbioticVault: any, slashAmount: any) => Promise<void>;
};

const filePath = `./${assetName}.ts`;
let assetData: AssetData;
try {
  const importedModule = importSync(filePath);
  const importedModuleKeys = Object.keys(importedModule);
  if (importedModuleKeys.length === 0) {
    throw new Error(`No exports found in ${filePath}`);
  }
  assetData = importedModule[importedModuleKeys[0]] as AssetData;
} catch (error) {
  // const filesInDir = fs.readdirSync(`${process.cwd()}/test/data/assets/new/${assetName}`);
  // const availableAssetNames = filesInDir.map(file => file.replace('.ts', '')).filter(name => name !== 'index');
  // throw new Error(`Asset data file not found. Available asset names: ${availableAssetNames.join(', ')}`);
  throw new Error(`File with data for ${assetName} not found.`);
}

assetData.impersonateStaker = async function (staker, iVault) {
  const donor = await impersonateWithEth(assetData.asset.donor, toWei(1));
  const stEth = await ethers.getContractAt("stETH", assetData.asset.nonWrappedAssetAddress);
  const stEthAmount = toWei(1000);
  await stEth.connect(donor).approve(this.asset.address, stEthAmount);

  const wstEth = await ethers.getContractAt("IWSteth", this.asset.address);
  const balanceBefore = await wstEth.balanceOf(donor.address);
  await wstEth.connect(donor).wrap(stEthAmount);
  const balanceAfter = await wstEth.balanceOf(donor.address);

  const wstAmount = balanceAfter - balanceBefore;
  await wstEth.connect(donor).transfer(staker.address, wstAmount);
  await wstEth.connect(staker).approve(await iVault.getAddress(), wstAmount);
  return staker;
};

assetData.addRewardsMellowVault = async function (amount, mellowVault) {
  const donor = await impersonateWithEth(this.asset.donor, toWei(1));
  const stEth = await ethers.getContractAt("stETH", assetData.asset.nonWrappedAssetAddress);
  await stEth.connect(donor).approve(this.asset.address, amount);

  const wstEth = await ethers.getContractAt("IWSteth", this.asset.address);
  const balanceBefore = await wstEth.balanceOf(donor);
  await wstEth.connect(donor).wrap(amount);
  const balanceAfter = await wstEth.balanceOf(donor);
  const wstAmount = balanceAfter - balanceBefore;
  await wstEth.connect(donor).transfer(mellowVault, wstAmount);
};

assetData.applySymbioticSlash = async function (symbioticVault, slashAmount) {
  const slasherAddressStorageIndex = 3;

  const [deployer] = await ethers.getSigners();

  await helpers.setStorageAt(
    await symbioticVault.getAddress(),
    slasherAddressStorageIndex,
    ethers.AbiCoder.defaultAbiCoder().encode(["address"], [await deployer.getAddress()]),
  );

  await symbioticVault.connect(deployer).onSlash(slashAmount, await symbioticVault.currentEpochStart());
};

export { assetData };
