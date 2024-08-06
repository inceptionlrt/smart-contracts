// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package FeeCollector

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
	ABI: "[{\"inputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"inputs\":[],\"name\":\"CommissionNotInRange\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"}],\"name\":\"FeeCollectorTransferFailed\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"InvalidInitialization\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"NotInitializing\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"OnlyGovernanceAllowed\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"OnlyOperatorAllowed\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"OnlyRestakingPoolAllowed\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"ReentrancyGuardReentrantCall\",\"type\":\"error\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint16\",\"name\":\"prevValue\",\"type\":\"uint16\"},{\"indexed\":false,\"internalType\":\"uint16\",\"name\":\"newValue\",\"type\":\"uint16\"}],\"name\":\"CommissionChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint64\",\"name\":\"version\",\"type\":\"uint64\"}],\"name\":\"Initialized\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"sender\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"Received\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"pool\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"treasury\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"rewards\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"fee\",\"type\":\"uint256\"}],\"name\":\"Withdrawn\",\"type\":\"event\"},{\"inputs\":[],\"name\":\"MAX_COMMISSION\",\"outputs\":[{\"internalType\":\"uint16\",\"name\":\"\",\"type\":\"uint16\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"commission\",\"outputs\":[{\"internalType\":\"uint16\",\"name\":\"\",\"type\":\"uint16\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"config\",\"outputs\":[{\"internalType\":\"contractIProtocolConfig\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getRewards\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"rewards\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"contractIProtocolConfig\",\"name\":\"config\",\"type\":\"address\"},{\"internalType\":\"uint16\",\"name\":\"commission_\",\"type\":\"uint16\"}],\"name\":\"initialize\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint16\",\"name\":\"newValue\",\"type\":\"uint16\"}],\"name\":\"setCommission\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"withdraw\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"stateMutability\":\"payable\",\"type\":\"receive\"}]",
	Bin: "0x608060405234801561000f575f80fd5b5061001861001d565b6100cf565b7ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a00805468010000000000000000900460ff161561006d5760405163f92ee8a960e01b815260040160405180910390fd5b80546001600160401b03908116146100cc5780546001600160401b0319166001600160401b0390811782556040519081527fc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d29060200160405180910390a15b50565b6108db806100dc5f395ff3fe608060405260043610610071575f3560e01c8063ae97dde81161004c578063ae97dde814610114578063c594cc651461013c578063e14891911461015b578063f39e69a414610175575f80fd5b80630572b0cc146100b15780633ccfd60b146100d857806379502c55146100ee575f80fd5b366100ad5760405134815233907f88a5966d370b9919b20f3e2c13ff65706f196a4e32cc2c12bf57088f885258749060200160405180910390a2005b5f80fd5b3480156100bc575f80fd5b506100c5610194565b6040519081526020015b60405180910390f35b3480156100e3575f80fd5b506100ec6101a4565b005b3480156100f9575f80fd5b505f546040516001600160a01b0390911681526020016100cf565b34801561011f575f80fd5b5061012961271081565b60405161ffff90911681526020016100cf565b348015610147575f80fd5b506100ec6101563660046107c6565b61042d565b348015610166575f80fd5b506032546101299061ffff1681565b348015610180575f80fd5b506100ec61018f3660046107fa565b6104dc565b5f61019e476105fc565b92915050565b6101ac610632565b476127108110610401575f806101c1836105fc565b915091505f6101d75f546001600160a01b031690565b6001600160a01b0316637745165b6040518163ffffffff1660e01b8152600401602060405180830381865afa158015610212573d5f803e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610236919061082d565b90505f61024a5f546001600160a01b031690565b6001600160a01b0316633b19e84a6040518163ffffffff1660e01b8152600401602060405180830381865afa158015610285573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906102a9919061082d565b90505f826001600160a01b0316846040515f6040518083038185875af1925050503d805f81146102f4576040519150601f19603f3d011682016040523d82523d5f602084013e6102f9565b606091505b505090508061032b5760405163035106a760e31b81526001600160a01b03841660048201526024015b60405180910390fd5b6040516001600160a01b0383169086905f81818185875af1925050503d805f8114610371576040519150601f19603f3d011682016040523d82523d5f602084013e610376565b606091505b505080915050806103a55760405163035106a760e31b81526001600160a01b0383166004820152602401610322565b816001600160a01b0316836001600160a01b03167f91fb9d98b786c57d74c099ccd2beca1739e9f6a81fb49001ca465c4b7591bbe286886040516103f3929190918252602082015260400190565b60405180910390a350505050505b5061042b60017f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f0055565b565b5f8054906101000a90046001600160a01b03166001600160a01b031663289b3c0d6040518163ffffffff1660e01b8152600401602060405180830381865afa15801561047b573d5f803e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061049f919061082d565b6001600160a01b0316336001600160a01b0316146104d05760405163e2d4f15f60e01b815260040160405180910390fd5b6104d9816106a2565b50565b7ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a008054600160401b810460ff16159067ffffffffffffffff165f811580156105215750825b90505f8267ffffffffffffffff16600114801561053d5750303b155b90508115801561054b575080155b156105695760405163f92ee8a960e01b815260040160405180910390fd5b845467ffffffffffffffff19166001178555831561059357845460ff60401b1916600160401b1785555b61059b610722565b6105a487610732565b6105ad8661075b565b83156105f357845460ff60401b19168555604051600181527fc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d29060200160405180910390a15b50505050505050565b6032545f908190612710906106159061ffff168561085c565b61061f9190610873565b915061062b8284610892565b9050915091565b7f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f0080546001190161067657604051633ee5aeb560e01b815260040160405180910390fd5b60029055565b60017f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f0055565b61271061ffff8216106106c857604051631994455560e11b815260040160405180910390fd5b6032546040805161ffff928316815291831660208301527f07d1ecb0b6fd1c556347c57a4035549a933093e3e5a0a63418dd3589c82749de910160405180910390a16032805461ffff191661ffff92909216919091179055565b61072a61075f565b61042b6107a8565b61073a61075f565b5f80546001600160a01b0319166001600160a01b0392909216919091179055565b6104d05b7ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a0054600160401b900460ff1661042b57604051631afcd79f60e31b815260040160405180910390fd5b61067c61075f565b803561ffff811681146107c1575f80fd5b919050565b5f602082840312156107d6575f80fd5b6107df826107b0565b9392505050565b6001600160a01b03811681146104d9575f80fd5b5f806040838503121561080b575f80fd5b8235610816816107e6565b9150610824602084016107b0565b90509250929050565b5f6020828403121561083d575f80fd5b81516107df816107e6565b634e487b7160e01b5f52601160045260245ffd5b808202811582820484141761019e5761019e610848565b5f8261088d57634e487b7160e01b5f52601260045260245ffd5b500490565b8181038181111561019e5761019e61084856fea2646970667358221220b446b0b2f4381329985974453ab2066d375098a2c5a888d0657ed2131916e1b464736f6c63430008150033",
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

