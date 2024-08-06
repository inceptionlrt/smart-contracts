// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package ProtocolConfig

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
	ABI: "[{\"inputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"inputs\":[],\"name\":\"InvalidInitialization\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"NotInitializing\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"OnlyGovernanceAllowed\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"ZeroAddress\",\"type\":\"error\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"contractICToken\",\"name\":\"prevValue\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"contractICToken\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"CTokenChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"contractIEigenPodManager\",\"name\":\"prevValue\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"contractIEigenPodManager\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"EigenManagerChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"prevValue\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"GovernanceChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint64\",\"name\":\"version\",\"type\":\"uint64\"}],\"name\":\"Initialized\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"prevValue\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"OperatorChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"contractIRatioFeed\",\"name\":\"prevValue\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"contractIRatioFeed\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"RatioFeedChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"contractIRestakerDeployer\",\"name\":\"prevValue\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"contractIRestakerDeployer\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"RestakerDeployerChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"contractIRestakingPool\",\"name\":\"prevValue\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"contractIRestakingPool\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"RestakingPoolChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"prevValue\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"TreasuryChanged\",\"type\":\"event\"},{\"inputs\":[],\"name\":\"getCToken\",\"outputs\":[{\"internalType\":\"contractICToken\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getGovernance\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getOperator\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getRatioFeed\",\"outputs\":[{\"internalType\":\"contractIRatioFeed\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getRestakerDeployer\",\"outputs\":[{\"internalType\":\"contractIRestakerDeployer\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getRestakingPool\",\"outputs\":[{\"internalType\":\"contractIRestakingPool\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getTreasury\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"governanceAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"operatorAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"treasuryAddress\",\"type\":\"address\"}],\"name\":\"initialize\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"contractICToken\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"setCToken\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"setGovernance\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"setOperator\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"contractIRatioFeed\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"setRatioFeed\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"contractIRestakerDeployer\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"setRestakerDeployer\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"contractIRestakingPool\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"setRestakingPool\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"newValue\",\"type\":\"address\"}],\"name\":\"setTreasury\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]",
	Bin: "0x608060405234801561000f575f80fd5b5061001861001d565b6100cf565b7ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a00805468010000000000000000900460ff161561006d5760405163f92ee8a960e01b815260040160405180910390fd5b80546001600160401b03908116146100cc5780546001600160401b0319166001600160401b0390811782556040519081527fc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d29060200160405180910390a15b50565b610b24806100dc5f395ff3fe608060405234801561000f575f80fd5b50600436106100f0575f3560e01c8063c0c53b8b11610093578063e855f74a11610063578063e855f74a146101a1578063ec6c350c146101b4578063f0e35a9a146101bc578063f0f44260146101cf575f80fd5b8063c0c53b8b1461016b578063c5db8a7a1461017e578063dd2b442f14610186578063e7f43c6814610199575f80fd5b80634cb71222116100ce5780634cb71222146101285780637745165b1461013d578063ab033ea914610145578063b3ab15fb14610158575f80fd5b8063289b3c0d146100f45780633b19e84a146101185780633f69e0f714610120575b5f80fd5b6100fc6101e2565b6040516001600160a01b03909116815260200160405180910390f35b6100fc61024f565b6100fc610281565b61013b610136366004610a5f565b6102b3565b005b6100fc610393565b61013b610153366004610a5f565b6103c5565b61013b610166366004610a5f565b61040a565b61013b610179366004610a81565b61044c565b6100fc61055e565b61013b610194366004610a5f565b610590565b6100fc61064f565b61013b6101af366004610a5f565b610681565b6100fc61073f565b61013b6101ca366004610a5f565b610771565b61013b6101dd366004610a5f565b610830565b5f61024060ff1961021460017f2c1ccc4e2e8669dd29e684614f72e5951cafb13383a25e53832a81925f89faca610ac9565b60405160200161022691815260200190565b604051602081830303815290604052805190602001201690565b546001600160a01b0316919050565b5f61024060ff1961021460017f0fc499aa3455bd2a5ab0b29aff6c822ab857e944cc6e50f67b9f41e56435bebc610ac9565b5f61024060ff1961021460017f4e0d6a466ad0a4dabd7bbb3c7174d20d7140bb3b8855f56ab16df50f16364518610ac9565b6102bb6101e2565b6001600160a01b0316336001600160a01b0316146102ec5760405163e2d4f15f60e01b815260040160405180910390fd5b6102f581610872565b7f604ae4b80bb1d3cb1b6f8fd99500a3203337ec3cdd83cb343ee91f8960f634df61031e61073f565b604080516001600160a01b03928316815291841660208301520160405180910390a18061037260ff1961021460017f4cdd4cb6db323c29441c0394bd1c6253320297c5aa6f34c1c5384c9bf6bbc500610ac9565b80546001600160a01b0319166001600160a01b039290921691909117905550565b5f61024060ff1961021460017fc27f2bdbccd115fb7a8dce580d6128b98b87079c11fd3cfa156ce5fcbf32387b610ac9565b6103cd6101e2565b6001600160a01b0316336001600160a01b0316146103fe5760405163e2d4f15f60e01b815260040160405180910390fd5b61040781610899565b50565b6104126101e2565b6001600160a01b0316336001600160a01b0316146104435760405163e2d4f15f60e01b815260040160405180910390fd5b6104078161091f565b7ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a008054600160401b810460ff16159067ffffffffffffffff165f811580156104915750825b90505f8267ffffffffffffffff1660011480156104ad5750303b155b9050811580156104bb575080155b156104d95760405163f92ee8a960e01b815260040160405180910390fd5b845467ffffffffffffffff19166001178555831561050357845460ff60401b1916600160401b1785555b61050e8789886109a5565b831561055457845460ff60401b19168555604051600181527fc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d29060200160405180910390a15b5050505050505050565b5f61024060ff1961021460017f0ac0abfa68711233fc41490a6f0b3b137ad1c680baf2f02dadf5527ae048a1fb610ac9565b6105986101e2565b6001600160a01b0316336001600160a01b0316146105c95760405163e2d4f15f60e01b815260040160405180910390fd5b6105d281610872565b7f37910025f99bc7fdc07bdf77dee21c246391d5e3f98e8c6e3b0306dfaf8f24fa6105fb610281565b604080516001600160a01b03928316815291841660208301520160405180910390a18061037260ff1961021460017f4e0d6a466ad0a4dabd7bbb3c7174d20d7140bb3b8855f56ab16df50f16364518610ac9565b5f61024060ff1961021460017f5c856a92785f6a62a694430cc3c1e05a0eb4456fd0c85251ab99976b25230cc8610ac9565b6106896101e2565b6001600160a01b0316336001600160a01b0316146106ba5760405163e2d4f15f60e01b815260040160405180910390fd5b6106c381610872565b7eae48a6cddea33b0b408d1f3e36bef3e47379bdc069c2f6662786c5bec83e106106eb610393565b604080516001600160a01b03928316815291841660208301520160405180910390a18061037260ff1961021460017fc27f2bdbccd115fb7a8dce580d6128b98b87079c11fd3cfa156ce5fcbf32387b610ac9565b5f61024060ff1961021460017f4cdd4cb6db323c29441c0394bd1c6253320297c5aa6f34c1c5384c9bf6bbc500610ac9565b6107796101e2565b6001600160a01b0316336001600160a01b0316146107aa5760405163e2d4f15f60e01b815260040160405180910390fd5b6107b381610872565b7fdb29c30d5fa0d3da86f28fcd1e16611171e924d291c7ef82f03cffb0bfa056526107dc61055e565b604080516001600160a01b03928316815291841660208301520160405180910390a18061037260ff1961021460017f0ac0abfa68711233fc41490a6f0b3b137ad1c680baf2f02dadf5527ae048a1fb610ac9565b6108386101e2565b6001600160a01b0316336001600160a01b0316146108695760405163e2d4f15f60e01b815260040160405180910390fd5b610407816109c5565b6001600160a01b0381166104075760405163d92e233d60e01b815260040160405180910390fd5b6108a281610872565b7f3aaaebeb4821d6a7e5c77ece53cff0afcc56c82add2c978dbbb7f73e84cbcfd26108cb6101e2565b604080516001600160a01b03928316815291841660208301520160405180910390a18061037260ff1961021460017f2c1ccc4e2e8669dd29e684614f72e5951cafb13383a25e53832a81925f89faca610ac9565b61092881610872565b7fd58299b712891143e76310d5e664c4203c940a67db37cf856bdaa3c5c76a802c61095161064f565b604080516001600160a01b03928316815291841660208301520160405180910390a18061037260ff1961021460017f5c856a92785f6a62a694430cc3c1e05a0eb4456fd0c85251ab99976b25230cc8610ac9565b6109ae8361091f565b6109b782610899565b6109c0816109c5565b505050565b6109ce81610872565b7f8c3aa5f43a388513435861bf27dfad7829cd248696fed367c62d441f629544966109f761024f565b604080516001600160a01b03928316815291841660208301520160405180910390a18061037260ff1961021460017f0fc499aa3455bd2a5ab0b29aff6c822ab857e944cc6e50f67b9f41e56435bebc610ac9565b6001600160a01b0381168114610407575f80fd5b5f60208284031215610a6f575f80fd5b8135610a7a81610a4b565b9392505050565b5f805f60608486031215610a93575f80fd5b8335610a9e81610a4b565b92506020840135610aae81610a4b565b91506040840135610abe81610a4b565b809150509250925092565b81810381811115610ae857634e487b7160e01b5f52601160045260245ffd5b9291505056fea2646970667358221220e040dcfac04be7e0708ade9a69c97aee464cae41cc6af641a0108b78f3d7c3d264736f6c63430008150033",
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

