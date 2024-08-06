// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package IStrategyManager

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

type IStrategyManagerDeprecatedStructQueuedWithdrawal struct {
	Strategies           []common.Address
	Shares               []*big.Int
	Staker               common.Address
	WithdrawerAndNonce   IStrategyManagerDeprecatedStructWithdrawerAndNonce
	WithdrawalStartBlock uint32
	DelegatedAddress     common.Address
}

type IStrategyManagerDeprecatedStructWithdrawerAndNonce struct {
	Withdrawer common.Address
	Nonce      *big.Int
}

var ContractMetaData = &bind.MetaData{
	ABI: "[{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"contractIERC20\",\"name\":\"token\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"contractIStrategy\",\"name\":\"strategy\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"}],\"name\":\"Deposit\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"contractIStrategy\",\"name\":\"strategy\",\"type\":\"address\"}],\"name\":\"StrategyAddedToDepositWhitelist\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"contractIStrategy\",\"name\":\"strategy\",\"type\":\"address\"}],\"name\":\"StrategyRemovedFromDepositWhitelist\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"previousAddress\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"newAddress\",\"type\":\"address\"}],\"name\":\"StrategyWhitelisterChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"contractIStrategy\",\"name\":\"strategy\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"bool\",\"name\":\"value\",\"type\":\"bool\"}],\"name\":\"UpdatedThirdPartyTransfersForbidden\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"internalType\":\"contractIERC20\",\"name\":\"token\",\"type\":\"address\"},{\"internalType\":\"contractIStrategy\",\"name\":\"strategy\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"}],\"name\":\"addShares\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"contractIStrategy[]\",\"name\":\"strategiesToWhitelist\",\"type\":\"address[]\"},{\"internalType\":\"bool[]\",\"name\":\"thirdPartyTransfersForbiddenValues\",\"type\":\"bool[]\"}],\"name\":\"addStrategiesToDepositWhitelist\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"components\":[{\"internalType\":\"contractIStrategy[]\",\"name\":\"strategies\",\"type\":\"address[]\"},{\"internalType\":\"uint256[]\",\"name\":\"shares\",\"type\":\"uint256[]\"},{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"components\":[{\"internalType\":\"address\",\"name\":\"withdrawer\",\"type\":\"address\"},{\"internalType\":\"uint96\",\"name\":\"nonce\",\"type\":\"uint96\"}],\"internalType\":\"structIStrategyManager.DeprecatedStruct_WithdrawerAndNonce\",\"name\":\"withdrawerAndNonce\",\"type\":\"tuple\"},{\"internalType\":\"uint32\",\"name\":\"withdrawalStartBlock\",\"type\":\"uint32\"},{\"internalType\":\"address\",\"name\":\"delegatedAddress\",\"type\":\"address\"}],\"internalType\":\"structIStrategyManager.DeprecatedStruct_QueuedWithdrawal\",\"name\":\"queuedWithdrawal\",\"type\":\"tuple\"}],\"name\":\"calculateWithdrawalRoot\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"pure\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"delegation\",\"outputs\":[{\"internalType\":\"contractIDelegationManager\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"contractIStrategy\",\"name\":\"strategy\",\"type\":\"address\"},{\"internalType\":\"contractIERC20\",\"name\":\"token\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"depositIntoStrategy\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"contractIStrategy\",\"name\":\"strategy\",\"type\":\"address\"},{\"internalType\":\"contractIERC20\",\"name\":\"token\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"expiry\",\"type\":\"uint256\"},{\"internalType\":\"bytes\",\"name\":\"signature\",\"type\":\"bytes\"}],\"name\":\"depositIntoStrategyWithSignature\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"eigenPodManager\",\"outputs\":[{\"internalType\":\"contractIEigenPodManager\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"}],\"name\":\"getDeposits\",\"outputs\":[{\"internalType\":\"contractIStrategy[]\",\"name\":\"\",\"type\":\"address[]\"},{\"internalType\":\"uint256[]\",\"name\":\"\",\"type\":\"uint256[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"components\":[{\"internalType\":\"contractIStrategy[]\",\"name\":\"strategies\",\"type\":\"address[]\"},{\"internalType\":\"uint256[]\",\"name\":\"shares\",\"type\":\"uint256[]\"},{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"components\":[{\"internalType\":\"address\",\"name\":\"withdrawer\",\"type\":\"address\"},{\"internalType\":\"uint96\",\"name\":\"nonce\",\"type\":\"uint96\"}],\"internalType\":\"structIStrategyManager.DeprecatedStruct_WithdrawerAndNonce\",\"name\":\"withdrawerAndNonce\",\"type\":\"tuple\"},{\"internalType\":\"uint32\",\"name\":\"withdrawalStartBlock\",\"type\":\"uint32\"},{\"internalType\":\"address\",\"name\":\"delegatedAddress\",\"type\":\"address\"}],\"internalType\":\"structIStrategyManager.DeprecatedStruct_QueuedWithdrawal\",\"name\":\"queuedWithdrawal\",\"type\":\"tuple\"}],\"name\":\"migrateQueuedWithdrawal\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"},{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"internalType\":\"contractIStrategy\",\"name\":\"strategy\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"}],\"name\":\"removeShares\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"contractIStrategy[]\",\"name\":\"strategiesToRemoveFromWhitelist\",\"type\":\"address[]\"}],\"name\":\"removeStrategiesFromDepositWhitelist\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"slasher\",\"outputs\":[{\"internalType\":\"contractISlasher\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"}],\"name\":\"stakerStrategyListLength\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"user\",\"type\":\"address\"},{\"internalType\":\"contractIStrategy\",\"name\":\"strategy\",\"type\":\"address\"}],\"name\":\"stakerStrategyShares\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"strategyWhitelister\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"contractIStrategy\",\"name\":\"strategy\",\"type\":\"address\"}],\"name\":\"thirdPartyTransfersForbidden\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"recipient\",\"type\":\"address\"},{\"internalType\":\"contractIStrategy\",\"name\":\"strategy\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"},{\"internalType\":\"contractIERC20\",\"name\":\"token\",\"type\":\"address\"}],\"name\":\"withdrawSharesAsTokens\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]",
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

func (_Contract *ContractCaller) CalculateWithdrawalRoot(opts *bind.CallOpts, queuedWithdrawal IStrategyManagerDeprecatedStructQueuedWithdrawal) ([32]byte, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "calculateWithdrawalRoot", queuedWithdrawal)

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

func (_Contract *ContractSession) CalculateWithdrawalRoot(queuedWithdrawal IStrategyManagerDeprecatedStructQueuedWithdrawal) ([32]byte, error) {
	return _Contract.Contract.CalculateWithdrawalRoot(&_Contract.CallOpts, queuedWithdrawal)
}

func (_Contract *ContractCallerSession) CalculateWithdrawalRoot(queuedWithdrawal IStrategyManagerDeprecatedStructQueuedWithdrawal) ([32]byte, error) {
	return _Contract.Contract.CalculateWithdrawalRoot(&_Contract.CallOpts, queuedWithdrawal)
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

func (_Contract *ContractCaller) EigenPodManager(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "eigenPodManager")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) EigenPodManager() (common.Address, error) {
	return _Contract.Contract.EigenPodManager(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) EigenPodManager() (common.Address, error) {
	return _Contract.Contract.EigenPodManager(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) GetDeposits(opts *bind.CallOpts, staker common.Address) ([]common.Address, []*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getDeposits", staker)

	if err != nil {
		return *new([]common.Address), *new([]*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new([]common.Address)).(*[]common.Address)
	out1 := *abi.ConvertType(out[1], new([]*big.Int)).(*[]*big.Int)

	return out0, out1, err

}

func (_Contract *ContractSession) GetDeposits(staker common.Address) ([]common.Address, []*big.Int, error) {
	return _Contract.Contract.GetDeposits(&_Contract.CallOpts, staker)
}

func (_Contract *ContractCallerSession) GetDeposits(staker common.Address) ([]common.Address, []*big.Int, error) {
	return _Contract.Contract.GetDeposits(&_Contract.CallOpts, staker)
}

func (_Contract *ContractCaller) Slasher(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "slasher")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) Slasher() (common.Address, error) {
	return _Contract.Contract.Slasher(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) Slasher() (common.Address, error) {
	return _Contract.Contract.Slasher(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) StakerStrategyListLength(opts *bind.CallOpts, staker common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "stakerStrategyListLength", staker)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) StakerStrategyListLength(staker common.Address) (*big.Int, error) {
	return _Contract.Contract.StakerStrategyListLength(&_Contract.CallOpts, staker)
}

func (_Contract *ContractCallerSession) StakerStrategyListLength(staker common.Address) (*big.Int, error) {
	return _Contract.Contract.StakerStrategyListLength(&_Contract.CallOpts, staker)
}

func (_Contract *ContractCaller) StakerStrategyShares(opts *bind.CallOpts, user common.Address, strategy common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "stakerStrategyShares", user, strategy)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) StakerStrategyShares(user common.Address, strategy common.Address) (*big.Int, error) {
	return _Contract.Contract.StakerStrategyShares(&_Contract.CallOpts, user, strategy)
}

func (_Contract *ContractCallerSession) StakerStrategyShares(user common.Address, strategy common.Address) (*big.Int, error) {
	return _Contract.Contract.StakerStrategyShares(&_Contract.CallOpts, user, strategy)
}

func (_Contract *ContractCaller) StrategyWhitelister(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "strategyWhitelister")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) StrategyWhitelister() (common.Address, error) {
	return _Contract.Contract.StrategyWhitelister(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) StrategyWhitelister() (common.Address, error) {
	return _Contract.Contract.StrategyWhitelister(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) ThirdPartyTransfersForbidden(opts *bind.CallOpts, strategy common.Address) (bool, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "thirdPartyTransfersForbidden", strategy)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

func (_Contract *ContractSession) ThirdPartyTransfersForbidden(strategy common.Address) (bool, error) {
	return _Contract.Contract.ThirdPartyTransfersForbidden(&_Contract.CallOpts, strategy)
}

func (_Contract *ContractCallerSession) ThirdPartyTransfersForbidden(strategy common.Address) (bool, error) {
	return _Contract.Contract.ThirdPartyTransfersForbidden(&_Contract.CallOpts, strategy)
}

func (_Contract *ContractTransactor) AddShares(opts *bind.TransactOpts, staker common.Address, token common.Address, strategy common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "addShares", staker, token, strategy, shares)
}

func (_Contract *ContractSession) AddShares(staker common.Address, token common.Address, strategy common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.AddShares(&_Contract.TransactOpts, staker, token, strategy, shares)
}

func (_Contract *ContractTransactorSession) AddShares(staker common.Address, token common.Address, strategy common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.AddShares(&_Contract.TransactOpts, staker, token, strategy, shares)
}

func (_Contract *ContractTransactor) AddStrategiesToDepositWhitelist(opts *bind.TransactOpts, strategiesToWhitelist []common.Address, thirdPartyTransfersForbiddenValues []bool) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "addStrategiesToDepositWhitelist", strategiesToWhitelist, thirdPartyTransfersForbiddenValues)
}

func (_Contract *ContractSession) AddStrategiesToDepositWhitelist(strategiesToWhitelist []common.Address, thirdPartyTransfersForbiddenValues []bool) (*types.Transaction, error) {
	return _Contract.Contract.AddStrategiesToDepositWhitelist(&_Contract.TransactOpts, strategiesToWhitelist, thirdPartyTransfersForbiddenValues)
}

func (_Contract *ContractTransactorSession) AddStrategiesToDepositWhitelist(strategiesToWhitelist []common.Address, thirdPartyTransfersForbiddenValues []bool) (*types.Transaction, error) {
	return _Contract.Contract.AddStrategiesToDepositWhitelist(&_Contract.TransactOpts, strategiesToWhitelist, thirdPartyTransfersForbiddenValues)
}

func (_Contract *ContractTransactor) DepositIntoStrategy(opts *bind.TransactOpts, strategy common.Address, token common.Address, amount *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "depositIntoStrategy", strategy, token, amount)
}