func (_Contract *ContractCaller) MAXCOMMISSION(opts *bind.CallOpts) (uint16, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "MAX_COMMISSION")

	if err != nil {
		return *new(uint16), err
	}

	out0 := *abi.ConvertType(out[0], new(uint16)).(*uint16)

	return out0, err

}

func (_Contract *ContractSession) MAXCOMMISSION() (uint16, error) {
	return _Contract.Contract.MAXCOMMISSION(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) MAXCOMMISSION() (uint16, error) {
	return _Contract.Contract.MAXCOMMISSION(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) Commission(opts *bind.CallOpts) (uint16, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "commission")

	if err != nil {
		return *new(uint16), err
	}

	out0 := *abi.ConvertType(out[0], new(uint16)).(*uint16)

	return out0, err

}

func (_Contract *ContractSession) Commission() (uint16, error) {
	return _Contract.Contract.Commission(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) Commission() (uint16, error) {
	return _Contract.Contract.Commission(&_Contract.CallOpts)
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

func (_Contract *ContractCaller) GetRewards(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getRewards")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) GetRewards() (*big.Int, error) {
	return _Contract.Contract.GetRewards(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) GetRewards() (*big.Int, error) {
	return _Contract.Contract.GetRewards(&_Contract.CallOpts)
}

func (_Contract *ContractTransactor) Initialize(opts *bind.TransactOpts, config common.Address, commission_ uint16) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "initialize", config, commission_)
}

func (_Contract *ContractSession) Initialize(config common.Address, commission_ uint16) (*types.Transaction, error) {
	return _Contract.Contract.Initialize(&_Contract.TransactOpts, config, commission_)
}

func (_Contract *ContractTransactorSession) Initialize(config common.Address, commission_ uint16) (*types.Transaction, error) {
	return _Contract.Contract.Initialize(&_Contract.TransactOpts, config, commission_)
}

func (_Contract *ContractTransactor) SetCommission(opts *bind.TransactOpts, newValue uint16) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "setCommission", newValue)
}

func (_Contract *ContractSession) SetCommission(newValue uint16) (*types.Transaction, error) {
	return _Contract.Contract.SetCommission(&_Contract.TransactOpts, newValue)
}

