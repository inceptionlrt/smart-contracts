# InceptionLRT

This repository contains smart contracts, vaults, tokens, and associated tests for the InceptionLRT project.

## Documentation

For detailed information and developer resources, please follow our [documentation](https://docs.inceptionlrt.com/for-developers/inception-vault-dev-details-testnet).

## Supported LSTs and upcoming additions

- [x] [stETH](https://etherscan.io/address/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84). Lido Staked Ethereum.
  - [InstEthVault](https://etherscan.io/address/0x814CC6B8fd2555845541FB843f37418b05977d8d).
  - [InstETH](https://etherscan.io/address/0x7FA768E035F956c41d6aeaa3Bd857e7E5141CAd5).
- [x] [rETH](https://etherscan.io/address/0xae78736cd615f374d3085123a210448e74fc6393): Rocket Ethereum.
  - [InrEthVault](https://etherscan.io/address/0x1Aa53BC4Beb82aDf7f5EDEE9e3bBF3434aD59F12).
  - [InrETH](https://etherscan.io/address/0x80d69e79258FE9D056c822461c4eb0B4ca8802E2).
- [ ] [oETH](https://etherscan.io/address/0x856c4Efb76C1D1AE02e20CEB03A2A6a08b0b8dC3): Original Ethereum.
  - [InoEthVault]().
  - [InoETH]().
- [ ] [osETH](https://etherscan.io/address/0xf1C9acDc66974dFB6dEcB12aA385b9cD01190E38): StakeWise Staked Ethereum LST.
  - [InosEthVault]().
  - [InosETH]().
- [ ] [aETHc](https://etherscan.io/address/0xe95a203b1a91a908f9b9ce46459d101078c2c3cb): Ankr Staked Ethereum.
  - [InankrEthVault]().
  - [InankrETH]().
- [ ] [cbETH](https://etherscan.io/address/0xBe9895146f7AF43049ca1c1AE358B0541Ea49704): Coinbase Wrapped Staked Ethereum LST.
  - [IncbEthVault]().
  - [IncbETH]().
- [ ] [wBETH](https://etherscan.io/address/0xa2e3356610840701bdf5611a53974510ae27e2e1): Wrapped Beacon Ethereum LST.
  - [InwbEthVault]().
  - [InwbETH]().
- [ ] [swETH](https://etherscan.io/address/0xf951e335afb289353dc249e82926178eac7ded78): Swell Ethereum.
  - [InswEthVault]().
  - [InswETH]().
- [ ] [ETHx](https://etherscan.io/address/0xA35b1B31Ce002FBF2058D22F30f95D405200A15b): Stader Staked Ethereum.
  - [InEthxVault]().
  - [InETHx]().

## Testing

To run tests for the Inception Protocol, please follow these instructions:

1. Set up a fork RPC:

- Windows: `export RPC_URL_ETHEREUM=""`
- MacOs/LinuxOs: `RPC_URL_ETHEREUM=""`

2. It's possible to run tests for specific LSTs or all supported:

- Paricular LSTs case:
  `ASSETS=athc,wbeth npx hardhat test`

- Running all tests at once:
  `npx hardhat test`
