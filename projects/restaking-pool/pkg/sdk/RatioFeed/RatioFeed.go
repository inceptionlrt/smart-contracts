// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package RatioFeed

import (
	"errors"
	"fmt"
	"math/big"
	"strings"

	"github.com/TagusLabs/genesis-smart-contracts/abigen/generated"
	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/event"
)

var (
	_ = errors.New
	_ = big.NewInt
	_ = strings.NewReader
	_ = ethereum.NotFound
	_ = bind.Bind
	_ = common.Big1
	_ = types.BloomLookup
	_ = event.NewSubscription
	_ = abi.ConvertType
)

var ContractMetaData = &bind.MetaData{
	ABI: "[{\"inputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"inputs\":[],\"name\":\"InvalidInitialization\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"NotInitializing\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"OnlyGovernanceAllowed\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"OnlyOperatorAllowed\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"OnlyRestakingPoolAllowed\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"enumIRatioFeed.RatioError\",\"name\":\"\",\"type\":\"uint8\"}],\"name\":\"RatioNotUpdated\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"RatioThresholdNotInRange\",\"type\":\"error\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint64\",\"name\":\"version\",\"type\":\"uint64\"}],\"name\":\"Initialized\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"oldValue\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newValue\",\"type\":\"uint256\"}],\"name\":\"RatioThresholdChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"tokenAddress\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"oldRatio\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newRatio\",\"type\":\"uint256\"}],\"name\":\"RatioUpdated\",\"type\":\"event\"},{\"inputs\":[],\"name\":\"INITIAL_RATIO\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"MAX_THRESHOLD\",\"outputs\":[{\"internalType\":\"uint32\",\"name\":\"\",\"type\":\"uint32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"token\",\"type\":\"address\"},{\"internalType\":\"uint8\",\"name\":\"day\",\"type\":\"uint8\"}],\"name\":\"averagePercentageRate\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"config\",\"outputs\":[{\"internalType\":\"contractIProtocolConfig\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"token\",\"type\":\"address\"}],\"name\":\"getRatio\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"name\":\"historicalRatios\",\"outputs\":[{\"internalType\":\"uint40\",\"name\":\"lastUpdate\",\"type\":\"uint40\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"contractIProtocolConfig\",\"name\":\"config\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"ratioThreshold_\",\"type\":\"uint256\"}],\"name\":\"initialize\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"ratioThreshold\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"token\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"newRatio\",\"type\":\"uint256\"}],\"name\":\"repairRatio\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"newValue\",\"type\":\"uint256\"}],\"name\":\"setRatioThreshold\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"token\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"newRatio\",\"type\":\"uint256\"}],\"name\":\"updateRatio\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]",
	Bin: "0x608060405234801561000f575f80fd5b5061001861001d565b6100cf565b7ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a00805468010000000000000000900460ff161561006d5760405163f92ee8a960e01b815260040160405180910390fd5b80546001600160401b03908116146100cc5780546001600160401b0319166001600160401b0390811782556040519081527fc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d29060200160405180910390a15b50565b610c98806100dc5f395ff3fe608060405234801561000f575f80fd5b50600436106100a6575f3560e01c80634898ab401161006e5780634898ab40146101215780637068ca0d14610130578063754b27071461014357806379502c551461016b578063cd6dc68714610185578063ec653c4b14610198575f80fd5b806308af5431146100aa57806311ad2955146100cf5780632364753a146100e457806327a0a544146100f75780633be19c0314610118575b5f80fd5b6100b56305f5e10081565b60405163ffffffff90911681526020015b60405180910390f35b6100e26100dd366004610a90565b6101d7565b005b6100e26100f2366004610aba565b610325565b61010a610105366004610ad1565b6103d4565b6040519081526020016100c6565b61010a60345481565b61010a670de0b6b3a764000081565b6100e261013e366004610a90565b61057b565b61010a610151366004610b0d565b6001600160a01b03165f9081526032602052604090205490565b5f546040516001600160a01b0390911681526020016100c6565b6100e2610193366004610a90565b6107e5565b6101c16101a6366004610b0d565b60336020525f908152604090206003015464ffffffffff1681565b60405164ffffffffff90911681526020016100c6565b5f8054906101000a90046001600160a01b03166001600160a01b031663289b3c0d6040518163ffffffff1660e01b8152600401602060405180830381865afa158015610225573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906102499190610b28565b6001600160a01b0316336001600160a01b03161461027a5760405163e2d4f15f60e01b815260040160405180910390fd5b670de0b6b3a764000081118061028e575080155b156102b8576003604051637e5e135360e01b81526004016102af9190610b57565b60405180910390fd5b6001600160a01b0382165f818152603260209081526040918290205482519081529081018490527f4c5c23b4efbfea6d16c8453f565e165a02a22cda9a8dc7aac0a66f91d2304da6910160405180910390a26001600160a01b039091165f90815260326020526040902055565b5f8054906101000a90046001600160a01b03166001600160a01b031663289b3c0d6040518163ffffffff1660e01b8152600401602060405180830381865afa158015610373573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906103979190610b28565b6001600160a01b0316336001600160a01b0316146103c85760405163e2d4f15f60e01b815260040160405180910390fd5b6103d1816108fb565b50565b5f808260ff161180156103ea575060088260ff16105b6104365760405162461bcd60e51b815260206004820152601960248201527f6461792073686f756c642062652066726f6d203120746f20370000000000000060448201526064016102af565b6001600160a01b0383165f908152603360205260408120805490916001600160401b039091169082600861046d60ff881685610ba5565b6104779190610be0565b610482906001610c05565b6001600160401b03166009811061049b5761049b610b7d565b60048104909101546001600160401b036008600390931683026101000a9091041691505f9084906104cc9085610be0565b6104d7906001610c05565b6001600160401b0316600981106104f0576104f0610b7d565b600491828204019190066008029054906101000a90046001600160401b03166001600160401b031690508082101561052e575f945050505050610575565b61053b60ff871683610c25565b6105458284610c3c565b6105589068056bc75e2d63100000610c25565b6105649061016d610c25565b61056e9190610c4f565b9450505050505b92915050565b5f8054906101000a90046001600160a01b03166001600160a01b031663e7f43c686040518163ffffffff1660e01b8152600401602060405180830381865afa1580156105c9573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906105ed9190610b28565b6001600160a01b0316336001600160a01b03161461061e57604051633734611360e01b815260040160405180910390fd5b6001600160a01b0382165f908152603560209081526040808320546032909252822054909161064e83858461096a565b90505f81600481111561066357610663610b43565b146106835780604051637e5e135360e01b81526004016102af9190610b57565b6001600160a01b0385165f8181526032602090815260409182902087905581518581529081018790527f4c5c23b4efbfea6d16c8453f565e165a02a22cda9a8dc7aac0a66f91d2304da6910160405180910390a26001600160a01b0385165f90815260356020908152604080832064ffffffffff428181169092556033909352922060038101549092620151449261071c921690610c3c565b11156107dd5780546001600160401b03168582600861073c846001610c05565b6107469190610be0565b610751906001610c05565b6001600160401b03166009811061076a5761076a610b7d565b600491828204019190066008026101000a8154816001600160401b0302191690836001600160401b031602179055508060016107a69190610c05565b825467ffffffffffffffff19166001600160401b03919091161782555060038101805464ffffffffff19164264ffffffffff161790555b505050505050565b7ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a008054600160401b810460ff1615906001600160401b03165f811580156108295750825b90505f826001600160401b031660011480156108445750303b155b905081158015610852575080155b156108705760405163f92ee8a960e01b815260040160405180910390fd5b845467ffffffffffffffff19166001178555831561089a57845460ff60401b1916600160401b1785555b6108a387610a04565b6108ac86610a2d565b83156108f257845460ff60401b19168555604051600181527fc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d29060200160405180910390a15b50505050505050565b6305f5e10081118061090b575080155b1561092957604051630a57072960e01b815260040160405180910390fd5b60345460408051918252602082018390527f661e4cadf2d36ec16a59d60dcfeebe23f9be2aec99852725798a4be99790840e910160405180910390a1603455565b5f815f0361099157670de0b6b3a764000083111561098a575060046109fd565b505f6109fd565b61a8c061099e8542610c3c565b10156109ac575060016109fd565b818311156109bc575060026109fd565b6034545f906305f5e100906109d19085610c25565b6109db9190610c4f565b90506109e78184610c3c565b8410156109f85760039150506109fd565b5f9150505b9392505050565b610a0c610a31565b5f80546001600160a01b0319166001600160a01b0392909216919091179055565b6103c85b7ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a0054600160401b900460ff16610a7a57604051631afcd79f60e31b815260040160405180910390fd5b565b6001600160a01b03811681146103d1575f80fd5b5f8060408385031215610aa1575f80fd5b8235610aac81610a7c565b946020939093013593505050565b5f60208284031215610aca575f80fd5b5035919050565b5f8060408385031215610ae2575f80fd5b8235610aed81610a7c565b9150602083013560ff81168114610b02575f80fd5b809150509250929050565b5f60208284031215610b1d575f80fd5b81356109fd81610a7c565b5f60208284031215610b38575f80fd5b81516109fd81610a7c565b634e487b7160e01b5f52602160045260245ffd5b6020810160058310610b7757634e487b7160e01b5f52602160045260245ffd5b91905290565b634e487b7160e01b5f52603260045260245ffd5b634e487b7160e01b5f52601160045260245ffd5b6001600160401b03828116828216039080821115610bc557610bc5610b91565b5092915050565b634e487b7160e01b5f52601260045260245ffd5b5f6001600160401b0380841680610bf957610bf9610bcc565b92169190910692915050565b6001600160401b03818116838216019080821115610bc557610bc5610b91565b808202811582820484141761057557610575610b91565b8181038181111561057557610575610b91565b5f82610c5d57610c5d610bcc565b50049056fea26469706673582212203224eb59a37cd806fdf7d7ad807b59278b1b3571b0085d948b024214b1c1a47664736f6c63430008150033",
}

