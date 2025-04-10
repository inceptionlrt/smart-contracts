const { addresses } = require("../config-addresses");
const { deployVault } = require("../../deploy-vault_S");

const VaultName = "inLBTCVault_S",
  TokenName = "Inception Symbiotic Restaked LBTC",
  TokenSymbol = "inBTCs",
  symbioticWrappers = ["0xdC1741f9bD33DD791942CC9435A90B0983DE8665"],
  symbioticVaults = ["0xdC47953c816531a8CA9E1D461AB53687d48EEA26"],
  asset = "0x8236a87084f8b84306f72007f36f2618a5634494",
  ratioFeed = "0xFd73Be536503B5Aa80Bf99D1Fd65b1306c69B191";

async function main() {
  await deployVault(addresses, VaultName, TokenName, TokenSymbol, [], [], symbioticVaults, asset, ratioFeed);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });