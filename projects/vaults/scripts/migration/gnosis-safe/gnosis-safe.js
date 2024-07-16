const fs = require("fs");
const { addChecksum } = require("./checksum");

const GS_BATCH_TEMPLATE = {
  version: "1.0",
  chainId: "5", // actual chain id
  createdAt: 1,
  meta: {
    name: "", // migration name
    description: "", // short description of migration
    txBuilderVersion: "1.11.1",
    createdFromSafeAddress: "", // can be empty?
    createdFromOwnerAddress: "", // can be empty?
    checksum: "", // ??
  },
  transactions: [],
};

const GS_TX_TEMPLATE = {
  to: "", // to address
  value: "0",
  data: null,
  contractMethod: {
    inputs: [
      {
        internalType: "address",
        name: "impl",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "upgradeToAndCall",
    payable: false,
  },
  contractInputsValues: {},
};

const ERC1967ProxyABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "previousAdmin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newAdmin",
        type: "address",
      },
    ],
    name: "AdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "beacon",
        type: "address",
      },
    ],
    name: "BeaconUpgraded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "Upgraded",
    type: "event",
  },
  {
    stateMutability: "payable",
    type: "fallback",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
  {
    inputs: [],
    name: "getCurrentVersion",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "impl",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
const TUProxyAdmin = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [
      { internalType: "contract AdminUpgradeabilityProxy", name: "proxy", type: "address" },
      { internalType: "address", name: "newAdmin", type: "address" },
    ],
    name: "changeProxyAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "contract AdminUpgradeabilityProxy", name: "proxy", type: "address" }],
    name: "getProxyAdmin",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "contract AdminUpgradeabilityProxy", name: "proxy", type: "address" }],
    name: "getProxyImplementation",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "renounceOwnership", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract AdminUpgradeabilityProxy", name: "proxy", type: "address" },
      { internalType: "address", name: "implementation", type: "address" },
    ],
    name: "upgrade",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract AdminUpgradeabilityProxy", name: "proxy", type: "address" },
      { internalType: "address", name: "implementation", type: "address" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "upgradeAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

class BatchBuilder {
  web3;
  data;

  constructor(web3, name, description, provider) {
    this.web3 = web3;

    const meta = Object.assign({}, GS_BATCH_TEMPLATE.meta, {
      name: `${name}_${provider.name}`,
      description,
    });
    const chain_id = provider.chainId;
    //  console.log("template", GS_BATCH_TEMPLATE);

    this.data = {
      ...GS_BATCH_TEMPLATE,
      createdAt: Date.now(),
      chainId: chain_id.toString(),
      meta,
      transactions: [],
    };
  }

  send({ to, value }) {
    this.data.transactions.push({
      to,
      value,
    });
  }

  add({ to, value, method, args }, abi) {
    this.data.transactions.push(
      Object.assign({}, GS_TX_TEMPLATE, {
        contractMethod: abi.find((v) => v.name === method && v.type === "function"),
        to,
        value: value || "0",
        contractInputsValues: args,
      })
    );
    return this;
  }

  addOzUpgrade(admin, proxy, impl) {
    this.add(
      {
        to: admin.address || admin,
        method: "upgrade",
        args: {
          proxy: proxy,
          implementation: impl,
        },
      },
      admin.abi || TUProxyAdmin
    );

    return this;
  }

  addERC1967Upgrade(proxy, impl) {
    this.add(
      {
        to: proxy.address,
        method: "upgradeToAndCall",
        args: {
          impl: impl.address,
          data: "0x",
        },
      },
      ERC1967ProxyABI
    );

    return this;
  }

  save() {
    // this.data = addChecksum(this.data, this.web3);
    console.log("transaction batch before save", this.data);
    if (!fs.existsSync("safe-batch")) {
      fs.mkdirSync("safe-batch");
    }
    fs.writeFileSync(`safe-batch/${this.data.meta.name}.json`, JSON.stringify(this.data));
    this.data = {};
  }
}

module.exports = {
  BatchBuilder,
};
