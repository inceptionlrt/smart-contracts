import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import hardhat from "hardhat";
import { impersonateWithEth, toWei } from '../../helpers/utils';
const { ethers } = hardhat;

const donorAddress = '0x5313b39bf226ced2332C81eB97BB28c6fD50d1a3';
const stETHAddress = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'; // Lido stETH

export const stETH = {
  assetName: "stETH",
  assetAddress: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0", // wstETH, collateral
  vaultName: "InstEthVault",
  vaultFactory: "InceptionVault_S",
  iVaultOperator: "0xd87D15b80445EC4251e33dBe0668C335624e54b7",
  ratioErr: 3n,
  transactErr: 5n,
  blockNumber: 22516224, //21687985,
  impersonateStaker: async function (staker, iVault) {
    const donor = await impersonateWithEth(donorAddress, toWei(1));
    const wstEth = await ethers.getContractAt("IWSteth", this.assetAddress);
    await wstEth.connect(donor).transfer(staker.address, toWei(1000));
    await wstEth.connect(staker).approve(await iVault.getAddress(), toWei(1000));
    return staker;
  },
  addRewardsMellowVault: async function (amount, mellowVault) {
    const donor = await impersonateWithEth(donorAddress, toWei(1));
    const wstEth = await ethers.getContractAt("IWSteth", this.assetAddress);
    await wstEth.connect(donor).transfer(mellowVault, amount);
  },
  applySymbioticSlash: async function (symbioticVault, slashAmount) {
    const slasherAddressStorageIndex = 3;

    const [deployer] = await ethers.getSigners();

    await helpers.setStorageAt(
      await symbioticVault.getAddress(),
      slasherAddressStorageIndex,
      ethers.AbiCoder.defaultAbiCoder().encode(["address"], [await deployer.getAddress()]),
    );

    await symbioticVault.connect(deployer).onSlash(slashAmount, await symbioticVault.currentEpochStart());
  },
};
