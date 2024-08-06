// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package ISlasher

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

type ISlasherMiddlewareTimes struct {
	StalestUpdateBlock    uint32
	LatestServeUntilBlock uint32
}

var ContractMetaData = &bind.MetaData{
	ABI: "[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"previouslySlashedAddress\",\"type\":\"address\"}],\"name\":\"FrozenStatusReset\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"index\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint32\",\"name\":\"stalestUpdateBlock\",\"type\":\"uint32\"},{\"indexed\":false,\"internalType\":\"uint32\",\"name\":\"latestServeUntilBlock\",\"type\":\"uint32\"}],\"name\":\"MiddlewareTimesAdded\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"slashedOperator\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"slashingContract\",\"type\":\"address\"}],\"name\":\"OperatorFrozen\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"contractAddress\",\"type\":\"address\"}],\"name\":\"OptedIntoSlashing\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"contractAddress\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint32\",\"name\":\"contractCanSlashOperatorUntilBlock\",\"type\":\"uint32\"}],\"name\":\"SlashingAbilityRevoked\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"toBeSlashed\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"slashingContract\",\"type\":\"address\"}],\"name\":\"canSlash\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"internalType\":\"uint32\",\"name\":\"withdrawalStartBlock\",\"type\":\"uint32\"},{\"internalType\":\"uint256\",\"name\":\"middlewareTimesIndex\",\"type\":\"uint256\"}],\"name\":\"canWithdraw\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"serviceContract\",\"type\":\"address\"}],\"name\":\"contractCanSlashOperatorUntilBlock\",\"outputs\":[{\"internalType\":\"uint32\",\"name\":\"\",\"type\":\"uint32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"delegation\",\"outputs\":[{\"internalType\":\"contractIDelegationManager\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"toBeFrozen\",\"type\":\"address\"}],\"name\":\"freezeOperator\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"internalType\":\"uint32\",\"name\":\"updateBlock\",\"type\":\"uint32\"}],\"name\":\"getCorrectValueForInsertAfter\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"internalType\":\"uint32\",\"name\":\"index\",\"type\":\"uint32\"}],\"name\":\"getMiddlewareTimesIndexServeUntilBlock\",\"outputs\":[{\"internalType\":\"uint32\",\"name\":\"\",\"type\":\"uint32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"internalType\":\"uint32\",\"name\":\"index\",\"type\":\"uint32\"}],\"name\":\"getMiddlewareTimesIndexStalestUpdateBlock\",\"outputs\":[{\"internalType\":\"uint32\",\"name\":\"\",\"type\":\"uint32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"}],\"name\":\"isFrozen\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"serviceContract\",\"type\":\"address\"}],\"name\":\"latestUpdateBlock\",\"outputs\":[{\"internalType\":\"uint32\",\"name\":\"\",\"type\":\"uint32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"}],\"name\":\"middlewareTimesLength\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"arrayIndex\",\"type\":\"uint256\"}],\"name\":\"operatorToMiddlewareTimes\",\"outputs\":[{\"components\":[{\"internalType\":\"uint32\",\"name\":\"stalestUpdateBlock\",\"type\":\"uint32\"},{\"internalType\":\"uint32\",\"name\":\"latestServeUntilBlock\",\"type\":\"uint32\"}],\"internalType\":\"structISlasher.MiddlewareTimes\",\"name\":\"\",\"type\":\"tuple\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"node\",\"type\":\"address\"}],\"name\":\"operatorWhitelistedContractsLinkedListEntry\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"},{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"}],\"name\":\"operatorWhitelistedContractsLinkedListSize\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"contractAddress\",\"type\":\"address\"}],\"name\":\"optIntoSlashing\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"internalType\":\"uint32\",\"name\":\"serveUntilBlock\",\"type\":\"uint32\"}],\"name\":\"recordFirstStakeUpdate\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"internalType\":\"uint32\",\"name\":\"serveUntilBlock\",\"type\":\"uint32\"}],\"name\":\"recordLastStakeUpdateAndRevokeSlashingAbility\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"internalType\":\"uint32\",\"name\":\"updateBlock\",\"type\":\"uint32\"},{\"internalType\":\"uint32\",\"name\":\"serveUntilBlock\",\"type\":\"uint32\"},{\"internalType\":\"uint256\",\"name\":\"insertAfter\",\"type\":\"uint256\"}],\"name\":\"recordStakeUpdate\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address[]\",\"name\":\"frozenAddresses\",\"type\":\"address[]\"}],\"name\":\"resetFrozenStatus\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"strategyManager\",\"outputs\":[{\"internalType\":\"contractIStrategyManager\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"}]",
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

