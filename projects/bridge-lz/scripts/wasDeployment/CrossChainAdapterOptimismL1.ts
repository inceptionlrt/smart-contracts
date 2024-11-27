import assert from 'assert';
import { type DeployFunction } from 'hardhat-deploy/types';
import fs from 'fs';
import path from 'path';

const contractName = 'CrossChainAdapterOptimismL1';

const deploy: DeployFunction = async (hre) => {
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    assert(deployer, 'Missing named deployer account');

    // Check if the network is 'sepolia'
    if (network.name !== 'sepolia') {
        throw new Error(`Deployment is only allowed on the 'sepolia' network. Current network: ${network.name}`);
    }

    // Define the path to the checkpoint file
    const checkpointFilePath = path.join(__dirname, '../deployment_checkpoint_sepolia.json');

    // Check if the file exists, if not, create an empty JSON structure
    let checkpointData = {};
    if (fs.existsSync(checkpointFilePath)) {
        checkpointData = JSON.parse(fs.readFileSync(checkpointFilePath, 'utf8'));
    }

    const rebalancer = checkpointData.Rebalancer;
    const transactionStorage = checkpointData.TransactionStorage;

    if (!rebalancer || !transactionStorage) {
        throw new Error('Missing Rebalancer or TransactionStorage address in deployment_checkpoint_sepolia.json');
    }

    console.log(`Network: ${network.name}`);
    console.log(`Deployer and Operator: ${deployer}`);
    console.log(`Rebalancer Address: ${rebalancer}`);
    console.log(`TransactionStorage Address: ${transactionStorage}`);

    // Fetch the external LayerZero EndpointV2 deployment
    const endpointV2Deployment = await hre.deployments.get('EndpointV2');

    const operator = deployer; // Set deployer as operator

    const { address } = await deploy(contractName, {
        from: deployer,
        args: [
            endpointV2Deployment.address, // LayerZero's EndpointV2 address
            deployer, // Delegate address (deployer as owner)
            rebalancer, // Rebalancer address from JSON
            transactionStorage, // Transaction storage address from JSON
            operator, // Operator (deployer)
        ],
        log: true,
        skipIfAlreadyDeployed: false,
    });

    console.log(`Deployed contract: ${contractName}, network: ${network.name}, address: ${address}`);

    // Write the new deployed address to deployment_checkpoint_sepolia.json
    checkpointData.CrossChainAdapterOptimismL1 = address;
    fs.writeFileSync(checkpointFilePath, JSON.stringify(checkpointData, null, 2), 'utf8');

    console.log(`Updated deployment_checkpoint_sepolia.json with CrossChainAdapterOptimismL1: ${address}`);
};

deploy.tags = [contractName];

export default deploy;
