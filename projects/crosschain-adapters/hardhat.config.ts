require("dotenv").config();
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545/",
    },
    // ethereum: {
    //   accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
    //   url: `${process.env.RPC_URL_ETHEREUM}`,
    //   chainId: 1,
    //   gas: 8000000,
    // },
    // sepolia: {
    //   accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
    //   url: `${process.env.RPC_URL_SEPOLIA}`,
    //   chainId: 11155111.,
    //   gas: 800000,
    // },
    // arbitrum: {
    //   accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
    //   url: `${process.env.RPC_URL_ARBITRUM}`,
    //   chainId: 42161,
    //   gas: 8000000,
    // },
    // arbitrumSepolia: {
    //   accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
    //   url: `${process.env.RPC_URL_ARBITRUM_SEPOLIA}`,
    //   chainId: 42161,
    //   gas: 8000000,
    // },
    // optimism: {
    //   accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
    //   url: `${process.env.RPC_URL_OPTIMISM}`,
    //   chainId: 10,
    //   gas: 8000000,
    // },
    // optimismSepolia: {
    //   accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
    //   url: `${process.env.RPC_URL_OPTIMISM_SEPOLIA}`,
    //   chainId: 11155420,
    //   gas: 8000000,
    // },
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
};

export default config;
