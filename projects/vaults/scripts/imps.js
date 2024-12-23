const { upgrades, ethers } = require("hardhat");

const InVault_S = "0xf9D9F828989A624423C48b95BC04E9Ae0ef5Ec97",
  IMellowRestaker_Address = "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378";

async function main() {
  /****************************************
   ************ InceptionVault_S ************
   ****************************************/

  const iVaultFactory = await ethers.getContractFactory("InVault_S_E2", {
    libraries: {
      InceptionLibrary: "0xF6940A8e7334Ab2a7781AF6f9E5aeD8EFB55116A",
    },
  });
  const vaultImpl = await upgrades.prepareUpgrade(InVault_S, iVaultFactory, {
    kind: "transparent",
    unsafeAllowLinkedLibraries: true,
  });
  console.log(`New Impl of InceptionVault(${vaultImpl}) was deployed`);

  /****************************************
   ************ IMellowRestaker ************
   ****************************************/

  const IMellowRestakerFactory = await ethers.getContractFactory("IMellowRestaker");
  const restakerImpl = await upgrades.prepareUpgrade(IMellowRestaker_Address, IMellowRestakerFactory);
  console.log(`New Impl of MellowRestaker(${restakerImpl}) was deployed`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

