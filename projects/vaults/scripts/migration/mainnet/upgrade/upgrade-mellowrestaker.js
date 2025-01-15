const { upgrades, ethers } = require("hardhat");

const IMellowRestaker = "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378";

async function main() {
  /****************************************
   ************ IMellowResatker ***********
   ****************************************/

  const iMellowRestakerFactory = await ethers.getContractFactory("IMellowRestaker");
  const mrestakerImpl = await upgrades.prepareUpgrade(IMellowRestaker, iMellowRestakerFactory, {
    kind: "transparent",
    unsafeAllowLinkedLibraries: true,
  });
  console.log(`New Impl of MellowRestaker(${mrestakerImpl}) was deployed`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

