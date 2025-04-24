import { ethers } from "hardhat";
import { impersonateWithEth, toWei } from "../../helpers/utils";

export const wstETH = {
    vaultName: "InstEthVault",
    vaultFactory: "InVault_S_E2",
    assetName: "stETH",
    assetAddress: "0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034",
    assetPoolName: "LidoMockPool",
    assetPool: "0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034",
    assetStrategy: "0x7D704507b76571a51d9caE8AdDAbBFd0ba0e63d3",
    strategyManager: "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6",
    iVaultOperator: "0xa4341b5Cf43afD2993e1ae47d956F44A2d6Fc08D",
    delegationManager: "0xA44151489861Fe9e3055d95adC98FbD462B948e7",
    rewardsCoordinator: "0xAcc1fb458a1317E886dB376Fc8141540537E68fE",
    withdrawalDelayBlocks: 400,
    ratioErr: 2n,
    transactErr: 5n,
    blockNumber: 3338549,
    url: "https://holesky.drpc.org",
    impersonateStaker: async function (staker, iVault) {
      const stETHDonorAddress = "0x66b25CFe6B9F0e61Bd80c4847225Baf4EE6Ba0A2";
      const donor = await impersonateWithEth(stETHDonorAddress, toWei(1));
      const stEth = await ethers.getContractAt("stETH", this.assetAddress);
      const stEthAmount = toWei(1000);
      await stEth.connect(donor).transfer(staker.address, stEthAmount);
      await stEth.connect(staker).approve(iVault, stEthAmount);
      return staker;
    },
  };

export const wstETHWrapped = {
  ...wstETH,
  assetAddress: "0x8d09a4502cc8cf1547ad300e066060d043f6982d",
  backedAssetAddress: "0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034",
  impersonateStaker: async function(staker, iVault) {
    const wstETHDonorAddress = "0x0000000000a2d441d85315e5163dEEC094bf6FE1";
    const donor1 = await impersonateWithEth(wstETHDonorAddress, toWei(10));

    const wstAmount = toWei(100);
    const wstEth = await ethers.getContractAt("IWSteth", this.assetAddress);
    await wstEth.connect(donor1).transfer(staker.address, wstAmount);
    await wstEth.connect(staker).approve(await iVault.getAddress(), wstAmount);

    const stETHDonorAddress = "0x66b25CFe6B9F0e61Bd80c4847225Baf4EE6Ba0A2";
    const donor2 = await impersonateWithEth(stETHDonorAddress, toWei(1));
    const stEth = await ethers.getContractAt("stETH", this.backedAssetAddress);
    const stEthAmount = toWei(1000);
    await stEth.connect(donor2).transfer(staker.address, stEthAmount);
    await stEth.connect(staker).approve(iVault, stEthAmount);

    return staker;
  },
};

export type AssetData = typeof wstETH | typeof wstETHWrapped;
