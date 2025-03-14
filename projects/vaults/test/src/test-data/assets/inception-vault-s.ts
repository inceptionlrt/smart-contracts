import hardhat from "hardhat";
import { impersonateWithEth, toWei } from '../../../helpers/utils';
const { ethers } = hardhat;

export const stETH = {
  assetName: "stETH",
  assetAddress: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
  vaultName: "InstEthVault",
  vaultFactory: "InVault_S_E2",
  iVaultOperator: "0xd87D15b80445EC4251e33dBe0668C335624e54b7",
  ratioErr: 3n,
  transactErr: 5n,
  blockNumber: 21850700, //21687985,
  impersonateStaker: async function (staker, iVault) {
    const donor = await impersonateWithEth("0x43594da5d6A03b2137a04DF5685805C676dEf7cB", toWei(1));
    const stEth = await ethers.getContractAt("stETH", "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84");
    const stEthAmount = toWei(1000);
    await stEth.connect(donor).approve(this.assetAddress, stEthAmount);

    const wstEth = await ethers.getContractAt("IWSteth", this.assetAddress);
    const balanceBefore = await wstEth.balanceOf(donor.address);
    await wstEth.connect(donor).wrap(stEthAmount);
    const balanceAfter = await wstEth.balanceOf(donor.address);

    const wstAmount = balanceAfter - balanceBefore;
    await wstEth.connect(donor).transfer(staker.address, wstAmount);
    await wstEth.connect(staker).approve(await iVault.getAddress(), wstAmount);
    return staker;
  },
  addRewardsMellowVault: async function (amount, mellowVault) {
    const donor = await impersonateWithEth("0x43594da5d6A03b2137a04DF5685805C676dEf7cB", toWei(1));
    const stEth = await ethers.getContractAt("stETH", "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84");
    await stEth.connect(donor).approve(this.assetAddress, amount);

    const wstEth = await ethers.getContractAt("IWSteth", this.assetAddress);
    const balanceBefore = await wstEth.balanceOf(donor);
    await wstEth.connect(donor).wrap(amount);
    const balanceAfter = await wstEth.balanceOf(donor);
    const wstAmount = balanceAfter - balanceBefore;
    await wstEth.connect(donor).transfer(mellowVault, wstAmount);
  },
};
