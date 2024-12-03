const { ethers } = require("hardhat");
const { generateTransactionData } = require("../../upgrade-diamond-proxy/set-signatures");
const { BatchBuilder } = require("../../gnosis-safe/gnosis-safe");

const INCEPTION_LIBRARY = "0x8a6a8a7233b16d0ecaa7510bfd110464a0d69f66",
  // InstEthVault - "InVault_E2"
  InVault_E2 = "0x814CC6B8fd2555845541FB843f37418b05977d8d",
  // InankrEthVault - "InVault_E1"
  InVault_E1 = "0x36B429439AB227fAB170A4dFb3321741c8815e55";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Setting signatures with the account:", deployer.address);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());
  const provider = await deployer.provider.getNetwork();

  const [sigs, accesses, targets] = await generateTransactionData(INCEPTION_LIBRARY);

  await gnosisSafe([sigs, accesses, targets], InVault_E2, provider);
  await gnosisSafe([sigs, accesses, targets], InVault_E1, provider);
}

async function gnosisSafe(signaturesData, address, provider) {
  console.log(signaturesData, address, provider.name);

  const setterFacetFactory = await ethers.getContractFactory("EigenSetterFacet", {
    libraries: { InceptionLibrary: INCEPTION_LIBRARY },
  });
  console.log(setterFacetFactory.interface.getFunction("setSignaturesBatch"));

  new BatchBuilder("", `diamond_proxy_${address}`, "function signatures", provider)
    .add(
      {
        to: address,
        value: 0,
        method: "setSignaturesBatch",
        args: {
          newValue: signaturesData,
        },
      },
      setterFacetFactory.interface,
    )
    .save();
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

