const { addresses } = require("./el-addresses");
const { deployVault } = require("../deploy-vault");

const VaultName = "InstEthVault",
  TokenName = "Inception stETH",
  TokenSymbol = "InstETH";

async function main() {
  await deployVault(addresses, VaultName, TokenName, TokenSymbol);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
