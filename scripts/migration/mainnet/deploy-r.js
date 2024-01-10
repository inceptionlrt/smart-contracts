const { addresses } = require("./el-addresses");
const { deployVault } = require("../deploy-vault");

const VaultName = "InrEthVault",
  TokenName = "Inception rETH",
  TokenSymbol = "InrETH";

async function main() {
  await deployVault(addresses, VaultName, TokenName, TokenSymbol);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
