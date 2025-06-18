import { impersonateWithEth, toWei } from "../../../helpers/utils";
import { ethers } from "hardhat";

export const wstETH_holesky = {
  blockNumber: 4023176,
  ratioErr: 3n,
  transactErr: 5n,
  vault: {
    name: "InstEthVault",
    contractName: "InceptionVault_S", // vaultFactory
    operator: '0xd87D15b80445EC4251e33dBe0668C335624e54b7', // iVaultOperator
  },

  asset: {
    name: "wstETH",
    address: "0x8d09a4502Cc8Cf1547aD300E066060D043f6982D", // wstETH, collateral
    strategy: "0x7D704507b76571a51d9caE8AdDAbBFd0ba0e63d3",
    donor: "0x0000000000a2d441d85315e5163dEEC094bf6FE1",
  },

  adapters: {
    mellowV3: [
      {
        name: "MultiVaultTest-1",
        vaultAddress: "0xD1d9c7cd66721e43579Be95BC6D13b56817Dd54D",
        wrapperAddress: "",
        bondStrategyAddress: "",
        curatorAddress: "",
        configuratorAddress: "",
      }
    ]
  },

  impersonateStaker: async function(staker, iVault) {
    const wstETHDonor = await impersonateWithEth(this.asset.donor, toWei(10));
    const wstAmount = toWei(100);
    const wstEth = await ethers.getContractAt("IWSteth", this.asset.address);
    await wstEth.connect(wstETHDonor).transfer(staker.address, wstAmount);
    await wstEth.connect(staker).approve(await iVault.getAddress(), wstAmount);
    return staker;
  },
};