import { HardhatUserConfig } from "hardhat/config";
import { CONFIG } from "../../hh.config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";
import fs from "fs";
import path from "path";

const TARGET_DIR = "./contracts";
const EXTERNAL_PROJECTS = [
  "../crosschain-adapters",
  "../rebalancer",
]

const collectContracts = () => {
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

collectContracts();

const config: HardhatUserConfig = {
  ...(CONFIG as HardhatUserConfig),
  solidity: {
    version: "0.8.26",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

export default config;
