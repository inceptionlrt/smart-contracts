// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package IProtocolConfig

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
	ABI: "[{\"inputs\":[],\"name\":\"OnlyGovernanceAllowed\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"ZeroAddress\",\"type\":\"error\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"contractICToken\",\"name\":\"prevValue\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"contractICToken\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"CTokenChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"contractIEigenPodManager\",\"name\":\"prevValue\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"contractIEigenPodManager\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"EigenManagerChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"prevValue\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"GovernanceChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"prevValue\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"OperatorChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"contractIRatioFeed\",\"name\":\"prevValue\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"contractIRatioFeed\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"RatioFeedChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"contractIRestakerDeployer\",\"name\":\"prevValue\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"contractIRestakerDeployer\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"RestakerDeployerChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"contractIRestakingPool\",\"name\":\"prevValue\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"contractIRestakingPool\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"RestakingPoolChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"prevValue\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"TreasuryChanged\",\"type\":\"event\"},{\"inputs\":[],\"name\":\"getCToken\",\"outputs\":[{\"internalType\":\"contractICToken\",\"name\":\"token\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getGovernance\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"governance\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getOperator\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getRatioFeed\",\"outputs\":[{\"internalType\":\"contractIRatioFeed\",\"name\":\"feed\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getRestakerDeployer\",\"outputs\":[{\"internalType\":\"contractIRestakerDeployer\",\"name\":\"deployer\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getRestakingPool\",\"outputs\":[{\"internalType\":\"contractIRestakingPool\",\"name\":\"pool\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getTreasury\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"treasury\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"}]",
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

