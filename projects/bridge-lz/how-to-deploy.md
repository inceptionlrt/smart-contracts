# How to deploy all

## Deploy LZCrossChainBridges
0. Ensure /bridge-lz project has no `deployments` folder.
1. Deploy the Sepolia bridge by running the command below, choosing `sepolia` as network and `l1` as tag.
>npx hardhat lz:deploy
>npx @layerzerolabs/verify-contract -d "./deployments" --contracts "LZCrossChainAdapterL1" -n "sepolia" -u "https://api-sepolia.etherscan.io/api" -k "5ECZSNXK68TW6UVFTETFJK7YDC7KBSFHGC"
2. Deploy the Arbitrum-Sepolia and Optimism-Sepolia bridges by running the command below, choosing `arbitrum sepolia` and `optimism sepolia` as networks and `l2` as tag.
>npx hardhat lz:deploy
3. Verify Arbitrum and Optimism LZCrossChainBridgeL2 contracts:
>npx @layerzerolabs/verify-contract -d "./deployments" --contracts "LZCrossChainAdapterL2" -n "arbitrum-sepolia" -u "https://api-sepolia.arbiscan.io/api" -k "RDRJNYQ7NDDSNCX3FJGKC81M5Q8PA55K6U"
>npx @layerzerolabs/verify-contract -d "./deployments" --contracts "LZCrossChainAdapterL2" -n "optimism-sepolia" -u "https://api-optimistic.etherscan.io/api" -k "C3JF1ZDIQ4TT388IVSIW8WHAZRKZH5R9XJ"
4. Write down their addresses in the repository's root: `deployment_checkpoint_sepolia.json`, `deployment_checkpoint_optimism-sepolia.json` and `deployment_checkpoint_arbitrum-sepolia.json`
5. Set peers manually, running these commands from this folder: 
> npx hardhat run scripts/set-peers-l1.ts --network sepolia

> npx hardhat run scripts/set-peers-l2-arb.ts --network arbitrum-sepolia

> npx hardhat run scripts/set-peers-l2-opt.ts --network optimism-sepolia

6. Deploy all other contracts:
>cd projects/restaking-pool
>yarn hardhat run scripts/deploy-omni-staking.ts --network sepolia

>cd projects/vaults
>npx hardhat run scripts/deploy-omni-staking-l2.ts --network arbitrumSepolia
7. Now it's time to fire the test
>cd projects/restaking-pool

>npx hardhat run scripts/call/send-eth-to-l1.ts --network arbitrumSepolia

>npx hardhat run scripts/call/send-data-to-l1.ts --network arbitrumSepolia