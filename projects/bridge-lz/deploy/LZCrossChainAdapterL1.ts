import assert from "assert";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades, network, run } from "hardhat";

const contractName = "LZCrossChainAdapterL1";

const deploy: DeployFunction = async (hre) => {
    const { getNamedAccounts } = hre;
    const { deployer } = await getNamedAccounts();

    assert(deployer, "Missing named deployer account");
    console.log(`Deployer Address: ${deployer}`);

    const targetNetwork = network.name;

    const testnetNames = ["holesky", "sepolia", "optimismSepolia", "arbitrumSepolia", "hardhat"];
    const mainnetNames = ["mainnet", "arbitrum", "optimism"];

    const isTestnet = testnetNames.includes(targetNetwork);
    const isMainnet = mainnetNames.includes(targetNetwork);

    if (!isTestnet && !isMainnet) {
        throw new Error(`Unsupported network: ${targetNetwork}`);
    }

    console.log(`Target Network: ${targetNetwork}`);
    console.log(`Is Testnet: ${isTestnet}`);
    console.log(`Is Mainnet: ${isMainnet}`);

    const endpointAddresses: Record<string, string> = {
        mainnet: "0x1a44076050125825900e736c501f859c50fE728c",
        holesky: "0x6EDCE65403992e310A62460808c4b910D972f10f",
        sepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f",
        arbitrum: "0x1a44076050125825900e736c501f859c50fE728c",
        arbitrumSepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f",
        optimism: "0x1a44076050125825900e736c501f859c50fE728c",
        optimismSepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f",
    };

    const endpointAddress = endpointAddresses[targetNetwork];
    if (!endpointAddress) {
        throw new Error(`No EndpointV2 address configured for network: ${targetNetwork}`);
    }

    console.log(`Using EndpointV2 Address: ${endpointAddress}`);

    const testEids = [40161, 40231, 40232, 40217];
    const testChainIds = [11155111, 421614, 11155420, 17000];

    const mainnetEids = [30110, 30111, 30101];
    const mainnetChainIds = [42161, 10, 1];

    const eIds = isTestnet ? testEids : mainnetEids;
    const chainIds = isTestnet ? testChainIds : mainnetChainIds;

    console.log(`EIDs: ${eIds}`);
    console.log(`Chain IDs: ${chainIds}`);

    const args_x = [
        endpointAddress,
        deployer,
        eIds,
        chainIds,
    ];

    // Deploy the Proxy
    console.log("Deploying TransparentUpgradeableProxy...");
    const contractFactory = await ethers.getContractFactory(contractName);
    const contract = await upgrades.deployProxy(contractFactory, args_x, {
        kind: "transparent",
    });
    await contract.deployed();
    console.log(`${contractName} Proxy deployed at:`, contract.address);

    const proxyAdminAddress = await upgrades.erc1967.getAdminAddress(contract.address);
    console.log("ProxyAdmin deployed at:", proxyAdminAddress);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(contract.address);
    console.log("Implementation deployed at:", implementationAddress);


    
    // Verification
    console.log("Verifying contracts...");

    // Verify Implementation
    try {
        await run("verify:verify", {
            address: implementationAddress,
            constructorArguments: [],
        });
        console.log("Implementation contract verified!");
    } catch (error) {
        console.error("Error verifying Implementation contract:", error);
    }

    // Verify ProxyAdmin
    try {
        await run("verify:verify", {
            address: proxyAdminAddress,
            constructorArguments: [],
        });
        console.log("ProxyAdmin contract verified!");
    } catch (error) {
        console.error("Error verifying ProxyAdmin contract:", error);
    }

    // // Verify Proxy
    // try {
    //     await run("verify:verify", {
    //         address: contract.address,
    //         constructorArguments: [],
    //     });
    //     console.log("Proxy contract verified!");
    // } catch (error) {
    //     console.error("Error verifying Proxy contract:", error);
    // }
};

deploy.tags = ["l1"];

export default deploy;
