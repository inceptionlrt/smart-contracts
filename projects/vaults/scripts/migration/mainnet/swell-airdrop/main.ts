import { ethers, upgrades } from "hardhat";

const SWELL_VAULT_ADDRESS = "0xc4181dC7BB31453C4A48689ce0CBe975e495321c",
  AIRDROP_CONTRACT_ADDRESS = "",
  SWELL_ASSET = "",
  INCEPTION_LIBRARY = "0x8a6a8a7233b16d0ecaa7510bfd110464a0d69f66";

async function main() {
  /*********************************************************
   ****** Upgrade the contract with the diamond proxy ******
   *********************************************************/

  const iVault = await upgradeDiamond();

  /*********************************************************
   ****************** Verify a claim data ******************
   *********************************************************/

  const airDropContract = await ethers.getContractAt("ICumulativeMerkleDrop", AIRDROP_CONTRACT_ADDRESS);

  const [amount, data] = (await verifyClaimData(airDropContract)) as [string, string[]];

  /*********************************************************
   *************** Claim with the claim data ***************
   *********************************************************/

  await claimAirDrop(iVault, amount, data);
}

/// TODO
const upgradeDiamond = async () => {
  /// TODO

  /// 0. upgrade the vault

  const IVAULT_EL = await ethers.getContractFactory("InceptionVault_EL");
  const newVault = await upgrades.upgradeProxy(SWELL_VAULT_ADDRESS, IVAULT_EL);

  //   const iVaultFactory = await ethers.getContractFactory(vaultImplContract, {
  //     libraries: {
  //       InceptionLibrary: libAddress,
  //     },
  //   });
  //   const impl = await upgrades.prepareUpgrade(address, iVaultFactory, {
  //     kind: "transparent",
  //     unsafeAllowLinkedLibraries: true,
  //     unsafeAllowRenames: true,
  //   });

  /// 1. deploy facets
  const EigenLayerFacet_Factory = await ethers.getContractFactory("SwellEigenLayerFacet", {
    libraries: { InceptionLibrary: INCEPTION_LIBRARY },
  });

  const eigenLayerFacet = await deployFacet(EigenLayerFacet_Factory);
  await newVault.setEigenLayerFacet(eigenLayerFacet);

  /// 2. set the signature for the claimAidrop with the access
  const sig = EigenLayerFacet_Factory.interface.getFunction("claimSwellAidrop")?.selector;
  await newVault.setSignature(sig, "0", "0");

  return newVault;
};

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
    "0x3b2ddc112883a40423e66c8674d28a09d24d667e99b7651acd52d3928814fedc",
    "0xcb08b350cac59b5f5a6272ebc30c096f2e308f68392355cf8542f9957ed33375",
    "0xb696dbe8a838abcf393924c568a8ce2e5c202bc2081376eb487b9371f1353bb1",
    "0x5e6936f09ba9c3d651fc57c0b62c3098fbe94662f1fcaf08062ef24f6f3b05c1",
    "0x98388ec1e875dbd15c808f500a0996f24bdee5425a6d1ca25db5c5b15a594ad1",
    "0x5deb7fa95c1192eb9a87eed22a2bb26c5be54c20a14cf6b5fa1214fd60554216",
    "0xc27a6e57fe3e82b45c972c1fcf48e88b8f66e845d1ae0adfcdf5381e0d013efa",
    "0xd0e0189a131608df9570bbbdd1812f70aa0f2d64345f8ace872f31b6012667db",
    "0xf94bad8322c06b3050d9f4bf856b82c532555be72aacec0a5eb0a7d55d9aab88",
    "0x9ea643611927cc5b7a0b5a6eef1388f26ee82edc93823f19dfff051a677c0cc8",
    "0x3467dd11129fb4ba2c4edffffd9c9a50b779d5f198107802968d3338b73a70e2",
    "0x354c2bea1d007835ee7ac1ea6c1cc206e21945bf944bd61f2ea6f1336f1d31d3",
    "0x77e8ae4b2fa86453b857c5ccededaf99cb5b49a6c2c19b07bfda905f62f60cf4",
    "0x7f83609678df0d66c28c8f04b5cddfafee17c4d7721111a2358bce2896bfc808",
    "0x7481a1a73e22cfb4dade75561e90b1b344d702263a6912bffe19841ced6cc709",
    "0x3803c8c5174f72f50edbd4234d1184e96e4c0b9bf03138744bfe6f39bfe17ca0",
    "0x1a9d7766f730995db87ea5873804ea7ee125c701f1640b9080415a39f8796c4b",
  ];

  const result = await contract.verifyClaim(data, amount, SWELL_VAULT_ADDRESS);
  if (result != true) {
    console.error("wrong the claim data");
    return;
  }

  return [amount, data];
};

const claimAirDrop = async (iVault: any, amount: String, data: any) => {
  const [receiver] = await ethers.getSigners();

  const swellAsset = await ethers.getContractAt("XERC20", SWELL_ASSET);
  const initBalance = await swellAsset.balanceOf(await receiver.getAddress());

  await iVault.claimSwellAidrop(amount, data, await receiver.getAddress());

  console.log(`final balance: ${await swellAsset.balanceOf(await receiver.getAddress())}`);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
