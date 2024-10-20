import 'dotenv/config'

import 'hardhat-deploy'
import 'hardhat-contract-sizer'
import '@nomiclabs/hardhat-ethers'
import '@layerzerolabs/toolbox-hardhat'
import '@nomicfoundation/hardhat-verify';
import { HardhatUserConfig, HttpNetworkAccountsUserConfig } from 'hardhat/types'


const accounts: HttpNetworkAccountsUserConfig | undefined = [`${process.env.DEPLOYER_PRIVATE_KEY}`]

const config: HardhatUserConfig = {
    paths: {
        cache: 'cache/hardhat',
    },
    solidity: {
        compilers: [
            {
                version: '0.8.27',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    networks: {
        hardhat: {
            forking: {
                url: process.env.RPC_URL_OPTIMISM_SEPOLIA || ""
            },
            accounts: [{ privateKey: `${process.env.DEPLOYER_PRIVATE_KEY}`, balance: "10000365467355464286459" }],
            chainId: 1337,  // Local chain ID for Hardhat network
        },
        'sepolia': {
            eid: 40161,
            url: process.env.RPC_URL_SEPOLIA,
            chainId: 11155111,
            accounts,
        },
        'arbitrum-sepolia': {
            eid: 40231,
            url: process.env.RPC_URL_ARBITRUM_SEPOLIA,
            chainId: 421614,
            accounts,
        },
        'optimism-sepolia': {
            eid: 40232,
            url: process.env.RPC_URL_OPTIMISM_SEPOLIA,
            chainId: 11155420,
            accounts,
        },

    },
    namedAccounts: {
        deployer: {
            default: 0, // wallet address of index[0], of the mnemonic in .env
        },
    },
    etherscan: {
        apiKey: {
            sepolia: `${process.env.ETHERSCAN_API_KEY}`,
            arbitrumTestnet: `${process.env.ARBISCAN_API_KEY}`
        }
    }
}

export default config
