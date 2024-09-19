require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
import path from "path";

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
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY_TESTNET}`],
      url: `${process.env.RPC_URL_HOLESKY}`,
      chainId: 17000,
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
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    imports: path.join(__dirname, "../restaking-pool/contracts")
  }
};

export default config;
