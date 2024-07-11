require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-contract-sizer");

require("./tasks/get-free-balances");
require("./tasks/get-inception-vaults");
require("./tasks/deposit-extra");
require("./tasks/deploy-rate-provider");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: `${process.env.RPC_URL_HOLESKY}`,
        blockNumber: 1442030,
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
    },
    holesky: {
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY_TESTNET}`],
      url: `${process.env.RPC_URL_HOLESKY}`,
      chainId: 17000,
      gas: 8000000,
    },
    mainnet: {
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
      url: `${process.env.RPC_URL_ETHEREUM}`,
      chainId: 1,
      gas: 8000000,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
};
