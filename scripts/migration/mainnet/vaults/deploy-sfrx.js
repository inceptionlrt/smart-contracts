/**
 * Staked Frax Ether LST
 */

const { addresses } = require("./config-addresses");
const { deployVault } = require("../deploy-vault");

const VaultName = "InsfrxEthVault",
  TokenName = "Inception Restaked sfrxETH",
  TokenSymbol = "InsfrxETH";

async function main() {
  await deployVault(addresses, VaultName, TokenName, TokenSymbol);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
