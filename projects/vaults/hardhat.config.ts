// import { HardhatUserConfig } from "hardhat/config";
import { CONFIG } from "../../hh.config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";

// Hardhat tasks
import "./tasks/get-free-balances";
import "./tasks/get-inception-vaults";
import "./tasks/deposit-extra";

const config: HardhatUserConfig = {
  // ...(CONFIG as HardhatUserConfig),
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

export default config;
