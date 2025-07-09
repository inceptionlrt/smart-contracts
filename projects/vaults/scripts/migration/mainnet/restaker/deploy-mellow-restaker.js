const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with the account: ${deployer.address}`);

  deployer.initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", deployer.initBalance.toString());

  const mellowRestakerFactory = await ethers.getContractFactory("IMellowRestaker");
  const mr = await upgrades.deployProxy(
    mellowRestakerFactory,
    [
      [],
      "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
      "0xd87D15b80445EC4251e33dBe0668C335624e54b7",
      "0xf9D9F828989A624423C48b95BC04E9Ae0ef5Ec97",
    ],
    {
      kind: "transparent",
    },
  );
  await mr.waitForDeployment();
  const mrAddress = await mr.getAddress();
  console.log(mrAddress);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

