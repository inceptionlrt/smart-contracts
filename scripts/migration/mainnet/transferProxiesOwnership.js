const { upgrades } = require("hardhat");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let vaultFactory, tokenFactory;

const transferOwnwership = async (vaultAddress, tokenAddress, newOwner) => {
  // Vault ownership
  const vault = await vaultFactory.attach(vaultAddress);
  let tx = await vault.transferOwnership(newOwner);
  await tx.wait();
  console.log(`Ownership of the vault(${vaultAddress}) transferred to ${newOwner}`);

  // Token ownership
  const token = await tokenFactory.attach(tokenAddress);
  tx = await token.transferOwnership(newOwner);
  await tx.wait();
  console.log(`Ownership of the token(${tokenAddress}) transferred to ${newOwner}`);
};

const newOwnerAddress = "",
  InstEthTokenAddress = "",
  InstEthVaultAddress = "",
  InrEthTokenAddress = "",
  InrEthVaultAddress = "";

async function main() {
  vaultFactory = await hre.ethers.getContractFactory("InVault_E1");

  readJsonAndSplitAsync;
  tokenFactory = await hre.ethers.getContractFactory("InceptionToken");

  // read the addresses from the folder

  // osETH
  await transferOwnwership(InstEthTokenAddress, newOwnerAddress);
  // iVault
  await transferOwnwership(InstEthVaultAddress, newOwnerAddress);
  // InrEthVault
  // iToken
  await transferOwnwership(InrEthTokenAddress, newOwnerAddress);
  // iVault
  await transferOwnwership(InrEthVaultAddress, newOwnerAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
