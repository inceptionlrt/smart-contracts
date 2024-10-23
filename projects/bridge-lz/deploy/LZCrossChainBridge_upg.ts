import assert from 'assert';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';

const contractName = 'CrossChainBridge';

const deploy: DeployFunction = async (hre) => {
    const { getNamedAccounts, deployments } = hre;
    const { deploy, save } = deployments;
    const { deployer } = await getNamedAccounts();

    assert(deployer, 'Missing named deployer account');
    console.log(`Deployer Address: ${deployer}`);

    // 1. Deploy the CrossChainBridge implementation contract
    console.log('Deploying implementation contract...');
    const implementationDeployment = await deploy(contractName, {
        from: deployer,
        args: [], // No constructor arguments for upgradeable contracts
        log: true,
        skipIfAlreadyDeployed: false,
    });

    const implementationAddress = implementationDeployment.address;
    console.log(`Deployed ${contractName} implementation at: ${implementationAddress}`);

    // 2. Deploy ProxyAdmin using Hardhat's deploy function
    console.log('Deploying ProxyAdmin...');
    let proxyAdminAddress;
    const existingProxyAdmin = await deployments.getOrNull('ProxyAdmin');
    if (!existingProxyAdmin) {
        try {
            const proxyAdminDeployment = await deploy('ProxyAdmin', {
                from: deployer,
                args: [deployer], // ProxyAdmin has no constructor arguments
                log: true,
                skipIfAlreadyDeployed: true,
            });
            proxyAdminAddress = proxyAdminDeployment.address;
            console.log(`Deployed ProxyAdmin at: ${proxyAdminAddress}`);
        } catch (error) {
            console.error('Error deploying ProxyAdmin:', error);
            return;
        }
    } else {
        proxyAdminAddress = existingProxyAdmin.address;
        console.log(`ProxyAdmin already deployed at: ${proxyAdminAddress}`);
    }

    // 3. Get the address of the EndpointV2 contract (assuming it's deployed)
    console.log('Fetching EndpointV2 contract...');
    const endpointV2Deployment = await deployments.get('EndpointV2');
    console.log(`EndpointV2 Address: ${endpointV2Deployment.address}`);

    const eIds = [40161, 40231, 40232];
    const chainIds = [11155111, 421614, 11155420];
    console.log(`eIds: ${eIds}`);
    console.log(`chainIds: ${chainIds}`);

    // 4. Encode the initialize function call for the proxy
    console.log('Encoding initialize function call...');
    const initializeData = (await ethers.getContractFactory(contractName)).interface.encodeFunctionData(
        'initialize',
        [
            endpointV2Deployment.address, // LayerZero's EndpointV2 address
            deployer,                     // Owner address
            eIds,                         // eIds array
            chainIds                      // chainIds array
        ]
    );
    console.log(`Encoded initialize data: ${initializeData}`);

    // 5. Deploy the TransparentUpgradeableProxy using the fully qualified name
    console.log('Deploying TransparentUpgradeableProxy...');
    console.log(`Implementation Address: ${implementationAddress}`);
    console.log(`ProxyAdmin Address: ${proxyAdminAddress}`);
    console.log(`Initialize Data: ${initializeData}`);

    try {
        const proxyDeployment = await deploy('TransparentUpgradeableProxy', {
            contract: 'contracts/proxy/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy', // Fully qualified name
            from: deployer,
            args: [implementationAddress, proxyAdminAddress, initializeData], // Correct constructor arguments
            log: true,
            skipIfAlreadyDeployed: false,
        });

        console.log(`Deployed TransparentUpgradeableProxy at: ${proxyDeployment.address}`);

        // 6. Save the proxy contract's deployment with the correct ABI
        await save(contractName, {
            abi: implementationDeployment.abi,
            address: proxyDeployment.address,
        });

        console.log(`${contractName} deployed as upgradeable contract through proxy at ${proxyDeployment.address}`);
    } catch (error) {
        console.error('Error during TransparentUpgradeableProxy deployment:', error);
    }
};

deploy.tags = ['upg'];

export default deploy;
