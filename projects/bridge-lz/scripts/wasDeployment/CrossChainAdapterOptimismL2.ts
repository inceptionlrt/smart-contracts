import assert from 'assert';
import { type DeployFunction } from 'hardhat-deploy/types';
import fs from 'fs';
import path from 'path';

const contractName = 'CrossChainAdapterOptimismL2';

const deploy: DeployFunction = async (hre) => {
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    assert(deployer, 'Missing named deployer account');

    // Define the path to the checkpoint file
    const checkpointFilePath = path.join(__dirname, '../deployment_checkpoint_optimism-sepolia.json');

    // Check if the file exists, if not, throw an error
    if (!fs.existsSync(checkpointFilePath)) {
        throw new Error(`File not found: ${checkpointFilePath}`);
    }

    // Read the JSON file to get rebalancer, transactionStorage, and vault addresses
    const checkpointData = JSON.parse(fs.readFileSync(checkpointFilePath, 'utf8'));

    const vault = checkpointData.InceptionOmniVault;

    if (!vault) {
        throw new Error('Missing InceptionOmniVault address in deployment_checkpoint_optimism_sepolia.json');
    }

    console.log(`Network: ${network.name}`);
    console.log(`Deployer and Operator: ${deployer}`);
    console.log(`Vault Address: ${vault}`);

    // Fetch the external LayerZero EndpointV2 deployment
    const endpointV2Deployment = await hre.deployments.get('EndpointV2');

    const operator = deployer; // Set deployer as operator

    const { address } = await deploy(contractName, {
        from: deployer,
        args: [
            endpointV2Deployment.address, // LayerZero's EndpointV2 address
            deployer, // Delegate address (deployer as owner)
            vault, // Vault address from JSON
            operator, // Operator (deployer)
        ],
        log: true,
        skipIfAlreadyDeployed: false,
    });

    console.log(`Deployed contract: ${contractName}, network: ${network.name}, address: ${address}`);

    // Write the new deployed address to deployment_checkpoint_optimism_sepolia.json
    checkpointData.CrossChainAdapterOptimismL2 = address;
    fs.writeFileSync(checkpointFilePath, JSON.stringify(checkpointData, null, 2), 'utf8');

    console.log(`Updated deployment_checkpoint_optimism_sepolia.json with CrossChainAdapterOptimismL2: ${address}`);
};

deploy.tags = [contractName];

export default deploy;
