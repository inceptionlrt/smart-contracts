import "dotenv";
import {HardhatUserConfig} from "hardhat/config";
import {CONFIG} from "../../../hh.config";
import "@nomicfoundation/hardhat-toolbox";
import "@layerzerolabs/test-devtools-evm-hardhat";
import "hardhat-gas-reporter";
import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";
import fs from "fs";
import fse from "fs-extra";
import path from "path";

const TARGET_DIR = "./contracts";
const EXTERNAL_PROJECTS = [
    "../../crosschain-adapters",
    "../../bridge-lz",
    "../../restaking-pool"
]

const collectContractsWithSymlinks = () => {
    if (!fs.existsSync(TARGET_DIR)) {
        fs.mkdirSync(TARGET_DIR);
    }

    EXTERNAL_PROJECTS.forEach((project) => {
        const baseName = path.basename(project);
        const symlinkPath = path.join(TARGET_DIR, baseName);
        console.log("basename: ", baseName);
        console.log("symlinkPath: ", symlinkPath);

        if (!fs.existsSync(symlinkPath)) {
            const resolvedSourceDir = path.resolve(project);
            fs.symlinkSync(path.join(resolvedSourceDir, "contracts"), symlinkPath, 'dir');
        }
    });
};
// collectContractsWithSymlinks();

const copyContracts = () => {
    EXTERNAL_PROJECTS.forEach((project) => {
        const srcDir = path.resolve(project + "/contracts");
        const dstDir = path.join(TARGET_DIR, path.basename(project));
        console.log("src dir:", srcDir);
        console.log("dst dir:", dstDir);

        //Clear old contracts
        fse.removeSync(dstDir);
        fse.ensureDirSync(dstDir);

        //Cope
        fse.copySync(srcDir, dstDir, {overwrite: true});
    });
};
copyContracts();

const config: HardhatUserConfig = {
    ...(CONFIG as HardhatUserConfig),
    networks: {
        hardhat: {
            forking: {
                url: process.env.MAINNET_RPC,
                blockNumber: 20810000,
            },
            addresses: {
                restakingPoolConfig: "0x81b98D3a51d4aC35e0ae132b0CF6b50EA1Da2603",
                restakingPool: "0x46199cAa0e453971cedf97f926368d9E5415831a",
                lib: "0x8a6a8a7233b16d0ecaa7510bfd110464a0d69f66",
                cToken: "0xf073bAC22DAb7FaF4a3Dd6c6189a70D54110525C",
                ratioFeed: "0x122ee24Cb3Cc1b6B987800D3B54A68FC16910Dbf",
                lockbox: "0xb86d7BfB30E4e9552Ba1Dd6208284667DF2E8c0E",
                optimismInbox: "0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1"
            }
        },
    },
    solidity: {
        version: "0.8.27",
        settings: {
            viaIR: true,
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
};

export default config;
