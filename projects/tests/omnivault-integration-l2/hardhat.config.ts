import "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import { CONFIG } from "../../../hh.config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";
import fs from "fs";
import fse from "fs-extra";
import path from "path";

const TARGET_DIR = "./contracts";
const EXTERNAL_PROJECTS = [
  "../../crosschain-adapters",
  "../../vaults"
]

const collectContractsWithSymlinks = () => {
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR);
  }

  EXTERNAL_PROJECTS.forEach((project) => {
    const baseName = path.basename(project);
    const symlinkPath = path.join(TARGET_DIR, baseName);
    console.log("basename: ", baseName);
    console.log("symlinkPath: ", symlinkPath);

    if (!fs.existsSync(symlinkPath)) {
      const resolvedSourceDir = path.resolve(project);
      fs.symlinkSync(path.join(resolvedSourceDir, "contracts"), symlinkPath, 'dir');
    }
  });
};
// collectContractsWithSymlinks();

const copyContracts = () => {
  EXTERNAL_PROJECTS.forEach((project) => {
    const srcDir = path.resolve(project + "/contracts");
    const dstDir = path.join(TARGET_DIR, path.basename(project));
    console.log("src dir:", srcDir);
    console.log("dst dir:", dstDir);

    //Clear old contracts
    fse.removeSync(dstDir);
    fse.ensureDirSync(dstDir);

    //Cope
    fse.copySync(srcDir, dstDir, {overwrite: true});
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
        OPT_DOMAIN_MESSENGER: "0x4200000000000000000000000000000000000007",
        OPT_BRIDGE: "0x4200000000000000000000000000000000000010"
      }
    },
  },
  solidity: {
    version: "0.8.26",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 0,
      },
    },
  },
};

export default config;
