import type { OAppOmniGraphHardhat, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'

const sepoliaContract: OmniPointHardhat = {
    eid: 40161,
    contractName: 'CrossChainBridge',
}

const arbitrumContract: OmniPointHardhat = {
    eid: 40231,
    contractName: 'CrossChainBridge',
}

const optimismContract: OmniPointHardhat = {
    eid: 40232,
    contractName: 'CrossChainBridge',
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
