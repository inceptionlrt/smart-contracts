import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@openzeppelin/hardhat-upgrades";
import "solidity-coverage";
import "hardhat-gas-reporter";
import "hardhat-dependency-compiler";

import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.26",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    holesky: {
      url: process.env.HOLESKY_RPC_URL || "",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY || ""],
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY || ""],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v6",
  },
  dependencyCompiler: {
    paths: [
      "crosschain-adapters/contracts/l1/AbstractCrossChainAdapterL1.sol",
      "crosschain-adapters/contracts/l1/CrossChainAdapterArbitrumL1.sol"
    ],
  },

};

export default config;
