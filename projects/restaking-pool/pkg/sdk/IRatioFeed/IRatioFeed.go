// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package IRatioFeed

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
	ABI: "[{\"inputs\":[{\"internalType\":\"enumIRatioFeed.RatioError\",\"name\":\"\",\"type\":\"uint8\"}],\"name\":\"RatioNotUpdated\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"RatioThresholdNotInRange\",\"type\":\"error\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"oldValue\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newValue\",\"type\":\"uint256\"}],\"name\":\"RatioThresholdChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"tokenAddress\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"oldRatio\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newRatio\",\"type\":\"uint256\"}],\"name\":\"RatioUpdated\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"token\",\"type\":\"address\"}],\"name\":\"getRatio\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"ratio\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"token\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"ratio\",\"type\":\"uint256\"}],\"name\":\"updateRatio\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]",
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

func (_Contract *ContractTransactor) UpdateRatio(opts *bind.TransactOpts, token common.Address, ratio *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "updateRatio", token, ratio)
}

func (_Contract *ContractSession) UpdateRatio(token common.Address, ratio *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.UpdateRatio(&_Contract.TransactOpts, token, ratio)
}

func (_Contract *ContractTransactorSession) UpdateRatio(token common.Address, ratio *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.UpdateRatio(&_Contract.TransactOpts, token, ratio)
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
	case _Contract.abi.Events["RatioThresholdChanged"].ID:
		return _Contract.ParseRatioThresholdChanged(log)
	case _Contract.abi.Events["RatioUpdated"].ID:
		return _Contract.ParseRatioUpdated(log)

	default:
		return nil, fmt.Errorf("abigen wrapper received unknown log topic: %v", log.Topics[0])
	}
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
	GetRatio(opts *bind.CallOpts, token common.Address) (*big.Int, error)

	UpdateRatio(opts *bind.TransactOpts, token common.Address, ratio *big.Int) (*types.Transaction, error)

	FilterRatioThresholdChanged(opts *bind.FilterOpts) (*ContractRatioThresholdChangedIterator, error)

	WatchRatioThresholdChanged(opts *bind.WatchOpts, sink chan<- *ContractRatioThresholdChanged) (event.Subscription, error)

	ParseRatioThresholdChanged(log types.Log) (*ContractRatioThresholdChanged, error)

	FilterRatioUpdated(opts *bind.FilterOpts, tokenAddress []common.Address) (*ContractRatioUpdatedIterator, error)

	WatchRatioUpdated(opts *bind.WatchOpts, sink chan<- *ContractRatioUpdated, tokenAddress []common.Address) (event.Subscription, error)

	ParseRatioUpdated(log types.Log) (*ContractRatioUpdated, error)

	ParseLog(log types.Log) (generated.AbigenLog, error)

	Address() common.Address
}