func (_Contract *ContractTransactor) Initialize(opts *bind.TransactOpts, governanceAddress common.Address, operatorAddress common.Address, treasuryAddress common.Address) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "initialize", governanceAddress, operatorAddress, treasuryAddress)
}

func (_Contract *ContractSession) Initialize(governanceAddress common.Address, operatorAddress common.Address, treasuryAddress common.Address) (*types.Transaction, error) {
	return _Contract.Contract.Initialize(&_Contract.TransactOpts, governanceAddress, operatorAddress, treasuryAddress)
}

func (_Contract *ContractTransactorSession) Initialize(governanceAddress common.Address, operatorAddress common.Address, treasuryAddress common.Address) (*types.Transaction, error) {
	return _Contract.Contract.Initialize(&_Contract.TransactOpts, governanceAddress, operatorAddress, treasuryAddress)
}

func (_Contract *ContractTransactor) SetCToken(opts *bind.TransactOpts, newValue common.Address) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "setCToken", newValue)
}

func (_Contract *ContractSession) SetCToken(newValue common.Address) (*types.Transaction, error) {
	return _Contract.Contract.SetCToken(&_Contract.TransactOpts, newValue)
}

func (_Contract *ContractTransactorSession) SetCToken(newValue common.Address) (*types.Transaction, error) {
	return _Contract.Contract.SetCToken(&_Contract.TransactOpts, newValue)
}