func (_Contract *ContractTransactorSession) SetCommission(newValue uint16) (*types.Transaction, error) {
	return _Contract.Contract.SetCommission(&_Contract.TransactOpts, newValue)
}

func (_Contract *ContractTransactor) Withdraw(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "withdraw")
}

func (_Contract *ContractSession) Withdraw() (*types.Transaction, error) {
	return _Contract.Contract.Withdraw(&_Contract.TransactOpts)
}

func (_Contract *ContractTransactorSession) Withdraw() (*types.Transaction, error) {
	return _Contract.Contract.Withdraw(&_Contract.TransactOpts)
}

func (_Contract *ContractTransactor) Receive(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Contract.contract.RawTransact(opts, nil)
}

func (_Contract *ContractSession) Receive() (*types.Transaction, error) {
	return _Contract.Contract.Receive(&_Contract.TransactOpts)
}

func (_Contract *ContractTransactorSession) Receive() (*types.Transaction, error) {
	return _Contract.Contract.Receive(&_Contract.TransactOpts)
}

type ContractCommissionChangedIterator struct {
	Event *ContractCommissionChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractCommissionChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractCommissionChanged)
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
		it.Event = new(ContractCommissionChanged)
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

func (it *ContractCommissionChangedIterator) Error() error {
	return it.fail
}