var ContractABI = ContractMetaData.ABI

var ContractBin = ContractMetaData.Bin

func DeployContract(auth *bind.TransactOpts, backend bind.ContractBackend) (common.Address, *types.Transaction, *Contract, error) {
	parsed, err := ContractMetaData.GetAbi()
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	if parsed == nil {
		return common.Address{}, nil, nil, errors.New("GetABI returned nil")
	}

	address, tx, contract, err := bind.DeployContract(auth, *parsed, common.FromHex(ContractBin), backend)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &Contract{ContractCaller: ContractCaller{contract: contract}, ContractTransactor: ContractTransactor{contract: contract}, ContractFilterer: ContractFilterer{contract: contract}}, nil
}

type Contract struct {
	address common.Address
	abi     abi.ABI
	ContractCaller
	ContractTransactor
	ContractFilterer
}

type ContractCaller struct {
	contract *bind.BoundContract
}

type ContractTransactor struct {
	contract *bind.BoundContract
}

type ContractFilterer struct {
	contract *bind.BoundContract
}

type ContractSession struct {
	Contract     *Contract
	CallOpts     bind.CallOpts
	TransactOpts bind.TransactOpts
}

type ContractCallerSession struct {
	Contract *ContractCaller
	CallOpts bind.CallOpts
}