func (_Contract *ContractTransactor) SetGovernance(opts *bind.TransactOpts, newValue common.Address) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "setGovernance", newValue)
}

func (_Contract *ContractSession) SetGovernance(newValue common.Address) (*types.Transaction, error) {
	return _Contract.Contract.SetGovernance(&_Contract.TransactOpts, newValue)
}

func (_Contract *ContractTransactorSession) SetGovernance(newValue common.Address) (*types.Transaction, error) {
	return _Contract.Contract.SetGovernance(&_Contract.TransactOpts, newValue)
}

func (_Contract *ContractTransactor) SetOperator(opts *bind.TransactOpts, newValue common.Address) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "setOperator", newValue)
}

func (_Contract *ContractSession) SetOperator(newValue common.Address) (*types.Transaction, error) {
	return _Contract.Contract.SetOperator(&_Contract.TransactOpts, newValue)
}

func (_Contract *ContractTransactorSession) SetOperator(newValue common.Address) (*types.Transaction, error) {
	return _Contract.Contract.SetOperator(&_Contract.TransactOpts, newValue)
}

func (_Contract *ContractTransactor) SetRatioFeed(opts *bind.TransactOpts, newValue common.Address) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "setRatioFeed", newValue)
}

func (_Contract *ContractSession) SetRatioFeed(newValue common.Address) (*types.Transaction, error) {
	return _Contract.Contract.SetRatioFeed(&_Contract.TransactOpts, newValue)
}

func (_Contract *ContractTransactorSession) SetRatioFeed(newValue common.Address) (*types.Transaction, error) {
	return _Contract.Contract.SetRatioFeed(&_Contract.TransactOpts, newValue)
}

