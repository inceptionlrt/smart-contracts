const fs = require("fs").promises;
const path = require("path");
const hre = require("hardhat");
const { addresses } = require("./migration/mainnet/config-addresses");

const advanceBlock = async () => {
  hre.network.provider.send("evm_mine");
};

const advanceBlocks = async (count) => {
  for (let i = 0; i < count; i++) {
    await advanceBlock();
  }
};

async function readJsonFiles(dirPath) {
  const vaults = new Map();
  try {
    const files = await fs.readdir(dirPath);
    const jsonFiles = files.filter((file) => path.extname(file).toLowerCase() === ".json");

    for (const file of jsonFiles) {
      const filePath = path.join(dirPath, file);
      const fileContent = await fs.readFile(filePath, "utf8");
      const jsonData = JSON.parse(fileContent);
      const modifiedName = file.replace("mainnet_", "").replace(".json", "");
      vaults.set(modifiedName, jsonData);
    }
  } catch (error) {
    console.error("Error reading JSON files:", error);
  }

  return vaults;
}

async function readJsonAndSplitAsync(filePath) {
  try {
    const jsonString = await fs.readFile(filePath, "utf8");
    const jsonObject = JSON.parse(jsonString);
    const dataMap = new Map(Object.entries(jsonObject));

    const keysArray = Array.from(dataMap.keys());
    const valuesArray = Array.from(dataMap.values());

    return [keysArray, valuesArray];
  } catch (err) {
    console.error("Error:", err);
  }
}

const getVaultImplAndStrategyAddress = async (vaultName) => {
  let vaultFactory = "InVault_E1";
  switch (vaultName) {
    case "InstEthVault":
      vaultFactory = "InVault_E2";
      strategyAddress = addresses.LidoStrategy;
      break;
    case "InrEthVault":
      vaultFactory = "InVault_E2";
      strategyAddress = addresses.RocketStrategy;
      break;
    case "InosEthVault":
      strategyAddress = addresses.StakewiseStrategy;
      break;
    case "InoEthVault":
      strategyAddress = addresses.OriginStrategy;
      break;
    case "InankrEthVault":
      strategyAddress = addresses.AnkrStrategy;
      break;
    case "InwbEthVault":
      strategyAddress = addresses.BinanceStrategy;
      break;
    case "IncbEthVault":
      strategyAddress = addresses.CoinbaseStrategy;
      break;
    case "InswEthVault":
      strategyAddress = addresses.SwellStrategy;
      break;
    case "InEthxVault":
      strategyAddress = addresses.StaderStrategy;
      break;
    case "InsfrxEthVault":
      strategyAddress = addresses.FraxStrategy;
      break;
    case "InmEthVault":
      strategyAddress = addresses.MantleStrategy;
      break;
    case "InlsEthVault":
      strategyAddress = addresses.LiquidStrategy;
      break;
  }
  return [vaultFactory, strategyAddress];
};

module.exports = {
  advanceBlocks,
  getVaultImplAndStrategyAddress,
  readJsonAndSplitAsync,
  readJsonFiles,
};
