// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package ITimelockController

import (
	"errors"
	"math/big"
	"strings"

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
	ABI: "[{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"id\",\"type\":\"bytes32\"}],\"name\":\"cancel\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"target\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"},{\"internalType\":\"bytes\",\"name\":\"payload\",\"type\":\"bytes\"},{\"internalType\":\"bytes32\",\"name\":\"predecessor\",\"type\":\"bytes32\"},{\"internalType\":\"bytes32\",\"name\":\"salt\",\"type\":\"bytes32\"}],\"name\":\"execute\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address[]\",\"name\":\"targets\",\"type\":\"address[]\"},{\"internalType\":\"uint256[]\",\"name\":\"values\",\"type\":\"uint256[]\"},{\"internalType\":\"bytes[]\",\"name\":\"payloads\",\"type\":\"bytes[]\"},{\"internalType\":\"bytes32\",\"name\":\"predecessor\",\"type\":\"bytes32\"},{\"internalType\":\"bytes32\",\"name\":\"salt\",\"type\":\"bytes32\"}],\"name\":\"executeBatch\",\"outputs\":[],\"stateMutability\":\"payable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getMinDelay\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"id\",\"type\":\"bytes32\"}],\"name\":\"getTimestamp\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"target\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"},{\"internalType\":\"bytes\",\"name\":\"data\",\"type\":\"bytes\"},{\"internalType\":\"bytes32\",\"name\":\"predecessor\",\"type\":\"bytes32\"},{\"internalType\":\"bytes32\",\"name\":\"salt\",\"type\":\"bytes32\"}],\"name\":\"hashOperation\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"pure\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address[]\",\"name\":\"targets\",\"type\":\"address[]\"},{\"internalType\":\"uint256[]\",\"name\":\"values\",\"type\":\"uint256[]\"},{\"internalType\":\"bytes[]\",\"name\":\"payloads\",\"type\":\"bytes[]\"},{\"internalType\":\"bytes32\",\"name\":\"predecessor\",\"type\":\"bytes32\"},{\"internalType\":\"bytes32\",\"name\":\"salt\",\"type\":\"bytes32\"}],\"name\":\"hashOperationBatch\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"pure\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"id\",\"type\":\"bytes32\"}],\"name\":\"isOperation\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"id\",\"type\":\"bytes32\"}],\"name\":\"isOperationDone\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"id\",\"type\":\"bytes32\"}],\"name\":\"isOperationPending\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"id\",\"type\":\"bytes32\"}],\"name\":\"isOperationReady\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"target\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"},{\"internalType\":\"bytes\",\"name\":\"data\",\"type\":\"bytes\"},{\"internalType\":\"bytes32\",\"name\":\"predecessor\",\"type\":\"bytes32\"},{\"internalType\":\"bytes32\",\"name\":\"salt\",\"type\":\"bytes32\"},{\"internalType\":\"uint256\",\"name\":\"delay\",\"type\":\"uint256\"}],\"name\":\"schedule\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address[]\",\"name\":\"targets\",\"type\":\"address[]\"},{\"internalType\":\"uint256[]\",\"name\":\"values\",\"type\":\"uint256[]\"},{\"internalType\":\"bytes[]\",\"name\":\"payloads\",\"type\":\"bytes[]\"},{\"internalType\":\"bytes32\",\"name\":\"predecessor\",\"type\":\"bytes32\"},{\"internalType\":\"bytes32\",\"name\":\"salt\",\"type\":\"bytes32\"},{\"internalType\":\"uint256\",\"name\":\"delay\",\"type\":\"uint256\"}],\"name\":\"scheduleBatch\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"newDelay\",\"type\":\"uint256\"}],\"name\":\"updateDelay\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]",
}

var ContractABI = ContractMetaData.ABI

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

