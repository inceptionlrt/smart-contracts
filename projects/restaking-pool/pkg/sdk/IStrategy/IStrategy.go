// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package IStrategy

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
	ABI: "[{\"inputs\":[{\"internalType\":\"contractIERC20\",\"name\":\"token\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"deposit\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"explanation\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"user\",\"type\":\"address\"}],\"name\":\"shares\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"amountShares\",\"type\":\"uint256\"}],\"name\":\"sharesToUnderlying\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"amountShares\",\"type\":\"uint256\"}],\"name\":\"sharesToUnderlyingView\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"totalShares\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"amountUnderlying\",\"type\":\"uint256\"}],\"name\":\"underlyingToShares\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"amountUnderlying\",\"type\":\"uint256\"}],\"name\":\"underlyingToSharesView\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"underlyingToken\",\"outputs\":[{\"internalType\":\"contractIERC20\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"user\",\"type\":\"address\"}],\"name\":\"userUnderlying\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"user\",\"type\":\"address\"}],\"name\":\"userUnderlyingView\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"recipient\",\"type\":\"address\"},{\"internalType\":\"contractIERC20\",\"name\":\"token\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amountShares\",\"type\":\"uint256\"}],\"name\":\"withdraw\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]",
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

func (_Contract *ContractCaller) Explanation(opts *bind.CallOpts) (string, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "explanation")

	if err != nil {
		return *new(string), err
	}

	out0 := *abi.ConvertType(out[0], new(string)).(*string)

	return out0, err

}

func (_Contract *ContractSession) Explanation() (string, error) {
	return _Contract.Contract.Explanation(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) Explanation() (string, error) {
	return _Contract.Contract.Explanation(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) Shares(opts *bind.CallOpts, user common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "shares", user)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) Shares(user common.Address) (*big.Int, error) {
	return _Contract.Contract.Shares(&_Contract.CallOpts, user)
}

func (_Contract *ContractCallerSession) Shares(user common.Address) (*big.Int, error) {
	return _Contract.Contract.Shares(&_Contract.CallOpts, user)
}

func (_Contract *ContractCaller) SharesToUnderlyingView(opts *bind.CallOpts, amountShares *big.Int) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "sharesToUnderlyingView", amountShares)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) SharesToUnderlyingView(amountShares *big.Int) (*big.Int, error) {
	return _Contract.Contract.SharesToUnderlyingView(&_Contract.CallOpts, amountShares)
}

func (_Contract *ContractCallerSession) SharesToUnderlyingView(amountShares *big.Int) (*big.Int, error) {
	return _Contract.Contract.SharesToUnderlyingView(&_Contract.CallOpts, amountShares)
}

func (_Contract *ContractCaller) TotalShares(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "totalShares")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) TotalShares() (*big.Int, error) {
	return _Contract.Contract.TotalShares(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) TotalShares() (*big.Int, error) {
	return _Contract.Contract.TotalShares(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) UnderlyingToSharesView(opts *bind.CallOpts, amountUnderlying *big.Int) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "underlyingToSharesView", amountUnderlying)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) UnderlyingToSharesView(amountUnderlying *big.Int) (*big.Int, error) {
	return _Contract.Contract.UnderlyingToSharesView(&_Contract.CallOpts, amountUnderlying)
}

func (_Contract *ContractCallerSession) UnderlyingToSharesView(amountUnderlying *big.Int) (*big.Int, error) {
	return _Contract.Contract.UnderlyingToSharesView(&_Contract.CallOpts, amountUnderlying)
}

func (_Contract *ContractCaller) UnderlyingToken(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "underlyingToken")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) UnderlyingToken() (common.Address, error) {
	return _Contract.Contract.UnderlyingToken(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) UnderlyingToken() (common.Address, error) {
	return _Contract.Contract.UnderlyingToken(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) UserUnderlyingView(opts *bind.CallOpts, user common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "userUnderlyingView", user)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) UserUnderlyingView(user common.Address) (*big.Int, error) {
	return _Contract.Contract.UserUnderlyingView(&_Contract.CallOpts, user)
}

func (_Contract *ContractCallerSession) UserUnderlyingView(user common.Address) (*big.Int, error) {
	return _Contract.Contract.UserUnderlyingView(&_Contract.CallOpts, user)
}

func (_Contract *ContractTransactor) Deposit(opts *bind.TransactOpts, token common.Address, amount *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "deposit", token, amount)
}

