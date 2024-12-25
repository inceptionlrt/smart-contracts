const { ethers, upgrades } = require("hardhat");

const INCEPTION_TOKEN = "0x50993e7827d066f1AfD122f6A73B819cF9Ff1972",
  UNDERLYING_ASSET = "0x078f5B7D650457eBc3430F2e49B3B5319b94fafF",
  LOCKBOX = "0x865Ff05496eA73b0fA49fbBB97F2812776362c87",
  INCEPTION_VAULT = "0x2d586f82BB895ee0D6566fAD03303E23Ab28d240",
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

