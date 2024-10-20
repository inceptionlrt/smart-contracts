import type { OAppOmniGraphHardhat, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'

const sepoliaContract: OmniPointHardhat = {
    eid: 40161,
    contractName: 'LZCrossChainBridge',
}

const arbitrumContract: OmniPointHardhat = {
    eid: 40231,
    contractName: 'LZCrossChainBridge',
}

const optimismContract: OmniPointHardhat = {
    eid: 40232,
    contractName: 'LZCrossChainBridge',
}


const config: OAppOmniGraphHardhat = {
    contracts: [
        {
            contract: sepoliaContract,
        },
        {
            contract: arbitrumContract,
        },
        {
            contract: optimismContract,
        }
    ],
    connections: [
        {
            from: sepoliaContract,
            to: optimismContract,
        },
        {
            from: optimismContract,
            to: sepoliaContract,

        },
        {
            from: sepoliaContract,
            to: arbitrumContract,

        },
        {
            from: arbitrumContract,
            to: sepoliaContract,

        }
    ],
}

export default config
