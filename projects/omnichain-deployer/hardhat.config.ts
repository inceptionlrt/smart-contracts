import { HardhatUserConfig } from "hardhat/config";
import { CONFIG } from "../../hh.config";
import "@nomicfoundation/hardhat-toolbox";
import "@layerzerolabs/test-devtools-evm-hardhat";
import "hardhat-gas-reporter";
import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";
import fse from "fs-extra";
import path from "path";

const EXTERNAL_PROJECTS = [ "../vaults", "../bridge-lz", "./mocks"];
const TARGET_DIR = "./contracts";

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
    fse.copySync(srcDir, dstDir, { overwrite: true });
  });
};
copyContracts();

const config: HardhatUserConfig = {
  ...(CONFIG as HardhatUserConfig),
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
