# How to deploy all

## Deploy LZCrossChainBridges
1. Deploy the bridgs on all chains:
>npx hardhat lz:deploy
2. Write down their addresses in `deployment_checkpoint_sepolia.json`, `deployment_checkpoint_optimism-sepolia.json` and `deployment_checkpoint_arbitrum-sepolia.json`
3. >npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts
4. Set also peers manually: 
> npx hardhat run scripts/set-peers-l1.ts --network sepolia

> npx hardhat run scripts/set-peers-l2-arb.ts --network arbitrum-sepolia

> npx hardhat run scripts/set-peers-l2-opt.ts --network optimism-sepolia

5. Verify contracts on Etherscan:
> npx hardhat flatten contracts/LZCrossChainBridge.sol > FlattenedLZBridge.sol
6. Deploy all other contracts:
>yarn hardhat run scripts/deploy-l1/all-test.ts --network sepolia
7. Now it's time to fire the test:
>npx hardhat run scripts/call-on-opt_modified.ts --network optimism-sepolia