type ContractTransactorSession struct {
	Contract     *ContractTransactor
	TransactOpts bind.TransactOpts
}

type ContractRaw struct {
	Contract *Contract
}

type ContractCallerRaw struct {
	Contract *ContractCaller
}

type ContractTransactorRaw struct {
	Contract *ContractTransactor
}

func NewContract(address common.Address, backend bind.ContractBackend) (*Contract, error) {
	abi, err := abi.JSON(strings.NewReader(ContractABI))
	if err != nil {
		return nil, err
	}
	contract, err := bindContract(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &Contract{address: address, abi: abi, ContractCaller: ContractCaller{contract: contract}, ContractTransactor: ContractTransactor{contract: contract}, ContractFilterer: ContractFilterer{contract: contract}}, nil
}

func NewContractCaller(address common.Address, caller bind.ContractCaller) (*ContractCaller, error) {
	contract, err := bindContract(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &ContractCaller{contract: contract}, nil
}

func NewContractTransactor(address common.Address, transactor bind.ContractTransactor) (*ContractTransactor, error) {
	contract, err := bindContract(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &ContractTransactor{contract: contract}, nil
}

func NewContractFilterer(address common.Address, filterer bind.ContractFilterer) (*ContractFilterer, error) {
	contract, err := bindContract(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &ContractFilterer{contract: contract}, nil
}

func bindContract(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := ContractMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

func (_Contract *ContractRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _Contract.Contract.ContractCaller.contract.Call(opts, result, method, params...)
}

func (_Contract *ContractRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Contract.Contract.ContractTransactor.contract.Transfer(opts)
}

func (_Contract *ContractRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Contract.Contract.ContractTransactor.contract.Transact(opts, method, params...)
}

func (_Contract *ContractCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _Contract.Contract.contract.Call(opts, result, method, params...)
}

func (_Contract *ContractTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Contract.Contract.contract.Transfer(opts)
}

func (_Contract *ContractTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Contract.Contract.contract.Transact(opts, method, params...)
}

func (_Contract *ContractCaller) INITIALRATIO(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "INITIAL_RATIO")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) INITIALRATIO() (*big.Int, error) {
	return _Contract.Contract.INITIALRATIO(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) INITIALRATIO() (*big.Int, error) {
	return _Contract.Contract.INITIALRATIO(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) MAXTHRESHOLD(opts *bind.CallOpts) (uint32, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "MAX_THRESHOLD")

	if err != nil {
		return *new(uint32), err
	}

	out0 := *abi.ConvertType(out[0], new(uint32)).(*uint32)

	return out0, err

}

func (_Contract *ContractSession) MAXTHRESHOLD() (uint32, error) {
	return _Contract.Contract.MAXTHRESHOLD(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) MAXTHRESHOLD() (uint32, error) {
	return _Contract.Contract.MAXTHRESHOLD(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) AveragePercentageRate(opts *bind.CallOpts, token common.Address, day uint8) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "averagePercentageRate", token, day)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) AveragePercentageRate(token common.Address, day uint8) (*big.Int, error) {
	return _Contract.Contract.AveragePercentageRate(&_Contract.CallOpts, token, day)
}

func (_Contract *ContractCallerSession) AveragePercentageRate(token common.Address, day uint8) (*big.Int, error) {
	return _Contract.Contract.AveragePercentageRate(&_Contract.CallOpts, token, day)
}

func (_Contract *ContractCaller) Config(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "config")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) Config() (common.Address, error) {
	return _Contract.Contract.Config(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) Config() (common.Address, error) {
	return _Contract.Contract.Config(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) GetRatio(opts *bind.CallOpts, token common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getRatio", token)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) GetRatio(token common.Address) (*big.Int, error) {
	return _Contract.Contract.GetRatio(&_Contract.CallOpts, token)
}

func (_Contract *ContractCallerSession) GetRatio(token common.Address) (*big.Int, error) {
	return _Contract.Contract.GetRatio(&_Contract.CallOpts, token)
}

func (_Contract *ContractCaller) HistoricalRatios(opts *bind.CallOpts, arg0 common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "historicalRatios", arg0)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) HistoricalRatios(arg0 common.Address) (*big.Int, error) {
	return _Contract.Contract.HistoricalRatios(&_Contract.CallOpts, arg0)
}

func (_Contract *ContractCallerSession) HistoricalRatios(arg0 common.Address) (*big.Int, error) {
	return _Contract.Contract.HistoricalRatios(&_Contract.CallOpts, arg0)
}

func (_Contract *ContractCaller) RatioThreshold(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "ratioThreshold")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) RatioThreshold() (*big.Int, error) {
	return _Contract.Contract.RatioThreshold(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) RatioThreshold() (*big.Int, error) {
	return _Contract.Contract.RatioThreshold(&_Contract.CallOpts)
}

func (_Contract *ContractTransactor) Initialize(opts *bind.TransactOpts, config common.Address, ratioThreshold_ *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "initialize", config, ratioThreshold_)
}

func (_Contract *ContractSession) Initialize(config common.Address, ratioThreshold_ *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.Initialize(&_Contract.TransactOpts, config, ratioThreshold_)
}

func (_Contract *ContractTransactorSession) Initialize(config common.Address, ratioThreshold_ *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.Initialize(&_Contract.TransactOpts, config, ratioThreshold_)
}

func (_Contract *ContractTransactor) RepairRatio(opts *bind.TransactOpts, token common.Address, newRatio *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "repairRatio", token, newRatio)
}

func (_Contract *ContractSession) RepairRatio(token common.Address, newRatio *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.RepairRatio(&_Contract.TransactOpts, token, newRatio)
}

func (_Contract *ContractTransactorSession) RepairRatio(token common.Address, newRatio *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.RepairRatio(&_Contract.TransactOpts, token, newRatio)
}

func (_Contract *ContractTransactor) SetRatioThreshold(opts *bind.TransactOpts, newValue *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "setRatioThreshold", newValue)
}

func (_Contract *ContractSession) SetRatioThreshold(newValue *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.SetRatioThreshold(&_Contract.TransactOpts, newValue)
}

func (_Contract *ContractTransactorSession) SetRatioThreshold(newValue *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.SetRatioThreshold(&_Contract.TransactOpts, newValue)
}

func (_Contract *ContractTransactor) UpdateRatio(opts *bind.TransactOpts, token common.Address, newRatio *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "updateRatio", token, newRatio)
}

func (_Contract *ContractSession) UpdateRatio(token common.Address, newRatio *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.UpdateRatio(&_Contract.TransactOpts, token, newRatio)
}

func (_Contract *ContractTransactorSession) UpdateRatio(token common.Address, newRatio *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.UpdateRatio(&_Contract.TransactOpts, token, newRatio)
}

type ContractInitializedIterator struct {
	Event *ContractInitialized

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractInitializedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractInitialized)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}

	select {
	case log := <-it.logs:
		it.Event = new(ContractInitialized)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

func (it *ContractInitializedIterator) Error() error {
	return it.fail
}

func (it *ContractInitializedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractInitialized struct {
	Version uint64
	Raw     types.Log
}

func (_Contract *ContractFilterer) FilterInitialized(opts *bind.FilterOpts) (*ContractInitializedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "Initialized")
	if err != nil {
		return nil, err
	}
	return &ContractInitializedIterator{contract: _Contract.contract, event: "Initialized", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchInitialized(opts *bind.WatchOpts, sink chan<- *ContractInitialized) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "Initialized")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractInitialized)
				if err := _Contract.contract.UnpackLog(event, "Initialized", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

func (_Contract *ContractFilterer) ParseInitialized(log types.Log) (*ContractInitialized, error) {
	event := new(ContractInitialized)
	if err := _Contract.contract.UnpackLog(event, "Initialized", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractRatioThresholdChangedIterator struct {
	Event *ContractRatioThresholdChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractRatioThresholdChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractRatioThresholdChanged)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}

	select {
	case log := <-it.logs:
		it.Event = new(ContractRatioThresholdChanged)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

func (it *ContractRatioThresholdChangedIterator) Error() error {
	return it.fail
}

func (it *ContractRatioThresholdChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractRatioThresholdChanged struct {
	OldValue *big.Int
	NewValue *big.Int
	Raw      types.Log
}

func (_Contract *ContractFilterer) FilterRatioThresholdChanged(opts *bind.FilterOpts) (*ContractRatioThresholdChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "RatioThresholdChanged")
	if err != nil {
		return nil, err
	}
	return &ContractRatioThresholdChangedIterator{contract: _Contract.contract, event: "RatioThresholdChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchRatioThresholdChanged(opts *bind.WatchOpts, sink chan<- *ContractRatioThresholdChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "RatioThresholdChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractRatioThresholdChanged)
				if err := _Contract.contract.UnpackLog(event, "RatioThresholdChanged", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

func (_Contract *ContractFilterer) ParseRatioThresholdChanged(log types.Log) (*ContractRatioThresholdChanged, error) {
	event := new(ContractRatioThresholdChanged)
	if err := _Contract.contract.UnpackLog(event, "RatioThresholdChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractRatioUpdatedIterator struct {
	Event *ContractRatioUpdated

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractRatioUpdatedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractRatioUpdated)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}

	select {
	case log := <-it.logs:
		it.Event = new(ContractRatioUpdated)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

func (it *ContractRatioUpdatedIterator) Error() error {
	return it.fail
}

func (it *ContractRatioUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractRatioUpdated struct {
	TokenAddress common.Address
	OldRatio     *big.Int
	NewRatio     *big.Int
	Raw          types.Log
}

func (_Contract *ContractFilterer) FilterRatioUpdated(opts *bind.FilterOpts, tokenAddress []common.Address) (*ContractRatioUpdatedIterator, error) {

	var tokenAddressRule []interface{}
	for _, tokenAddressItem := range tokenAddress {
		tokenAddressRule = append(tokenAddressRule, tokenAddressItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "RatioUpdated", tokenAddressRule)
	if err != nil {
		return nil, err
	}
	return &ContractRatioUpdatedIterator{contract: _Contract.contract, event: "RatioUpdated", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchRatioUpdated(opts *bind.WatchOpts, sink chan<- *ContractRatioUpdated, tokenAddress []common.Address) (event.Subscription, error) {

	var tokenAddressRule []interface{}
	for _, tokenAddressItem := range tokenAddress {
		tokenAddressRule = append(tokenAddressRule, tokenAddressItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "RatioUpdated", tokenAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractRatioUpdated)
				if err := _Contract.contract.UnpackLog(event, "RatioUpdated", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

func (_Contract *ContractFilterer) ParseRatioUpdated(log types.Log) (*ContractRatioUpdated, error) {
	event := new(ContractRatioUpdated)
	if err := _Contract.contract.UnpackLog(event, "RatioUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

func (_Contract *Contract) ParseLog(log types.Log) (generated.AbigenLog, error) {
	switch log.Topics[0] {
	case _Contract.abi.Events["Initialized"].ID:
		return _Contract.ParseInitialized(log)
	case _Contract.abi.Events["RatioThresholdChanged"].ID:
		return _Contract.ParseRatioThresholdChanged(log)
	case _Contract.abi.Events["RatioUpdated"].ID:
		return _Contract.ParseRatioUpdated(log)

	default:
		return nil, fmt.Errorf("abigen wrapper received unknown log topic: %v", log.Topics[0])
	}
}

func (ContractInitialized) Topic() common.Hash {
	return common.HexToHash("0xc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d2")
}

func (ContractRatioThresholdChanged) Topic() common.Hash {
	return common.HexToHash("0x661e4cadf2d36ec16a59d60dcfeebe23f9be2aec99852725798a4be99790840e")
}

func (ContractRatioUpdated) Topic() common.Hash {
	return common.HexToHash("0x4c5c23b4efbfea6d16c8453f565e165a02a22cda9a8dc7aac0a66f91d2304da6")
}

func (_Contract *Contract) Address() common.Address {
	return _Contract.address
}

type ContractInterface interface {
	INITIALRATIO(opts *bind.CallOpts) (*big.Int, error)

	MAXTHRESHOLD(opts *bind.CallOpts) (uint32, error)

	AveragePercentageRate(opts *bind.CallOpts, token common.Address, day uint8) (*big.Int, error)

	Config(opts *bind.CallOpts) (common.Address, error)

	GetRatio(opts *bind.CallOpts, token common.Address) (*big.Int, error)

	HistoricalRatios(opts *bind.CallOpts, arg0 common.Address) (*big.Int, error)

	RatioThreshold(opts *bind.CallOpts) (*big.Int, error)

	Initialize(opts *bind.TransactOpts, config common.Address, ratioThreshold_ *big.Int) (*types.Transaction, error)

	RepairRatio(opts *bind.TransactOpts, token common.Address, newRatio *big.Int) (*types.Transaction, error)

	SetRatioThreshold(opts *bind.TransactOpts, newValue *big.Int) (*types.Transaction, error)

	UpdateRatio(opts *bind.TransactOpts, token common.Address, newRatio *big.Int) (*types.Transaction, error)

	FilterInitialized(opts *bind.FilterOpts) (*ContractInitializedIterator, error)

	WatchInitialized(opts *bind.WatchOpts, sink chan<- *ContractInitialized) (event.Subscription, error)

	ParseInitialized(log types.Log) (*ContractInitialized, error)

	FilterRatioThresholdChanged(opts *bind.FilterOpts) (*ContractRatioThresholdChangedIterator, error)

	WatchRatioThresholdChanged(opts *bind.WatchOpts, sink chan<- *ContractRatioThresholdChanged) (event.Subscription, error)

	ParseRatioThresholdChanged(log types.Log) (*ContractRatioThresholdChanged, error)

	FilterRatioUpdated(opts *bind.FilterOpts, tokenAddress []common.Address) (*ContractRatioUpdatedIterator, error)

	WatchRatioUpdated(opts *bind.WatchOpts, sink chan<- *ContractRatioUpdated, tokenAddress []common.Address) (event.Subscription, error)

	ParseRatioUpdated(log types.Log) (*ContractRatioUpdated, error)

	ParseLog(log types.Log) (generated.AbigenLog, error)

	Address() common.Address
}