func (_Contract *ContractSession) DepositIntoStrategy(strategy common.Address, token common.Address, amount *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.DepositIntoStrategy(&_Contract.TransactOpts, strategy, token, amount)
}

func (_Contract *ContractTransactorSession) DepositIntoStrategy(strategy common.Address, token common.Address, amount *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.DepositIntoStrategy(&_Contract.TransactOpts, strategy, token, amount)
}

func (_Contract *ContractTransactor) DepositIntoStrategyWithSignature(opts *bind.TransactOpts, strategy common.Address, token common.Address, amount *big.Int, staker common.Address, expiry *big.Int, signature []byte) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "depositIntoStrategyWithSignature", strategy, token, amount, staker, expiry, signature)
}

func (_Contract *ContractSession) DepositIntoStrategyWithSignature(strategy common.Address, token common.Address, amount *big.Int, staker common.Address, expiry *big.Int, signature []byte) (*types.Transaction, error) {
	return _Contract.Contract.DepositIntoStrategyWithSignature(&_Contract.TransactOpts, strategy, token, amount, staker, expiry, signature)
}

func (_Contract *ContractTransactorSession) DepositIntoStrategyWithSignature(strategy common.Address, token common.Address, amount *big.Int, staker common.Address, expiry *big.Int, signature []byte) (*types.Transaction, error) {
	return _Contract.Contract.DepositIntoStrategyWithSignature(&_Contract.TransactOpts, strategy, token, amount, staker, expiry, signature)
}

