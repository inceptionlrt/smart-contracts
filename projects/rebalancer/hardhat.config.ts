require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
import "@nomicfoundation/hardhat-verify";
import { resolve } from "path";

/** @type import('hardhat/config').HardhatUserConfig */
const config: HardhatUserConfig = {
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545/",
    },
    ethereum: {
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
      url: `${process.env.RPC_URL_ETHEREUM}`,
      chainId: 1,
      gas: 8000000,
    },
    holesky: {
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
      url: `${process.env.RPC_URL_HOLESKY}`,
      chainId: 17000,
      gas: 8000000,
    },
    sepolia: {
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
      url: `${process.env.RPC_URL_SEPOLIA}`,
      chainId: 11155111.,
      gas: 8000000,
    },
    arbitrum: {
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
      url: `${process.env.RPC_URL_ARBITRUM}`,
      chainId: 42161,
      gas: 8000000,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.26",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: "YOUR_ETHERSCAN_API_KEY"
  },
  paths: {
    sources: "./contracts", // default path for contracts
    cache: "./cache",
    artifacts: "./artifacts",
  },
  external: {
    contracts: [
      {
        artifacts: resolve(__dirname, "./node_modules/genesis-smart-contracts/artifacts"),
        sources: resolve(__dirname, "./node_modules/genesis-smart-contracts/contracts"),
      },
    ],
  },
  include: [resolve(__dirname, "./contracts"), resolve(__dirname, "./genesis-smart-contracts")],
};

export default config;