func (_Contract *ContractCaller) GetMinDelay(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getMinDelay")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) GetMinDelay() (*big.Int, error) {
	return _Contract.Contract.GetMinDelay(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) GetMinDelay() (*big.Int, error) {
	return _Contract.Contract.GetMinDelay(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) GetTimestamp(opts *bind.CallOpts, id [32]byte) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getTimestamp", id)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) GetTimestamp(id [32]byte) (*big.Int, error) {
	return _Contract.Contract.GetTimestamp(&_Contract.CallOpts, id)
}

func (_Contract *ContractCallerSession) GetTimestamp(id [32]byte) (*big.Int, error) {
	return _Contract.Contract.GetTimestamp(&_Contract.CallOpts, id)
}

func (_Contract *ContractCaller) HashOperation(opts *bind.CallOpts, target common.Address, value *big.Int, data []byte, predecessor [32]byte, salt [32]byte) ([32]byte, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "hashOperation", target, value, data, predecessor, salt)

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

func (_Contract *ContractSession) HashOperation(target common.Address, value *big.Int, data []byte, predecessor [32]byte, salt [32]byte) ([32]byte, error) {
	return _Contract.Contract.HashOperation(&_Contract.CallOpts, target, value, data, predecessor, salt)
}

func (_Contract *ContractCallerSession) HashOperation(target common.Address, value *big.Int, data []byte, predecessor [32]byte, salt [32]byte) ([32]byte, error) {
	return _Contract.Contract.HashOperation(&_Contract.CallOpts, target, value, data, predecessor, salt)
}

func (_Contract *ContractCaller) HashOperationBatch(opts *bind.CallOpts, targets []common.Address, values []*big.Int, payloads [][]byte, predecessor [32]byte, salt [32]byte) ([32]byte, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "hashOperationBatch", targets, values, payloads, predecessor, salt)

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

func (_Contract *ContractSession) HashOperationBatch(targets []common.Address, values []*big.Int, payloads [][]byte, predecessor [32]byte, salt [32]byte) ([32]byte, error) {
	return _Contract.Contract.HashOperationBatch(&_Contract.CallOpts, targets, values, payloads, predecessor, salt)
}

func (_Contract *ContractCallerSession) HashOperationBatch(targets []common.Address, values []*big.Int, payloads [][]byte, predecessor [32]byte, salt [32]byte) ([32]byte, error) {
	return _Contract.Contract.HashOperationBatch(&_Contract.CallOpts, targets, values, payloads, predecessor, salt)
}

func (_Contract *ContractCaller) IsOperation(opts *bind.CallOpts, id [32]byte) (bool, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "isOperation", id)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

func (_Contract *ContractSession) IsOperation(id [32]byte) (bool, error) {
	return _Contract.Contract.IsOperation(&_Contract.CallOpts, id)
}

func (_Contract *ContractCallerSession) IsOperation(id [32]byte) (bool, error) {
	return _Contract.Contract.IsOperation(&_Contract.CallOpts, id)
}

func (_Contract *ContractCaller) IsOperationDone(opts *bind.CallOpts, id [32]byte) (bool, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "isOperationDone", id)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

func (_Contract *ContractSession) IsOperationDone(id [32]byte) (bool, error) {
	return _Contract.Contract.IsOperationDone(&_Contract.CallOpts, id)
}

func (_Contract *ContractCallerSession) IsOperationDone(id [32]byte) (bool, error) {
	return _Contract.Contract.IsOperationDone(&_Contract.CallOpts, id)
}

func (_Contract *ContractCaller) IsOperationPending(opts *bind.CallOpts, id [32]byte) (bool, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "isOperationPending", id)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

func (_Contract *ContractSession) IsOperationPending(id [32]byte) (bool, error) {
	return _Contract.Contract.IsOperationPending(&_Contract.CallOpts, id)
}

func (_Contract *ContractCallerSession) IsOperationPending(id [32]byte) (bool, error) {
	return _Contract.Contract.IsOperationPending(&_Contract.CallOpts, id)
}

func (_Contract *ContractCaller) IsOperationReady(opts *bind.CallOpts, id [32]byte) (bool, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "isOperationReady", id)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

func (_Contract *ContractSession) IsOperationReady(id [32]byte) (bool, error) {
	return _Contract.Contract.IsOperationReady(&_Contract.CallOpts, id)
}

func (_Contract *ContractCallerSession) IsOperationReady(id [32]byte) (bool, error) {
	return _Contract.Contract.IsOperationReady(&_Contract.CallOpts, id)
}

func (_Contract *ContractTransactor) Cancel(opts *bind.TransactOpts, id [32]byte) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "cancel", id)
}

func (_Contract *ContractSession) Cancel(id [32]byte) (*types.Transaction, error) {
	return _Contract.Contract.Cancel(&_Contract.TransactOpts, id)
}

func (_Contract *ContractTransactorSession) Cancel(id [32]byte) (*types.Transaction, error) {
	return _Contract.Contract.Cancel(&_Contract.TransactOpts, id)
}

func (_Contract *ContractTransactor) Execute(opts *bind.TransactOpts, target common.Address, value *big.Int, payload []byte, predecessor [32]byte, salt [32]byte) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "execute", target, value, payload, predecessor, salt)
}

func (_Contract *ContractSession) Execute(target common.Address, value *big.Int, payload []byte, predecessor [32]byte, salt [32]byte) (*types.Transaction, error) {
	return _Contract.Contract.Execute(&_Contract.TransactOpts, target, value, payload, predecessor, salt)
}

func (_Contract *ContractTransactorSession) Execute(target common.Address, value *big.Int, payload []byte, predecessor [32]byte, salt [32]byte) (*types.Transaction, error) {
	return _Contract.Contract.Execute(&_Contract.TransactOpts, target, value, payload, predecessor, salt)
}

