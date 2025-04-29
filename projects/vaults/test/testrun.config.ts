import 'dotenv/config';
import { assetData } from './data/assets/new';

console.log(assetData);

const rpcURL = process.env.RPC;
if (!rpcURL) throw new Error("RPC variable is required. Please set it in your .env file");

const testrunConfig: {
  network: string;
  RPC: string;
  assetData: typeof assetData;
} = {
  network: process.env.NETWORK || 'mainnet',
  RPC: rpcURL,
  assetData: assetData,
}

export {testrunConfig};
