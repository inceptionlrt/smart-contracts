import { ethers, network } from "hardhat";
import { impersonateAccount } from "@nomicfoundation/hardhat-network-helpers";

const SWELL_VAULT_ADDRESS = "0xc4181dC7BB31453C4A48689ce0CBe975e495321c",
  AIRDROP_CONTRACT_ADDRESS = "0x342f0d375ba986a65204750a4aece3b39f739d75",
  OWNER_ADDRESS = "0x8e6C8799B542E507bfDDCA1a424867e885D96e79",
  SWELL_ASSET = "0x0a6e7ba5042b38349e437ec6db6214aec7b35676",
  INCEPTION_AIRDROP_CONTRACT = "0x81cDDe43155DB595DBa2Cefd50d8e7714aff34f4",
  INCEPTION_LIBRARY = "0x8a6a8a7233b16d0ecaa7510bfd110464a0d69f66";

async function main() {
  await impersonateAccount(OWNER_ADDRESS);
  const owner = await ethers.getSigner(OWNER_ADDRESS);

  const [treasury] = await ethers.getSigners();
  await treasury.sendTransaction({ to: OWNER_ADDRESS, value: "1000000000000000000000" });

  /*********************************************************
   ****** Upgrade the contract with the diamond proxy ******
   *********************************************************/

  const upgradedVault = await replaceImplementation(owner);

  // /*********************************************************
  //  ****************** Verify a claim data ******************
  //  *********************************************************/

  const airDropContract = await ethers.getContractAt("ICumulativeMerkleDrop", AIRDROP_CONTRACT_ADDRESS);

  const [amount, data] = (await verifyClaimData(airDropContract)) as [string, string[]];

  // /*********************************************************
  //  *************** Claim with the claim data ***************
  //  *********************************************************/

  await claimAirDrop(owner, amount, data);
}

const deployFacet = async (EigenLayerFacet_Factory: any) => {
  const eigenFacet = await EigenLayerFacet_Factory.deploy();
  await eigenFacet.waitForDeployment();
  console.log(`eigenFacetAddress: ${await eigenFacet.getAddress()}`);

  return await eigenFacet.getAddress();
};

const verifyClaimData = async (contract: any) => {
  const amount = "234543928852265939865280";
  const data = [
    "0x47e3a910471f747800ac4e25be98396dd592e21f0346fbd9714a57e78dd4a4fa",
    "0x7dfec54d26f1611107310787360caae029544fbe8a110b9606d5583a0813206d",
    "0xe587b571a597f39b3e8c79f769e46fd657081d3457cb6fbdcf1e270bf19996e5",
    "0x7555947130f605f3c5d10d18e28e9dd92348401bfb7dfdac084f38aa9a53d3dd",
    "0x05c8c2332f8c2e69571243e38fcf7074bc4118f65205c1c65a02d59b374dcfe6",
    "0x52e976e7f5de45d8c2a2d81ee009a275667f49227e7aba9ac067ad174354cab8",
    "0xa7bbaa09f0fab0e9af16dd3860126fd60e7d6f05ea2263828fcf8328f55f48d1",
    "0x5d6d143b9f5947eaf14eae48abac0a6d42ea97f2c9d2f824f564f6532a283aa7",
    "0xb5c9dd84c3f46c7046d6fb4d893d5a7bd8a6f015e723789c233a804765245945",
    "0x2a4bd8f1e012351a9d56a467af45ed87ca1b75081bd5a461a4d0c9b4131676c8",
    "0x920eebe7f3ccc079fe340190a23486621792d65f2cee9e8b42d0137bd85147d3",
    "0xd7f679532add0bde916d762cee59165490620851c517ff24088f65b2510dab69",
    "0x8cc104748f3d2360c50f64b2b5517dd04e86e219168feef90769feae15e1ad72",
    "0x4fe83f73a9ece83e7b276731b5522e6c1c6f4a16e72768e928d4a34ebebd205b",
    "0x5a0f21edbe9146973e80be643b94bbc164fea0420fe9c51d55e3488d05321a44",
    "0x4881a17e038a06336526189822eb41b295d2ccae2252263d58cdd5b16c7169d8",
    "0x662c490e29d8df27ca411ff86108659fb469edc622747e1624d7b772cbfe9c6b",
    "0x0f37421fa9f11e2d801a715034ac814a1446888d97cb2dfce8d069503bffb618",
  ];

  const result = await contract.verifyProof(data, amount, SWELL_VAULT_ADDRESS);
  console.log(`result: ${result}`);
  if (result != true) {
    console.error("wrong the claim data");
    return;
  }

  return [amount, data];
};

const claimAirDrop = async (owner: any, amount: any, data: any) => {
  const swellAsset = await ethers.getContractAt("ERC20", SWELL_ASSET);

  const iVault = await ethers.getContractAt("SwellEigenLayerFacet", SWELL_VAULT_ADDRESS);
  await iVault.connect(owner).claimSwellAidrop(amount, data);

  console.log(`balance of Inception AirDrop contract: ${await swellAsset.balanceOf(INCEPTION_AIRDROP_CONTRACT)}`);
};

const replaceImplementation = async (owner: any) => {
  const implementationAddress = "0x6bb087367a5d2f5ac35a25ad69d97a3fbf663495";

  const [signer] = await ethers.getSigners();

  console.log("Compiling InceptionOmniVault contract...");

  const NewImplementation = await ethers.getContractFactory("InceptionVault_EL", {
    libraries: { InceptionLibrary: INCEPTION_LIBRARY },
  });

  console.log("Deploying a new implementation contract...");
  const newImpl = await NewImplementation.deploy();
  const deployTx = newImpl.deploymentTransaction();
  if (!deployTx) {
    throw new Error("Failed to get deployment transaction.");
  }

  console.log("Waiting for deployment transaction to be mined...");
  await deployTx.wait();
  console.log(`New contract deployed at: ${newImpl.target}`);

  console.log("Fetching deployed bytecode...");
  const newBytecode = await ethers.provider.getCode(newImpl.target);

  console.log("Replacing bytecode of the proxy implementation...");
  await network.provider.send("hardhat_setCode", [implementationAddress, newBytecode]);
  console.log(`Bytecode at ${implementationAddress} replaced successfully.`);

  const updatedBytecode = await ethers.provider.getCode(implementationAddress);
  if (updatedBytecode === newBytecode) {
    console.log("Verification successful: Bytecode updated.");
  } else {
    console.error("Verification failed: Bytecode mismatch.");
    return;
  }

  const upgradedVault = new ethers.Contract(SWELL_VAULT_ADDRESS, NewImplementation.interface, signer);

  //------------- CALLING THE SMART CONTRACT --------------------------------//

  // set a facet

  const EigenLayerFacet_Factory = await ethers.getContractFactory("SwellEigenLayerFacet", {
    libraries: { InceptionLibrary: INCEPTION_LIBRARY },
  });

  const eigenLayerFacet = await deployFacet(EigenLayerFacet_Factory);
  console.log("eigenLayerFacet: ", eigenLayerFacet);
  await (upgradedVault as any).connect(owner).setEigenLayerFacet(eigenLayerFacet);

  /// 2. set the signature for the claimAidrop with the access
  const sig = EigenLayerFacet_Factory.interface.getFunction("claimSwellAidrop")?.selector;
  await (upgradedVault as any).connect(owner).setSignature(sig, "1", "2");

  return upgradedVault;
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