func (_Contract *ContractCaller) CanSlash(opts *bind.CallOpts, toBeSlashed common.Address, slashingContract common.Address) (bool, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "canSlash", toBeSlashed, slashingContract)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

func (_Contract *ContractSession) CanSlash(toBeSlashed common.Address, slashingContract common.Address) (bool, error) {
	return _Contract.Contract.CanSlash(&_Contract.CallOpts, toBeSlashed, slashingContract)
}

func (_Contract *ContractCallerSession) CanSlash(toBeSlashed common.Address, slashingContract common.Address) (bool, error) {
	return _Contract.Contract.CanSlash(&_Contract.CallOpts, toBeSlashed, slashingContract)
}

func (_Contract *ContractCaller) ContractCanSlashOperatorUntilBlock(opts *bind.CallOpts, operator common.Address, serviceContract common.Address) (uint32, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "contractCanSlashOperatorUntilBlock", operator, serviceContract)

	if err != nil {
		return *new(uint32), err
	}

	out0 := *abi.ConvertType(out[0], new(uint32)).(*uint32)

	return out0, err

}

func (_Contract *ContractSession) ContractCanSlashOperatorUntilBlock(operator common.Address, serviceContract common.Address) (uint32, error) {
	return _Contract.Contract.ContractCanSlashOperatorUntilBlock(&_Contract.CallOpts, operator, serviceContract)
}

func (_Contract *ContractCallerSession) ContractCanSlashOperatorUntilBlock(operator common.Address, serviceContract common.Address) (uint32, error) {
	return _Contract.Contract.ContractCanSlashOperatorUntilBlock(&_Contract.CallOpts, operator, serviceContract)
}

func (_Contract *ContractCaller) Delegation(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "delegation")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) Delegation() (common.Address, error) {
	return _Contract.Contract.Delegation(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) Delegation() (common.Address, error) {
	return _Contract.Contract.Delegation(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) GetCorrectValueForInsertAfter(opts *bind.CallOpts, operator common.Address, updateBlock uint32) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getCorrectValueForInsertAfter", operator, updateBlock)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) GetCorrectValueForInsertAfter(operator common.Address, updateBlock uint32) (*big.Int, error) {
	return _Contract.Contract.GetCorrectValueForInsertAfter(&_Contract.CallOpts, operator, updateBlock)
}

func (_Contract *ContractCallerSession) GetCorrectValueForInsertAfter(operator common.Address, updateBlock uint32) (*big.Int, error) {
	return _Contract.Contract.GetCorrectValueForInsertAfter(&_Contract.CallOpts, operator, updateBlock)
}

func (_Contract *ContractCaller) GetMiddlewareTimesIndexServeUntilBlock(opts *bind.CallOpts, operator common.Address, index uint32) (uint32, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getMiddlewareTimesIndexServeUntilBlock", operator, index)

	if err != nil {
		return *new(uint32), err
	}

	out0 := *abi.ConvertType(out[0], new(uint32)).(*uint32)

	return out0, err

}

func (_Contract *ContractSession) GetMiddlewareTimesIndexServeUntilBlock(operator common.Address, index uint32) (uint32, error) {
	return _Contract.Contract.GetMiddlewareTimesIndexServeUntilBlock(&_Contract.CallOpts, operator, index)
}

func (_Contract *ContractCallerSession) GetMiddlewareTimesIndexServeUntilBlock(operator common.Address, index uint32) (uint32, error) {
	return _Contract.Contract.GetMiddlewareTimesIndexServeUntilBlock(&_Contract.CallOpts, operator, index)
}

func (_Contract *ContractCaller) GetMiddlewareTimesIndexStalestUpdateBlock(opts *bind.CallOpts, operator common.Address, index uint32) (uint32, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getMiddlewareTimesIndexStalestUpdateBlock", operator, index)

	if err != nil {
		return *new(uint32), err
	}

	out0 := *abi.ConvertType(out[0], new(uint32)).(*uint32)

	return out0, err

}

func (_Contract *ContractSession) GetMiddlewareTimesIndexStalestUpdateBlock(operator common.Address, index uint32) (uint32, error) {
	return _Contract.Contract.GetMiddlewareTimesIndexStalestUpdateBlock(&_Contract.CallOpts, operator, index)
}

func (_Contract *ContractCallerSession) GetMiddlewareTimesIndexStalestUpdateBlock(operator common.Address, index uint32) (uint32, error) {
	return _Contract.Contract.GetMiddlewareTimesIndexStalestUpdateBlock(&_Contract.CallOpts, operator, index)
}

func (_Contract *ContractCaller) IsFrozen(opts *bind.CallOpts, staker common.Address) (bool, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "isFrozen", staker)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

func (_Contract *ContractSession) IsFrozen(staker common.Address) (bool, error) {
	return _Contract.Contract.IsFrozen(&_Contract.CallOpts, staker)
}

func (_Contract *ContractCallerSession) IsFrozen(staker common.Address) (bool, error) {
	return _Contract.Contract.IsFrozen(&_Contract.CallOpts, staker)
}

func (_Contract *ContractCaller) LatestUpdateBlock(opts *bind.CallOpts, operator common.Address, serviceContract common.Address) (uint32, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "latestUpdateBlock", operator, serviceContract)

	if err != nil {
		return *new(uint32), err
	}

	out0 := *abi.ConvertType(out[0], new(uint32)).(*uint32)

	return out0, err

}

