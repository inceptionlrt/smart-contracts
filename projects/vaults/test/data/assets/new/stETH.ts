const stETHAddress = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'; // Lido stETH

export const stETH = {
  blockNumber: 21850700,
  ratioErr: 3n,
  transactErr: 5n,
  vault: {
    name: "InstEthVault",
    contractName: "InVault_S_E2", // vaultFactory
    operator: '0xd87D15b80445EC4251e33dBe0668C335624e54b7', // iVaultOperator
  },

  asset: {
    name: "stETH",
    nonWrappedAssetAddress: stETHAddress,
    address: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0", // wstETH, collateral
    strategy: "0x7D704507b76571a51d9caE8AdDAbBFd0ba0e63d3",
    donor: "0x43594da5d6A03b2137a04DF5685805C676dEf7cB",
  },

  adapters: {
    mellow: [
      {
        name: "P2P",
        vaultAddress: "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a",
        wrapperAddress: "0x41A1FBEa7Ace3C3a6B66a73e96E5ED07CDB2A34d",
        bondStrategyAddress: "0xA0ea6d4fe369104eD4cc18951B95C3a43573C0F6",
        curatorAddress: "0x4a3c7F2470Aa00ebE6aE7cB1fAF95964b9de1eF4",
        configuratorAddress: "0x84b240E99d4C473b5E3dF1256300E2871412dDfe",
      }
    ],
    symbiotic: [
      {
        name: "Gauntlet Restaked wstETH",
        vaultAddress: "0xc10A7f0AC6E3944F4860eE97a937C51572e3a1Da",
        collateral: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
        burner: "0xDB0737bd7eBEA50135e4c8af56900b029b858371",
        delegator: "0x1f16782a9b75FfFAD87e7936791C672bdDBCb8Ec",
        slasher: "0x541c86eb2C5e7F3E0C04eF82aeb68EA6A86409ef",
      }
    ]
  },
};
