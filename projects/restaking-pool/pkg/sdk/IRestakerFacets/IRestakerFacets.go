// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package IRestakerFacets

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
	ABI: "[{\"inputs\":[],\"name\":\"ZeroAddress\",\"type\":\"error\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"enumIRestakerFacets.FuncTarget\",\"name\":\"target\",\"type\":\"uint8\"},{\"indexed\":false,\"internalType\":\"bytes4\",\"name\":\"signature\",\"type\":\"bytes4\"}],\"name\":\"SignatureSet\",\"type\":\"event\"},{\"inputs\":[],\"name\":\"getDelegationManager\",\"outputs\":[{\"internalType\":\"contractIDelegationManager\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getEigenPodManager\",\"outputs\":[{\"internalType\":\"contractIEigenPodManager\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes4\",\"name\":\"sig\",\"type\":\"bytes4\"}],\"name\":\"selectorToTarget\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"}]",
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

func (_Contract *ContractCaller) GetDelegationManager(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getDelegationManager")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) GetDelegationManager() (common.Address, error) {
	return _Contract.Contract.GetDelegationManager(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) GetDelegationManager() (common.Address, error) {
	return _Contract.Contract.GetDelegationManager(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) GetEigenPodManager(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getEigenPodManager")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) GetEigenPodManager() (common.Address, error) {
	return _Contract.Contract.GetEigenPodManager(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) GetEigenPodManager() (common.Address, error) {
	return _Contract.Contract.GetEigenPodManager(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) SelectorToTarget(opts *bind.CallOpts, sig [4]byte) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "selectorToTarget", sig)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) SelectorToTarget(sig [4]byte) (common.Address, error) {
	return _Contract.Contract.SelectorToTarget(&_Contract.CallOpts, sig)
}

func (_Contract *ContractCallerSession) SelectorToTarget(sig [4]byte) (common.Address, error) {
	return _Contract.Contract.SelectorToTarget(&_Contract.CallOpts, sig)
}

type ContractSignatureSetIterator struct {
	Event *ContractSignatureSet

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractSignatureSetIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractSignatureSet)
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
		it.Event = new(ContractSignatureSet)
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

func (it *ContractSignatureSetIterator) Error() error {
	return it.fail
}

func (it *ContractSignatureSetIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractSignatureSet struct {
	Target    uint8
	Signature [4]byte
	Raw       types.Log
}

func (_Contract *ContractFilterer) FilterSignatureSet(opts *bind.FilterOpts, target []uint8) (*ContractSignatureSetIterator, error) {

	var targetRule []interface{}
	for _, targetItem := range target {
		targetRule = append(targetRule, targetItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "SignatureSet", targetRule)
	if err != nil {
		return nil, err
	}
	return &ContractSignatureSetIterator{contract: _Contract.contract, event: "SignatureSet", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchSignatureSet(opts *bind.WatchOpts, sink chan<- *ContractSignatureSet, target []uint8) (event.Subscription, error) {

	var targetRule []interface{}
	for _, targetItem := range target {
		targetRule = append(targetRule, targetItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "SignatureSet", targetRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractSignatureSet)
				if err := _Contract.contract.UnpackLog(event, "SignatureSet", log); err != nil {
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

func (_Contract *ContractFilterer) ParseSignatureSet(log types.Log) (*ContractSignatureSet, error) {
	event := new(ContractSignatureSet)
	if err := _Contract.contract.UnpackLog(event, "SignatureSet", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

func (_Contract *Contract) ParseLog(log types.Log) (generated.AbigenLog, error) {
	switch log.Topics[0] {
	case _Contract.abi.Events["SignatureSet"].ID:
		return _Contract.ParseSignatureSet(log)

	default:
		return nil, fmt.Errorf("abigen wrapper received unknown log topic: %v", log.Topics[0])
	}
}

func (ContractSignatureSet) Topic() common.Hash {
	return common.HexToHash("0x2d68f7f9788b3207d1a77f40d81758efd807d1a239636683f6e7d25267cc7496")
}

func (_Contract *Contract) Address() common.Address {
	return _Contract.address
}

type ContractInterface interface {
	GetDelegationManager(opts *bind.CallOpts) (common.Address, error)

	GetEigenPodManager(opts *bind.CallOpts) (common.Address, error)

	SelectorToTarget(opts *bind.CallOpts, sig [4]byte) (common.Address, error)

	FilterSignatureSet(opts *bind.FilterOpts, target []uint8) (*ContractSignatureSetIterator, error)

	WatchSignatureSet(opts *bind.WatchOpts, sink chan<- *ContractSignatureSet, target []uint8) (event.Subscription, error)

	ParseSignatureSet(log types.Log) (*ContractSignatureSet, error)

	ParseLog(log types.Log) (generated.AbigenLog, error)

	Address() common.Address
}
