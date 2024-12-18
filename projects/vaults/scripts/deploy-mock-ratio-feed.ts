import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("Deploying InceptionERC20OmniVault...");

  const network = await ethers.provider.getNetwork();
  const networkName = network.name;
/*
  let INCEPTION_TOKEN_ADDRESS: string;
  let CROSS_CHAIN_BRIDGE_ADDRESS_L2: string;
  let UNDERLYING_ASSET_ADDRESS: string = "";

  switch (networkName) {
    case "fraxHolesky":
  //    INCEPTION_TOKEN_ADDRESS = "0x5A7a183B6B44Dc4EC2E3d2eF43F98C5152b1d76d";
      UNDERLYING_ASSET_ADDRESS = "0xDc638d549a01284e5E2409C26369dB46dC45f44a";
      CROSS_CHAIN_BRIDGE_ADDRESS_L2 = "0xcf827850BEC27f0F646A739EeC442B76591cc9B3";
      break;
    case "arbitrum":
      INCEPTION_TOKEN_ADDRESS = "0x5A7a183B6B44Dc4EC2E3d2eF43F98C5152b1d76d";
      CROSS_CHAIN_BRIDGE_ADDRESS_L2 = "0x19Ba5CcC603e1224B8502C56087e4147cEDD2522";
      break;
    case "optimism":
      INCEPTION_TOKEN_ADDRESS = "0x5A7a183B6B44Dc4EC2E3d2eF43F98C5152b1d76d";
      CROSS_CHAIN_BRIDGE_ADDRESS_L2 = "0x19Ba5CcC603e1224B8502C56087e4147cEDD2522";
      break;
    case "arbitrumSepolia":
      INCEPTION_TOKEN_ADDRESS = "";
      CROSS_CHAIN_BRIDGE_ADDRESS_L2 = "0xb7A8CA74cbfe313804c3D52663e9b0C0585B5C4e";
      break;
    case "optimismSepolia":
      INCEPTION_TOKEN_ADDRESS = "0xb1692ed9b08f8dd641f4109568ed6f471166c7e5";
      CROSS_CHAIN_BRIDGE_ADDRESS_L2 = "0x838a7fe80f1AF808Bc5ad0f9B1AC6e26B2475E17";
      break;
    default:
      throw new Error(`Unsupported network: ${networkName}`);
  }

  if (!CROSS_CHAIN_BRIDGE_ADDRESS_L2) {
    throw new Error("Please set the CROSS_CHAIN_BRIDGE_ADDRESS_L2 for the current network");
  }

  const operatorAddress = process.env.OPERATOR_ADDRESS;
  if (!operatorAddress) {
    throw new Error("Please set the OPERATOR_ADDRESS environment variable");
  }

  const vaultName = "InEthOmniVault";

  console.log("Deployment parameters:");
  console.log("Network:", networkName);
  console.log("Vault Name:", vaultName);
  console.log("Operator Address:", operatorAddress);
  //console.log("Inception Token Address:", INCEPTION_TOKEN_ADDRESS);
  console.log("CrossChainBridge Address:", CROSS_CHAIN_BRIDGE_ADDRESS_L2);

  // 1. Deploy InceptionToken (InETH)
  */
  const mrfFactory = await ethers.getContractFactory("MockRatioFeed");
  const mrf = await upgrades.deployProxy(mrfFactory, [], { kind: "transparent" });
  await mrf.waitForDeployment();
  const mrfAddress = await mrf.getAddress();
  console.log(`MockRatioFactory deployed at: ${mrfAddress}`);

  await mrf.updateMockRatio("0xDc638d549a01284e5E2409C26369dB46dC45f44a", 1n)

  console.log("Deployment complete.");
/*
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
      address: adminAddress,
      constructorArguments: [],
    });
    console.log("ProxyAdmin contract verified!");
  } catch (error) {
    console.error("Error verifying ProxyAdmin contract:", error);
  }

  try {
  await run("verify:verify", {
      address: deployedAddress,
      constructorArguments: [],
    });
    console.log("Proxy contract verified!");
  } catch (error) {
    console.error("Error verifying Implementation contract:", error);
  }
  */
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Error deploying InceptionOmniVault:", error);
    process.exit(1);
  });

