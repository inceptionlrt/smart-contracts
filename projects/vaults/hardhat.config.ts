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
    // local: {
    //   url: "http://127.0.0.1:8545",
    //   // chainId: 1337,
    //   // gasPrice: 20000000000,
    //   // gas: 6721975,
    // },
    hardhat: {
      forking: {
        url: `${process.env.MAINNET_RPC}`,
        blockNumber: 21687985,
      },
    },
  },
};

export default config;
