const { addresses } = require("./config-addresses");
const { deployVault } = require("../deploy-vault");

const VaultName = "InEthxVault",
  TokenName = "Inception Restaked ETHx",
  TokenSymbol = "InETHx";

async function main() {
  await deployVault(addresses, VaultName, TokenName, TokenSymbol);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
