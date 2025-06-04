import { impersonateWithEth, toWei } from "../../../helpers/utils";
import { ethers } from "hardhat";

const wETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // Lido stETH

export const wETH = {
  blockNumber: 22166925,
  ratioErr: 3n,
  transactErr: 5n,
  vault: {
    name: "InstEthVault",
    contractName: "InceptionVault_S", // vaultFactory
    operator: "0xd87D15b80445EC4251e33dBe0668C335624e54b7", // iVaultOperator
  },

  asset: {
    name: "wETH",
    nonWrappedAssetAddress: wETHAddress,
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    donor: "0x57757E3D981446D585Af0D9Ae4d7DF6D64647806",
    wstETH: "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
    wstETHDonor: "0xd85351181b3F264ee0FDFa94518464d7c3DefaDa"
  },

  adapters: {
    mellowV3: [
      {
        name: "P2P",
        vaultAddress: "0xb11C95eeB53FF748B6Dd4e2F9f4294F8F4030aF0",
        wrapperAddress: "0xfd4a4922d1afe70000ce0ec6806454e78256504e",
        bondStrategyAddress: "0xA0ea6d4fe369104eD4cc18951B95C3a43573C0F6",
        curatorAddress: "0xA1E38210B06A05882a7e7Bfe167Cd67F07FA234A",
        configuratorAddress: "0x84b240E99d4C473b5E3dF1256300E2871412dDfe",
      },
      {
        name: "Mev Capital",
        vaultAddress: "0xcAfC35fB68DFCD6AF2BC264E687c6c0279284068",
        wrapperAddress: "0xfd4a4922d1afe70000ce0ec6806454e78256504e",
        bondStrategyAddress: "0xc3A149b5Ca3f4A5F17F5d865c14AA9DBb570F10A",
        curatorAddress: "0xA1E38210B06A05882a7e7Bfe167Cd67F07FA234A",
        configuratorAddress: "0x2dEc4fDC225C1f71161Ea481E23D66fEaAAE2391",
      },
    ],
  },

  impersonateStaker: async function(staker, iVault) {
    // add wETH
    const donor = await impersonateWithEth(this.asset.donor, toWei(1));
    const weth = await ethers.getContractAt("IERC20", this.asset.address);
    const wethAmount = toWei(1000);
    await weth.connect(donor).transfer(staker.address, wethAmount);
    await weth.connect(staker).approve(await iVault.getAddress(), wethAmount);

    // add wstETH
    const donor1 = await impersonateWithEth(this.asset.wstETHDonor, toWei(10));
    const wstAmount = toWei(100);
    const wstEth = await ethers.getContractAt("IERC20", this.asset.wstETH);
    await wstEth.connect(donor1).transfer(staker.address, wstAmount);
    await wstEth.connect(staker).approve(await iVault.getAddress(), wstAmount);

    return staker;
  },
};