func (_Contract *ContractCaller) GetCToken(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getCToken")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) GetCToken() (common.Address, error) {
	return _Contract.Contract.GetCToken(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) GetCToken() (common.Address, error) {
	return _Contract.Contract.GetCToken(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) GetGovernance(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getGovernance")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) GetGovernance() (common.Address, error) {
	return _Contract.Contract.GetGovernance(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) GetGovernance() (common.Address, error) {
	return _Contract.Contract.GetGovernance(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) GetOperator(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getOperator")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) GetOperator() (common.Address, error) {
	return _Contract.Contract.GetOperator(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) GetOperator() (common.Address, error) {
	return _Contract.Contract.GetOperator(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) GetRatioFeed(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getRatioFeed")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) GetRatioFeed() (common.Address, error) {
	return _Contract.Contract.GetRatioFeed(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) GetRatioFeed() (common.Address, error) {
	return _Contract.Contract.GetRatioFeed(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) GetRestakerDeployer(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getRestakerDeployer")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) GetRestakerDeployer() (common.Address, error) {
	return _Contract.Contract.GetRestakerDeployer(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) GetRestakerDeployer() (common.Address, error) {
	return _Contract.Contract.GetRestakerDeployer(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) GetRestakingPool(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getRestakingPool")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) GetRestakingPool() (common.Address, error) {
	return _Contract.Contract.GetRestakingPool(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) GetRestakingPool() (common.Address, error) {
	return _Contract.Contract.GetRestakingPool(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) GetTreasury(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getTreasury")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) GetTreasury() (common.Address, error) {
	return _Contract.Contract.GetTreasury(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) GetTreasury() (common.Address, error) {
	return _Contract.Contract.GetTreasury(&_Contract.CallOpts)
}

type ContractCTokenChangedIterator struct {
	Event *ContractCTokenChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractCTokenChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractCTokenChanged)
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
		it.Event = new(ContractCTokenChanged)
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

func (it *ContractCTokenChangedIterator) Error() error {
	return it.fail
}

func (it *ContractCTokenChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractCTokenChanged struct {
	PrevValue common.Address
	NewValue  common.Address
	Raw       types.Log
}

func (_Contract *ContractFilterer) FilterCTokenChanged(opts *bind.FilterOpts) (*ContractCTokenChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "CTokenChanged")
	if err != nil {
		return nil, err
	}
	return &ContractCTokenChangedIterator{contract: _Contract.contract, event: "CTokenChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchCTokenChanged(opts *bind.WatchOpts, sink chan<- *ContractCTokenChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "CTokenChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractCTokenChanged)
				if err := _Contract.contract.UnpackLog(event, "CTokenChanged", log); err != nil {
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

func (_Contract *ContractFilterer) ParseCTokenChanged(log types.Log) (*ContractCTokenChanged, error) {
	event := new(ContractCTokenChanged)
	if err := _Contract.contract.UnpackLog(event, "CTokenChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractEigenManagerChangedIterator struct {
	Event *ContractEigenManagerChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractEigenManagerChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractEigenManagerChanged)
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
		it.Event = new(ContractEigenManagerChanged)
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

func (it *ContractEigenManagerChangedIterator) Error() error {
	return it.fail
}

func (it *ContractEigenManagerChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractEigenManagerChanged struct {
	PrevValue common.Address
	NewValue  common.Address
	Raw       types.Log
}

func (_Contract *ContractFilterer) FilterEigenManagerChanged(opts *bind.FilterOpts) (*ContractEigenManagerChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "EigenManagerChanged")
	if err != nil {
		return nil, err
	}
	return &ContractEigenManagerChangedIterator{contract: _Contract.contract, event: "EigenManagerChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchEigenManagerChanged(opts *bind.WatchOpts, sink chan<- *ContractEigenManagerChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "EigenManagerChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractEigenManagerChanged)
				if err := _Contract.contract.UnpackLog(event, "EigenManagerChanged", log); err != nil {
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

func (_Contract *ContractFilterer) ParseEigenManagerChanged(log types.Log) (*ContractEigenManagerChanged, error) {
	event := new(ContractEigenManagerChanged)
	if err := _Contract.contract.UnpackLog(event, "EigenManagerChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractGovernanceChangedIterator struct {
	Event *ContractGovernanceChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractGovernanceChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractGovernanceChanged)
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
		it.Event = new(ContractGovernanceChanged)
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

func (it *ContractGovernanceChangedIterator) Error() error {
	return it.fail
}

func (it *ContractGovernanceChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractGovernanceChanged struct {
	PrevValue common.Address
	NewValue  common.Address
	Raw       types.Log
}

func (_Contract *ContractFilterer) FilterGovernanceChanged(opts *bind.FilterOpts) (*ContractGovernanceChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "GovernanceChanged")
	if err != nil {
		return nil, err
	}
	return &ContractGovernanceChangedIterator{contract: _Contract.contract, event: "GovernanceChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchGovernanceChanged(opts *bind.WatchOpts, sink chan<- *ContractGovernanceChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "GovernanceChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractGovernanceChanged)
				if err := _Contract.contract.UnpackLog(event, "GovernanceChanged", log); err != nil {
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

func (_Contract *ContractFilterer) ParseGovernanceChanged(log types.Log) (*ContractGovernanceChanged, error) {
	event := new(ContractGovernanceChanged)
	if err := _Contract.contract.UnpackLog(event, "GovernanceChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractOperatorChangedIterator struct {
	Event *ContractOperatorChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractOperatorChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractOperatorChanged)
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
		it.Event = new(ContractOperatorChanged)
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

func (it *ContractOperatorChangedIterator) Error() error {
	return it.fail
}

func (it *ContractOperatorChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractOperatorChanged struct {
	PrevValue common.Address
	NewValue  common.Address
	Raw       types.Log
}

func (_Contract *ContractFilterer) FilterOperatorChanged(opts *bind.FilterOpts) (*ContractOperatorChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "OperatorChanged")
	if err != nil {
		return nil, err
	}
	return &ContractOperatorChangedIterator{contract: _Contract.contract, event: "OperatorChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchOperatorChanged(opts *bind.WatchOpts, sink chan<- *ContractOperatorChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "OperatorChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractOperatorChanged)
				if err := _Contract.contract.UnpackLog(event, "OperatorChanged", log); err != nil {
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

func (_Contract *ContractFilterer) ParseOperatorChanged(log types.Log) (*ContractOperatorChanged, error) {
	event := new(ContractOperatorChanged)
	if err := _Contract.contract.UnpackLog(event, "OperatorChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractRatioFeedChangedIterator struct {
	Event *ContractRatioFeedChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractRatioFeedChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractRatioFeedChanged)
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
		it.Event = new(ContractRatioFeedChanged)
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

func (it *ContractRatioFeedChangedIterator) Error() error {
	return it.fail
}

func (it *ContractRatioFeedChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractRatioFeedChanged struct {
	PrevValue common.Address
	NewValue  common.Address
	Raw       types.Log
}

func (_Contract *ContractFilterer) FilterRatioFeedChanged(opts *bind.FilterOpts) (*ContractRatioFeedChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "RatioFeedChanged")
	if err != nil {
		return nil, err
	}
	return &ContractRatioFeedChangedIterator{contract: _Contract.contract, event: "RatioFeedChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchRatioFeedChanged(opts *bind.WatchOpts, sink chan<- *ContractRatioFeedChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "RatioFeedChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractRatioFeedChanged)
				if err := _Contract.contract.UnpackLog(event, "RatioFeedChanged", log); err != nil {
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

func (_Contract *ContractFilterer) ParseRatioFeedChanged(log types.Log) (*ContractRatioFeedChanged, error) {
	event := new(ContractRatioFeedChanged)
	if err := _Contract.contract.UnpackLog(event, "RatioFeedChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractRestakerDeployerChangedIterator struct {
	Event *ContractRestakerDeployerChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractRestakerDeployerChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractRestakerDeployerChanged)
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
		it.Event = new(ContractRestakerDeployerChanged)
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

func (it *ContractRestakerDeployerChangedIterator) Error() error {
	return it.fail
}

func (it *ContractRestakerDeployerChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractRestakerDeployerChanged struct {
	PrevValue common.Address
	NewValue  common.Address
	Raw       types.Log
}

func (_Contract *ContractFilterer) FilterRestakerDeployerChanged(opts *bind.FilterOpts) (*ContractRestakerDeployerChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "RestakerDeployerChanged")
	if err != nil {
		return nil, err
	}
	return &ContractRestakerDeployerChangedIterator{contract: _Contract.contract, event: "RestakerDeployerChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchRestakerDeployerChanged(opts *bind.WatchOpts, sink chan<- *ContractRestakerDeployerChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "RestakerDeployerChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractRestakerDeployerChanged)
				if err := _Contract.contract.UnpackLog(event, "RestakerDeployerChanged", log); err != nil {
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

func (_Contract *ContractFilterer) ParseRestakerDeployerChanged(log types.Log) (*ContractRestakerDeployerChanged, error) {
	event := new(ContractRestakerDeployerChanged)
	if err := _Contract.contract.UnpackLog(event, "RestakerDeployerChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractRestakingPoolChangedIterator struct {
	Event *ContractRestakingPoolChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractRestakingPoolChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractRestakingPoolChanged)
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
		it.Event = new(ContractRestakingPoolChanged)
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

func (it *ContractRestakingPoolChangedIterator) Error() error {
	return it.fail
}

func (it *ContractRestakingPoolChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractRestakingPoolChanged struct {
	PrevValue common.Address
	NewValue  common.Address
	Raw       types.Log
}

func (_Contract *ContractFilterer) FilterRestakingPoolChanged(opts *bind.FilterOpts) (*ContractRestakingPoolChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "RestakingPoolChanged")
	if err != nil {
		return nil, err
	}
	return &ContractRestakingPoolChangedIterator{contract: _Contract.contract, event: "RestakingPoolChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchRestakingPoolChanged(opts *bind.WatchOpts, sink chan<- *ContractRestakingPoolChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "RestakingPoolChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractRestakingPoolChanged)
				if err := _Contract.contract.UnpackLog(event, "RestakingPoolChanged", log); err != nil {
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

func (_Contract *ContractFilterer) ParseRestakingPoolChanged(log types.Log) (*ContractRestakingPoolChanged, error) {
	event := new(ContractRestakingPoolChanged)
	if err := _Contract.contract.UnpackLog(event, "RestakingPoolChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractTreasuryChangedIterator struct {
	Event *ContractTreasuryChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractTreasuryChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractTreasuryChanged)
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
		it.Event = new(ContractTreasuryChanged)
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

func (it *ContractTreasuryChangedIterator) Error() error {
	return it.fail
}

func (it *ContractTreasuryChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractTreasuryChanged struct {
	PrevValue common.Address
	NewValue  common.Address
	Raw       types.Log
}

func (_Contract *ContractFilterer) FilterTreasuryChanged(opts *bind.FilterOpts) (*ContractTreasuryChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "TreasuryChanged")
	if err != nil {
		return nil, err
	}
	return &ContractTreasuryChangedIterator{contract: _Contract.contract, event: "TreasuryChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchTreasuryChanged(opts *bind.WatchOpts, sink chan<- *ContractTreasuryChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "TreasuryChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractTreasuryChanged)
				if err := _Contract.contract.UnpackLog(event, "TreasuryChanged", log); err != nil {
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

func (_Contract *ContractFilterer) ParseTreasuryChanged(log types.Log) (*ContractTreasuryChanged, error) {
	event := new(ContractTreasuryChanged)
	if err := _Contract.contract.UnpackLog(event, "TreasuryChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

func (_Contract *Contract) ParseLog(log types.Log) (generated.AbigenLog, error) {
	switch log.Topics[0] {
	case _Contract.abi.Events["CTokenChanged"].ID:
		return _Contract.ParseCTokenChanged(log)
	case _Contract.abi.Events["EigenManagerChanged"].ID:
		return _Contract.ParseEigenManagerChanged(log)
	case _Contract.abi.Events["GovernanceChanged"].ID:
		return _Contract.ParseGovernanceChanged(log)
	case _Contract.abi.Events["OperatorChanged"].ID:
		return _Contract.ParseOperatorChanged(log)
	case _Contract.abi.Events["RatioFeedChanged"].ID:
		return _Contract.ParseRatioFeedChanged(log)
	case _Contract.abi.Events["RestakerDeployerChanged"].ID:
		return _Contract.ParseRestakerDeployerChanged(log)
	case _Contract.abi.Events["RestakingPoolChanged"].ID:
		return _Contract.ParseRestakingPoolChanged(log)
	case _Contract.abi.Events["TreasuryChanged"].ID:
		return _Contract.ParseTreasuryChanged(log)

	default:
		return nil, fmt.Errorf("abigen wrapper received unknown log topic: %v", log.Topics[0])
	}
}

func (ContractCTokenChanged) Topic() common.Hash {
	return common.HexToHash("0x604ae4b80bb1d3cb1b6f8fd99500a3203337ec3cdd83cb343ee91f8960f634df")
}

func (ContractEigenManagerChanged) Topic() common.Hash {
	return common.HexToHash("0xdce0fb87deaee9a5681d737cdbc7ba6fc10d8fac2e72e52589fff9dbbae06abb")
}

func (ContractGovernanceChanged) Topic() common.Hash {
	return common.HexToHash("0x3aaaebeb4821d6a7e5c77ece53cff0afcc56c82add2c978dbbb7f73e84cbcfd2")
}

func (ContractOperatorChanged) Topic() common.Hash {
	return common.HexToHash("0xd58299b712891143e76310d5e664c4203c940a67db37cf856bdaa3c5c76a802c")
}

func (ContractRatioFeedChanged) Topic() common.Hash {
	return common.HexToHash("0xdb29c30d5fa0d3da86f28fcd1e16611171e924d291c7ef82f03cffb0bfa05652")
}

func (ContractRestakerDeployerChanged) Topic() common.Hash {
	return common.HexToHash("0x37910025f99bc7fdc07bdf77dee21c246391d5e3f98e8c6e3b0306dfaf8f24fa")
}

func (ContractRestakingPoolChanged) Topic() common.Hash {
	return common.HexToHash("0x00ae48a6cddea33b0b408d1f3e36bef3e47379bdc069c2f6662786c5bec83e10")
}

func (ContractTreasuryChanged) Topic() common.Hash {
	return common.HexToHash("0x8c3aa5f43a388513435861bf27dfad7829cd248696fed367c62d441f62954496")
}

func (_Contract *Contract) Address() common.Address {
	return _Contract.address
}

type ContractInterface interface {
	GetCToken(opts *bind.CallOpts) (common.Address, error)

	GetGovernance(opts *bind.CallOpts) (common.Address, error)

	GetOperator(opts *bind.CallOpts) (common.Address, error)

	GetRatioFeed(opts *bind.CallOpts) (common.Address, error)

	GetRestakerDeployer(opts *bind.CallOpts) (common.Address, error)

	GetRestakingPool(opts *bind.CallOpts) (common.Address, error)

	GetTreasury(opts *bind.CallOpts) (common.Address, error)

	FilterCTokenChanged(opts *bind.FilterOpts) (*ContractCTokenChangedIterator, error)

	WatchCTokenChanged(opts *bind.WatchOpts, sink chan<- *ContractCTokenChanged) (event.Subscription, error)

	ParseCTokenChanged(log types.Log) (*ContractCTokenChanged, error)

	FilterEigenManagerChanged(opts *bind.FilterOpts) (*ContractEigenManagerChangedIterator, error)

	WatchEigenManagerChanged(opts *bind.WatchOpts, sink chan<- *ContractEigenManagerChanged) (event.Subscription, error)

	ParseEigenManagerChanged(log types.Log) (*ContractEigenManagerChanged, error)

	FilterGovernanceChanged(opts *bind.FilterOpts) (*ContractGovernanceChangedIterator, error)

	WatchGovernanceChanged(opts *bind.WatchOpts, sink chan<- *ContractGovernanceChanged) (event.Subscription, error)

	ParseGovernanceChanged(log types.Log) (*ContractGovernanceChanged, error)

	FilterOperatorChanged(opts *bind.FilterOpts) (*ContractOperatorChangedIterator, error)

	WatchOperatorChanged(opts *bind.WatchOpts, sink chan<- *ContractOperatorChanged) (event.Subscription, error)

	ParseOperatorChanged(log types.Log) (*ContractOperatorChanged, error)

	FilterRatioFeedChanged(opts *bind.FilterOpts) (*ContractRatioFeedChangedIterator, error)

	WatchRatioFeedChanged(opts *bind.WatchOpts, sink chan<- *ContractRatioFeedChanged) (event.Subscription, error)

	ParseRatioFeedChanged(log types.Log) (*ContractRatioFeedChanged, error)

	FilterRestakerDeployerChanged(opts *bind.FilterOpts) (*ContractRestakerDeployerChangedIterator, error)

	WatchRestakerDeployerChanged(opts *bind.WatchOpts, sink chan<- *ContractRestakerDeployerChanged) (event.Subscription, error)

	ParseRestakerDeployerChanged(log types.Log) (*ContractRestakerDeployerChanged, error)

	FilterRestakingPoolChanged(opts *bind.FilterOpts) (*ContractRestakingPoolChangedIterator, error)

	WatchRestakingPoolChanged(opts *bind.WatchOpts, sink chan<- *ContractRestakingPoolChanged) (event.Subscription, error)

	ParseRestakingPoolChanged(log types.Log) (*ContractRestakingPoolChanged, error)

	FilterTreasuryChanged(opts *bind.FilterOpts) (*ContractTreasuryChangedIterator, error)

	WatchTreasuryChanged(opts *bind.WatchOpts, sink chan<- *ContractTreasuryChanged) (event.Subscription, error)

	ParseTreasuryChanged(log types.Log) (*ContractTreasuryChanged, error)

	ParseLog(log types.Log) (generated.AbigenLog, error)

	Address() common.Address
}
