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
- [x] [oETH](https://etherscan.io/address/0x856c4Efb76C1D1AE02e20CEB03A2A6a08b0b8dC3): Original Ethereum.
  - [InoEthVault](https://etherscan.io/address/0x4878F636A9Aa314B776Ac51A25021C44CAF86bEd).
  - [InoETH](https://etherscan.io/address/0x9181f633E9B9F15A32d5e37094F4C93b333e0E92).
- [x] [osETH](https://etherscan.io/address/0xf1C9acDc66974dFB6dEcB12aA385b9cD01190E38): StakeWise Staked Ethereum LST.
  - [InosEthVault](https://etherscan.io/address/0xA9F8c770661BeE8DF2D026edB1Cb6FF763C780FF).
  - [InosETH](https://etherscan.io/address/0xA9F8c770661BeE8DF2D026edB1Cb6FF763C780FF).
- [x] [aETHc](https://etherscan.io/address/0xe95a203b1a91a908f9b9ce46459d101078c2c3cb): Ankr Staked Ethereum.
  - [InankrEthVault](https://etherscan.io/address/0x36B429439AB227fAB170A4dFb3321741c8815e55).
  - [InankrETH](https://etherscan.io/address/0xfa2629B9cF3998D52726994E0FcdB750224D8B9D).
- [x] [cbETH](https://etherscan.io/address/0xBe9895146f7AF43049ca1c1AE358B0541Ea49704): Coinbase Wrapped Staked Ethereum LST.
  - [IncbEthVault](https://etherscan.io/address/0xfE715358368416E01d3A961D3a037b7359735d5e).
  - [IncbETH](https://etherscan.io/address/0xBf19Eead55a6B100667f04F8FBC5371E03E8ab2E).
- [x] [wBETH](https://etherscan.io/address/0xa2e3356610840701bdf5611a53974510ae27e2e1): Wrapped Beacon Ethereum LST.
  - [InwbEthVault](https://etherscan.io/address/0xC0660932C5dCaD4A1409b7975d147203B1e9A2B6).
  - [InwbETH](https://etherscan.io/address/0xDA9B11Cd701e10C2Ec1a284f80820eDD128c5246).
- [x] [swETH](https://etherscan.io/address/0xf951e335afb289353dc249e82926178eac7ded78): Swell Ethereum.
  - [InswEthVault](https://etherscan.io/address/0xc4181dC7BB31453C4A48689ce0CBe975e495321c).
  - [InswETH](https://etherscan.io/address/0xC3ADe5aCe1bBb033CcAE8177C12Ecbfa16bD6A9D).
- [x] [ETHx](https://etherscan.io/address/0xA35b1B31Ce002FBF2058D22F30f95D405200A15b): Stader Staked Ethereum.
  - [InEthxVault](https://etherscan.io/address/0x90E80E25ABDB6205B08DeBa29a87f7eb039023C2).
  - [InETHx](https://etherscan.io/address/0x57a5a0567187FF4A8dcC1A9bBa86155E355878F2).
- [x] [sfrxETH](https://etherscan.io/address/0xac3e018457b222d93114458476f3e3416abbe38f): Staked Frax Ether.
  - [InsfrxEthVault]().
  - [InsfrxETH]().
- [x] [mETH](https://etherscan.io/address/0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa): mEth.
  - [InmEthVault]().
  - [InmETH]().

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
