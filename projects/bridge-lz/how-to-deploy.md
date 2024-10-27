# How to deploy all

## Deploy LZCrossChainBridges
0. Ensure /bridge-lz project has no `deployments` folder.
1. Deploy the Sepolia bridge by running the command below, choosing `sepolia` as network and `l1` as tag.
>npx hardhat lz:deploy
2. Deploy the Arbitrum-Sepolia and Optimism-Sepolia bridges by running the command below, choosing `arbitrum sepolia` and `optimism sepolia` as networks and `l2` as tag.
>npx hardhat lz:deploy
2. Write down their addresses in the repository's root: `deployment_checkpoint_sepolia.json`, `deployment_checkpoint_optimism-sepolia.json` and `deployment_checkpoint_arbitrum-sepolia.json`
3. Set peers manually, running these commands from this folder: 
> npx hardhat run scripts/set-peers-l1.ts --network sepolia

> npx hardhat run scripts/set-peers-l2-arb.ts --network arbitrum-sepolia

> npx hardhat run scripts/set-peers-l2-opt.ts --network optimism-sepolia

5. Verify contracts on Etherscan.
6. Deploy all other contracts:
>cd projects/restaking-pool
>yarn hardhat run projects/restaking-pool/deploy-omni-staking.ts --network sepolia
7. Now it's time to fire the test
>cd projects/restaking-pool

>npx hardhat run scripts/call/send-eth-to-l1.ts --network arbitrumSepolia

>npx hardhat run scripts/call/send-data-to-l1.ts --network arbitrumSepolia