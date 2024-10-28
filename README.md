![OmniStaking Architecture](./OmniStaking_Architecture.jpg)

# OmniStaking

OmniStaking is a cross-chain staking system designed to maintain the balance of Inception Tokens across Layer 1 (L1) and multiple Layer 2 (L2) networks. By managing both data and ETH transfers between chains, OmniStaking ensures that the protocol maintains a consistent supply of Inception Tokens across all deployed chains, creating a unified and decentralized staking ecosystem.

## Overview

OmniStaking operates through a sequence of cross-chain communications involving several key contracts and components:

1. **InceptionOmniVault**: This contract initiates the transfer process. Operators (backend) interact with it to send either:
   - **Data Messages**: For reporting asset balances, using `sendAssetsInfoToL1()`.
   - **ETH Transfers**: For transferring ETH across chains, using `sendEthCrossChain()`.

2. **LZCrossChainAdapterL2**: This contract, specific to L2 chains, is responsible for processing and transmitting cross-chain messages. It receives calls from `InceptionOmniVault` and initiates cross-chain transfers using the LayerZero protocol.

3. **LZCrossChainAdapterL1**: After a specified delay (e.g., 7 days for mainnets or 20 minutes for testnets), messages or ETH transfers from L2 arrive at this L1 contract. Here, the contract:
   - Decodes data messages.
   - Relays the decoded information or ETH to the **NativeRebalancer**.

4. **NativeRebalancer**: This L1 contract aggregates data from all L2 chains. When data from each L2 is received, users can call `updateTreasuryData` on **NativeRebalancer**. This function recalculates the token supply, minting or burning tokens to maintain the invariant:

$$
\text{sum(Inception Tokens on L2s)} = \text{Inception Tokens on L1}
$$

## Message Flow

### L2 to L1 (Data and ETH Transfer)

1. **Data Transfer**: 
   - The operator calls `sendAssetsInfoToL1()` on **InceptionOmniVault**.
   - This data message is forwarded to **LZCrossChainAdapterL2**, which encodes and sends the data across chains.

2. **ETH Transfer**: 
   - The operator initiates `sendEthCrossChain()` on **InceptionOmniVault**.
   - **LZCrossChainAdapterL2** processes and sends the ETH transfer request to **LZCrossChainAdapterL1**.

### L1 Reception and Balancing

After the specified waiting period, **LZCrossChainAdapterL1** receives the cross-chain message or ETH transfer:

1. **Data Message**: **LZCrossChainAdapterL1** decodes the data and relays it to **NativeRebalancer**.
2. **ETH Transfer**: The ETH is directly forwarded as specified in the initial transfer request.

Once all L2 data has been received, users call `updateTreasuryData()` on **NativeRebalancer**, which mints or burns Inception Tokens on L1 as needed to ensure cross-chain token balance.

## Components

- **InceptionOmniVault**: Initiates L2 to L1 cross-chain transfers.
- **LZCrossChainAdapterL2**: Manages cross-chain messaging from L2 to L1.
- **LZCrossChainAdapterL1**: Receives and processes messages or ETH on L1.
- **NativeRebalancer**: Maintains the Inception Token invariant across chains by adjusting L1 supply.

## Invariant Guarantee

OmniStaking maintains the invariant:

$$
\text{sum(Inception Tokens on L2s)} = \text{Inception Tokens on L1}
$$


This ensures that the total supply of Inception Tokens is balanced across all chains in the OmniStaking ecosystem.
