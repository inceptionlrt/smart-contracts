const { upgrades, ethers } = require("hardhat");
const { addresses } = require("./migration/mainnet/config-addresses");

const InVault_S = "0xf9D9F828989A624423C48b95BC04E9Ae0ef5Ec97";
const MellowRestaker = "0x09740e3B2CCF6e82F4fb3A57519c8b65dA728378";

async function main() {
  /****************************************
   ************ InceptionVault_S ************
   ****************************************/

  const library = await ethers.deployContract("InceptionLibrary");

  const iVaultFactory = await ethers.getContractFactory("InVault_S_E2", {
    libraries: {
      InceptionLibrary: await library.getAddress(),
    },
  });
  const vaultImpl = await upgrades.prepareUpgrade(InVault_S, iVaultFactory, {
    kind: "transparent",
    unsafeAllowLinkedLibraries: true,
  });
  console.log(`New Impl of InceptionVault(${vaultImpl}) was deployed`);

  // Symbiotic
  const sRestaker = await ethers.getContractFactory("ISymbioticRestaker");
  vaults = ["0x4e0554959A631B3D3938ffC158e0a7b2124aF9c5", "0xc10A7f0AC6E3944F4860eE97a937C51572e3a1Da"]
  const s = await upgrades.deployProxy(sRestaker, [vaults, InVault_S, "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0", addresses.Operator], { kind: "transparent" });
  await s.waitForDeployment();
  console.log(`New Impl of MellowRestaker(${await s.getAddress()}) was deployed`);

  // Mellow
  const mRestaker = await ethers.getContractFactory("IMellowRestaker");
  const mImp = await upgrades.prepareUpgrade(MellowRestaker, mRestaker);
  console.log(`New Impl of MellowRestaker(${mImp}) was deployed`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

