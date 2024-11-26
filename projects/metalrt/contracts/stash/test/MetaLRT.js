// const ether = require('@openzeppelin/test-helpers/src/ether');
const { expect } = require('chai');
// const { BigNumber } = require('ethers');
// const { joinSignature } = require('ethers/lib/utils');
const { ethers, network } = require('hardhat');
// const Web3 = require('web3');
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { randomBytes } = require('ethers');
const { bigint } = require('hardhat/internal/core/params/argumentTypes');
const { sign } = require('crypto');


describe('===FORK===', function () {

    let deployer;

    let local, local2, local3;
    let signer, signer2, signer3;

    let wstETHAddress = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0";
    let stETHAddress = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";

    const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

    let MetaLRTFactory, RatioAdapterFactory;

    let wstETH_ABI = ["function transfer(address,uint256) external", "function approve(address,uint256) external", "function balanceOf(address) external view returns(uint256)", "function wrap(uint256) external returns (uint256)"];
    let stETH_ABI = ["function transfer(address,uint256) external", "function approve(address,uint256) external", "function balanceOf(address) external view returns(uint256)", "function submit(address) external payable returns(uint256)"];

    let mLRT, ra;

    let wstETH, stETH;

    let passOnValue;

    let instETH = "0x814CC6B8fd2555845541FB843f37418b05977d8d";
    let instETHDerivative = "0x7FA768E035F956c41d6aeaa3Bd857e7E5141CAd5";

    let inswETH = "0xc4181dC7BB31453C4A48689ce0CBe975e495321c";
    let inswETHDerivative = "0xC3ADe5aCe1bBb033CcAE8177C12Ecbfa16bD6A9D";

    before(async function () {

        [deployer, local, local2, local3] = await ethers.getSigners();

        await network.provider.request({
            method: "hardhat_reset",
            params: [
            {
                forking: {
                jsonRpcUrl: "https://rpc.ankr.com/eth",
                blockNumber: 21114276
                },
            },
            ],
        });

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x3c22ec75ea5D745c78fc84762F7F1E6D82a2c5BF"],
        });
        signer = await ethers.getSigner("0x3c22ec75ea5D745c78fc84762F7F1E6D82a2c5BF")
        await network.provider.send("hardhat_setBalance", [
            "0x3c22ec75ea5D745c78fc84762F7F1E6D82a2c5BF",
            "0x10000000000000000000",
        ]);

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x28C0208b7144B511C73586Bb07dE2100495e92f3"],
        });
        signer2 = await ethers.getSigner("0x28C0208b7144B511C73586Bb07dE2100495e92f3")
        await network.provider.send("hardhat_setBalance", [
            "0x28C0208b7144B511C73586Bb07dE2100495e92f3",
            "0x10000000000000000000",
        ]);
    });

    describe('MetaLRT', function () {

        before(async function () {

            // Factories
            MetaLRTFactory = await ethers.getContractFactory("MetaLRTDerivative");
            RatioAdapterFactory = await ethers.getContractFactory("RatioAdapter");

            // Deployment
            mLRT = await upgrades.deployProxy(MetaLRTFactory, ["Meta Liquid Restaked Token", "mLRT", ethers.parseEther("0.01"), wstETHAddress], { initializer: "initialize" }); await mLRT.waitForDeployment();
            ra = await upgrades.deployProxy(RatioAdapterFactory, [], { initializer: "initialize" }); await ra.waitForDeployment();
            wstETH = await ethers.getContractAt(wstETH_ABI, wstETHAddress);
            stETH = await ethers.getContractAt(stETH_ABI, stETHAddress);

            // Setup
            await ra.setToken(await wstETH.getAddress(), "getStETHByWstETH(uint256)", "getWstETHByStETH(uint256)", "", false);

            // Asset Transfer
            await wstETH.connect(signer).transfer(await local.getAddress(), ethers.parseEther("100"));
        });

        // ---===< CORE >===---

        it('changeYieldHeritor()', async function () {
            this.timeout(150000000);

            await mLRT.changeYieldHeritor(wstETHAddress);
            expect(await mLRT.yieldHeritor()).to.be.equal(wstETHAddress);
            await mLRT.changeYieldHeritor(await deployer.getAddress());
            expect(await mLRT.yieldHeritor()).to.be.equal(await deployer.getAddress());
        });
        it('changeYieldMargin()', async function () {
            this.timeout(150000000);

            await mLRT.changeYieldMargin(ethers.parseEther("0.1"));
            expect(await mLRT.yieldMargin()).to.be.equal(ethers.parseEther("0.1"));
            await mLRT.changeYieldMargin(ethers.parseEther("0.01"));
            expect(await mLRT.yieldMargin()).to.be.equal(ethers.parseEther("0.01"));
        });
        it('changeAdapter()', async function () {
            this.timeout(150000000);

            expect(await mLRT.ratioAdapter()).to.be.equal(NULL_ADDRESS);
            await mLRT.changeAdapter(await ra.getAddress());
            expect(await mLRT.ratioAdapter()).to.be.equal(await ra.getAddress());
        });
        it('deposit()', async function () {
            this.timeout(150000000);

            await wstETH.connect(local).approve(await mLRT.getAddress(), ethers.parseEther("10"));
            await mLRT.connect(local).deposit(ethers.parseEther("10"), await local.getAddress());

            // convertToShares(wstETHinETH * totalShares / wstETHinETHTotal)
            let share = (BigInt(await ra.toValue(await wstETH.getAddress(), ethers.parseEther("10"))) * 1n) / (BigInt(await ra.toValue(await wstETH.getAddress(), 0)) + 1n);
            expect(await wstETH.balanceOf(local.address)).to.be.equal(ethers.parseEther("90"));
            expect(await wstETH.balanceOf(await mLRT.getAddress())).to.be.equal(ethers.parseEther("10"));
            expect(await mLRT.balanceOf(local.address)).to.be.equal(share);
        });
        it('claimYield()', async function () {
            this.timeout(150000000);

            let balance = await ra.toValue(await wstETH.getAddress(), ethers.parseEther("10"));
            let totalAssets = await ra.toValue(await wstETH.getAddress(), ethers.parseEther("10")) - 0n;  // 0n = VaultYield
            expect(await mLRT.getBalance()).to.be.equal(balance);
            expect(await mLRT.getVaultYield()).to.be.equal(0n);
            expect(await mLRT.totalAssets()).to.be.equal(totalAssets);
            expect(await mLRT.yieldBalance()).to.be.equal(balance);

            // ----------------------- Ratio of wstETH changes
            await ethers.provider.send("hardhat_setStorageAt", [
                await stETH.getAddress(),
                "0xed310af23f61f96daefbcd140b306c0bdbf8c178398299741687b90e794772b0",
                "0x00000000000000000000000000000000000000000000001adb187510dabf8e0a",  // Increased BUFFERED_ETHER_POSITION of stETH
              ]);
            // -----------------------

            let balanceAfter = await ra.toValue(await wstETH.getAddress(), ethers.parseEther("10"));
            let totalYield = balanceAfter - balance;
            let protocolYield = (totalYield * 1n)/100n;  // Yield Margin was 1%
            let totalAssetsAfter = balanceAfter - protocolYield;

            expect(await mLRT.getBalance()).to.be.equal(balanceAfter);
            expect(await mLRT.getVaultYield()).to.be.equal(protocolYield);
            expect(await mLRT.totalAssets()).to.be.equal(totalAssetsAfter);
            expect(await mLRT.yieldBalance()).to.be.equal(balance);

            await mLRT.claimYield();

            expect(await mLRT.getBalance()).to.be.equal(balanceAfter - protocolYield);
            expect(await mLRT.getVaultYield()).to.be.equal(0n);
            expect(await mLRT.totalAssets()).to.be.equal(totalAssetsAfter);
            expect(await mLRT.yieldBalance()).to.be.equal(balanceAfter - protocolYield);
            expect(await wstETH.balanceOf(await deployer.getAddress())).to.be.equal(await ra.fromValue(await wstETH.getAddress(), protocolYield));

            passOnValue = [ totalAssetsAfter, protocolYield];
        });
        it('redeem()', async function () {
            this.timeout(150000000);

            let shares = await mLRT.balanceOf(await local.getAddress());
            // convertToAssets(shares * wstETHinETHTotal / totalShares)
            let assets = (BigInt(shares) * BigInt(passOnValue[0])) / BigInt(shares);
            let deployerBalanceBefore = await ra.fromValue(await wstETH.getAddress(), passOnValue[1]); 
            expect(await wstETH.balanceOf(await deployer.getAddress())).to.be.equal(deployerBalanceBefore);

            await mLRT.connect(local).redeem(shares, await deployer.getAddress(), await local.getAddress());

            expect(await wstETH.balanceOf(await deployer.getAddress())).to.be.approximately(deployerBalanceBefore + (await ra.fromValue(await wstETH.getAddress(), assets)), 10);
            expect(await mLRT.balanceOf(await local.getAddress())).to.be.equal(0n);
        });
        it('mint()', async function () {
            this.timeout(150000000);

            let targetMintShares = 10n*10n**18n;
            let totalAssets = await mLRT.totalAssets();
            let totalSupply = await mLRT.totalSupply();
            // convertToAssets(shares * wstETHinETHTotal / totalShares)
            let assets = await ra.fromValue(await wstETH.getAddress(), (BigInt(10n*10n**18n) * (BigInt(totalAssets) + 1n)) / (BigInt(totalSupply) + 1n));

            await wstETH.connect(local).approve(await mLRT.getAddress(), assets);
            await mLRT.connect(local).mint(10n*10n**18n, await local.getAddress());

            expect(await wstETH.balanceOf(local.address)).to.be.equal(ethers.parseEther("90") - assets);
            expect(await wstETH.balanceOf(await mLRT.getAddress())).to.be.approximately(assets, 10);
            expect(await mLRT.balanceOf(await local.getAddress())).to.be.equal(targetMintShares);

            passOnValue = [assets];
        });
        it('withdraw()', async function () {
            this.timeout(150000000);

            // Yield Accumulation
            let balance = await ra.toValue(await wstETH.getAddress(), passOnValue[0]);
            let totalAssets = await ra.toValue(await wstETH.getAddress(), passOnValue[0]) - 0n;  // 0n = VaultYield
            expect(await mLRT.getBalance()).to.be.approximately(balance, 10);
            expect(await mLRT.getVaultYield()).to.be.equal(0n);
            expect(await mLRT.totalAssets()).to.be.approximately(totalAssets, 10);
            expect(await mLRT.yieldBalance()).to.be.approximately(balance, 10);

            // ----------------------- Ratio of wstETH changes
            await ethers.provider.send("hardhat_setStorageAt", [
                await stETH.getAddress(),
                "0xed310af23f61f96daefbcd140b306c0bdbf8c178398299741687b90e794772b0",
                "0x00000000000000000000000000000000000000000000001afb187510dabf8e0a",  // Increased BUFFERED_ETHER_POSITION of stETH
              ]);
            // -----------------------

            let balanceAfter = await ra.toValue(await wstETH.getAddress(), passOnValue[0]);
            let totalYield = balanceAfter - balance;
            let protocolYield = (totalYield * 1n)/100n;  // Yield Margin was 1%
            let totalAssetsAfter = balanceAfter - protocolYield;

            expect(await mLRT.getBalance()).to.be.approximately(balanceAfter, 10);
            expect(await mLRT.getVaultYield()).to.be.equal(protocolYield);
            expect(await mLRT.totalAssets()).to.be.approximately(totalAssetsAfter, 10);
            expect(await mLRT.yieldBalance()).to.be.approximately(balance, 10);

            // Actual Withdraw
            let targetWithdrawAssets = passOnValue[0] - await ra.fromValue(await wstETH.getAddress(), protocolYield);
            let totalSupply = await mLRT.totalSupply();
            totalAssets = await mLRT.totalAssets();
            // convertToShares(wstETHinETH * totalShares / wstETHinETHTotal)
            let shares = (await ra.toValue(await wstETH.getAddress(), targetWithdrawAssets - 1n) * (totalSupply + 1n)) / (totalAssets + 1n);

            let sharesBefore = await mLRT.balanceOf(await local.getAddress());
            let yieldBefore = await wstETH.balanceOf(await deployer.getAddress());
            await mLRT.connect(local).withdraw(targetWithdrawAssets - 1n, await local.getAddress(), await local.getAddress());
            let sharesAfter = await mLRT.balanceOf(await local.getAddress());
            let yieldAfter = await wstETH.balanceOf(await deployer.getAddress());

            expect(shares).to.be.approximately(sharesBefore - sharesAfter, 10);
            expect(await wstETH.balanceOf(await mLRT.getAddress())).to.be.approximately(0, 10);
            expect(await ra.toValue(await wstETH.getAddress(), yieldAfter - yieldBefore)).to.be.approximately(protocolYield, 10);

        });

        // ---===< STRATEGIES >===---

        it('addStrategy(), setAllocations()', async function () {
            this.timeout(150000000);

            // Strategy 1
            let YieldStrategy = await ethers.getContractFactory("StrategyYieldU");
            let ys = await YieldStrategy.deploy(await mLRT.getAddress(), await wstETH.getAddress(), instETH, instETHDerivative, await stETH.getAddress(), await ra.getAddress()); await ys.waitForDeployment();

            await mLRT.addStrategy(await ys.getAddress(), instETHDerivative);
            await mLRT.setAllocations([1n*10n**18n]);
            await ra.setToken(instETHDerivative, "convertToAssets(uint256)", "convertToShares(uint256)", "", false);
            await ra.setProviderForToken(instETHDerivative, instETH);

            expect(await mLRT.strategies(0)).to.be.equal(await ys.getAddress());
            expect((await mLRT.stats(await ys.getAddress()))[0]).to.be.equal(1n*10n**18n);
            expect((await mLRT.stats(await ys.getAddress()))[1]).to.be.equal(instETHDerivative);

            // Strategy 2
            YieldStrategy = await ethers.getContractFactory("StrategyYield");
            ys = await YieldStrategy.deploy(await mLRT.getAddress(), await wstETH.getAddress(), inswETH, inswETHDerivative, NULL_ADDRESS, await ra.getAddress()); await ys.waitForDeployment();
            await ra.setToken(inswETHDerivative, "convertToAssets(uint256)", "convertToShares(uint256)", "", false);
            await ra.setProviderForToken(inswETHDerivative, inswETH);

            await mLRT.addStrategy(await ys.getAddress(), inswETHDerivative);
            await mLRT.setAllocations([3n*10n**17n, 7n*10n**17n]);  // 30%, 70%
        });

        it('sDeposit()', async function () {
            this.timeout(150000000);

            // Users deposit mLRT's underlying
            await wstETH.connect(signer).approve(await mLRT.getAddress(), ethers.parseEther("1000"));
            await mLRT.connect(signer).deposit(ethers.parseEther("1000"), await signer.getAddress());
            
            let strategy = await mLRT.strategies(0);

            expect(await mLRT.totalAssets()).to.be.approximately(await ra.toValue(await wstETH.getAddress(), ethers.parseEther("1000")), 10);

            // Deposit to Strateg 1
            await mLRT.sDeposit(strategy, ethers.parseEther("300"));

            expect(await mLRT.totalAssets()).to.be.approximately(await ra.toValue(await wstETH.getAddress(), ethers.parseEther("1000")), 10);
        });
        it('sWithdraw()', async function () {
            this.timeout(150000000);

            let strategy = await mLRT.strategies(0);

            let stategyBalanceETH = await mLRT.getSDepositETH(strategy);
            let stategyBalancewstETH = await ra.fromValue(instETHDerivative, stategyBalanceETH);

            expect(await mLRT.totalAssets()).to.be.approximately(await ra.toValue(await wstETH.getAddress(), ethers.parseEther("1000")), 10);

            await mLRT.sWithdraw(strategy, stategyBalancewstETH);

            let assetsWithdrawn = (await ra.toValue(await wstETH.getAddress(), ethers.parseEther("300")) * 995n)/1000n;  // 5% flash fee
            let assetsInVaultBeforeWithdraw = await ra.toValue(await wstETH.getAddress(), ethers.parseEther("700"));
            let total = assetsWithdrawn + assetsInVaultBeforeWithdraw;
            expect(await mLRT.totalAssets()).to.be.approximately(total, 10);
            expect(await wstETH.balanceOf(await mLRT.getAddress())).to.be.approximately(await ra.fromValue(await wstETH.getAddress(), total), 10);
        });
        it('sDepositAuto()', async function () {

            // User deposits mLRT's underlying (Just to make even balance in vault)
            await wstETH.connect(signer).approve(await mLRT.getAddress(), 1500000000000000001n);
            await mLRT.connect(signer).deposit(1500000000000000001n, await signer.getAddress());

            expect(await wstETH.balanceOf(await mLRT.getAddress()), ethers.parseEther("1000"));

            let strategy1 = await mLRT.strategies(0);
            let strategy2 = await mLRT.strategies(1);

            expect((await mLRT.stats(strategy1)).allocation).to.be.equal(3n*10n**17n); // 30%
            expect((await mLRT.stats(strategy2)).allocation).to.be.equal(7n*10n**17n); // 70%

            await mLRT.sDepositAuto(ethers.parseEther("1000"));

            let instContract = await ethers.getContractAt(wstETH_ABI, instETHDerivative);
            let inswContract = await ethers.getContractAt(wstETH_ABI, inswETHDerivative);
            console.log(await instContract.balanceOf(await mLRT.getAddress()));
            console.log(await inswContract.balanceOf(await mLRT.getAddress()));

        });
        it('dDeposit()', async function () {
            this.timeout(150000000);

            // // User deposits mLRT's underlying (Just to make even balance in vault)
            // await wstETH.connect(signer).approve(await mLRT.getAddress(), 1500000000000000001n);
            // await mLRT.connect(signer).deposit(1500000000000000001n, await signer.getAddress());

            // expect(await wstETH.balanceOf(await mLRT.getAddress()), ethers.parseEther("1000"));

            // await mLRT.setAllocations([3n*10n**17n, 7n*10n**17n]);  // 30%, 70%

            // let instETHDerivativeToken = await ethers.getContractAt(["function approve(address,uint256) external"], instETHDerivative);

            // await instETHDerivativeToken.connect(signer2).approve(await mLRT.getAddress(), 10000000000000000000n);
            // await mLRT.connect(signer2).dDeposit([ethers.parseEther("10"), 0]);

            // console.log(await mLRT.balanceOf(await signer2.getAddress()))
        });
        it('dWithdraw()', async function () {
            this.timeout(150000000); 
        });
    });
});