// const eth = require("ethereumjs-util");

import { ethers, network } from "hardhat";

// function signMessageUsingPrivateKey(privateKey, data) {
//   const { ec: EC } = require("elliptic"),
//     ec = new EC("secp256k1");
//   let keyPair = ec.keyFromPrivate(privateKey);
//   let res = keyPair.sign(data.substring(2));
//   const N_DIV_2 = web3.utils.toBN(
//     "7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0",
//     16,
//   );
//   const secp256k1N = web3.utils.toBN(
//     "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141",
//     16,
//   );
//   let v = res.recoveryParam;
//   let s = res.s;
//   if (s.cmp(N_DIV_2) > 0) {
//     s = secp256k1N.sub(s);
//     v = v === 0 ? 1 : 0;
//   }
//   return (
//     "0x" +
//     Buffer.concat([
//       res.r.toArrayLike(Buffer, "be", 32),
//       s.toArrayLike(Buffer, "be", 32),
//     ]).toString("hex") +
//     (v === 0 ? "1b" : "1c")
//   );
// }

// async function advanceTime(time) {
//   return new Promise((resolve, reject) => {
//     web3.currentProvider.send(
//       {
//         jsonrpc: "2.0",
//         method: "evm_increaseTime",
//         params: [time],
//         id: new Date().getTime(),
//       },
//       (err, result) => {
//         if (err) {
//           return reject(err);
//         }
//         return resolve(result);
//       },
//     );
//   });
// }

// async function advanceBlock() {
//   return new Promise((resolve, reject) => {
//     web3.currentProvider.send(
//       {
//         jsonrpc: "2.0",
//         method: "evm_mine",
//         id: new Date().getTime(),
//       },
//       (err, result) => {
//         if (err) {
//           return reject(err);
//         }
//         const newBlockHash = web3.eth.getBlock("latest").hash;

//         return resolve(newBlockHash);
//       },
//     );
//   });
// }

// async function advanceBlocks(count) {
//   for (let i = 0; i < count; i++) {
//     await advanceBlock();
//   }
// }

// async function takeSnapshot() {
//   return new Promise((resolve, reject) => {
//     web3.currentProvider.send(
//       {
//         jsonrpc: "2.0",
//         method: "evm_snapshot",
//         id: new Date().getTime(),
//       },
//       (err, snapshotId) => {
//         if (err) {
//           return reject(err);
//         }
//         return resolve(snapshotId);
//       },
//     );
//   });
// }

// async function revertToSnapshot(id) {
//   return new Promise((resolve, reject) => {
//     web3.currentProvider.send(
//       {
//         jsonrpc: "2.0",
//         method: "evm_revert",
//         params: [id],
//         id: new Date().getTime(),
//       },
//       (err, result) => {
//         if (err) {
//           return reject(err);
//         }
//         return resolve(result);
//       },
//     );
//   });
// }

// async function advanceTimeAndBlock(time) {
//   await advanceTime(time);
//   await advanceBlock();
//   return Promise.resolve(web3.eth.getBlock("latest"));
// }

// function makeHex(data) {
//   return web3.utils.padRight(web3.utils.asciiToHex(data), 64);
// }

// function computeCreate2Address(deployer, salt, bytecode) {
//   const byteCodeHash = eth.keccak256(eth.toBuffer(bytecode));
//   const address = eth.keccak256(
//     eth.toBuffer(
//       [
//         "0xff",
//         deployer,
//         web3.utils.padRight(salt, 64),
//         byteCodeHash.toString("hex"),
//       ].join(""),
//     ),
//   );
//   return `0x${address.toString("hex").substr(24)}`;
// }

// function computeContractAddress(deployer, nonce) {
//   const address = eth.keccak256(eth.rlp.encode([deployer, nonce]));
//   return `0x${address.toString("hex").substr(24)}`;
// }

// const expectError = async (promise, text) => {
//   try {
//     await promise;
//   } catch (e) {
//     if (text === undefined || e.message.includes(text)) {
//       return;
//     }
//     console.error(new Error(`Unexpected error: ${e.message}`));
//   }
//   console.error(new Error(`Expected error: ${text}`));
//   assert.fail();
// };

// module.exports = {
//   signMessageUsingPrivateKey,
//   advanceTime,
//   advanceBlock,
//   advanceBlocks,
//   advanceTimeAndBlock,
//   takeSnapshot,
//   revertToSnapshot,
//   makeHex,
//   computeCreate2Address,
//   computeContractAddress,
//   expectError,
// };

export const increaseChainTimeForSeconds = async (seconds: number) => {
  if (seconds > 0) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await mineBlock();
    const nextBlockNumber = await ethers.provider.getBlockNumber();
    const nextBlock = await ethers.provider.getBlock(nextBlockNumber);
    return nextBlock;
  } else {
    return await ethers.provider.getBlock("latest");
  }
};

export const mineBlock = async () => {
  network.provider.send("evm_mine");
};

export async function hhReset() {
  await network.provider.request({
    method: "hardhat_reset",
    params: [],
  });
}
