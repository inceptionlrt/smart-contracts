import { ethers, upgrades } from "hardhat";
import {
  DelegationManagerMock,
  EigenPodManagerMock,
  ProtocolConfig,
  RestakingPool,
  CToken,
  RatioFeed,
  FeeCollector,
  RestakerDeployer,
  RestakerFacets,
} from "../../typechain-types";
import { HardhatEthersSigner, SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { _1E18 } from "./constants";

export async function deployEigenMocks() {
  const podImpl = await ethers.deployContract("EigenPodMock", [
    ethers.ZeroAddress,
    ethers.ZeroAddress,
    ethers.ZeroAddress,
    0,
  ]);
  await podImpl.waitForDeployment();

  const simpleBeacon = await ethers.deployContract("SimpleBeacon", [await podImpl.getAddress()]);
  await simpleBeacon.waitForDeployment();

  const eigenPodManager = await ethers.deployContract("EigenPodManagerMock", [
    ethers.ZeroAddress,
    await simpleBeacon.getAddress(),
    ethers.ZeroAddress,
    ethers.ZeroAddress,
  ]);
  await eigenPodManager.waitForDeployment();

  const delegationManager = await ethers.deployContract("DelegationManagerMock");
  await delegationManager.waitForDeployment();

  return {
    eigenPodManager: eigenPodManager as unknown as EigenPodManagerMock,
    delegationManager: delegationManager as unknown as DelegationManagerMock,
  };
}

export async function deployRestakerContacts({
  eigenPodManager,
  delegationManager,
  owner,
  protocolConfig,
}: {
  eigenPodManager: EigenPodManagerMock;
  delegationManager: DelegationManagerMock;
  owner: string;
  protocolConfig?: ProtocolConfig;
}) {
  // deploy facets
  const restakerFacets = await upgrades.deployProxy(
    await ethers.getContractFactory("RestakerFacets"),
    [owner, await eigenPodManager.getAddress(), await delegationManager.getAddress()],
    { redeployImplementation: "always" },
  );
  await restakerFacets.waitForDeployment();

  // deploy restaker beacon
  const Restaker = await ethers.getContractFactory("Restaker");
  const beacon = await upgrades.deployBeacon(Restaker, {
    redeployImplementation: "always",
  });
  await beacon.waitForDeployment();

  // deploy RestakerDeployer
  const restakerDeployer = await ethers.deployContract("RestakerDeployer", [
    await beacon.getAddress(),
    await restakerFacets.getAddress(),
  ]);
  await restakerDeployer.waitForDeployment();
  protocolConfig && (await protocolConfig.setRestakerDeployer(await restakerDeployer.getAddress()));

  return {
    restakerDeployer: restakerDeployer as unknown as RestakerDeployer,
    restakerFacets: restakerFacets as unknown as RestakerFacets,
    beacon,
  };
}

export async function deployConfig(wallets: HardhatEthersSigner[]) {
  const [governance, operator, treasury] = wallets;
  const config = await upgrades.deployProxy(
    await ethers.getContractFactory("ProtocolConfig"),
    [governance.address, operator.address, treasury.address],
    { redeployImplementation: "always" },
  );
  await config.waitForDeployment();
  config.address = await config.getAddress();

  return config as unknown as ProtocolConfig;
}

export async function deployRatioFeed(protocolConfig: ProtocolConfig, ratioThreshold = 10_000_000n) {
  const ratioFeed = await upgrades.deployProxy(
    await ethers.getContractFactory("RatioFeed"),
    [await protocolConfig.getAddress(), ratioThreshold],
    { redeployImplementation: "always" },
  );
  await ratioFeed.waitForDeployment();
  ratioFeed.address = await ratioFeed.getAddress();
  await protocolConfig.setRatioFeed(ratioFeed.address);

  return ratioFeed as unknown as RatioFeed;
}

export async function deployFeeCollector(
  protocolConfig: ProtocolConfig,
  commission = 1000, // 10%
) {
  const feeCollector = await upgrades.deployProxy(
    await ethers.getContractFactory("FeeCollector"),
    [await protocolConfig.getAddress(), commission],
    { redeployImplementation: "always" },
  );
  await feeCollector.waitForDeployment();
  feeCollector.address = await feeCollector.getAddress();

  return feeCollector as unknown as FeeCollector;
}

export async function deployLiquidRestaking({
  protocolConfig,
  tokenName,
  tokenSymbol,
  distributeGasLimit,
  ratioThreshold,
  maxTVL,
}: {
  protocolConfig: ProtocolConfig;
  tokenName: string;
  tokenSymbol: string;
  distributeGasLimit?: bigint;
  ratioThreshold?: bigint;
  maxTVL?: bigint;
}) {
  // cToken
  const cToken = await deployCToken(protocolConfig, tokenName, tokenSymbol);

  // Library
  const library = await ethers.deployContract("InceptionLibrary");
  await library.waitForDeployment();

  // Pool
  const restakingPool = await upgrades.deployProxy(
    await ethers.getContractFactory("RestakingPool", {
      libraries: {
        InceptionLibrary: await library.getAddress(),
      },
    }),
    [await protocolConfig.getAddress(), distributeGasLimit || 250000n, maxTVL || 32_000_000_000_000_000_000n],
    { redeployImplementation: "always", unsafeAllowLinkedLibraries: true },
  );
  await restakingPool.waitForDeployment();
  restakingPool.address = await restakingPool.getAddress();
  await protocolConfig.setRestakingPool(restakingPool.address);

  const ratioFeed = await deployRatioFeed(protocolConfig, ratioThreshold);
  await ratioFeed.repairRatio(await cToken.getAddress(), _1E18); // force update ratio to 1e18

  return {
    cToken: cToken as unknown as CToken,
    restakingPool: restakingPool as unknown as RestakingPool,
    ratioFeed,
  };
}

export async function deployCToken(protocolConfig: ProtocolConfig, tokenName: string, tokenSymbol: string) {
  const cToken = await upgrades.deployProxy(
    await ethers.getContractFactory("cToken"),
    [await protocolConfig.getAddress(), tokenName, tokenSymbol],
    { redeployImplementation: "always" },
  );
  await cToken.waitForDeployment();
  cToken.address = await cToken.getAddress();
  await protocolConfig.setCToken(cToken.address);
  return cToken as unknown as CToken;
}
