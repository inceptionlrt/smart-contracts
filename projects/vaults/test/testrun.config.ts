import 'dotenv/config';
import importSync from 'import-sync';
import fs from 'fs';

const assetName = process.env.ASSET_NAME;
if (!assetName) throw new Error("ASSET_NAME variable is required. Please set it in your .env file");
const rpcURL = process.env.RPC;
if (!rpcURL) throw new Error("RPC variable is required. Please set it in your .env file");

export const testrunConfig: {
  assetName: string;
  network: string;
  RPC: string;
  assetData: any; 
} = {
  assetName,
  network: process.env.NETWORK || 'mainnet',
  RPC: rpcURL,
  assetData: {},
}

if (!testrunConfig.assetName) throw new Error("ASSET_NAME variable is required. Please set it in your .env file");
if (!testrunConfig.RPC) throw new Error("RPC variable is required. Please set it in your .env file");

const assetsPath = `data/assets/new`;

const filePath = `./${assetsPath}/${testrunConfig.assetName}.ts`;
let assetData;
try {
  assetData = importSync(filePath).default;
} catch (error) {
  const filesInDir = fs.readdirSync(process.cwd() + '/test/' + assetsPath);
  const availableAssetNames = filesInDir.map(file => file.replace('.ts', '')).filter(name => name !== 'index');

  throw new Error(`Asset data file not found. Available asset names: ${availableAssetNames.join(', ')}`);
}
testrunConfig.assetData = assetData;

// console.info(`Asset data loaded from ${filePath}`);
// console.info(assetData);
