export enum Network {
  mainnet = 'mainnet',
  testnet = 'testnet'
};

export const Assets = {
  stETH: 'stETH',
  wstETH: 'wstETH',
}

export const emptyBytes = [
  "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
];

export const adapters = {
  EigenLayer: 'EigenLayer',
  Mellow: 'Mellow',
  Symbiotic: 'Symbiotic',
};

export type Adapter = typeof adapters[keyof typeof adapters];