func (_Contract *ContractSession) LatestUpdateBlock(operator common.Address, serviceContract common.Address) (uint32, error) {
	return _Contract.Contract.LatestUpdateBlock(&_Contract.CallOpts, operator, serviceContract)
}

func (_Contract *ContractCallerSession) LatestUpdateBlock(operator common.Address, serviceContract common.Address) (uint32, error) {
	return _Contract.Contract.LatestUpdateBlock(&_Contract.CallOpts, operator, serviceContract)
}

func (_Contract *ContractCaller) MiddlewareTimesLength(opts *bind.CallOpts, operator common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "middlewareTimesLength", operator)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) MiddlewareTimesLength(operator common.Address) (*big.Int, error) {
	return _Contract.Contract.MiddlewareTimesLength(&_Contract.CallOpts, operator)
}

func (_Contract *ContractCallerSession) MiddlewareTimesLength(operator common.Address) (*big.Int, error) {
	return _Contract.Contract.MiddlewareTimesLength(&_Contract.CallOpts, operator)
}

func (_Contract *ContractCaller) OperatorToMiddlewareTimes(opts *bind.CallOpts, operator common.Address, arrayIndex *big.Int) (ISlasherMiddlewareTimes, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "operatorToMiddlewareTimes", operator, arrayIndex)

	if err != nil {
		return *new(ISlasherMiddlewareTimes), err
	}

	out0 := *abi.ConvertType(out[0], new(ISlasherMiddlewareTimes)).(*ISlasherMiddlewareTimes)

	return out0, err

}

func (_Contract *ContractSession) OperatorToMiddlewareTimes(operator common.Address, arrayIndex *big.Int) (ISlasherMiddlewareTimes, error) {
	return _Contract.Contract.OperatorToMiddlewareTimes(&_Contract.CallOpts, operator, arrayIndex)
}

func (_Contract *ContractCallerSession) OperatorToMiddlewareTimes(operator common.Address, arrayIndex *big.Int) (ISlasherMiddlewareTimes, error) {
	return _Contract.Contract.OperatorToMiddlewareTimes(&_Contract.CallOpts, operator, arrayIndex)
}

func (_Contract *ContractCaller) OperatorWhitelistedContractsLinkedListEntry(opts *bind.CallOpts, operator common.Address, node common.Address) (bool, *big.Int, *big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "operatorWhitelistedContractsLinkedListEntry", operator, node)

	if err != nil {
		return *new(bool), *new(*big.Int), *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)
	out1 := *abi.ConvertType(out[1], new(*big.Int)).(**big.Int)
	out2 := *abi.ConvertType(out[2], new(*big.Int)).(**big.Int)

	return out0, out1, out2, err

}

func (_Contract *ContractSession) OperatorWhitelistedContractsLinkedListEntry(operator common.Address, node common.Address) (bool, *big.Int, *big.Int, error) {
	return _Contract.Contract.OperatorWhitelistedContractsLinkedListEntry(&_Contract.CallOpts, operator, node)
}

func (_Contract *ContractCallerSession) OperatorWhitelistedContractsLinkedListEntry(operator common.Address, node common.Address) (bool, *big.Int, *big.Int, error) {
	return _Contract.Contract.OperatorWhitelistedContractsLinkedListEntry(&_Contract.CallOpts, operator, node)
}

func (_Contract *ContractCaller) OperatorWhitelistedContractsLinkedListSize(opts *bind.CallOpts, operator common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "operatorWhitelistedContractsLinkedListSize", operator)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) OperatorWhitelistedContractsLinkedListSize(operator common.Address) (*big.Int, error) {
	return _Contract.Contract.OperatorWhitelistedContractsLinkedListSize(&_Contract.CallOpts, operator)
}

