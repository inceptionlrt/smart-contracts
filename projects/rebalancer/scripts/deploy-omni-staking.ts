import { ethers, upgrades } from "hardhat";
const fs = require('fs');
const path = require('path');
require("dotenv").config();


async function main() {
    /*******************************
     * Step 1: Deploy ProtocolConfig
     *******************************/

    // Load the ABI and bytecode for ProtocolConfig from node_modules
    const protocolConfigPath = path.join(
        __dirname,
        "../node_modules/genesis-smart-contracts/artifacts/contracts/ProtocolConfig.sol/ProtocolConfig.json"
    );
    const protocolConfigArtifact = JSON.parse(fs.readFileSync(protocolConfigPath, "utf8"));
    const protocolConfigAbi = protocolConfigArtifact.abi;
    const protocolConfigBytecode = protocolConfigArtifact.bytecode;

    // Get the deployer account
    const [deployer] = await ethers.getSigners();

    // Deploy ProtocolConfig implementation contract
    console.log("Deploying ProtocolConfig implementation...");
    const ProtocolConfigFactory = new ethers.ContractFactory(protocolConfigAbi, protocolConfigBytecode, deployer);
    const protocolConfigImplementation = await ProtocolConfigFactory.deploy();
    await protocolConfigImplementation.waitForDeployment();
    const protocolConfigImplementationAddress = await protocolConfigImplementation.getAddress();
    console.log("ProtocolConfig implementation deployed at:", protocolConfigImplementationAddress);

    // Load OpenZeppelin's precompiled TransparentUpgradeableProxy ABI and bytecode
    const ozProxyPath = path.join(
        __dirname,
        "../node_modules/@openzeppelin/contracts/build/contracts/TransparentUpgradeableProxy.json"
    );
    const ozProxyArtifact = JSON.parse(fs.readFileSync(ozProxyPath, "utf8"));
    const ozProxyAbi = ozProxyArtifact.abi;
    const ozProxyBytecode = ozProxyArtifact.bytecode;

    // Create the ContractFactory for TransparentUpgradeableProxy
    const TransparentUpgradeableProxyFactory = new ethers.ContractFactory(ozProxyAbi, ozProxyBytecode, deployer);

    // Deploy TransparentUpgradeableProxy for ProtocolConfig
    console.log("Deploying TransparentUpgradeableProxy for ProtocolConfig...");
    const protocolConfigProxy = await TransparentUpgradeableProxyFactory.deploy(
        protocolConfigImplementationAddress,
        deployer.address,
        "0x"
    );
    await protocolConfigProxy.waitForDeployment();
    const protocolConfigProxyAddress = await protocolConfigProxy.getAddress();
    console.log("TransparentUpgradeableProxy (ProtocolConfig) deployed at:", protocolConfigProxyAddress);

    // Initialize ProtocolConfig via the proxy
    const governanceAddress = deployer.address;
    const operatorAddress = deployer.address;
    const treasuryAddress = deployer.address;

    console.log("Initializing ProtocolConfig...");
    const protocolConfig = new ethers.Contract(protocolConfigProxyAddress, protocolConfigAbi, deployer);
    const initializeProtocolConfigTx = await protocolConfig.initialize(governanceAddress, operatorAddress, treasuryAddress);
    await initializeProtocolConfigTx.wait();
    console.log("ProtocolConfig initialized.");

    /*****************************
     * Step 2: Deploy RatioFeed
     *****************************/

    // Load the ABI and bytecode for RatioFeed from node_modules
    const ratioFeedPath = path.join(
        __dirname,
        "../node_modules/genesis-smart-contracts/artifacts/contracts/RatioFeed.sol/RatioFeed.json"
    );
    const ratioFeedArtifact = JSON.parse(fs.readFileSync(ratioFeedPath, "utf8"));
    const ratioFeedAbi = ratioFeedArtifact.abi;
    const ratioFeedBytecode = ratioFeedArtifact.bytecode;

    // Deploy RatioFeed implementation contract
    console.log("Deploying RatioFeed implementation...");
    const RatioFeedFactory = new ethers.ContractFactory(ratioFeedAbi, ratioFeedBytecode, deployer);
    const ratioFeedImplementation = await RatioFeedFactory.deploy();
    await ratioFeedImplementation.waitForDeployment();
    const ratioFeedImplementationAddress = await ratioFeedImplementation.getAddress();
    console.log("RatioFeed implementation deployed at:", ratioFeedImplementationAddress);

    // Deploy TransparentUpgradeableProxy for RatioFeed
    console.log("Deploying TransparentUpgradeableProxy for RatioFeed...");
    const ratioFeedProxy = await TransparentUpgradeableProxyFactory.deploy(
        ratioFeedImplementationAddress,
        deployer.address,
        "0x"
    );
    await ratioFeedProxy.waitForDeployment();
    const ratioFeedProxyAddress = await ratioFeedProxy.getAddress();
    console.log("TransparentUpgradeableProxy (RatioFeed) deployed at:", ratioFeedProxyAddress);

    // Initialize RatioFeed via the proxy
    const ratioThreshold = 1000000;

    console.log("Initializing RatioFeed...");
    const ratioFeed = new ethers.Contract(ratioFeedProxyAddress, ratioFeedAbi, deployer);
    const initializeRatioFeedTx = await ratioFeed.initialize(protocolConfigProxyAddress, ratioThreshold);
    await initializeRatioFeedTx.wait();
    console.log("RatioFeed initialized.");

    /**************************************************
     * Step 3: Set RatioFeed in ProtocolConfig contract
     **************************************************/

    console.log("Setting RatioFeed in ProtocolConfig...");
    const setRatioFeedTx = await protocolConfig.setRatioFeed(ratioFeedProxyAddress);
    await setRatioFeedTx.wait();
    console.log("RatioFeed set in ProtocolConfig.");

    /****************************
     * Step 4: Deploy cToken
     ****************************/

    // Load the ABI and bytecode for cToken from node_modules
    const cTokenPath = path.join(
        __dirname,
        "../node_modules/genesis-smart-contracts/artifacts/contracts/cToken.sol/cToken.json"
    );
    const cTokenArtifact = JSON.parse(fs.readFileSync(cTokenPath, "utf8"));
    const cTokenAbi = cTokenArtifact.abi;
    const cTokenBytecode = cTokenArtifact.bytecode;

    // Deploy cToken implementation contract
    console.log("Deploying cToken implementation...");
    const cTokenFactory = new ethers.ContractFactory(cTokenAbi, cTokenBytecode, deployer);
    const cTokenImplementation = await cTokenFactory.deploy();
    await cTokenImplementation.waitForDeployment();
    const cTokenImplementationAddress = await cTokenImplementation.getAddress();
    console.log("cToken implementation deployed at:", cTokenImplementationAddress);

    // Deploy TransparentUpgradeableProxy for cToken
    console.log("Deploying TransparentUpgradeableProxy for cToken...");
    const cTokenProxy = await TransparentUpgradeableProxyFactory.deploy(
        cTokenImplementationAddress,
        deployer.address,
        "0x"
    );
    await cTokenProxy.waitForDeployment();
    const cTokenProxyAddress = await cTokenProxy.getAddress();
    console.log("TransparentUpgradeableProxy (cToken) deployed at:", cTokenProxyAddress);

    // Initialize cToken via the proxy
    const tokenName = "cETH";
    const tokenSymbol = "cETH";

    console.log("Initializing cToken...");
    const cToken = new ethers.Contract(cTokenProxyAddress, cTokenAbi, deployer);
    const initializecTokenTx = await cToken.initialize(protocolConfigProxyAddress, tokenName, tokenSymbol);
    await initializecTokenTx.wait();
    console.log("cToken initialized.");

    /**************************************************
     * Step 5: Set cToken in ProtocolConfig contract
     **************************************************/

    console.log("Setting cToken in ProtocolConfig...");
    const setCtokenTx = await protocolConfig.setCToken(cTokenProxyAddress);
    await setCtokenTx.wait();
    console.log("cToken set in ProtocolConfig.");

    /****************************
     * Step 6: Deploy RestakingPool
     ****************************/

    // Load the ABI and bytecode for RestakingPool from node_modules
    const restakingPoolPath = path.join(
        __dirname,
        "../node_modules/genesis-smart-contracts/artifacts/contracts/RestakingPool.sol/RestakingPool.json"
    );
    const restakingPoolArtifact = JSON.parse(fs.readFileSync(restakingPoolPath, "utf8"));
    const restakingPoolAbi = restakingPoolArtifact.abi;
    const restakingPoolBytecode = restakingPoolArtifact.bytecode;




    // Log the bytecode for verification
    // console.log("RestakingPool Bytecode:", restakingPoolBytecode);

    // Ensure bytecode starts with '0x'
    if (!restakingPoolBytecode.startsWith("0x")) {
        throw new Error("Bytecode is not properly formatted. It should start with '0x'.");
    }


    const tx = {
        data: restakingPoolBytecode, // Ensure bytecode is correct here
        gasLimit: 4000000, // Adjust the gas limit according to the contract size
    };

    
    const response = await deployer.sendTransaction(tx);
    console.log("here🐸");
    const receipt = await response.wait();
    console.log("Contract deployed at 🐸🐸🐸:", receipt.contractAddress);

    // Deploy RestakingPool implementation contract
    console.log("Deploying RestakingPool implementation...");
    console.log("First 100 bytes of RestakingPool Bytecode:", restakingPoolBytecode.substring(0, 200));
    const RestakingPoolFactory = new ethers.ContractFactory(restakingPoolAbi, restakingPoolBytecode, deployer);
    console.log("🐸");

    const restakingPoolImplementation = await RestakingPoolFactory.deploy();
    await restakingPoolImplementation.waitForDeployment();
    const restakingPoolImplementationAddress = await restakingPoolImplementation.getAddress();
    console.log("RestakingPool implementation deployed at:", restakingPoolImplementationAddress);

    // Deploy TransparentUpgradeableProxy for RestakingPool
    console.log("Deploying TransparentUpgradeableProxy for RestakingPool...");
    const restakingPoolProxy = await TransparentUpgradeableProxyFactory.deploy(
        restakingPoolImplementationAddress,
        deployer.address,
        "0x"
    );
    await restakingPoolProxy.waitForDeployment();
    const restakingPoolProxyAddress = await restakingPoolProxy.getAddress();
    console.log("TransparentUpgradeableProxy (RestakingPool) deployed at:", restakingPoolProxyAddress);

    // Initialize RestakingPool via the proxy
    const distributeGasLimit = 30000000; // Example gas limit
    const newMaxTVL = 100000000; // Example max TVL

    console.log("Initializing RestakingPool...");
    const restakingPool = new ethers.Contract(restakingPoolProxyAddress, restakingPoolAbi, deployer);
    const initializeRestakingPoolTx = await restakingPool.initialize(protocolConfigProxyAddress, distributeGasLimit, newMaxTVL);
    await initializeRestakingPoolTx.wait();
    console.log("RestakingPool initialized.");

    /**************************************************
     * Step 7: Set RestakingPool in ProtocolConfig contract
     **************************************************/

    console.log("Setting RestakingPool in ProtocolConfig...");
    const setRestakingPoolTx = await protocolConfig.setRestakingPool(restakingPoolProxyAddress);
    await setRestakingPoolTx.wait();
    console.log("RestakingPool set in ProtocolConfig.");

    // Step 5: Deploy TransactionStorage contract
    console.log("Deploying TransactionStorage...");
    const TransactionStorage = await ethers.getContractFactory("TransactionStorage");
    const transactionStorage = await TransactionStorage.deploy(deployerAddress);
    await transactionStorage.waitForDeployment();
    const transactionStorageAddress = transactionStorage.getAddress();
    console.log("TransactionStorage deployed at:", transactionStorageAddress);

    // Step 6: Deploy Rebalancer contract as an upgradeable proxy
    console.log("Deploying Rebalancer...");
    const Rebalancer = await ethers.getContractFactory("Rebalancer");
    const rebalancer = await upgrades.deployProxy(
        Rebalancer,
        [cTokenAddress, restakingPoolAddress, transactionStorageAddress, ratioFeedAddress],
        { initializer: 'initialize' }
    );
    await rebalancer.waitForDeployment();
    const rebalancerAddress = rebalancer.getAddress();
    console.log("Rebalancer (proxy) deployed at:", rebalancerAddress);

    // Step 7: Set Rebalancer and cToken in ProtocolConfig
    console.log("Configuring ProtocolConfig...");
    const setRebalancerTx = await protocolConfig.setRebalancer(rebalancerAddress);
    await setRebalancerTx.wait();
    console.log("ProtocolConfig updated with Rebalancer and cToken addresses.");

    // Step 8: Deploy XERC20Lockbox (Lockbox)
    console.log("Deploying XERC20Lockbox...");
    const XERC20Lockbox = await ethers.getContractFactory("XERC20Lockbox");
    const xerc20Lockbox = await XERC20Lockbox.deploy(
        cTokenAddress,  // XERC20 token address
        deployer.getAddress(),  // ERC20 token address, replace if needed
        true // true if the token is the native gas token (ETH in this case)
    );
    await xerc20Lockbox.waitForDeployment();
    const lockboxAddress = xerc20Lockbox.getAddress();
    console.log("XERC20Lockbox deployed at:", lockboxAddress);

    // Set Lockbox in XERC20 (cToken)
    console.log("Setting Lockbox in cToken...");
    const setLockboxTx = await cTokenDeployed.setLockbox(lockboxAddress);
    await setLockboxTx.wait();
    console.log("Lockbox set in cToken.");

    // Output deployed addresses
    console.log("Congrats, deployment successful! 🥳");
    console.log("ProtocolConfig deployed at:", protocolConfigAddress);
    console.log("cToken deployed at:", cTokenAddress);
    console.log("TransactionStorage:", transactionStorageAddress);
    console.log("Rebalancer (proxy):", rebalancerAddress);
    console.log("XERC20Lockbox deployed at:", lockboxAddress);
    console.log("RatioFeed deployed at:", ratioFeedAddress);
    console.log("RestakingPool deployed at:", restakingPoolAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
