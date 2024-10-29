import { expect } from "chai";
import { ethers, deployments, upgrades } from "hardhat";
import { InceptionOmniVault, InceptionToken, InceptionRatioFeed } from "../typechain-types";
const Options = require("@layerzerolabs/lz-v2-utilities").Options;

describe("InceptionOmniVault Cross-Chain Tests", function () {
    const CrossChainAdapterL2Address = "0x939E5216eaec2Fa6eB252BA8137F3796891CcD5B";

    async function deployFixture() {
        await deployments.fixture();
        const [deployer] = await ethers.getSigners();

        // Deploy InceptionRatioFeed
        const InceptionRatioFeed = await ethers.getContractFactory("contracts/vaults/InceptionRatioFeed.sol:InceptionRatioFeed");
        const inceptionRatioFeed = await upgrades.deployProxy(InceptionRatioFeed, [
            deployer.address 
        ]) as InceptionRatioFeed;
        await inceptionRatioFeed.waitForDeployment();

        // Set ratio threshold for InceptionRatioFeed
        const ratioThreshold = 1_000_000n;
        await inceptionRatioFeed.setRatioThreshold(ratioThreshold);

        // Deploy InceptionToken
        const InceptionToken = await ethers.getContractFactory("InceptionToken");
        const inceptionToken = await upgrades.deployProxy(InceptionToken, [
            "Inception Token",       // Token name
            "INCT"                   // Token symbol
        ]) as InceptionToken;
        await inceptionToken.waitForDeployment();

        const InceptionOmniVault = await ethers.getContractFactory("InceptionOmniVault");
        const inceptionOmniVault = await upgrades.deployProxy(InceptionOmniVault, [
            "Inception Vault",          // Vault name
            deployer.address,           // Operator
            inceptionToken.target,      // InceptionToken
            CrossChainAdapterL2Address  // CrossChainAdapterL2 
        ], { initializer: "__InceptionOmniVault_init" }) as InceptionOmniVault;
        await inceptionOmniVault.waitForDeployment();

        // Set the vault address in InceptionToken
        await inceptionToken.setVault(inceptionOmniVault.target);

        // Set the InceptionRatioFeed address in InceptionOmniVault
        await inceptionOmniVault.setRatioFeed(inceptionRatioFeed.target);

        // Set the initial ratio for InceptionToken in InceptionRatioFeed
        const initialRatio = ethers.parseUnits("1", 18); // 1.0 ratio
        await inceptionRatioFeed.updateRatioBatch([inceptionToken.target], [initialRatio]);

        return { inceptionOmniVault, inceptionToken, inceptionRatioFeed, deployer };
    }

    describe("quoteSendEthCrossChain", function () {
        it("should return a quote for cross-chain ETH transfer", async function () {
            const { inceptionOmniVault, deployer } = await deployFixture();

            const targetChainId = 11155111;
            const sendValue = ethers.parseUnits("123456.789", "gwei");
            const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, sendValue).toHex().toString();
            console.log("Options encoding (hex):", options);

            const quote = await inceptionOmniVault.connect(deployer).quoteSendEthCrossChain(targetChainId, options);

            expect(quote).to.be.a("bigint");
            console.log("Cross-chain ETH transfer quote:", quote.toString());
        });
    });
});