func (_Contract *ContractSession) Deposit(token common.Address, amount *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.Deposit(&_Contract.TransactOpts, token, amount)
}

func (_Contract *ContractTransactorSession) Deposit(token common.Address, amount *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.Deposit(&_Contract.TransactOpts, token, amount)
}

func (_Contract *ContractTransactor) SharesToUnderlying(opts *bind.TransactOpts, amountShares *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "sharesToUnderlying", amountShares)
}

func (_Contract *ContractSession) SharesToUnderlying(amountShares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.SharesToUnderlying(&_Contract.TransactOpts, amountShares)
}

func (_Contract *ContractTransactorSession) SharesToUnderlying(amountShares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.SharesToUnderlying(&_Contract.TransactOpts, amountShares)
}

func (_Contract *ContractTransactor) UnderlyingToShares(opts *bind.TransactOpts, amountUnderlying *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "underlyingToShares", amountUnderlying)
}

func (_Contract *ContractSession) UnderlyingToShares(amountUnderlying *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.UnderlyingToShares(&_Contract.TransactOpts, amountUnderlying)
}

func (_Contract *ContractTransactorSession) UnderlyingToShares(amountUnderlying *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.UnderlyingToShares(&_Contract.TransactOpts, amountUnderlying)
}

func (_Contract *ContractTransactor) UserUnderlying(opts *bind.TransactOpts, user common.Address) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "userUnderlying", user)
}

func (_Contract *ContractSession) UserUnderlying(user common.Address) (*types.Transaction, error) {
	return _Contract.Contract.UserUnderlying(&_Contract.TransactOpts, user)
}

func (_Contract *ContractTransactorSession) UserUnderlying(user common.Address) (*types.Transaction, error) {
	return _Contract.Contract.UserUnderlying(&_Contract.TransactOpts, user)
}

func (_Contract *ContractTransactor) Withdraw(opts *bind.TransactOpts, recipient common.Address, token common.Address, amountShares *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "withdraw", recipient, token, amountShares)
}

func (_Contract *ContractSession) Withdraw(recipient common.Address, token common.Address, amountShares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.Withdraw(&_Contract.TransactOpts, recipient, token, amountShares)
}

func (_Contract *ContractTransactorSession) Withdraw(recipient common.Address, token common.Address, amountShares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.Withdraw(&_Contract.TransactOpts, recipient, token, amountShares)
}

func (_Contract *Contract) Address() common.Address {
	return _Contract.address
}

type ContractInterface interface {
	Explanation(opts *bind.CallOpts) (string, error)

	Shares(opts *bind.CallOpts, user common.Address) (*big.Int, error)

	SharesToUnderlyingView(opts *bind.CallOpts, amountShares *big.Int) (*big.Int, error)

	TotalShares(opts *bind.CallOpts) (*big.Int, error)

	UnderlyingToSharesView(opts *bind.CallOpts, amountUnderlying *big.Int) (*big.Int, error)

	UnderlyingToken(opts *bind.CallOpts) (common.Address, error)

	UserUnderlyingView(opts *bind.CallOpts, user common.Address) (*big.Int, error)

	Deposit(opts *bind.TransactOpts, token common.Address, amount *big.Int) (*types.Transaction, error)

	SharesToUnderlying(opts *bind.TransactOpts, amountShares *big.Int) (*types.Transaction, error)

	UnderlyingToShares(opts *bind.TransactOpts, amountUnderlying *big.Int) (*types.Transaction, error)

	UserUnderlying(opts *bind.TransactOpts, user common.Address) (*types.Transaction, error)

	Withdraw(opts *bind.TransactOpts, recipient common.Address, token common.Address, amountShares *big.Int) (*types.Transaction, error)

	Address() common.Address
}
