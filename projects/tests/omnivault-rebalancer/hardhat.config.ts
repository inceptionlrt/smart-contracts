import "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import { CONFIG } from "../../../hh.config";
import "@nomicfoundation/hardhat-toolbox";
import "@layerzerolabs/test-devtools-evm-hardhat";
import "hardhat-gas-reporter";
import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";
import fse from "fs-extra";
import path from "path";

const TARGET_DIR = "./contracts";
const EXTERNAL_PROJECTS = ["../../bridge-lz", "../../restaking-pool", "../../vaults"];

const copyContracts = () => {
  EXTERNAL_PROJECTS.forEach(project => {
    const srcDir = path.resolve(project + "/contracts");
    const dstDir = path.join(TARGET_DIR, path.basename(project));
    console.log("src dir:", srcDir);
    console.log("dst dir:", dstDir);

    //Clear old contracts
    fse.removeSync(dstDir);
    fse.ensureDirSync(dstDir);

    //Cope
    fse.copySync(srcDir, dstDir, { overwrite: true });
  });
};
copyContracts();

const config: HardhatUserConfig = {
  ...(CONFIG as HardhatUserConfig),
  networks: {
    hardhat: {
      forking: {
        url: process.env.MAINNET_RPC,
        blockNumber: 20810000,
      },
      addresses: {
        restakingPoolConfig: "0x81b98D3a51d4aC35e0ae132b0CF6b50EA1Da2603",
        restakingPool: "0x46199cAa0e453971cedf97f926368d9E5415831a",
        inceptionVault: "0x295234B7E370a5Db2D2447aCA83bc7448f151161",
        lib: "0x8a6a8a7233b16d0ecaa7510bfd110464a0d69f66",
        cToken: "0xf073bAC22DAb7FaF4a3Dd6c6189a70D54110525C",
        inceptionToken: "0x668308d77be3533c909a692302Cb4D135Bf8041C",
        sfrxETH: "0xac3e018457b222d93114458476f3e3416abbe38f",
        ratioFeed: "0x122ee24Cb3Cc1b6B987800D3B54A68FC16910Dbf",
        lockbox: "0xb86d7BfB30E4e9552Ba1Dd6208284667DF2E8c0E",
      },
    },
  },
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

export default config;

