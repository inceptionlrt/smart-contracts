// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package RestakerDeployer

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
	ABI: "[{\"inputs\":[{\"internalType\":\"address\",\"name\":\"beacon_\",\"type\":\"address\"},{\"internalType\":\"contractIRestakerFacets\",\"name\":\"facets_\",\"type\":\"address\"}],\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"inputs\":[],\"name\":\"Create2EmptyBytecode\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"Create2FailedDeployment\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"balance\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"needed\",\"type\":\"uint256\"}],\"name\":\"Create2InsufficientBalance\",\"type\":\"error\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"creator\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"contractIRestaker\",\"name\":\"restaker\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"id\",\"type\":\"uint256\"}],\"name\":\"RestakerDeployed\",\"type\":\"event\"},{\"inputs\":[],\"name\":\"BEACON_PROXY_BYTECODE\",\"outputs\":[{\"internalType\":\"bytes\",\"name\":\"\",\"type\":\"bytes\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"beacon\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"deployRestaker\",\"outputs\":[{\"internalType\":\"contractIRestaker\",\"name\":\"restaker\",\"type\":\"address\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"facets\",\"outputs\":[{\"internalType\":\"contractIRestakerFacets\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"id\",\"type\":\"uint256\"}],\"name\":\"getRestaker\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"nonce\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"}]",
	Bin: "0x60c060405234801561000f575f80fd5b50604051610af0380380610af083398101604081905261002e9161005c565b6001600160a01b039182166080521660a052610094565b6001600160a01b0381168114610059575f80fd5b50565b5f806040838503121561006d575f80fd5b825161007881610045565b602084015190925061008981610045565b809150509250929050565b60805160a051610a2f6100c15f395f818160ad015261014c01525f8181606901526102730152610a2f5ff3fe608060405234801561000f575f80fd5b5060043610610060575f3560e01c806359659e90146100645780637a0ed627146100a85780639ce953c8146100cf578063affed0e0146100d7578063cda3ef36146100ed578063d52fc71014610102575b5f80fd5b61008b7f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b0390911681526020015b60405180910390f35b61008b7f000000000000000000000000000000000000000000000000000000000000000081565b61008b610115565b6100df5f5481565b60405190815260200161009f565b6100f5610206565b60405161009f91906103c7565b61008b6101103660046103f9565b61022b565b5f8054339061012d90839061012861024a565b6102df565b60405163485cc95560e01b81526001600160a01b0383811660048301527f0000000000000000000000000000000000000000000000000000000000000000811660248301529193509083169063485cc955906044015f604051808303815f87803b158015610199575f80fd5b505af11580156101ab573d5f803e3d5ffd5b50505f80546001600160a01b038087169450851692507f66b1c85e3aa7b590e4fcd19543377d320772af5d49300c8c50653f46253ee99f91806101ed83610410565b9091555060405190815260200160405180910390a35090565b60405161021560208201610398565b601f1982820381018352601f9091011660405281565b5f6102448261023861024a565b80519060200120610368565b92915050565b60606040518060200161025c90610398565b601f1982820381018352601f9091011660408181527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166020830152808201525f606082015260800160408051601f19818403018152908290526102cb9291602001610434565b604051602081830303815290604052905090565b5f8347101561030e5760405163392efb2b60e21b81524760048201526024810185905260440160405180910390fd5b81515f0361032f57604051631328927760e21b815260040160405180910390fd5b8282516020840186f590506001600160a01b03811661036157604051633a0ba96160e11b815260040160405180910390fd5b9392505050565b5f6103618383305f604051836040820152846020820152828152600b8101905060ff815360559020949350505050565b6105978061046383390190565b5f5b838110156103bf5781810151838201526020016103a7565b50505f910152565b602081525f82518060208401526103e58160408501602087016103a5565b601f01601f19169190910160400192915050565b5f60208284031215610409575f80fd5b5035919050565b5f6001820161042d57634e487b7160e01b5f52601160045260245ffd5b5060010190565b5f83516104458184602088016103a5565b8351908301906104598183602088016103a5565b0194935050505056fe60a060405260405161059738038061059783398101604081905261002291610376565b61002c828261003e565b506001600160a01b0316608052610465565b610047826100fb565b6040516001600160a01b038316907f1cf3b03a6cf19fa2baba4df148e9dcabedea7f8a5c07840e207e5c089be95d3e905f90a28051156100ef576100ea826001600160a01b0316635c60da1b6040518163ffffffff1660e01b8152600401602060405180830381865afa1580156100c0573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906100e49190610431565b82610209565b505050565b6100f761027c565b5050565b806001600160a01b03163b5f0361013557604051631933b43b60e21b81526001600160a01b03821660048201526024015b60405180910390fd5b807fa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d5080546001600160a01b0319166001600160a01b0392831617905560408051635c60da1b60e01b815290515f92841691635c60da1b9160048083019260209291908290030181865afa1580156101ae573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906101d29190610431565b9050806001600160a01b03163b5f036100f757604051634c9c8ce360e01b81526001600160a01b038216600482015260240161012c565b60605f80846001600160a01b031684604051610225919061044a565b5f60405180830381855af49150503d805f811461025d576040519150601f19603f3d011682016040523d82523d5f602084013e610262565b606091505b50909250905061027385838361029d565b95945050505050565b341561029b5760405163b398979f60e01b815260040160405180910390fd5b565b6060826102b2576102ad826102fc565b6102f5565b81511580156102c957506001600160a01b0384163b155b156102f257604051639996b31560e01b81526001600160a01b038516600482015260240161012c565b50805b9392505050565b80511561030c5780518082602001fd5b604051630a12f52160e11b815260040160405180910390fd5b80516001600160a01b038116811461033b575f80fd5b919050565b634e487b7160e01b5f52604160045260245ffd5b5f5b8381101561036e578181015183820152602001610356565b50505f910152565b5f8060408385031215610387575f80fd5b61039083610325565b60208401519092506001600160401b03808211156103ac575f80fd5b818501915085601f8301126103bf575f80fd5b8151818111156103d1576103d1610340565b604051601f8201601f19908116603f011681019083821181831017156103f9576103f9610340565b81604052828152886020848701011115610411575f80fd5b610422836020830160208801610354565b80955050505050509250929050565b5f60208284031215610441575f80fd5b6102f582610325565b5f825161045b818460208701610354565b9190910192915050565b60805161011b61047c5f395f601d015261011b5ff3fe6080604052600a600c565b005b60186014601a565b609d565b565b5f7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316635c60da1b6040518163ffffffff1660e01b8152600401602060405180830381865afa1580156076573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906098919060ba565b905090565b365f80375f80365f845af43d5f803e80801560b6573d5ff35b3d5ffd5b5f6020828403121560c9575f80fd5b81516001600160a01b038116811460de575f80fd5b939250505056fea264697066735822122044b28942acb3192d781190d042b679e6aa3641738035cf4bc89550d2155caf2364736f6c63430008150033a264697066735822122071dcec642a1207388e831434aceaa9cd9b203a3425c97528480eb45197c5c99964736f6c63430008150033",
}