func (_Contract *ContractTransactor) MigrateQueuedWithdrawal(opts *bind.TransactOpts, queuedWithdrawal IStrategyManagerDeprecatedStructQueuedWithdrawal) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "migrateQueuedWithdrawal", queuedWithdrawal)
}

func (_Contract *ContractSession) MigrateQueuedWithdrawal(queuedWithdrawal IStrategyManagerDeprecatedStructQueuedWithdrawal) (*types.Transaction, error) {
	return _Contract.Contract.MigrateQueuedWithdrawal(&_Contract.TransactOpts, queuedWithdrawal)
}

func (_Contract *ContractTransactorSession) MigrateQueuedWithdrawal(queuedWithdrawal IStrategyManagerDeprecatedStructQueuedWithdrawal) (*types.Transaction, error) {
	return _Contract.Contract.MigrateQueuedWithdrawal(&_Contract.TransactOpts, queuedWithdrawal)
}

func (_Contract *ContractTransactor) RemoveShares(opts *bind.TransactOpts, staker common.Address, strategy common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "removeShares", staker, strategy, shares)
}

func (_Contract *ContractSession) RemoveShares(staker common.Address, strategy common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.RemoveShares(&_Contract.TransactOpts, staker, strategy, shares)
}

func (_Contract *ContractTransactorSession) RemoveShares(staker common.Address, strategy common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.RemoveShares(&_Contract.TransactOpts, staker, strategy, shares)
}

