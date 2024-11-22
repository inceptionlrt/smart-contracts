const { ethers } = require("hardhat");

const multisig = "0x8e6C8799B542E507bfDDCA1a424867e885D96e79";

const iTokenAddress = "0x8E0789d39db454DBE9f4a77aCEF6dc7c69f6D552",
      iVaultAddress = "0xf9D9F828989A624423C48b95BC04E9Ae0ef5Ec97",
      iRestaker     = "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378";

const PA1 = "0x2A089327A9B17AEcb75132CF015f556F2046739c",
      PA2 = "0xAb31156bcDD9C280Bb7b0d8062EFeD26e5c725AF",
      PA3 = "0xC40F099e73aDB9b78a6c1AB22c520D635fFb4D53";

async function main() {

    const fetchedToken    = await ethers.getContractAt("InVault_S_E2", iTokenAddress);
    const fetchedVault    = await ethers.getContractAt("InVault_S_E2", iVaultAddress);
    const fetchedRestaker = await ethers.getContractAt("InVault_S_E2", iRestaker);
    const fetchedPA1      = await ethers.getContractAt("InVault_S_E2", PA1);
    const fetchedPA2      = await ethers.getContractAt("InVault_S_E2", PA2);
    const fetchedPA3      = await ethers.getContractAt("InVault_S_E2", PA3);

    let TX = await fetchedToken.transferOwnership(multisig);    await TX.wait(); console.log("1");
    TX     = await fetchedVault.transferOwnership(multisig);    await TX.wait(); console.log("2");
    TX     = await fetchedRestaker.transferOwnership(multisig); await TX.wait(); console.log("3");
    TX     = await fetchedPA1.transferOwnership(multisig);      await TX.wait(); console.log("4");
    TX     = await fetchedPA2.transferOwnership(multisig);      await TX.wait(); console.log("5");
    TX     = await fetchedPA3.transferOwnership(multisig);      await TX.wait(); console.log("6");


}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
