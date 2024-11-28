require("dotenv").config();

const accounts = process.env.DEPLOYER_PRIVATE_KEY
  ? [process.env.DEPLOYER_PRIVATE_KEY]
  : ["1495992B2A5CC4DD53E231157BBF401329BD1B7EE355CEAB55A791398921CA17"];
const gasPrice = process.env.GAS_PRICE ? parseInt(process.env.GAS_PRICE) : "auto";

export const CONFIG = {
  networks: {
    mainnet: {
      url: process.env.MAINNET_RPC || "https://rpc.ankr.com/eth",
      chainId: 1,
      gas: 8000000,
      gasPrice,
      accounts,
      eid: 30101
    },
    holesky: {
      url: process.env.HOLESKY_RPC || "https://rpc.ankr.com/eth_holesky",
      chainId: 17000,
      gas: 8000000,
      gasPrice,
      accounts,
      eid: 40217,
      verify: {
        etherscan: {
          apiKey: process.env.ETHERSCAN_API_KEY,
          apiUrl: "https://api-holesky.etherscan.io",
        },
      },
    },
    arbitrum: {
      url: process.env.RPC_URL_ARBITRUM,
      chainId: 42161,
      gas: 8000000,
      gasPrice,
      accounts,
      eid: 30110,
    },
    sepolia: {
      url: process.env.RPC_URL_SEPOLIA,
      chainId: 11155111,
      gas: 800000,
      gasPrice,
      accounts,
      eid: 40161,
      verify: {
        etherscan: {
          apiKey: process.env.ETHERSCAN_API_KEY,
          apiUrl: "https://api-sepolia.etherscan.io",
        },
      },
    },
    optimism: {
      url: process.env.RPC_URL_OPTIMISM,
      chainId: 10,
      gas: 8000000,
      gasPrice,
      accounts,
      eid: 30111,
      verify: {
        etherscan: {
          apiKey: process.env.OPTIMISM_API_KEY,
          apiUrl: "https://api-optimistic.etherscan.io/api",
        },
      },
    },
    arbitrumSepolia: {
      url: process.env.RPC_URL_ARBITRUM_TESTNET,
      chainId: 421614,
      gas: 8000000,
      gasPrice,
      accounts,
      eid: 40231,
    },
    optimismSepolia: {
      url: process.env.RPC_URL_OPTIMISM_SEPOLIA,
      chainId: 11155420,
      gas: 8000000,
      gasPrice,
      accounts,
      eid: 40232,
    },
    local: {
      url: process.env.LOCAL_RPC || "http://127.0.0.1:8545",
      chainId: 1337,
      gasPrice: 20000000000,
      gas: 6721975,
    },
    hardhat: {
      forking: {
        url: `${process.env.RPC_URL_SEPOLIA}`,
      },
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [{ privateKey: process.env.DEPLOYER_PRIVATE_KEY, balance: "10000000000000000000" }]
        : []
    },
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
  },
  mocha: {
    enableTimeouts: false,
    before_timeout: 120000,
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    token: "ETH",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    treasury: {
      default: "0x064B9a8cd35ad4dB117617A3773F8129E9515967",
      mainnet: "0x00Fd4edEd5BB37d19F98Ab49722Ef51E84745928",
    },
    operator: {
      default: "0x064B9a8cd35ad4dB117617A3773F8129E9515967",
      mainnet: "0x078dc682083132b4E86731062FCF95A729Bac067",
    },
    governance: {
      default: 0,
      mainnet: "0x03D7aaa453D9e7048101d425e73848e16c534DFD",
    },
    elPodManager: {
      goerli: "0xa286b84C96aF280a49Fe1F40B9627C2A2827df41",
      holesky: "0x30770d7E3e71112d7A6b7259542D1f680a70e315",
      mainnet: "0x91E677b07F7AF907ec9a428aafA9fc14a0d3A338",
    },
    elDelegationManager: {
      goerli: "0x1b7b8F6b258f95Cf9596EabB9aa18B62940Eb0a8",
      holesky: "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6",
      mainnet: "0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A",
    },
    proxyAdminTimelock: {
      default: 0,
      mainnet: "0xc70470Cdc428d6A3966cd25F476F84D898158638",
    },
  },
  etherscan: {
    apiKey: {
      holesky: process.env.HOLESKY_ETHERSCAN_API_KEY,
      mainnet: process.env.ETHERSCAN_API_KEY,
      sepolia: process.env.ETHERSCAN_API_KEY,
      arbitrum: process.env.ARBISCAN_API_KEY,
      arbitrumSepolia: process.env.ARBISCAN_API_KEY,
      optimism: process.env.OPTIMISM_API_KEY,
      optimismSepolia: process.env.OPTIMISM_API_KEY,
    },
    customChains: [
      {
        network: "holesky",
        chainId: 17000,
        urls: {
          apiURL: "https://api-holesky.etherscan.io/api",
          browserURL: "https://holesky.etherscan.io",
        },
      },
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io",
        },
      },

      {
        network: "optimismSepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://api-sepolia-optimistic.etherscan.io/api",
          browserURL: "https://sepolia-optimism.etherscan.io/",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
};