func (_Contract *ContractTransactor) SetRestakerDeployer(opts *bind.TransactOpts, newValue common.Address) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "setRestakerDeployer", newValue)
}

func (_Contract *ContractSession) SetRestakerDeployer(newValue common.Address) (*types.Transaction, error) {
	return _Contract.Contract.SetRestakerDeployer(&_Contract.TransactOpts, newValue)
}

func (_Contract *ContractTransactorSession) SetRestakerDeployer(newValue common.Address) (*types.Transaction, error) {
	return _Contract.Contract.SetRestakerDeployer(&_Contract.TransactOpts, newValue)
}

func (_Contract *ContractTransactor) SetRestakingPool(opts *bind.TransactOpts, newValue common.Address) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "setRestakingPool", newValue)
}

func (_Contract *ContractSession) SetRestakingPool(newValue common.Address) (*types.Transaction, error) {
	return _Contract.Contract.SetRestakingPool(&_Contract.TransactOpts, newValue)
}

func (_Contract *ContractTransactorSession) SetRestakingPool(newValue common.Address) (*types.Transaction, error) {
	return _Contract.Contract.SetRestakingPool(&_Contract.TransactOpts, newValue)
}

func (_Contract *ContractTransactor) SetTreasury(opts *bind.TransactOpts, newValue common.Address) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "setTreasury", newValue)
}

func (_Contract *ContractSession) SetTreasury(newValue common.Address) (*types.Transaction, error) {
	return _Contract.Contract.SetTreasury(&_Contract.TransactOpts, newValue)
}

func (_Contract *ContractTransactorSession) SetTreasury(newValue common.Address) (*types.Transaction, error) {
	return _Contract.Contract.SetTreasury(&_Contract.TransactOpts, newValue)
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
	case _Contract.abi.Events["Initialized"].ID:
		return _Contract.ParseInitialized(log)
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

func (ContractInitialized) Topic() common.Hash {
	return common.HexToHash("0xc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d2")
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

	Initialize(opts *bind.TransactOpts, governanceAddress common.Address, operatorAddress common.Address, treasuryAddress common.Address) (*types.Transaction, error)

	SetCToken(opts *bind.TransactOpts, newValue common.Address) (*types.Transaction, error)

	SetGovernance(opts *bind.TransactOpts, newValue common.Address) (*types.Transaction, error)

	SetOperator(opts *bind.TransactOpts, newValue common.Address) (*types.Transaction, error)

	SetRatioFeed(opts *bind.TransactOpts, newValue common.Address) (*types.Transaction, error)

	SetRestakerDeployer(opts *bind.TransactOpts, newValue common.Address) (*types.Transaction, error)

	SetRestakingPool(opts *bind.TransactOpts, newValue common.Address) (*types.Transaction, error)

	SetTreasury(opts *bind.TransactOpts, newValue common.Address) (*types.Transaction, error)

	FilterCTokenChanged(opts *bind.FilterOpts) (*ContractCTokenChangedIterator, error)

	WatchCTokenChanged(opts *bind.WatchOpts, sink chan<- *ContractCTokenChanged) (event.Subscription, error)

	ParseCTokenChanged(log types.Log) (*ContractCTokenChanged, error)

	FilterEigenManagerChanged(opts *bind.FilterOpts) (*ContractEigenManagerChangedIterator, error)

	WatchEigenManagerChanged(opts *bind.WatchOpts, sink chan<- *ContractEigenManagerChanged) (event.Subscription, error)

	ParseEigenManagerChanged(log types.Log) (*ContractEigenManagerChanged, error)

	FilterGovernanceChanged(opts *bind.FilterOpts) (*ContractGovernanceChangedIterator, error)

	WatchGovernanceChanged(opts *bind.WatchOpts, sink chan<- *ContractGovernanceChanged) (event.Subscription, error)

	ParseGovernanceChanged(log types.Log) (*ContractGovernanceChanged, error)

	FilterInitialized(opts *bind.FilterOpts) (*ContractInitializedIterator, error)

	WatchInitialized(opts *bind.WatchOpts, sink chan<- *ContractInitialized) (event.Subscription, error)

	ParseInitialized(log types.Log) (*ContractInitialized, error)

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
