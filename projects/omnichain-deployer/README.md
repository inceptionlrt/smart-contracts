Deployment scripts

How to use (assuming populated .env):
1. Fill addresses in state.json with the stuff that's already deployed and the required constants (see state.example.json)
2. Run scripts/stage1.js with L1 network:
npx hardhat run scripts/stage1.js --network mainnet
3. Run scripts/stage2.js with L2 (Fraxtal)
npx hardhat run scripts/stage2.js --network fraxtal
4. Run scripts/stage3.js with L1 again
npx hardhat run scripts/stage3.js --network mainnet

You can use corresponding testnets in place of mainnets if needed.
Deployed addresses will be saved in state.json.
The stages should be safe to rerun if something fails since the addresses are kept after each contract deployment.

Stage 1 script:
1. If neither L1 iVault and iToken are set, deploy mock vault and token to L1 and set their ratio feed. After that, update ratio for the new token.
2. If rebalancer address isn't set, deploy rebalancer and set it as the target receiver on the L1 crosschain adapter.
3. Set rebalancer address in the L1 InceptionToken contract.

Stage 2:
1. Deploy L2 inceptionToken if the address wasn't set.
2. Deploy L2 crosschain adapter (the FraxFerry one in this case).
3. Deploy L2 vault and set its address in the token and adapter contracts.

Stage 3:
1. Set L1 adapter's LZ peer to the L2 adapter's address and EID.

These scripts assume that the deployer has all the required permissions to set properties of the existing contracts.
