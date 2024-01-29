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

// Function to read JSON file and convert it to an object
async function readJsonAndSplitAsync(filePath) {
  try {
    const jsonString = await fs.readFile(filePath, "utf8");
    const jsonObject = JSON.parse(jsonString);
    const dataMap = new Map(Object.entries(jsonObject));

    // Splitting the Map into keys and values arrays
    const keysArray = Array.from(dataMap.keys());
    const valuesArray = Array.from(dataMap.values());

    console.log("Keys Array:", keysArray.length);
    console.log("Values Array:", valuesArray.length);

    return [keysArray, valuesArray];
  } catch (err) {
    console.error("Error:", err);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
