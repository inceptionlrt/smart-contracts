// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package IRestakerDeployer

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
	ABI: "[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"creator\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"contractIRestaker\",\"name\":\"restaker\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"id\",\"type\":\"uint256\"}],\"name\":\"RestakerDeployed\",\"type\":\"event\"},{\"inputs\":[],\"name\":\"BEACON_PROXY_BYTECODE\",\"outputs\":[{\"internalType\":\"bytes\",\"name\":\"\",\"type\":\"bytes\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"beacon\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"deployRestaker\",\"outputs\":[{\"internalType\":\"contractIRestaker\",\"name\":\"restaker\",\"type\":\"address\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"id\",\"type\":\"uint256\"}],\"name\":\"getRestaker\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"nonce\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"}]",
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

func (_Contract *ContractCaller) BEACONPROXYBYTECODE(opts *bind.CallOpts) ([]byte, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "BEACON_PROXY_BYTECODE")

	if err != nil {
		return *new([]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([]byte)).(*[]byte)

	return out0, err

}

func (_Contract *ContractSession) BEACONPROXYBYTECODE() ([]byte, error) {
	return _Contract.Contract.BEACONPROXYBYTECODE(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) BEACONPROXYBYTECODE() ([]byte, error) {
	return _Contract.Contract.BEACONPROXYBYTECODE(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) Beacon(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "beacon")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) Beacon() (common.Address, error) {
	return _Contract.Contract.Beacon(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) Beacon() (common.Address, error) {
	return _Contract.Contract.Beacon(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) GetRestaker(opts *bind.CallOpts, id *big.Int) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getRestaker", id)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) GetRestaker(id *big.Int) (common.Address, error) {
	return _Contract.Contract.GetRestaker(&_Contract.CallOpts, id)
}

func (_Contract *ContractCallerSession) GetRestaker(id *big.Int) (common.Address, error) {
	return _Contract.Contract.GetRestaker(&_Contract.CallOpts, id)
}

func (_Contract *ContractCaller) Nonce(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "nonce")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) Nonce() (*big.Int, error) {
	return _Contract.Contract.Nonce(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) Nonce() (*big.Int, error) {
	return _Contract.Contract.Nonce(&_Contract.CallOpts)
}

func (_Contract *ContractTransactor) DeployRestaker(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "deployRestaker")
}

func (_Contract *ContractSession) DeployRestaker() (*types.Transaction, error) {
	return _Contract.Contract.DeployRestaker(&_Contract.TransactOpts)
}

func (_Contract *ContractTransactorSession) DeployRestaker() (*types.Transaction, error) {
	return _Contract.Contract.DeployRestaker(&_Contract.TransactOpts)
}

type ContractRestakerDeployedIterator struct {
	Event *ContractRestakerDeployed

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractRestakerDeployedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractRestakerDeployed)
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
		it.Event = new(ContractRestakerDeployed)
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

func (it *ContractRestakerDeployedIterator) Error() error {
	return it.fail
}

func (it *ContractRestakerDeployedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractRestakerDeployed struct {
	Creator  common.Address
	Restaker common.Address
	Id       *big.Int
	Raw      types.Log
}

func (_Contract *ContractFilterer) FilterRestakerDeployed(opts *bind.FilterOpts, creator []common.Address, restaker []common.Address) (*ContractRestakerDeployedIterator, error) {

	var creatorRule []interface{}
	for _, creatorItem := range creator {
		creatorRule = append(creatorRule, creatorItem)
	}
	var restakerRule []interface{}
	for _, restakerItem := range restaker {
		restakerRule = append(restakerRule, restakerItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "RestakerDeployed", creatorRule, restakerRule)
	if err != nil {
		return nil, err
	}
	return &ContractRestakerDeployedIterator{contract: _Contract.contract, event: "RestakerDeployed", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchRestakerDeployed(opts *bind.WatchOpts, sink chan<- *ContractRestakerDeployed, creator []common.Address, restaker []common.Address) (event.Subscription, error) {

	var creatorRule []interface{}
	for _, creatorItem := range creator {
		creatorRule = append(creatorRule, creatorItem)
	}
	var restakerRule []interface{}
	for _, restakerItem := range restaker {
		restakerRule = append(restakerRule, restakerItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "RestakerDeployed", creatorRule, restakerRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractRestakerDeployed)
				if err := _Contract.contract.UnpackLog(event, "RestakerDeployed", log); err != nil {
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

func (_Contract *ContractFilterer) ParseRestakerDeployed(log types.Log) (*ContractRestakerDeployed, error) {
	event := new(ContractRestakerDeployed)
	if err := _Contract.contract.UnpackLog(event, "RestakerDeployed", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

func (_Contract *Contract) ParseLog(log types.Log) (generated.AbigenLog, error) {
	switch log.Topics[0] {
	case _Contract.abi.Events["RestakerDeployed"].ID:
		return _Contract.ParseRestakerDeployed(log)

	default:
		return nil, fmt.Errorf("abigen wrapper received unknown log topic: %v", log.Topics[0])
	}
}

func (ContractRestakerDeployed) Topic() common.Hash {
	return common.HexToHash("0x66b1c85e3aa7b590e4fcd19543377d320772af5d49300c8c50653f46253ee99f")
}

func (_Contract *Contract) Address() common.Address {
	return _Contract.address
}

type ContractInterface interface {
	BEACONPROXYBYTECODE(opts *bind.CallOpts) ([]byte, error)

	Beacon(opts *bind.CallOpts) (common.Address, error)

	GetRestaker(opts *bind.CallOpts, id *big.Int) (common.Address, error)

	Nonce(opts *bind.CallOpts) (*big.Int, error)

	DeployRestaker(opts *bind.TransactOpts) (*types.Transaction, error)

	FilterRestakerDeployed(opts *bind.FilterOpts, creator []common.Address, restaker []common.Address) (*ContractRestakerDeployedIterator, error)

	WatchRestakerDeployed(opts *bind.WatchOpts, sink chan<- *ContractRestakerDeployed, creator []common.Address, restaker []common.Address) (event.Subscription, error)

	ParseRestakerDeployed(log types.Log) (*ContractRestakerDeployed, error)

	ParseLog(log types.Log) (generated.AbigenLog, error)

	Address() common.Address
}
