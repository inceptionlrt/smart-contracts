const { ethers } = require("hardhat");
const { setSignatureBatch } = require("../../upgrade-diamond-proxy/set-signatures");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Setting signatures with the account:", deployer.address);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  await setSignatureBatch();
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

