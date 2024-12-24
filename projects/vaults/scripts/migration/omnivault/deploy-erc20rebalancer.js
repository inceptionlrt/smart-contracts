const { ethers, upgrades } = require("hardhat");

const INCEPTION_TOKEN = "0xA5528beA2bE2467629E6c3b017198d971590a48a",
  UNDERLYING_ASSET = "0xffA312b35306f7076C0093DdeE93cdC07F3f9C59",
  LOCKBOX = "0xEb0b9578CDA5bcD08307744258B7D8aFAaF402c8",
  INCEPTION_VAULT = "0x049DCdA2079d915C079BeEDFa7414551730546d6",
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