func (_Contract *ContractCallerSession) OperatorWhitelistedContractsLinkedListSize(operator common.Address) (*big.Int, error) {
	return _Contract.Contract.OperatorWhitelistedContractsLinkedListSize(&_Contract.CallOpts, operator)
}

func (_Contract *ContractCaller) StrategyManager(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "strategyManager")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) StrategyManager() (common.Address, error) {
	return _Contract.Contract.StrategyManager(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) StrategyManager() (common.Address, error) {
	return _Contract.Contract.StrategyManager(&_Contract.CallOpts)
}

func (_Contract *ContractTransactor) CanWithdraw(opts *bind.TransactOpts, operator common.Address, withdrawalStartBlock uint32, middlewareTimesIndex *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "canWithdraw", operator, withdrawalStartBlock, middlewareTimesIndex)
}

func (_Contract *ContractSession) CanWithdraw(operator common.Address, withdrawalStartBlock uint32, middlewareTimesIndex *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.CanWithdraw(&_Contract.TransactOpts, operator, withdrawalStartBlock, middlewareTimesIndex)
}

func (_Contract *ContractTransactorSession) CanWithdraw(operator common.Address, withdrawalStartBlock uint32, middlewareTimesIndex *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.CanWithdraw(&_Contract.TransactOpts, operator, withdrawalStartBlock, middlewareTimesIndex)
}

func (_Contract *ContractTransactor) FreezeOperator(opts *bind.TransactOpts, toBeFrozen common.Address) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "freezeOperator", toBeFrozen)
}

func (_Contract *ContractSession) FreezeOperator(toBeFrozen common.Address) (*types.Transaction, error) {
	return _Contract.Contract.FreezeOperator(&_Contract.TransactOpts, toBeFrozen)
}

func (_Contract *ContractTransactorSession) FreezeOperator(toBeFrozen common.Address) (*types.Transaction, error) {
	return _Contract.Contract.FreezeOperator(&_Contract.TransactOpts, toBeFrozen)
}

func (_Contract *ContractTransactor) OptIntoSlashing(opts *bind.TransactOpts, contractAddress common.Address) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "optIntoSlashing", contractAddress)
}

func (_Contract *ContractSession) OptIntoSlashing(contractAddress common.Address) (*types.Transaction, error) {
	return _Contract.Contract.OptIntoSlashing(&_Contract.TransactOpts, contractAddress)
}

func (_Contract *ContractTransactorSession) OptIntoSlashing(contractAddress common.Address) (*types.Transaction, error) {
	return _Contract.Contract.OptIntoSlashing(&_Contract.TransactOpts, contractAddress)
}

func (_Contract *ContractTransactor) RecordFirstStakeUpdate(opts *bind.TransactOpts, operator common.Address, serveUntilBlock uint32) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "recordFirstStakeUpdate", operator, serveUntilBlock)
}

func (_Contract *ContractSession) RecordFirstStakeUpdate(operator common.Address, serveUntilBlock uint32) (*types.Transaction, error) {
	return _Contract.Contract.RecordFirstStakeUpdate(&_Contract.TransactOpts, operator, serveUntilBlock)
}

func (_Contract *ContractTransactorSession) RecordFirstStakeUpdate(operator common.Address, serveUntilBlock uint32) (*types.Transaction, error) {
	return _Contract.Contract.RecordFirstStakeUpdate(&_Contract.TransactOpts, operator, serveUntilBlock)
}

func (_Contract *ContractTransactor) RecordLastStakeUpdateAndRevokeSlashingAbility(opts *bind.TransactOpts, operator common.Address, serveUntilBlock uint32) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "recordLastStakeUpdateAndRevokeSlashingAbility", operator, serveUntilBlock)
}

func (_Contract *ContractSession) RecordLastStakeUpdateAndRevokeSlashingAbility(operator common.Address, serveUntilBlock uint32) (*types.Transaction, error) {
	return _Contract.Contract.RecordLastStakeUpdateAndRevokeSlashingAbility(&_Contract.TransactOpts, operator, serveUntilBlock)
}

func (_Contract *ContractTransactorSession) RecordLastStakeUpdateAndRevokeSlashingAbility(operator common.Address, serveUntilBlock uint32) (*types.Transaction, error) {
	return _Contract.Contract.RecordLastStakeUpdateAndRevokeSlashingAbility(&_Contract.TransactOpts, operator, serveUntilBlock)
}

func (_Contract *ContractTransactor) RecordStakeUpdate(opts *bind.TransactOpts, operator common.Address, updateBlock uint32, serveUntilBlock uint32, insertAfter *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "recordStakeUpdate", operator, updateBlock, serveUntilBlock, insertAfter)
}