func (_Contract *ContractTransactor) RemoveStrategiesFromDepositWhitelist(opts *bind.TransactOpts, strategiesToRemoveFromWhitelist []common.Address) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "removeStrategiesFromDepositWhitelist", strategiesToRemoveFromWhitelist)
}

func (_Contract *ContractSession) RemoveStrategiesFromDepositWhitelist(strategiesToRemoveFromWhitelist []common.Address) (*types.Transaction, error) {
	return _Contract.Contract.RemoveStrategiesFromDepositWhitelist(&_Contract.TransactOpts, strategiesToRemoveFromWhitelist)
}

func (_Contract *ContractTransactorSession) RemoveStrategiesFromDepositWhitelist(strategiesToRemoveFromWhitelist []common.Address) (*types.Transaction, error) {
	return _Contract.Contract.RemoveStrategiesFromDepositWhitelist(&_Contract.TransactOpts, strategiesToRemoveFromWhitelist)
}

func (_Contract *ContractTransactor) WithdrawSharesAsTokens(opts *bind.TransactOpts, recipient common.Address, strategy common.Address, shares *big.Int, token common.Address) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "withdrawSharesAsTokens", recipient, strategy, shares, token)
}

func (_Contract *ContractSession) WithdrawSharesAsTokens(recipient common.Address, strategy common.Address, shares *big.Int, token common.Address) (*types.Transaction, error) {
	return _Contract.Contract.WithdrawSharesAsTokens(&_Contract.TransactOpts, recipient, strategy, shares, token)
}

