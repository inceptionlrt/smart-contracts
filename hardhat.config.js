// require("hardhat-gas-reporter");
// require("hardhat-storage-layout");
require("hardhat-tracer");
require("@nomicfoundation/hardhat-toolbox");
// require("solidity-coverage");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // gasReporter: {
  //   enabled: true,
  //   currency: "USD",
  //   gasPrice: 21,
  // },
  networks: {
    hardhat: {
      forking: {
        url: "",
        // blockNumber: 9300672,
        accounts: [""],
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      accounts: [""],
    },
    goerli: {
      url: "",
      accounts: [""],
      gas: 10000000,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 0,
          },
        },
      },
    ],
  },
};
