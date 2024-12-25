const { ethers, upgrades } = require("hardhat");

const INCEPTION_TOKEN = "0xE4452f2BFA4F13d241A699f40dd956445aC6dF47",
  UNDERLYING_ASSET = "0xFA4471cAA64E0A6F1a8A2328F01dD48D27Fa99a9",
  LOCKBOX = "0x865Ff05496eA73b0fA49fbBB97F2812776362c87",
  INCEPTION_VAULT = "0x70232716d02115D0B85834A6CBeAe62556b4D53F",
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
    [2522n, inceptionToken, underlyingAsset, lockbox, inceptionVault, defaultAdapter, operator],
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