func (_Contract *ContractTransactor) ExecuteBatch(opts *bind.TransactOpts, targets []common.Address, values []*big.Int, payloads [][]byte, predecessor [32]byte, salt [32]byte) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "executeBatch", targets, values, payloads, predecessor, salt)
}

func (_Contract *ContractSession) ExecuteBatch(targets []common.Address, values []*big.Int, payloads [][]byte, predecessor [32]byte, salt [32]byte) (*types.Transaction, error) {
	return _Contract.Contract.ExecuteBatch(&_Contract.TransactOpts, targets, values, payloads, predecessor, salt)
}

func (_Contract *ContractTransactorSession) ExecuteBatch(targets []common.Address, values []*big.Int, payloads [][]byte, predecessor [32]byte, salt [32]byte) (*types.Transaction, error) {
	return _Contract.Contract.ExecuteBatch(&_Contract.TransactOpts, targets, values, payloads, predecessor, salt)
}

func (_Contract *ContractTransactor) Schedule(opts *bind.TransactOpts, target common.Address, value *big.Int, data []byte, predecessor [32]byte, salt [32]byte, delay *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "schedule", target, value, data, predecessor, salt, delay)
}

func (_Contract *ContractSession) Schedule(target common.Address, value *big.Int, data []byte, predecessor [32]byte, salt [32]byte, delay *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.Schedule(&_Contract.TransactOpts, target, value, data, predecessor, salt, delay)
}

func (_Contract *ContractTransactorSession) Schedule(target common.Address, value *big.Int, data []byte, predecessor [32]byte, salt [32]byte, delay *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.Schedule(&_Contract.TransactOpts, target, value, data, predecessor, salt, delay)
}

func (_Contract *ContractTransactor) ScheduleBatch(opts *bind.TransactOpts, targets []common.Address, values []*big.Int, payloads [][]byte, predecessor [32]byte, salt [32]byte, delay *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "scheduleBatch", targets, values, payloads, predecessor, salt, delay)
}

func (_Contract *ContractSession) ScheduleBatch(targets []common.Address, values []*big.Int, payloads [][]byte, predecessor [32]byte, salt [32]byte, delay *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.ScheduleBatch(&_Contract.TransactOpts, targets, values, payloads, predecessor, salt, delay)
}

func (_Contract *ContractTransactorSession) ScheduleBatch(targets []common.Address, values []*big.Int, payloads [][]byte, predecessor [32]byte, salt [32]byte, delay *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.ScheduleBatch(&_Contract.TransactOpts, targets, values, payloads, predecessor, salt, delay)
}

func (_Contract *ContractTransactor) UpdateDelay(opts *bind.TransactOpts, newDelay *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "updateDelay", newDelay)
}

func (_Contract *ContractSession) UpdateDelay(newDelay *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.UpdateDelay(&_Contract.TransactOpts, newDelay)
}

func (_Contract *ContractTransactorSession) UpdateDelay(newDelay *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.UpdateDelay(&_Contract.TransactOpts, newDelay)
}

func (_Contract *Contract) Address() common.Address {
	return _Contract.address
}

type ContractInterface interface {
	GetMinDelay(opts *bind.CallOpts) (*big.Int, error)

	GetTimestamp(opts *bind.CallOpts, id [32]byte) (*big.Int, error)

	HashOperation(opts *bind.CallOpts, target common.Address, value *big.Int, data []byte, predecessor [32]byte, salt [32]byte) ([32]byte, error)

	HashOperationBatch(opts *bind.CallOpts, targets []common.Address, values []*big.Int, payloads [][]byte, predecessor [32]byte, salt [32]byte) ([32]byte, error)

	IsOperation(opts *bind.CallOpts, id [32]byte) (bool, error)

	IsOperationDone(opts *bind.CallOpts, id [32]byte) (bool, error)

	IsOperationPending(opts *bind.CallOpts, id [32]byte) (bool, error)

	IsOperationReady(opts *bind.CallOpts, id [32]byte) (bool, error)

	Cancel(opts *bind.TransactOpts, id [32]byte) (*types.Transaction, error)

	Execute(opts *bind.TransactOpts, target common.Address, value *big.Int, payload []byte, predecessor [32]byte, salt [32]byte) (*types.Transaction, error)

	ExecuteBatch(opts *bind.TransactOpts, targets []common.Address, values []*big.Int, payloads [][]byte, predecessor [32]byte, salt [32]byte) (*types.Transaction, error)

	Schedule(opts *bind.TransactOpts, target common.Address, value *big.Int, data []byte, predecessor [32]byte, salt [32]byte, delay *big.Int) (*types.Transaction, error)

	ScheduleBatch(opts *bind.TransactOpts, targets []common.Address, values []*big.Int, payloads [][]byte, predecessor [32]byte, salt [32]byte, delay *big.Int) (*types.Transaction, error)

	UpdateDelay(opts *bind.TransactOpts, newDelay *big.Int) (*types.Transaction, error)

	Address() common.Address
}
