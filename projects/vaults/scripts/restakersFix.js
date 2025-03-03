const { upgrades, ethers } = require("hardhat");

const InVault_S = "0xA8211B17Ee8cC9C3E739c32710Cc4d6621B360AE";
const MellowRestaker = "0xD7A622cc33E6dFAf689b4e6df1879154C982feBA";
const SymbioticRestaker = "0x1d14041C0E180BAce9eae187d30B76495d3C5F7D";
const LibAddress = "0x313d6c1b075077ce10b3229ee75e0af453cb7d07";

const multisig = "0x8e6C8799B542E507bfDDCA1a424867e885D96e79";
const timelock = "0x650bD9Dee50E3eE15cbb49749ff6ABcf55A8FB1e";

let tx;

async function main() {

  const [deployer] = await ethers.getSigners();

  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  // Factory
  const InceptionVaultFactory = await hre.ethers.getContractFactory("InVault_S_E1", 
    {
        libraries: {
            InceptionLibrary: LibAddress
        },
    }
  );
  let vault = await ethers.getContractAt("InVault_S_E1", InVault_S);
//   let proxyAdmin = await ethers.getContractAt(["function upgradeAndCall(address,address,bytes) external"], "0x6bA42F28991C912A7A386EE9650Cfc5aF5A40E6A");
//   await upgrades.forceImport(InVault_S, InceptionVaultFactory);

  // ProxyAdmin and Upgrade
//   let newVault = await InceptionVaultFactory.deploy();
//   await newVault.waitForDeployment();
//   tx = await proxyAdmin.upgradeAndCall(InVault_S, await newVault.getAddress(), "0x");
//   await tx.wait();
  let c = await upgrades.upgradeProxy(InVault_S, InceptionVaultFactory, {
    kind: "transparent",
    unsafeAllowLinkedLibraries: true,
  });
  console.log("Implementation was deployed and upgraded");

  // Set Restakers
  tx = await vault.setMellowRestaker(MellowRestaker); await tx.wait(); console.log("1");
  tx = await vault.setSymbioticRestaker(SymbioticRestaker); await tx.wait(); console.log("2");

  // Transfer Ownerships
  let pa1 = await ethers.getContractAt(["function transferOwnership(address) external"], "0x839a70027FE3904301bb8955c65D6754e183Ec33");
  let pa2 = await ethers.getContractAt(["function transferOwnership(address) external"], "0xD050EF71C01ca3B866469Be3C94371BcbF096540");
  let pa3 = await ethers.getContractAt(["function transferOwnership(address) external"], "0x9BD2406836939FF373c2B8EFAffFDdbed1f64185");
  let pa4 = await ethers.getContractAt(["function transferOwnership(address) external"], "0x6bA42F28991C912A7A386EE9650Cfc5aF5A40E6A");

  tx = await pa1.transeferOwnerships(timelock); await tx.wait(); console.log("3");
  tx = await pa2.transeferOwnerships(timelock); await tx.wait(); console.log("4");
  tx = await pa3.transeferOwnerships(timelock); await tx.wait(); console.log("5");
  tx = await pa4.transeferOwnerships(timelock); await tx.wait(); console.log("6");

  const fininalBalance = await deployer.provider.getBalance(deployer.address);
  console.log(`deployed spent: ${initBalance - fininalBalance}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