func (it *ContractCommissionChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractCommissionChanged struct {
	PrevValue uint16
	NewValue  uint16
	Raw       types.Log
}

func (_Contract *ContractFilterer) FilterCommissionChanged(opts *bind.FilterOpts) (*ContractCommissionChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "CommissionChanged")
	if err != nil {
		return nil, err
	}
	return &ContractCommissionChangedIterator{contract: _Contract.contract, event: "CommissionChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchCommissionChanged(opts *bind.WatchOpts, sink chan<- *ContractCommissionChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "CommissionChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractCommissionChanged)
				if err := _Contract.contract.UnpackLog(event, "CommissionChanged", log); err != nil {
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

func (_Contract *ContractFilterer) ParseCommissionChanged(log types.Log) (*ContractCommissionChanged, error) {
	event := new(ContractCommissionChanged)
	if err := _Contract.contract.UnpackLog(event, "CommissionChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
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

type ContractReceivedIterator struct {
	Event *ContractReceived

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractReceivedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractReceived)
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
		it.Event = new(ContractReceived)
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

func (it *ContractReceivedIterator) Error() error {
	return it.fail
}

func (it *ContractReceivedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractReceived struct {
	Sender common.Address
	Amount *big.Int
	Raw    types.Log
}

func (_Contract *ContractFilterer) FilterReceived(opts *bind.FilterOpts, sender []common.Address) (*ContractReceivedIterator, error) {

	var senderRule []interface{}
	for _, senderItem := range sender {
		senderRule = append(senderRule, senderItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "Received", senderRule)
	if err != nil {
		return nil, err
	}
	return &ContractReceivedIterator{contract: _Contract.contract, event: "Received", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchReceived(opts *bind.WatchOpts, sink chan<- *ContractReceived, sender []common.Address) (event.Subscription, error) {

	var senderRule []interface{}
	for _, senderItem := range sender {
		senderRule = append(senderRule, senderItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "Received", senderRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractReceived)
				if err := _Contract.contract.UnpackLog(event, "Received", log); err != nil {
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

func (_Contract *ContractFilterer) ParseReceived(log types.Log) (*ContractReceived, error) {
	event := new(ContractReceived)
	if err := _Contract.contract.UnpackLog(event, "Received", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractWithdrawnIterator struct {
	Event *ContractWithdrawn

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractWithdrawnIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractWithdrawn)
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
		it.Event = new(ContractWithdrawn)
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

func (it *ContractWithdrawnIterator) Error() error {
	return it.fail
}

func (it *ContractWithdrawnIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractWithdrawn struct {
	Pool     common.Address
	Treasury common.Address
	Rewards  *big.Int
	Fee      *big.Int
	Raw      types.Log
}

func (_Contract *ContractFilterer) FilterWithdrawn(opts *bind.FilterOpts, pool []common.Address, treasury []common.Address) (*ContractWithdrawnIterator, error) {

	var poolRule []interface{}
	for _, poolItem := range pool {
		poolRule = append(poolRule, poolItem)
	}
	var treasuryRule []interface{}
	for _, treasuryItem := range treasury {
		treasuryRule = append(treasuryRule, treasuryItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "Withdrawn", poolRule, treasuryRule)
	if err != nil {
		return nil, err
	}
	return &ContractWithdrawnIterator{contract: _Contract.contract, event: "Withdrawn", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchWithdrawn(opts *bind.WatchOpts, sink chan<- *ContractWithdrawn, pool []common.Address, treasury []common.Address) (event.Subscription, error) {

	var poolRule []interface{}
	for _, poolItem := range pool {
		poolRule = append(poolRule, poolItem)
	}
	var treasuryRule []interface{}
	for _, treasuryItem := range treasury {
		treasuryRule = append(treasuryRule, treasuryItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "Withdrawn", poolRule, treasuryRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractWithdrawn)
				if err := _Contract.contract.UnpackLog(event, "Withdrawn", log); err != nil {
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

func (_Contract *ContractFilterer) ParseWithdrawn(log types.Log) (*ContractWithdrawn, error) {
	event := new(ContractWithdrawn)
	if err := _Contract.contract.UnpackLog(event, "Withdrawn", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

func (_Contract *Contract) ParseLog(log types.Log) (generated.AbigenLog, error) {
	switch log.Topics[0] {
	case _Contract.abi.Events["CommissionChanged"].ID:
		return _Contract.ParseCommissionChanged(log)
	case _Contract.abi.Events["Initialized"].ID:
		return _Contract.ParseInitialized(log)
	case _Contract.abi.Events["Received"].ID:
		return _Contract.ParseReceived(log)
	case _Contract.abi.Events["Withdrawn"].ID:
		return _Contract.ParseWithdrawn(log)

	default:
		return nil, fmt.Errorf("abigen wrapper received unknown log topic: %v", log.Topics[0])
	}
}

func (ContractCommissionChanged) Topic() common.Hash {
	return common.HexToHash("0x07d1ecb0b6fd1c556347c57a4035549a933093e3e5a0a63418dd3589c82749de")
}

func (ContractInitialized) Topic() common.Hash {
	return common.HexToHash("0xc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d2")
}

func (ContractReceived) Topic() common.Hash {
	return common.HexToHash("0x88a5966d370b9919b20f3e2c13ff65706f196a4e32cc2c12bf57088f88525874")
}

func (ContractWithdrawn) Topic() common.Hash {
	return common.HexToHash("0x91fb9d98b786c57d74c099ccd2beca1739e9f6a81fb49001ca465c4b7591bbe2")
}

func (_Contract *Contract) Address() common.Address {
	return _Contract.address
}

type ContractInterface interface {
	MAXCOMMISSION(opts *bind.CallOpts) (uint16, error)

	Commission(opts *bind.CallOpts) (uint16, error)

	Config(opts *bind.CallOpts) (common.Address, error)

	GetRewards(opts *bind.CallOpts) (*big.Int, error)

	Initialize(opts *bind.TransactOpts, config common.Address, commission_ uint16) (*types.Transaction, error)

	SetCommission(opts *bind.TransactOpts, newValue uint16) (*types.Transaction, error)

	Withdraw(opts *bind.TransactOpts) (*types.Transaction, error)

	Receive(opts *bind.TransactOpts) (*types.Transaction, error)

	FilterCommissionChanged(opts *bind.FilterOpts) (*ContractCommissionChangedIterator, error)

	WatchCommissionChanged(opts *bind.WatchOpts, sink chan<- *ContractCommissionChanged) (event.Subscription, error)

	ParseCommissionChanged(log types.Log) (*ContractCommissionChanged, error)

	FilterInitialized(opts *bind.FilterOpts) (*ContractInitializedIterator, error)

	WatchInitialized(opts *bind.WatchOpts, sink chan<- *ContractInitialized) (event.Subscription, error)

	ParseInitialized(log types.Log) (*ContractInitialized, error)

	FilterReceived(opts *bind.FilterOpts, sender []common.Address) (*ContractReceivedIterator, error)

	WatchReceived(opts *bind.WatchOpts, sink chan<- *ContractReceived, sender []common.Address) (event.Subscription, error)

	ParseReceived(log types.Log) (*ContractReceived, error)

	FilterWithdrawn(opts *bind.FilterOpts, pool []common.Address, treasury []common.Address) (*ContractWithdrawnIterator, error)

	WatchWithdrawn(opts *bind.WatchOpts, sink chan<- *ContractWithdrawn, pool []common.Address, treasury []common.Address) (event.Subscription, error)

	ParseWithdrawn(log types.Log) (*ContractWithdrawn, error)

	ParseLog(log types.Log) (generated.AbigenLog, error)

	Address() common.Address
}
