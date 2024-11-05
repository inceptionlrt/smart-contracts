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
}

export default config
