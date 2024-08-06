// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package InceptionLibrary

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
	ABI: "[{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"capacity\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"optimalCapacity\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"optimalBonusRate\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"maxDepositBonusRate\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"targetCapacity\",\"type\":\"uint256\"}],\"name\":\"calculateDepositBonus\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"bonus\",\"type\":\"uint256\"}],\"stateMutability\":\"pure\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"capacity\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"optimalCapacity\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"optimalFeeRate\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"maxFlashWithdrawalFeeRate\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"targetCapacity\",\"type\":\"uint256\"}],\"name\":\"calculateWithdrawalFee\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"fee\",\"type\":\"uint256\"}],\"stateMutability\":\"pure\",\"type\":\"function\"}]",
	Bin: "0x61043a610035600b8282823980515f1a60731461002957634e487b7160e01b5f525f60045260245ffd5b305f52607381538281f3fe730000000000000000000000000000000000000000301460806040526004361061003f575f3560e01c8063cfe6424414610043578063fea65f7214610068575b5f80fd5b610056610051366004610337565b61007b565b60405190815260200160405180910390f35b610056610076366004610337565b6101dd565b5f808711801561008a57508486115b1561010157868561009b828961038a565b10156100ae576100ab868861038a565b90505b6402540be4006100be86836103a3565b6100c891906103ba565b6100d290836103d9565b91506100de818961038a565b97506100ea818861038a565b9650815f036100ff576100fc826103ec565b91505b505b86156101c0575f8261011b87670de0b6b3a76400006103a3565b61012591906103ba565b61012f868661038a565b61014190670de0b6b3a76400006103a3565b61014b91906103ba565b90505f8361015a60028b6103ba565b610164908a61038a565b61016e90846103a3565b61017891906103ba565b610182908661038a565b90506402540be400610194828b6103a3565b61019e91906103ba565b6101a890846103d9565b9250825f036101bd576101ba836103ec565b92505b50505b805f036101d3576101d0816103ec565b90505b9695505050505050565b5f80871180156101ec57508486105b156102cf57866101fc81886103d9565b8610156102105761020d878761038a565b90505b5f8361022488670de0b6b3a76400006103a3565b61022e91906103ba565b610238878761038a565b61024a90670de0b6b3a76400006103a3565b61025491906103ba565b90505f846102636002856103ba565b61026d908b6103d9565b61027790846103a3565b61028191906103ba565b61028b908761038a565b9050610297838a6103d9565b98506402540be4006102a982856103a3565b6102b391906103ba565b6102bd90856103d9565b93506102c9838b61038a565b99505050505b5f871180156102de5750818611155b156101d3575f6102ee88886103d9565b8311610303576102fe878461038a565b610305565b875b90506402540be40061031786836103a3565b61032191906103ba565b61032b90836103d9565b98975050505050505050565b5f805f805f8060c0878903121561034c575f80fd5b505084359660208601359650604086013595606081013595506080810135945060a0013592509050565b634e487b7160e01b5f52601160045260245ffd5b8181038181111561039d5761039d610376565b92915050565b808202811582820484141761039d5761039d610376565b5f826103d457634e487b7160e01b5f52601260045260245ffd5b500490565b8082018082111561039d5761039d610376565b5f600182016103fd576103fd610376565b506001019056fea2646970667358221220223c013ad81328a80101fa8c99eac4a4de6a5b768a9390e23db84a8c4cd95b8364736f6c63430008150033",
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

func (_Contract *ContractCaller) CalculateDepositBonus(opts *bind.CallOpts, amount *big.Int, capacity *big.Int, optimalCapacity *big.Int, optimalBonusRate *big.Int, maxDepositBonusRate *big.Int, targetCapacity *big.Int) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "calculateDepositBonus", amount, capacity, optimalCapacity, optimalBonusRate, maxDepositBonusRate, targetCapacity)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) CalculateDepositBonus(amount *big.Int, capacity *big.Int, optimalCapacity *big.Int, optimalBonusRate *big.Int, maxDepositBonusRate *big.Int, targetCapacity *big.Int) (*big.Int, error) {
	return _Contract.Contract.CalculateDepositBonus(&_Contract.CallOpts, amount, capacity, optimalCapacity, optimalBonusRate, maxDepositBonusRate, targetCapacity)
}

func (_Contract *ContractCallerSession) CalculateDepositBonus(amount *big.Int, capacity *big.Int, optimalCapacity *big.Int, optimalBonusRate *big.Int, maxDepositBonusRate *big.Int, targetCapacity *big.Int) (*big.Int, error) {
	return _Contract.Contract.CalculateDepositBonus(&_Contract.CallOpts, amount, capacity, optimalCapacity, optimalBonusRate, maxDepositBonusRate, targetCapacity)
}

func (_Contract *ContractCaller) CalculateWithdrawalFee(opts *bind.CallOpts, amount *big.Int, capacity *big.Int, optimalCapacity *big.Int, optimalFeeRate *big.Int, maxFlashWithdrawalFeeRate *big.Int, targetCapacity *big.Int) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "calculateWithdrawalFee", amount, capacity, optimalCapacity, optimalFeeRate, maxFlashWithdrawalFeeRate, targetCapacity)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) CalculateWithdrawalFee(amount *big.Int, capacity *big.Int, optimalCapacity *big.Int, optimalFeeRate *big.Int, maxFlashWithdrawalFeeRate *big.Int, targetCapacity *big.Int) (*big.Int, error) {
	return _Contract.Contract.CalculateWithdrawalFee(&_Contract.CallOpts, amount, capacity, optimalCapacity, optimalFeeRate, maxFlashWithdrawalFeeRate, targetCapacity)
}

func (_Contract *ContractCallerSession) CalculateWithdrawalFee(amount *big.Int, capacity *big.Int, optimalCapacity *big.Int, optimalFeeRate *big.Int, maxFlashWithdrawalFeeRate *big.Int, targetCapacity *big.Int) (*big.Int, error) {
	return _Contract.Contract.CalculateWithdrawalFee(&_Contract.CallOpts, amount, capacity, optimalCapacity, optimalFeeRate, maxFlashWithdrawalFeeRate, targetCapacity)
}

func (_Contract *Contract) Address() common.Address {
	return _Contract.address
}

type ContractInterface interface {
	CalculateDepositBonus(opts *bind.CallOpts, amount *big.Int, capacity *big.Int, optimalCapacity *big.Int, optimalBonusRate *big.Int, maxDepositBonusRate *big.Int, targetCapacity *big.Int) (*big.Int, error)

	CalculateWithdrawalFee(opts *bind.CallOpts, amount *big.Int, capacity *big.Int, optimalCapacity *big.Int, optimalFeeRate *big.Int, maxFlashWithdrawalFeeRate *big.Int, targetCapacity *big.Int) (*big.Int, error)

	Address() common.Address
}