func (_Contract *ContractSession) RecordStakeUpdate(operator common.Address, updateBlock uint32, serveUntilBlock uint32, insertAfter *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.RecordStakeUpdate(&_Contract.TransactOpts, operator, updateBlock, serveUntilBlock, insertAfter)
}

func (_Contract *ContractTransactorSession) RecordStakeUpdate(operator common.Address, updateBlock uint32, serveUntilBlock uint32, insertAfter *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.RecordStakeUpdate(&_Contract.TransactOpts, operator, updateBlock, serveUntilBlock, insertAfter)
}

func (_Contract *ContractTransactor) ResetFrozenStatus(opts *bind.TransactOpts, frozenAddresses []common.Address) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "resetFrozenStatus", frozenAddresses)
}

func (_Contract *ContractSession) ResetFrozenStatus(frozenAddresses []common.Address) (*types.Transaction, error) {
	return _Contract.Contract.ResetFrozenStatus(&_Contract.TransactOpts, frozenAddresses)
}

func (_Contract *ContractTransactorSession) ResetFrozenStatus(frozenAddresses []common.Address) (*types.Transaction, error) {
	return _Contract.Contract.ResetFrozenStatus(&_Contract.TransactOpts, frozenAddresses)
}

type ContractFrozenStatusResetIterator struct {
	Event *ContractFrozenStatusReset

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractFrozenStatusResetIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractFrozenStatusReset)
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
		it.Event = new(ContractFrozenStatusReset)
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

func (it *ContractFrozenStatusResetIterator) Error() error {
	return it.fail
}

func (it *ContractFrozenStatusResetIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractFrozenStatusReset struct {
	PreviouslySlashedAddress common.Address
	Raw                      types.Log
}

func (_Contract *ContractFilterer) FilterFrozenStatusReset(opts *bind.FilterOpts, previouslySlashedAddress []common.Address) (*ContractFrozenStatusResetIterator, error) {

	var previouslySlashedAddressRule []interface{}
	for _, previouslySlashedAddressItem := range previouslySlashedAddress {
		previouslySlashedAddressRule = append(previouslySlashedAddressRule, previouslySlashedAddressItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "FrozenStatusReset", previouslySlashedAddressRule)
	if err != nil {
		return nil, err
	}
	return &ContractFrozenStatusResetIterator{contract: _Contract.contract, event: "FrozenStatusReset", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchFrozenStatusReset(opts *bind.WatchOpts, sink chan<- *ContractFrozenStatusReset, previouslySlashedAddress []common.Address) (event.Subscription, error) {

	var previouslySlashedAddressRule []interface{}
	for _, previouslySlashedAddressItem := range previouslySlashedAddress {
		previouslySlashedAddressRule = append(previouslySlashedAddressRule, previouslySlashedAddressItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "FrozenStatusReset", previouslySlashedAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractFrozenStatusReset)
				if err := _Contract.contract.UnpackLog(event, "FrozenStatusReset", log); err != nil {
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

func (_Contract *ContractFilterer) ParseFrozenStatusReset(log types.Log) (*ContractFrozenStatusReset, error) {
	event := new(ContractFrozenStatusReset)
	if err := _Contract.contract.UnpackLog(event, "FrozenStatusReset", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractMiddlewareTimesAddedIterator struct {
	Event *ContractMiddlewareTimesAdded

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractMiddlewareTimesAddedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractMiddlewareTimesAdded)
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
		it.Event = new(ContractMiddlewareTimesAdded)
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

func (it *ContractMiddlewareTimesAddedIterator) Error() error {
	return it.fail
}

func (it *ContractMiddlewareTimesAddedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractMiddlewareTimesAdded struct {
	Operator              common.Address
	Index                 *big.Int
	StalestUpdateBlock    uint32
	LatestServeUntilBlock uint32
	Raw                   types.Log
}

func (_Contract *ContractFilterer) FilterMiddlewareTimesAdded(opts *bind.FilterOpts) (*ContractMiddlewareTimesAddedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "MiddlewareTimesAdded")
	if err != nil {
		return nil, err
	}
	return &ContractMiddlewareTimesAddedIterator{contract: _Contract.contract, event: "MiddlewareTimesAdded", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchMiddlewareTimesAdded(opts *bind.WatchOpts, sink chan<- *ContractMiddlewareTimesAdded) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "MiddlewareTimesAdded")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractMiddlewareTimesAdded)
				if err := _Contract.contract.UnpackLog(event, "MiddlewareTimesAdded", log); err != nil {
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

func (_Contract *ContractFilterer) ParseMiddlewareTimesAdded(log types.Log) (*ContractMiddlewareTimesAdded, error) {
	event := new(ContractMiddlewareTimesAdded)
	if err := _Contract.contract.UnpackLog(event, "MiddlewareTimesAdded", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractOperatorFrozenIterator struct {
	Event *ContractOperatorFrozen

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractOperatorFrozenIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractOperatorFrozen)
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
		it.Event = new(ContractOperatorFrozen)
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

func (it *ContractOperatorFrozenIterator) Error() error {
	return it.fail
}

func (it *ContractOperatorFrozenIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractOperatorFrozen struct {
	SlashedOperator  common.Address
	SlashingContract common.Address
	Raw              types.Log
}

func (_Contract *ContractFilterer) FilterOperatorFrozen(opts *bind.FilterOpts, slashedOperator []common.Address, slashingContract []common.Address) (*ContractOperatorFrozenIterator, error) {

	var slashedOperatorRule []interface{}
	for _, slashedOperatorItem := range slashedOperator {
		slashedOperatorRule = append(slashedOperatorRule, slashedOperatorItem)
	}
	var slashingContractRule []interface{}
	for _, slashingContractItem := range slashingContract {
		slashingContractRule = append(slashingContractRule, slashingContractItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "OperatorFrozen", slashedOperatorRule, slashingContractRule)
	if err != nil {
		return nil, err
	}
	return &ContractOperatorFrozenIterator{contract: _Contract.contract, event: "OperatorFrozen", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchOperatorFrozen(opts *bind.WatchOpts, sink chan<- *ContractOperatorFrozen, slashedOperator []common.Address, slashingContract []common.Address) (event.Subscription, error) {

	var slashedOperatorRule []interface{}
	for _, slashedOperatorItem := range slashedOperator {
		slashedOperatorRule = append(slashedOperatorRule, slashedOperatorItem)
	}
	var slashingContractRule []interface{}
	for _, slashingContractItem := range slashingContract {
		slashingContractRule = append(slashingContractRule, slashingContractItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "OperatorFrozen", slashedOperatorRule, slashingContractRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractOperatorFrozen)
				if err := _Contract.contract.UnpackLog(event, "OperatorFrozen", log); err != nil {
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

func (_Contract *ContractFilterer) ParseOperatorFrozen(log types.Log) (*ContractOperatorFrozen, error) {
	event := new(ContractOperatorFrozen)
	if err := _Contract.contract.UnpackLog(event, "OperatorFrozen", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractOptedIntoSlashingIterator struct {
	Event *ContractOptedIntoSlashing

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractOptedIntoSlashingIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractOptedIntoSlashing)
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
		it.Event = new(ContractOptedIntoSlashing)
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

func (it *ContractOptedIntoSlashingIterator) Error() error {
	return it.fail
}

func (it *ContractOptedIntoSlashingIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractOptedIntoSlashing struct {
	Operator        common.Address
	ContractAddress common.Address
	Raw             types.Log
}

func (_Contract *ContractFilterer) FilterOptedIntoSlashing(opts *bind.FilterOpts, operator []common.Address, contractAddress []common.Address) (*ContractOptedIntoSlashingIterator, error) {

	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}
	var contractAddressRule []interface{}
	for _, contractAddressItem := range contractAddress {
		contractAddressRule = append(contractAddressRule, contractAddressItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "OptedIntoSlashing", operatorRule, contractAddressRule)
	if err != nil {
		return nil, err
	}
	return &ContractOptedIntoSlashingIterator{contract: _Contract.contract, event: "OptedIntoSlashing", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchOptedIntoSlashing(opts *bind.WatchOpts, sink chan<- *ContractOptedIntoSlashing, operator []common.Address, contractAddress []common.Address) (event.Subscription, error) {

	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}
	var contractAddressRule []interface{}
	for _, contractAddressItem := range contractAddress {
		contractAddressRule = append(contractAddressRule, contractAddressItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "OptedIntoSlashing", operatorRule, contractAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractOptedIntoSlashing)
				if err := _Contract.contract.UnpackLog(event, "OptedIntoSlashing", log); err != nil {
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

func (_Contract *ContractFilterer) ParseOptedIntoSlashing(log types.Log) (*ContractOptedIntoSlashing, error) {
	event := new(ContractOptedIntoSlashing)
	if err := _Contract.contract.UnpackLog(event, "OptedIntoSlashing", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractSlashingAbilityRevokedIterator struct {
	Event *ContractSlashingAbilityRevoked

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractSlashingAbilityRevokedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractSlashingAbilityRevoked)
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
		it.Event = new(ContractSlashingAbilityRevoked)
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

func (it *ContractSlashingAbilityRevokedIterator) Error() error {
	return it.fail
}

func (it *ContractSlashingAbilityRevokedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractSlashingAbilityRevoked struct {
	Operator                           common.Address
	ContractAddress                    common.Address
	ContractCanSlashOperatorUntilBlock uint32
	Raw                                types.Log
}

func (_Contract *ContractFilterer) FilterSlashingAbilityRevoked(opts *bind.FilterOpts, operator []common.Address, contractAddress []common.Address) (*ContractSlashingAbilityRevokedIterator, error) {

	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}
	var contractAddressRule []interface{}
	for _, contractAddressItem := range contractAddress {
		contractAddressRule = append(contractAddressRule, contractAddressItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "SlashingAbilityRevoked", operatorRule, contractAddressRule)
	if err != nil {
		return nil, err
	}
	return &ContractSlashingAbilityRevokedIterator{contract: _Contract.contract, event: "SlashingAbilityRevoked", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchSlashingAbilityRevoked(opts *bind.WatchOpts, sink chan<- *ContractSlashingAbilityRevoked, operator []common.Address, contractAddress []common.Address) (event.Subscription, error) {

	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}
	var contractAddressRule []interface{}
	for _, contractAddressItem := range contractAddress {
		contractAddressRule = append(contractAddressRule, contractAddressItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "SlashingAbilityRevoked", operatorRule, contractAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractSlashingAbilityRevoked)
				if err := _Contract.contract.UnpackLog(event, "SlashingAbilityRevoked", log); err != nil {
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

func (_Contract *ContractFilterer) ParseSlashingAbilityRevoked(log types.Log) (*ContractSlashingAbilityRevoked, error) {
	event := new(ContractSlashingAbilityRevoked)
	if err := _Contract.contract.UnpackLog(event, "SlashingAbilityRevoked", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

func (_Contract *Contract) ParseLog(log types.Log) (generated.AbigenLog, error) {
	switch log.Topics[0] {
	case _Contract.abi.Events["FrozenStatusReset"].ID:
		return _Contract.ParseFrozenStatusReset(log)
	case _Contract.abi.Events["MiddlewareTimesAdded"].ID:
		return _Contract.ParseMiddlewareTimesAdded(log)
	case _Contract.abi.Events["OperatorFrozen"].ID:
		return _Contract.ParseOperatorFrozen(log)
	case _Contract.abi.Events["OptedIntoSlashing"].ID:
		return _Contract.ParseOptedIntoSlashing(log)
	case _Contract.abi.Events["SlashingAbilityRevoked"].ID:
		return _Contract.ParseSlashingAbilityRevoked(log)

	default:
		return nil, fmt.Errorf("abigen wrapper received unknown log topic: %v", log.Topics[0])
	}
}

func (ContractFrozenStatusReset) Topic() common.Hash {
	return common.HexToHash("0xd4cef0af27800d466fcacd85779857378b85cb61569005ff1464fa6e5ced69d8")
}

func (ContractMiddlewareTimesAdded) Topic() common.Hash {
	return common.HexToHash("0x1b62ba64c72d01e41a2b8c46e6aeeff728ef3a4438cf1cac3d92ee12189d5649")
}

func (ContractOperatorFrozen) Topic() common.Hash {
	return common.HexToHash("0x444a84f512816ae7be8ed8a66aa88e362eb54d0988e83acc9d81746622b3ba51")
}

func (ContractOptedIntoSlashing) Topic() common.Hash {
	return common.HexToHash("0xefa9fb38e813d53c15edf501e03852843a3fed691960523391d71a092b3627d8")
}

func (ContractSlashingAbilityRevoked) Topic() common.Hash {
	return common.HexToHash("0x9aa1b1391f35c672ed1f3b7ece632f4513e618366bef7a2f67b7c6bc1f2d2b14")
}

func (_Contract *Contract) Address() common.Address {
	return _Contract.address
}

type ContractInterface interface {
	CanSlash(opts *bind.CallOpts, toBeSlashed common.Address, slashingContract common.Address) (bool, error)

	ContractCanSlashOperatorUntilBlock(opts *bind.CallOpts, operator common.Address, serviceContract common.Address) (uint32, error)

	Delegation(opts *bind.CallOpts) (common.Address, error)

	GetCorrectValueForInsertAfter(opts *bind.CallOpts, operator common.Address, updateBlock uint32) (*big.Int, error)

	GetMiddlewareTimesIndexServeUntilBlock(opts *bind.CallOpts, operator common.Address, index uint32) (uint32, error)

	GetMiddlewareTimesIndexStalestUpdateBlock(opts *bind.CallOpts, operator common.Address, index uint32) (uint32, error)

	IsFrozen(opts *bind.CallOpts, staker common.Address) (bool, error)

	LatestUpdateBlock(opts *bind.CallOpts, operator common.Address, serviceContract common.Address) (uint32, error)

	MiddlewareTimesLength(opts *bind.CallOpts, operator common.Address) (*big.Int, error)

	OperatorToMiddlewareTimes(opts *bind.CallOpts, operator common.Address, arrayIndex *big.Int) (ISlasherMiddlewareTimes, error)

	OperatorWhitelistedContractsLinkedListEntry(opts *bind.CallOpts, operator common.Address, node common.Address) (bool, *big.Int, *big.Int, error)

	OperatorWhitelistedContractsLinkedListSize(opts *bind.CallOpts, operator common.Address) (*big.Int, error)

	StrategyManager(opts *bind.CallOpts) (common.Address, error)

	CanWithdraw(opts *bind.TransactOpts, operator common.Address, withdrawalStartBlock uint32, middlewareTimesIndex *big.Int) (*types.Transaction, error)

	FreezeOperator(opts *bind.TransactOpts, toBeFrozen common.Address) (*types.Transaction, error)

	OptIntoSlashing(opts *bind.TransactOpts, contractAddress common.Address) (*types.Transaction, error)

	RecordFirstStakeUpdate(opts *bind.TransactOpts, operator common.Address, serveUntilBlock uint32) (*types.Transaction, error)

	RecordLastStakeUpdateAndRevokeSlashingAbility(opts *bind.TransactOpts, operator common.Address, serveUntilBlock uint32) (*types.Transaction, error)

	RecordStakeUpdate(opts *bind.TransactOpts, operator common.Address, updateBlock uint32, serveUntilBlock uint32, insertAfter *big.Int) (*types.Transaction, error)

	ResetFrozenStatus(opts *bind.TransactOpts, frozenAddresses []common.Address) (*types.Transaction, error)

	FilterFrozenStatusReset(opts *bind.FilterOpts, previouslySlashedAddress []common.Address) (*ContractFrozenStatusResetIterator, error)

	WatchFrozenStatusReset(opts *bind.WatchOpts, sink chan<- *ContractFrozenStatusReset, previouslySlashedAddress []common.Address) (event.Subscription, error)

	ParseFrozenStatusReset(log types.Log) (*ContractFrozenStatusReset, error)

	FilterMiddlewareTimesAdded(opts *bind.FilterOpts) (*ContractMiddlewareTimesAddedIterator, error)

	WatchMiddlewareTimesAdded(opts *bind.WatchOpts, sink chan<- *ContractMiddlewareTimesAdded) (event.Subscription, error)

	ParseMiddlewareTimesAdded(log types.Log) (*ContractMiddlewareTimesAdded, error)

	FilterOperatorFrozen(opts *bind.FilterOpts, slashedOperator []common.Address, slashingContract []common.Address) (*ContractOperatorFrozenIterator, error)

	WatchOperatorFrozen(opts *bind.WatchOpts, sink chan<- *ContractOperatorFrozen, slashedOperator []common.Address, slashingContract []common.Address) (event.Subscription, error)

	ParseOperatorFrozen(log types.Log) (*ContractOperatorFrozen, error)

	FilterOptedIntoSlashing(opts *bind.FilterOpts, operator []common.Address, contractAddress []common.Address) (*ContractOptedIntoSlashingIterator, error)

	WatchOptedIntoSlashing(opts *bind.WatchOpts, sink chan<- *ContractOptedIntoSlashing, operator []common.Address, contractAddress []common.Address) (event.Subscription, error)

	ParseOptedIntoSlashing(log types.Log) (*ContractOptedIntoSlashing, error)

	FilterSlashingAbilityRevoked(opts *bind.FilterOpts, operator []common.Address, contractAddress []common.Address) (*ContractSlashingAbilityRevokedIterator, error)

	WatchSlashingAbilityRevoked(opts *bind.WatchOpts, sink chan<- *ContractSlashingAbilityRevoked, operator []common.Address, contractAddress []common.Address) (event.Subscription, error)

	ParseSlashingAbilityRevoked(log types.Log) (*ContractSlashingAbilityRevoked, error)

	ParseLog(log types.Log) (generated.AbigenLog, error)

	Address() common.Address
}
