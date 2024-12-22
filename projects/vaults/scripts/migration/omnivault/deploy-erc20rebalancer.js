const { ethers, upgrades } = require("hardhat");

const INCEPTION_TOKEN = "0x34f90E4Ca80906B5770863aD1D9E661B4dB65da9",
  UNDERLYING_ASSET = "0xDc638d549a01284e5E2409C26369dB46dC45f44a",
  LOCKBOX = "0x1CdD819e2d1C82A6E51FDF7b05F8436e5CD89259",
  INCEPTION_VAULT = "0xDc4c9339247cb3f64cdd46e80a0b89bD08c0C734",
  DEFAULT_ADAPTER = "0xA2c902810eAE3C24208580e043cA0de36Ae66c3E";

const deployERC20Rebalancer = async (
  inceptionToken,
  underlyingAsset,
  lockbox,
  inceptionVault,
  defaultAdapter,
  operator,
) => {
  const ERC20RebalancerFactory = await hre.ethers.getContractFactory("ERC20Rebalancer");
  const rebalancer = await upgrades.deployProxy(
    ERC20RebalancerFactory,
    [inceptionToken, underlyingAsset, lockbox, inceptionVault, defaultAdapter, operator],
    { kind: "transparent" },
  );
  await rebalancer.waitForDeployment();
  const rebalancerAddr = await rebalancer.getAddress();
  console.log(`ERC20Rebalancer address: ${rebalancerAddr}`);

  return rebalancerAddr;
};

async function main() {
  const [deployer] = await ethers.getSigners();

  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log(`Account(${await deployer.getAddress()}) balance: ${initBalance.toString()}`);

  const ercRebalancer = await deployERC20Rebalancer(
    INCEPTION_TOKEN,
    UNDERLYING_ASSET,
    LOCKBOX,
    INCEPTION_VAULT,
    DEFAULT_ADAPTER,
    await deployer.getAddress(),
  );
  console.log(ercRebalancer);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

