// require("hardhat-gas-reporter");
// require("hardhat-storage-layout");
require("hardhat-tracer");
require("@nomicfoundation/hardhat-toolbox");
// require("solidity-coverage");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    hardhat: {},
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
