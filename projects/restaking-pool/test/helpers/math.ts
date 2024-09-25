import { ethers } from "ethers";
import { CToken, RestakingPool } from "../../typechain-types";
import { _1E18 } from "./constants";

export function randomBI(length: number): bigint {
  if (length > 0) {
    let randomNum = "";
    randomNum += Math.floor(Math.random() * 9) + 1; // generates a random digit 1-9
    for (let i = 0; i < length - 1; i++) {
      randomNum += Math.floor(Math.random() * 10); // generates a random digit 0-9
    }
    return BigInt(randomNum);
  } else {
    return 0n;
  }
}

export function randomBIbyMax(max: bigint): bigint {
  const maxRandom = 1000_000_000_000n;
  if (max > 0) {
    const r = BigInt(Math.floor(Math.random() * Number(maxRandom)));
    return (max * r) / maxRandom;
  } else {
    return 0n;
  }
}

export function divideAndRound(a: bigint, b: bigint): bigint {
  if (b === 0n) {
    throw new Error("Division by zero");
  }
  const quotient = a / b;
  const remainder = a % b;
  return quotient + (2n * remainder >= b ? 1n : 0n);
}

export function divideAndCeil(a: bigint, b: bigint): bigint {
  if (b === 0n) {
    throw new Error("Division by zero");
  }
  const quotient = a / b;
  const remainder = a % b;
  return remainder === 0n ? quotient : quotient + 1n;
}

export const toWei = (ether) => ethers.parseEther(ether.toString());

// ratio = totalSharesSupply * 1e18 / (totalLocked + netRewards - pendingWithdrawals)
export async function calcRatio(cToken: CToken, pool: RestakingPool, numOfValidators: bigint = 1n, netRewards: bigint = 0n ) {
  const totalSharesSupply = await cToken.totalSupply();
  // totalLocked = freeBalance + totalStaked + mevTipsRewards (withoutFee)
  const freeBalance = await pool.getPending();
  const totalStaked = toWei(32) * numOfValidators;
  const totalLocked = freeBalance + totalStaked + netRewards;
  const pendingWithdrawals = await pool.getTotalPendingUnstakes();

  return totalSharesSupply * _1E18 / (totalLocked - pendingWithdrawals);
}