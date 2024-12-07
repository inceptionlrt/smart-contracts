import { HardhatUserConfig } from "hardhat/config";
import { CONFIG } from "../../hh.config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";

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
  sourcify: {
    enabled: true
  }
};

export default config;
