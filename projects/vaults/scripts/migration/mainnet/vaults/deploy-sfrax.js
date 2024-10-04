/**
 * Staked FRAX
 */

const { addresses } = require("../config-addresses");
const { deployVault } = require("../../deploy-vault");

const VaultName = "InsFraxVault",
  TokenName = "Inception Restaked sFRAX",
  TokenSymbol = "insFRAX";

async function main() {
  await deployVault(addresses, "0x50253dc4a01c6408Fab9646e804FCbFDb74e3E4c", VaultName, TokenName, TokenSymbol);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
