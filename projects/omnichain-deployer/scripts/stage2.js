const { ethers, upgrades } = require("hardhat");
const fs = require('node:fs/promises');



const loadState = async () => {
    const data = await fs.readFile('state.json', { encoding: 'utf8' });
    const obj = JSON.parse(data);
    return obj;
}

const saveState = async (state) => {
    const data = JSON.stringify(state);
    await fs.writeFile('state.json', data, { encoding: 'utf8' });
}

const deployL2token = async (name, symbol) => {
    // 1. Deploy InceptionToken (InETH)
  const inETHFactory = await ethers.getContractFactory("InceptionToken");
  const inETH = await upgrades.deployProxy(inETHFactory, [name, symbol], { kind: "transparent" });
  await inETH.waitForDeployment();
  const inETHAddress = await inETH.getAddress();
  console.log(`InceptionToken deployed at: ${inETHAddress}`);
  return inETHAddress;
}

const deployL2vault = async (incToken, underlying, adapter, ratiofeed) => {

  const InceptionOmniVaultFactory = await ethers.getContractFactory("ERC20OmniVault_E2");
  console.log("Deploying Transparent Proxy...");

  const args = [
    vaultName,
    operatorAddress,
    incToken,
    underlying,
    adapter,
  ];
  const inceptionOmniVault = await upgrades.deployProxy(
    InceptionOmniVaultFactory,
    args,
    /* {
      initializer: "initialize",
    }, */
  );

  console.log("Waiting for deployment...");
  await inceptionOmniVault.waitForDeployment();

  const deployedAddress = await inceptionOmniVault.getAddress();
  console.log("InceptionOmniVault deployed to (proxy):", deployedAddress);

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(deployedAddress);
  console.log("InceptionOmniVault implementation deployed at:", implementationAddress);

  const adminAddress = await upgrades.erc1967.getAdminAddress(deployedAddress);
  console.log("Proxy Admin Address:", adminAddress);
//  console.log(`Target receiver set successfully on LZCrossChainAdapterL2: ${deployedAddress}`);

  await inceptionOmniVault.setRatioFeed(ratiofeed);

  // uncomment if needed
  
  const feed = ethers.getContractAt("IInceptionRatioFeed", ratiofeed); //"0x90D5a4860e087462F8eE15B52D9b1914BdC977B5");
  await feed.updateRatioBatch([incToken], ["1000000000000000000"]);
  
  // todo: is it safe with live token but no vault?
  //await inETH.setVault(deployedAddress);
  //console.log(`Token vault address set: ${deployedAddress}`);


  return deployedAddress;
}

const setVaultInIncToken = async (vault, token) => {
  const token = await ethers.getContractAt("InceptionToken", token);
  await token.setVault(vault);
}

const deployL2adapter = async (deployer, chainidL1, eidL1, LZEndpointL2, ferryL2, assetL2, rebalancerL1, adapterL1, vaultL2) => {

  const args_x = [assetL2, ferryL2, rebalancerL1, LZEndpointL2, deployer, l1ChainId, [eidL1], [chainidL1]];
  console.log("Deploying L2 adapter...");
  const contractFactory = await ethers.getContractFactory("FraxFerryLZCrossChainAdapterL2");
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

  await contract.setTargetReceiver(vaultL2);
  await contract.setPeer(eidL1,"0x000000000000000000000000" + adapterL1.substring(2));

  return contract.getAddress();

}



const main = async () => {
    // Stage 2: deploy L2 with L1 addresses already being known
    let obj = await loadState();

    if(!obj.iTokenAddressL2) {
      console.log("Deploying L2 iToken...");
      obj.iTokenAddressL2 = await deployL2token(obj.tokenName, obj.tokenSymbol);
    }
    await saveState(obj);

    if (obj.iVaultAddressL2) {
      console.log("Deploying L2 IOV...");
        obj.iVaultAddressL2 = await deployL2vault(obj.iTokenAddressL2, obj.underlyingAssetL2, obj.CrossChainL2, obj.ratioFeedAddressL2);
        await setVaultInIncToken(obj.iTokenAddressL2, obj.iVaultAddressL2);
    }
    await saveState(obj);

    if (obj.adapterAddressL2) {
      console.log("Deploying L2 adapter...");
        obj.adapterAddressL2 = await deployL2adapter(await deployer.getAddress(), obj.chainIdL1, obj.EidL1, obj.LZEndpointL2, obj.FerryL2, obj.underlyingAssetL2, obj.rebalancer);
    }
    await saveState(obj);
}

main().then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});