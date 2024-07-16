import { AddressLike, BigNumberish, BytesLike, ContractMethodArgs } from "ethers";
import { ethers } from "hardhat";

/**
 * address target,
 * uint256 value,
 * bytes calldata data,
 * bytes32 predecessor,
 * bytes32 salt,uint256 delay
 */
type ScheduleArgs = ContractMethodArgs<
  [
    target: AddressLike,
    value: BigNumberish,
    data: BytesLike,
    predecessor: BytesLike,
    salt: BytesLike,
    delay: BigNumberish,
  ]
>;

type HashOperationArgs = ContractMethodArgs<
  [target: AddressLike, value: BigNumberish, data: BytesLike, predecessor: BytesLike, salt: BytesLike]
>;

export class TxBuilder {
  private _target: AddressLike = ethers.ZeroAddress;
  private _value: BigNumberish = "0";
  private _data: BytesLike = "0x";
  private _predecessor: BytesLike = ethers.encodeBytes32String("");
  private _salt: BytesLike = ethers.encodeBytes32String("");
  private _delay: BigNumberish = "0";

  private constructor() {}

  static new() {
    return new TxBuilder();
  }

  setTarget(target: AddressLike): TxBuilder {
    this._target = target;
    return this;
  }

  setValue(value: BigNumberish): TxBuilder {
    this._value = value;
    return this;
  }

  setData(data: BytesLike): TxBuilder {
    this._data = data;
    return this;
  }

  setPredecessor(predecessor: BytesLike): TxBuilder {
    this._predecessor = predecessor;
    return this;
  }

  setSalt(salt: BytesLike): TxBuilder {
    this._salt = salt;
    return this;
  }

  setDelay(delay: BigNumberish): TxBuilder {
    this._delay = delay;
    return this;
  }

  get scheduleArgs(): ScheduleArgs {
    return [this._target, this._value, this._data, this._predecessor, this._salt, this._delay];
  }

  get hashOperationArgs(): HashOperationArgs {
    return [this._target, this._value, this._data, this._predecessor, this._salt];
  }

  get eventArgs() {
    return [this._target, this._value, this._data, this._predecessor, this._delay];
  }
}