var ContractABI = ContractMetaData.ABI

var ContractBin = ContractMetaData.Bin

func DeployContract(auth *bind.TransactOpts, backend bind.ContractBackend, beacon_ common.Address, facets_ common.Address) (common.Address, *types.Transaction, *Contract, error) {
	parsed, err := ContractMetaData.GetAbi()
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	if parsed == nil {
		return common.Address{}, nil, nil, errors.New("GetABI returned nil")
	}

	address, tx, contract, err := bind.DeployContract(auth, *parsed, common.FromHex(ContractBin), backend, beacon_, facets_)
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

func (_Contract *ContractCaller) Facets(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "facets")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) Facets() (common.Address, error) {
	return _Contract.Contract.Facets(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) Facets() (common.Address, error) {
	return _Contract.Contract.Facets(&_Contract.CallOpts)
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

	Facets(opts *bind.CallOpts) (common.Address, error)

	GetRestaker(opts *bind.CallOpts, id *big.Int) (common.Address, error)

	Nonce(opts *bind.CallOpts) (*big.Int, error)

	DeployRestaker(opts *bind.TransactOpts) (*types.Transaction, error)

	FilterRestakerDeployed(opts *bind.FilterOpts, creator []common.Address, restaker []common.Address) (*ContractRestakerDeployedIterator, error)

	WatchRestakerDeployed(opts *bind.WatchOpts, sink chan<- *ContractRestakerDeployed, creator []common.Address, restaker []common.Address) (event.Subscription, error)

	ParseRestakerDeployed(log types.Log) (*ContractRestakerDeployed, error)

	ParseLog(log types.Log) (generated.AbigenLog, error)

	Address() common.Address
}
