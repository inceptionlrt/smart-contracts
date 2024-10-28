import "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import { CONFIG } from "../../hh.config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-verify";

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

  networks: {
    localhost: {
      url: "http://127.0.0.1:8545/",
    },
    hardhat: {
      forking: {
        url: process.env.RPC_URL_OPTIMISM_SEPOLIA || "",
      },
      accounts: [{ privateKey: `${process.env.DEPLOYER_PRIVATE_KEY}`, balance: "365467355464286459" }],
      chainId: 1337,  // Local chain ID for Hardhat network
    },
    ethereum: {
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
      url: `${process.env.RPC_URL_ETHEREUM}`,
      chainId: 1,
      gas: 8000000,
    },
    sepolia: {
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
      url: `${process.env.RPC_URL_SEPOLIA}`,
      chainId: 11155111,
      gas: 8000000,
    },
    holesky: {
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
      url: `${process.env.RPC_URL_HOLESKY}`,
      chainId: 17000,
      gasPrice: "auto",
    },
    arbitrum: {
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
      url: `${process.env.RPC_URL_ARBITRUM}`,
      chainId: 42161,
      gas: 8000000,
    },
    arbitrumSepolia: {
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
      url: `${process.env.RPC_URL_ARBITRUM_SEPOLIA}`,
      chainId: 421614,
      gas: 8000000,
    },
    optimism: {
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
      url: `${process.env.RPC_URL_OPTIMISM}`,
      chainId: 10,
      gas: 8000000,
    },
    optimismSepolia: {
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
      url: `${process.env.RPC_URL_OPTIMISM_SEPOLIA}`,
      chainId: 11155420,
      gas: 8000000,
    },
  },
  etherscan: {
    apiKey: `${process.env.ETHERSCAN_API_KEY}`
  },
  sourcify: {
    enabled: true
  }
};

export default config;
