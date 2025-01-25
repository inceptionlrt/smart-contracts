import assert from "assert";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades, network, run } from "hardhat";

const contractName = "FraxFerryLZCrossChainAdapterL2";

const deploy: DeployFunction = async (hre) => {
  const { getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  assert(deployer, "Missing named deployer account");
  console.log(`Deployer Address: ${deployer}`);

  const targetNetwork = network.name;

  const testnetNames = ["fraxHolesky","optimismSepolia", "arbitrumSepolia", "hardhat"];
  const mainnetNames = ["arbitrum", "optimism"];

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
    fraxHolesky: "0x6EDCE65403992e310A62460808c4b910D972f10f",
  };

  const ferryAddresses:Record<string, string> = {
    fraxHolesky: "0x54102317E9AeAcbb1Eac32214d099D60d260E9a3", // WARNING: debug version
    holesky: "0x54102317E9AeAcbb1Eac32214d099D60d260E9a3", // WARNING: debug version
  }

  const dummyTokenAddresses:Record<string, string> = {
    fraxHolesky: "0x72DE502C4F68DCE383b075dA455ed45e15122a46", // WARNING: debug version
    holesky: "0x72DE502C4F68DCE383b075dA455ed45e15122a46", // WARNING: debug version
  }

  const endpointAddress = endpointAddresses[targetNetwork];
  if (!endpointAddress) {
    throw new Error(
      `No EndpointV2 address configured for network: ${targetNetwork}`,
    );
  }

  const ferryAddress = ferryAddresses[targetNetwork];
  if (!ferryAddress) {
    throw new Error(
      `No Fraxferry address configured for network: ${targetNetwork}`,
    );
  }

  const dummyTokenAddress = dummyTokenAddresses[targetNetwork];
  if (!dummyTokenAddress) {
    throw new Error(
      `No ERC20 address configured for network: ${targetNetwork}`,
    );
  }

  const rebalancerAddress = "0x22cC881644076E5Db51ed965A7873c723A632A09";

  console.log(`Using EndpointV2 Address: ${endpointAddress}`);
  console.log(`Using Fraxferry Address: ${ferryAddress}`);
  console.log(`Using dummy token Address: ${dummyTokenAddress}`);
  console.log(`Using Rebalancer Address: ${rebalancerAddress}`);

  const testEids = [40255, 40161, 40231, 40232, 40217];
  const testChainIds = [2522, 11155111, 421614, 11155420, 17000];

  const mainnetEids = [30110, 30111, 30101];
  const mainnetChainIds = [42161, 10, 1];

  const eIds = isTestnet ? testEids : mainnetEids;
  const chainIds = isTestnet ? testChainIds : mainnetChainIds;
  const l1ChainId = isTestnet ? 17000 : 1;

  console.log(`EIDs: ${eIds}`);
  console.log(`Chain IDs: ${chainIds}`);

  const args_x = [dummyTokenAddress, ferryAddress, rebalancerAddress, endpointAddress, deployer, l1ChainId, eIds, chainIds];

  // Deploy the Proxy
  console.log("Deploying TransparentUpgradeableProxy...");
  const contractFactory = await ethers.getContractFactory(contractName);
  const contract = await upgrades.deployProxy(contractFactory, args_x, {
    kind: "transparent",
  });
  await contract.waitForDeployment();
  console.log(
    `${contractName} Proxy deployed at:`,
    await contract.getAddress(),
  );

  const proxyAdminAddress = await upgrades.erc1967.getAdminAddress(
    await contract.getAddress(),
  );
  console.log("ProxyAdmin deployed at:", proxyAdminAddress);

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    await contract.getAddress(),
  );
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
};

deploy.tags = ["l2-frax"];
/*
deploy().then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});
*/
export default deploy;
