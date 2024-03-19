const fs = require("fs").promises;
const path = require("path");

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

module.exports = {
  readJsonFiles,
};
