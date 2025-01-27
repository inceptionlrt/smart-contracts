import { HardhatUserConfig } from "hardhat/config";
import { CONFIG } from "../../hh.config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-storage-layout";

// Hardhat tasks
import "./tasks/get-free-balances";
import "./tasks/get-inception-vaults";
import "./tasks/deposit-extra";

const config: HardhatUserConfig = {
  ...(CONFIG as HardhatUserConfig),
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100,
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: `${process.env.HOLESKY_RPC}`,
        blockNumber: 2680454,
      },
    },
  },
};

export default config;
