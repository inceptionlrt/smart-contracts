# InceptionLRT

This repository contains smart contracts, vaults, tokens, and associated tests for the InceptionLRT project.

## Documentation

For detailed information and developer resources, please follow our [documentation](https://docs.inceptionlrt.com/for-developers/inception-vault-dev-details-testnet).

The contracts are upgradeable and guarded with the [TimeLockController](https://docs.openzeppelin.com/contracts/4.x/api/governance#TimelockController) contract.
The address can be found here: [InceptionTimeLock](https://etherscan.io/address/0x650bd9dee50e3ee15cbb49749ff6abcf55a8fb1e)

Additionally, the corresponding _RateProviders_ were deployed for all LRT (InceptionToken), see below. The RateProvider allows you to calculate the _rate_, providing a redemption price for _1 LRT_.

## Supported LSTs and upcoming additions

- [x] [stETH](https://etherscan.io/address/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84). Lido Staked Ethereum.
  - [InstEthVault](https://etherscan.io/address/0x814CC6B8fd2555845541FB843f37418b05977d8d).
  - [InstETH](https://etherscan.io/address/0x7FA768E035F956c41d6aeaa3Bd857e7E5141CAd5).
  - [InstETHRateProvider](https://etherscan.io/address/0x343281bb5029c4b698fe736d800115ac64d5de39).
- [x] [rETH](https://etherscan.io/address/0xae78736cd615f374d3085123a210448e74fc6393): Rocket Ethereum.
  - [InrEthVault](https://etherscan.io/address/0x1Aa53BC4Beb82aDf7f5EDEE9e3bBF3434aD59F12).
  - [InrETH](https://etherscan.io/address/0x80d69e79258FE9D056c822461c4eb0B4ca8802E2).
  - [InrETHRateProvider](https://etherscan.io/address/0xD6d553327b16dd6076D69c2DAEc91A50dD1E9F66).
- [x] [oETH](https://etherscan.io/address/0x856c4Efb76C1D1AE02e20CEB03A2A6a08b0b8dC3): Original Ethereum.
  - [InoEthVault](https://etherscan.io/address/0x4878F636A9Aa314B776Ac51A25021C44CAF86bEd).
  - [InoETH](https://etherscan.io/address/0x9181f633E9B9F15A32d5e37094F4C93b333e0E92).
  - [InoETHRateProvider](https://etherscan.io/address/0xbd600020f943f7C61a8123fE2720A05434A3B38b).
- [x] [osETH](https://etherscan.io/address/0xf1C9acDc66974dFB6dEcB12aA385b9cD01190E38): StakeWise Staked Ethereum LST.
  - [InosEthVault](https://etherscan.io/address/0xA9F8c770661BeE8DF2D026edB1Cb6FF763C780FF).
  - [InosETH](https://etherscan.io/address/0xfD07fD5EBEa6F24888a397997E262179Bf494336).
  - [InosETHRateProvider](https://etherscan.io/address/0x1F27848Ae927Ba278eE575e4A55f6c7ED7BFFe8C).
- [x] [ankrETH](https://etherscan.io/address/0xe95a203b1a91a908f9b9ce46459d101078c2c3cb): Ankr Staked Ethereum.
  - [InankrEthVault](https://etherscan.io/address/0x36B429439AB227fAB170A4dFb3321741c8815e55).
  - [InankrETH](https://etherscan.io/address/0xfa2629B9cF3998D52726994E0FcdB750224D8B9D).
  - [InankrETHRateProvider](https://etherscan.io/address/0x8bC73134A736437da780570308d3b37b67174ddb).
- [x] [cbETH](https://etherscan.io/address/0xBe9895146f7AF43049ca1c1AE358B0541Ea49704): Coinbase Wrapped Staked Ethereum LST.
  - [IncbEthVault](https://etherscan.io/address/0xfE715358368416E01d3A961D3a037b7359735d5e).
  - [IncbETH](https://etherscan.io/address/0xBf19Eead55a6B100667f04F8FBC5371E03E8ab2E).
  - [IncbETHRateProvider](https://etherscan.io/address/0xa1Bb72c5915a7e2C85BaeA2C563858eaCB3F7A45).
- [x] [wBETH](https://etherscan.io/address/0xa2e3356610840701bdf5611a53974510ae27e2e1): Wrapped Beacon Ethereum LST.
  - [InwbEthVault](https://etherscan.io/address/0xC0660932C5dCaD4A1409b7975d147203B1e9A2B6).
  - [InwbETH](https://etherscan.io/address/0xDA9B11Cd701e10C2Ec1a284f80820eDD128c5246).
  - [InwbETHRateProvider](https://etherscan.io/address/0x69c59c3DD7566eb12792203f8F832ca81a050eB1).
- [x] [swETH](https://etherscan.io/address/0xf951e335afb289353dc249e82926178eac7ded78): Swell Ethereum.
  - [InswEthVault](https://etherscan.io/address/0xc4181dC7BB31453C4A48689ce0CBe975e495321c).
  - [InswETH](https://etherscan.io/address/0xC3ADe5aCe1bBb033CcAE8177C12Ecbfa16bD6A9D).
  - [InswETHRateProvider](https://etherscan.io/address/0xebFa0353DFF1801F5c8Ea07448771D6FadD1E721).
- [x] [ETHx](https://etherscan.io/address/0xA35b1B31Ce002FBF2058D22F30f95D405200A15b): Stader Staked Ethereum.
  - [InEthxVault](https://etherscan.io/address/0x90E80E25ABDB6205B08DeBa29a87f7eb039023C2).
  - [InETHx](https://etherscan.io/address/0x57a5a0567187FF4A8dcC1A9bBa86155E355878F2).
  - [InETHxRateProvider](https://etherscan.io/address/0xd812bA3543f9aB64b2BCBcE34fb3b00bFF2bA2FC).
- [x] [sfrxETH](https://etherscan.io/address/0xac3e018457b222d93114458476f3e3416abbe38f): Staked Frax Ether.
  - [InsfrxEthVault](https://etherscan.io/address/0x295234B7E370a5Db2D2447aCA83bc7448f151161).
  - [InsfrxETH](https://etherscan.io/address/0x668308d77be3533c909a692302Cb4D135Bf8041C).
  - [InsfrxETHRateProvider](https://etherscan.io/address/0x07f86901057F392fd3A508b8AbcbaafB08c13B1e).
- [x] [mETH](https://etherscan.io/address/0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa): Mantle Staked Ether.
  - [InmEthVault](https://etherscan.io/address/0xd0ee89d82183D7Ddaef14C6b4fC0AA742F426355).
  - [InmETH](https://etherscan.io/address/0xeCf3672A6d2147E2A77f07069Fb48d8Cf6F6Fbf9).
  - [InmETHRateProvider](https://etherscan.io/address/0xA22A7A8c550760574Fd7b722C9f7100902D57707).
- [x] [lsETH](https://etherscan.io/address/0x8c1BEd5b9a0928467c9B1341Da1D7BD5e10b6549): Liquid Staked ETH.
  - [InlsEthVault](https://etherscan.io/address/0x6E17a8b5D33e6DBdB9fC61d758BF554b6AD93322).
  - [InlsETH](https://etherscan.io/address/0x94B888E11a9E960A9c3B3528EB6aC807B27Ca62E).
  - [InlsETHRateProvider](https://etherscan.io/address/0x20f6d8e1e821Bd5B94f7bF725AF304Bc5ef09c36).
- [x] [wstETH](https://etherscan.io/address/0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0): Wrapped liquid staked Ether 2.0.
  - [inwstETHVault_S](https://etherscan.io/address/0xf9D9F828989A624423C48b95BC04E9Ae0ef5Ec97).
  - [inwstETHs](https://etherscan.io/address/0x8E0789d39db454DBE9f4a77aCEF6dc7c69f6D552).

## Testing

To run tests for the Inception Protocol, please follow these instructions:

1. Set up a fork RPC:

- Windows: `export RPC_URL_ETHEREUM=""`
- MacOs/LinuxOs: `RPC_URL_ETHEREUM=""`

2. Set the `solidity.compilers[0].settings.runs: 0` before contracts compilation in hardhat.config.js,
   otherwise may cause `Block not found` error.

3. Set any `DEPLOYER_PRIVATE_KEY` env or comment the line in hardhat.config.js.

4. Compile with `npx hardhat compile`.

5. It's possible to run tests for specific LSTs or all supported:

- Paricular LSTs case:
  `ASSETS=athc,wbeth npx hardhat test`

- Running all tests at once:
  `npx hardhat test`

## InceptionVault_S
1. User flow:
   
    1. Deposit
        - Approve vault's underlying `InceptionVault_S.asset()` to the vault
        - Call `deposit(uint256 amount, address receiver)`
        - Receive inception token as vault shares
    2. Redeem
        - Call `redeem(uint256 shares, address receiver, address owner)`
        - Vault burns inception tokens of `owner` equal to `shares`
        - Corresponding vault's underlying `InceptionVault_S.asset()` are received by `receiver`
2. Mellow Integration:
   
    1. Deposit flow
        - `InceptionVault_S` via the `IMellowAdapter` deposits assets into mellow vaults proportional to assigned allocations
        - `InceptionVault_S.delegateToMellowVault(address mellowVault, uint256 amount)` calls `IMellowAdapter.delegateMellow(uint256 amount, uint256 deadline, address mellowVault)` to forward assets to `IMellowAdapter`
        - `IMellowAdapter` then calls `MellowWrapper.deposit(address to, address token, uint256 amount, uint256 minLpAmount, uint256 deadline)` to deposit assets to Mellow Vault
    2. Withdraw flow
        - `InceptionVault_S.undelegateFrom(address mellowVault, uint256 amount)` calls `IMellowAdapter.withdrawMellow(mellowVault, amount, true)` with `closePrevious` set to `true`
        - `IMellowAdapter` then calls `registerWithdrawal(address to, uint256 lpAmount, uint256[] memory minAmounts, uint256 deadline, uint256 requestDeadline, bool closePrevious)` to generate withdrawal request
    3. Emergency withdraw
        - `InceptionVault_S` does support emergency withdraw using `undelegateForceFrom(address mellowVault, uint256 amount)`
        - This inturn calls `IMellowAdapter.withdrawEmergencyMellow(address _mellowVault, uint256 amount)` which calls `mellowVault.function emergencyWithdraw(uint256[] memory minAmounts, uint256 deadline)`
    4. Mellow rewards
        - Mellow staking rewards accumulation are reflected by `InceptionVault_S.ratio()` which takes into account the balance + rewards
    5. Flash withdraw
        - `InceptionVault_S` does support flash withdrawal since withdrawal from mellow has withdrawal process delay
        - `InceptionVault_S.flashWithdraw(uint256 iShares, address receiver)` allows the user to receive assets immediately on withdrawal transaction
        - Flash withdrawal incurs additional flash fees, which are calculated by `InceptionLibrary` based on utilization and optimal rate
        - Part of fees go to Protocol and part are added to `depositBonusAmount` for depositors
3. Mainnet params:
   
    - Operator = 0xd87D15b80445EC4251e33dBe0668C335624e54b7
    - withdrawUtilizationKink = 25 * 1e8
    - optimalWithdrawalRate = 5 * 1e7
    - Supported vaults = [MEV: 0x5fD13359Ba15A84B76f7F87568309040176167cd]

        
