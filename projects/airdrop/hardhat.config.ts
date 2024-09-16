import { HardhatUserConfig } from "hardhat/config";
import { CONFIG } from "../../hh.config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";

const config: HardhatUserConfig = {
  ...(CONFIG as HardhatUserConfig),
  networks: {
    localhost: {
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY_TESTNET}`],
      url: "http://127.0.0.1:8545/"
    },
    ethereum: {
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
      url: `${process.env.RPC_URL_ETHEREUM}`,
      chainId: 1,
      gas: 8000000,
    }, holesky: {
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
      url: `${process.env.RPC_URL_HOLESKY}`,
      chainId: 17000,
      gas: 80000000,
    }
  },
  solidity: {
    version: "0.8.26",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  }, etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    enabled: true
  }

};

export default config;
