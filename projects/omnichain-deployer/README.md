Deployment scripts

How to use (assuming populated .env):
1. Fill addresses in state.json with the stuff that's already deployed and the required constants (see state.example.json)
2. Run scripts/stage1.js with L1 network
3. Run scripts/stage2.js with L2 (Fraxtal)
4. Run scripts/stage3.js with L1 again

Deployed addresses will be saved in state.json.
The stages should be safe to rerun if something fails since the addresses are kept after each contract deployment.
