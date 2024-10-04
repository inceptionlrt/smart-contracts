/**
 * tBTC
 */

const { addresses } = require("../config-addresses");
const { deployVault } = require("../../deploy-vault");

const VaultName = "IntBtcVault",
  TokenName = "Inception Restaked tBTC",
  TokenSymbol = "intBTC";

async function main() {
  await deployVault(addresses, "0x1AEe5EC60fc79B669f11FE368fDe789E267649e2", VaultName, TokenName, TokenSymbol);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