func (_Contract *ContractTransactorSession) WithdrawSharesAsTokens(recipient common.Address, strategy common.Address, shares *big.Int, token common.Address) (*types.Transaction, error) {
	return _Contract.Contract.WithdrawSharesAsTokens(&_Contract.TransactOpts, recipient, strategy, shares, token)
}

type ContractDepositIterator struct {
	Event *ContractDeposit

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractDepositIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractDeposit)
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
		it.Event = new(ContractDeposit)
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

func (it *ContractDepositIterator) Error() error {
	return it.fail
}

func (it *ContractDepositIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractDeposit struct {
	Staker   common.Address
	Token    common.Address
	Strategy common.Address
	Shares   *big.Int
	Raw      types.Log
}

func (_Contract *ContractFilterer) FilterDeposit(opts *bind.FilterOpts) (*ContractDepositIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "Deposit")
	if err != nil {
		return nil, err
	}
	return &ContractDepositIterator{contract: _Contract.contract, event: "Deposit", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchDeposit(opts *bind.WatchOpts, sink chan<- *ContractDeposit) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "Deposit")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractDeposit)
				if err := _Contract.contract.UnpackLog(event, "Deposit", log); err != nil {
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

func (_Contract *ContractFilterer) ParseDeposit(log types.Log) (*ContractDeposit, error) {
	event := new(ContractDeposit)
	if err := _Contract.contract.UnpackLog(event, "Deposit", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractStrategyAddedToDepositWhitelistIterator struct {
	Event *ContractStrategyAddedToDepositWhitelist

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractStrategyAddedToDepositWhitelistIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractStrategyAddedToDepositWhitelist)
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
		it.Event = new(ContractStrategyAddedToDepositWhitelist)
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

func (it *ContractStrategyAddedToDepositWhitelistIterator) Error() error {
	return it.fail
}

func (it *ContractStrategyAddedToDepositWhitelistIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractStrategyAddedToDepositWhitelist struct {
	Strategy common.Address
	Raw      types.Log
}

func (_Contract *ContractFilterer) FilterStrategyAddedToDepositWhitelist(opts *bind.FilterOpts) (*ContractStrategyAddedToDepositWhitelistIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "StrategyAddedToDepositWhitelist")
	if err != nil {
		return nil, err
	}
	return &ContractStrategyAddedToDepositWhitelistIterator{contract: _Contract.contract, event: "StrategyAddedToDepositWhitelist", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchStrategyAddedToDepositWhitelist(opts *bind.WatchOpts, sink chan<- *ContractStrategyAddedToDepositWhitelist) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "StrategyAddedToDepositWhitelist")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractStrategyAddedToDepositWhitelist)
				if err := _Contract.contract.UnpackLog(event, "StrategyAddedToDepositWhitelist", log); err != nil {
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

func (_Contract *ContractFilterer) ParseStrategyAddedToDepositWhitelist(log types.Log) (*ContractStrategyAddedToDepositWhitelist, error) {
	event := new(ContractStrategyAddedToDepositWhitelist)
	if err := _Contract.contract.UnpackLog(event, "StrategyAddedToDepositWhitelist", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractStrategyRemovedFromDepositWhitelistIterator struct {
	Event *ContractStrategyRemovedFromDepositWhitelist

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractStrategyRemovedFromDepositWhitelistIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractStrategyRemovedFromDepositWhitelist)
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
		it.Event = new(ContractStrategyRemovedFromDepositWhitelist)
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

func (it *ContractStrategyRemovedFromDepositWhitelistIterator) Error() error {
	return it.fail
}

func (it *ContractStrategyRemovedFromDepositWhitelistIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractStrategyRemovedFromDepositWhitelist struct {
	Strategy common.Address
	Raw      types.Log
}

func (_Contract *ContractFilterer) FilterStrategyRemovedFromDepositWhitelist(opts *bind.FilterOpts) (*ContractStrategyRemovedFromDepositWhitelistIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "StrategyRemovedFromDepositWhitelist")
	if err != nil {
		return nil, err
	}
	return &ContractStrategyRemovedFromDepositWhitelistIterator{contract: _Contract.contract, event: "StrategyRemovedFromDepositWhitelist", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchStrategyRemovedFromDepositWhitelist(opts *bind.WatchOpts, sink chan<- *ContractStrategyRemovedFromDepositWhitelist) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "StrategyRemovedFromDepositWhitelist")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractStrategyRemovedFromDepositWhitelist)
				if err := _Contract.contract.UnpackLog(event, "StrategyRemovedFromDepositWhitelist", log); err != nil {
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

func (_Contract *ContractFilterer) ParseStrategyRemovedFromDepositWhitelist(log types.Log) (*ContractStrategyRemovedFromDepositWhitelist, error) {
	event := new(ContractStrategyRemovedFromDepositWhitelist)
	if err := _Contract.contract.UnpackLog(event, "StrategyRemovedFromDepositWhitelist", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractStrategyWhitelisterChangedIterator struct {
	Event *ContractStrategyWhitelisterChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractStrategyWhitelisterChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractStrategyWhitelisterChanged)
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
		it.Event = new(ContractStrategyWhitelisterChanged)
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

func (it *ContractStrategyWhitelisterChangedIterator) Error() error {
	return it.fail
}

func (it *ContractStrategyWhitelisterChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractStrategyWhitelisterChanged struct {
	PreviousAddress common.Address
	NewAddress      common.Address
	Raw             types.Log
}

func (_Contract *ContractFilterer) FilterStrategyWhitelisterChanged(opts *bind.FilterOpts) (*ContractStrategyWhitelisterChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "StrategyWhitelisterChanged")
	if err != nil {
		return nil, err
	}
	return &ContractStrategyWhitelisterChangedIterator{contract: _Contract.contract, event: "StrategyWhitelisterChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchStrategyWhitelisterChanged(opts *bind.WatchOpts, sink chan<- *ContractStrategyWhitelisterChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "StrategyWhitelisterChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractStrategyWhitelisterChanged)
				if err := _Contract.contract.UnpackLog(event, "StrategyWhitelisterChanged", log); err != nil {
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

func (_Contract *ContractFilterer) ParseStrategyWhitelisterChanged(log types.Log) (*ContractStrategyWhitelisterChanged, error) {
	event := new(ContractStrategyWhitelisterChanged)
	if err := _Contract.contract.UnpackLog(event, "StrategyWhitelisterChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractUpdatedThirdPartyTransfersForbiddenIterator struct {
	Event *ContractUpdatedThirdPartyTransfersForbidden

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractUpdatedThirdPartyTransfersForbiddenIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractUpdatedThirdPartyTransfersForbidden)
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
		it.Event = new(ContractUpdatedThirdPartyTransfersForbidden)
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

func (it *ContractUpdatedThirdPartyTransfersForbiddenIterator) Error() error {
	return it.fail
}

func (it *ContractUpdatedThirdPartyTransfersForbiddenIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractUpdatedThirdPartyTransfersForbidden struct {
	Strategy common.Address
	Value    bool
	Raw      types.Log
}

func (_Contract *ContractFilterer) FilterUpdatedThirdPartyTransfersForbidden(opts *bind.FilterOpts) (*ContractUpdatedThirdPartyTransfersForbiddenIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "UpdatedThirdPartyTransfersForbidden")
	if err != nil {
		return nil, err
	}
	return &ContractUpdatedThirdPartyTransfersForbiddenIterator{contract: _Contract.contract, event: "UpdatedThirdPartyTransfersForbidden", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchUpdatedThirdPartyTransfersForbidden(opts *bind.WatchOpts, sink chan<- *ContractUpdatedThirdPartyTransfersForbidden) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "UpdatedThirdPartyTransfersForbidden")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractUpdatedThirdPartyTransfersForbidden)
				if err := _Contract.contract.UnpackLog(event, "UpdatedThirdPartyTransfersForbidden", log); err != nil {
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

func (_Contract *ContractFilterer) ParseUpdatedThirdPartyTransfersForbidden(log types.Log) (*ContractUpdatedThirdPartyTransfersForbidden, error) {
	event := new(ContractUpdatedThirdPartyTransfersForbidden)
	if err := _Contract.contract.UnpackLog(event, "UpdatedThirdPartyTransfersForbidden", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

func (_Contract *Contract) ParseLog(log types.Log) (generated.AbigenLog, error) {
	switch log.Topics[0] {
	case _Contract.abi.Events["Deposit"].ID:
		return _Contract.ParseDeposit(log)
	case _Contract.abi.Events["StrategyAddedToDepositWhitelist"].ID:
		return _Contract.ParseStrategyAddedToDepositWhitelist(log)
	case _Contract.abi.Events["StrategyRemovedFromDepositWhitelist"].ID:
		return _Contract.ParseStrategyRemovedFromDepositWhitelist(log)
	case _Contract.abi.Events["StrategyWhitelisterChanged"].ID:
		return _Contract.ParseStrategyWhitelisterChanged(log)
	case _Contract.abi.Events["UpdatedThirdPartyTransfersForbidden"].ID:
		return _Contract.ParseUpdatedThirdPartyTransfersForbidden(log)

	default:
		return nil, fmt.Errorf("abigen wrapper received unknown log topic: %v", log.Topics[0])
	}
}

func (ContractDeposit) Topic() common.Hash {
	return common.HexToHash("0x7cfff908a4b583f36430b25d75964c458d8ede8a99bd61be750e97ee1b2f3a96")
}

func (ContractStrategyAddedToDepositWhitelist) Topic() common.Hash {
	return common.HexToHash("0x0c35b17d91c96eb2751cd456e1252f42a386e524ef9ff26ecc9950859fdc04fe")
}

func (ContractStrategyRemovedFromDepositWhitelist) Topic() common.Hash {
	return common.HexToHash("0x4074413b4b443e4e58019f2855a8765113358c7c72e39509c6af45fc0f5ba030")
}

func (ContractStrategyWhitelisterChanged) Topic() common.Hash {
	return common.HexToHash("0x4264275e593955ff9d6146a51a4525f6ddace2e81db9391abcc9d1ca48047d29")
}

func (ContractUpdatedThirdPartyTransfersForbidden) Topic() common.Hash {
	return common.HexToHash("0x77d930df4937793473a95024d87a98fd2ccb9e92d3c2463b3dacd65d3e6a5786")
}

func (_Contract *Contract) Address() common.Address {
	return _Contract.address
}

type ContractInterface interface {
	CalculateWithdrawalRoot(opts *bind.CallOpts, queuedWithdrawal IStrategyManagerDeprecatedStructQueuedWithdrawal) ([32]byte, error)

	Delegation(opts *bind.CallOpts) (common.Address, error)

	EigenPodManager(opts *bind.CallOpts) (common.Address, error)

	GetDeposits(opts *bind.CallOpts, staker common.Address) ([]common.Address, []*big.Int, error)

	Slasher(opts *bind.CallOpts) (common.Address, error)

	StakerStrategyListLength(opts *bind.CallOpts, staker common.Address) (*big.Int, error)

	StakerStrategyShares(opts *bind.CallOpts, user common.Address, strategy common.Address) (*big.Int, error)

	StrategyWhitelister(opts *bind.CallOpts) (common.Address, error)

	ThirdPartyTransfersForbidden(opts *bind.CallOpts, strategy common.Address) (bool, error)

	AddShares(opts *bind.TransactOpts, staker common.Address, token common.Address, strategy common.Address, shares *big.Int) (*types.Transaction, error)

	AddStrategiesToDepositWhitelist(opts *bind.TransactOpts, strategiesToWhitelist []common.Address, thirdPartyTransfersForbiddenValues []bool) (*types.Transaction, error)

	DepositIntoStrategy(opts *bind.TransactOpts, strategy common.Address, token common.Address, amount *big.Int) (*types.Transaction, error)

	DepositIntoStrategyWithSignature(opts *bind.TransactOpts, strategy common.Address, token common.Address, amount *big.Int, staker common.Address, expiry *big.Int, signature []byte) (*types.Transaction, error)

	MigrateQueuedWithdrawal(opts *bind.TransactOpts, queuedWithdrawal IStrategyManagerDeprecatedStructQueuedWithdrawal) (*types.Transaction, error)

	RemoveShares(opts *bind.TransactOpts, staker common.Address, strategy common.Address, shares *big.Int) (*types.Transaction, error)

	RemoveStrategiesFromDepositWhitelist(opts *bind.TransactOpts, strategiesToRemoveFromWhitelist []common.Address) (*types.Transaction, error)

	WithdrawSharesAsTokens(opts *bind.TransactOpts, recipient common.Address, strategy common.Address, shares *big.Int, token common.Address) (*types.Transaction, error)

	FilterDeposit(opts *bind.FilterOpts) (*ContractDepositIterator, error)

	WatchDeposit(opts *bind.WatchOpts, sink chan<- *ContractDeposit) (event.Subscription, error)

	ParseDeposit(log types.Log) (*ContractDeposit, error)

	FilterStrategyAddedToDepositWhitelist(opts *bind.FilterOpts) (*ContractStrategyAddedToDepositWhitelistIterator, error)

	WatchStrategyAddedToDepositWhitelist(opts *bind.WatchOpts, sink chan<- *ContractStrategyAddedToDepositWhitelist) (event.Subscription, error)

	ParseStrategyAddedToDepositWhitelist(log types.Log) (*ContractStrategyAddedToDepositWhitelist, error)

	FilterStrategyRemovedFromDepositWhitelist(opts *bind.FilterOpts) (*ContractStrategyRemovedFromDepositWhitelistIterator, error)

	WatchStrategyRemovedFromDepositWhitelist(opts *bind.WatchOpts, sink chan<- *ContractStrategyRemovedFromDepositWhitelist) (event.Subscription, error)

	ParseStrategyRemovedFromDepositWhitelist(log types.Log) (*ContractStrategyRemovedFromDepositWhitelist, error)

	FilterStrategyWhitelisterChanged(opts *bind.FilterOpts) (*ContractStrategyWhitelisterChangedIterator, error)

	WatchStrategyWhitelisterChanged(opts *bind.WatchOpts, sink chan<- *ContractStrategyWhitelisterChanged) (event.Subscription, error)

	ParseStrategyWhitelisterChanged(log types.Log) (*ContractStrategyWhitelisterChanged, error)

	FilterUpdatedThirdPartyTransfersForbidden(opts *bind.FilterOpts) (*ContractUpdatedThirdPartyTransfersForbiddenIterator, error)

	WatchUpdatedThirdPartyTransfersForbidden(opts *bind.WatchOpts, sink chan<- *ContractUpdatedThirdPartyTransfersForbidden) (event.Subscription, error)

	ParseUpdatedThirdPartyTransfersForbidden(log types.Log) (*ContractUpdatedThirdPartyTransfersForbidden, error)

	ParseLog(log types.Log) (generated.AbigenLog, error)

	Address() common.Address
}
