// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package IRestakingPool

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

type IRestakingPoolUnstake struct {
	Recipient common.Address
	Amount    *big.Int
}

var ContractMetaData = &bind.MetaData{
	ABI: "[{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"claimed\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"fee\",\"type\":\"uint256\"}],\"name\":\"AmbiguousFee\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"capacity\",\"type\":\"uint256\"}],\"name\":\"InsufficientCapacity\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"param\",\"type\":\"uint256\"}],\"name\":\"ParameterExceedsLimits\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"uint64\",\"name\":\"max\",\"type\":\"uint64\"}],\"name\":\"PoolDistributeGasLimitNotInRange\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"PoolFailedInnerCall\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"PoolInsufficientBalance\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"PoolRestakerExists\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"PoolRestakerNotExists\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"PoolStakeAmGreaterThanAvailable\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"PoolStakeAmLessThanMin\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"PoolUnstakeAmLessThanMin\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"PoolWrongInputLength\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"PoolZeroAddress\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"PoolZeroAmount\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"TargetCapacityNotSet\",\"type\":\"error\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"claimer\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"ClaimExpected\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"string\",\"name\":\"provider\",\"type\":\"string\"},{\"indexed\":false,\"internalType\":\"bytes[]\",\"name\":\"pubkeys\",\"type\":\"bytes[]\"}],\"name\":\"Deposited\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint32\",\"name\":\"prevValue\",\"type\":\"uint32\"},{\"indexed\":false,\"internalType\":\"uint32\",\"name\":\"newValue\",\"type\":\"uint32\"}],\"name\":\"DistributeGasLimitChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"restaker\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"treasury\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"fee\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"totalClaimed\",\"type\":\"uint256\"}],\"name\":\"FeeClaimed\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"sender\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"receiver\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"fee\",\"type\":\"uint256\"}],\"name\":\"FlashUnstaked\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"prevValue\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newValue\",\"type\":\"uint256\"}],\"name\":\"MaxTVLChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"prevValue\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newValue\",\"type\":\"uint256\"}],\"name\":\"MinStakeChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"prevValue\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newValue\",\"type\":\"uint256\"}],\"name\":\"MinUntakeChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"ownerAddress\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"receiverAddress\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"}],\"name\":\"PendingUnstake\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"prevValue\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newValue\",\"type\":\"uint256\"}],\"name\":\"ProtocolFeeChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"sender\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"Received\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"bytes32\",\"name\":\"code\",\"type\":\"bytes32\"}],\"name\":\"ReferralStake\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"string\",\"name\":\"provider\",\"type\":\"string\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"restaker\",\"type\":\"address\"}],\"name\":\"RestakerAdded\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"StakeBonus\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newMaxBonusRate\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newOptimalBonusRate\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newDepositUtilizationKink\",\"type\":\"uint256\"}],\"name\":\"StakeBonusParamsChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"}],\"name\":\"Staked\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"prevValue\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newValue\",\"type\":\"uint256\"}],\"name\":\"TargetCapacityChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"claimer\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"caller\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"UnstakeClaimed\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newMaxFlashFeeRate\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newOptimalWithdrawalRate\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newWithdrawUtilizationKink\",\"type\":\"uint256\"}],\"name\":\"UnstakeFeeParamsChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"}],\"name\":\"Unstaked\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"components\":[{\"internalType\":\"address\",\"name\":\"recipient\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"indexed\":false,\"internalType\":\"structIRestakingPool.Unstake[]\",\"name\":\"unstakes\",\"type\":\"tuple[]\"}],\"name\":\"UnstakesDistributed\",\"type\":\"event\"},{\"inputs\":[],\"name\":\"getMinStake\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getMinUnstake\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"}]",
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

func (_Contract *ContractCaller) GetMinStake(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getMinStake")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) GetMinStake() (*big.Int, error) {
	return _Contract.Contract.GetMinStake(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) GetMinStake() (*big.Int, error) {
	return _Contract.Contract.GetMinStake(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) GetMinUnstake(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getMinUnstake")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) GetMinUnstake() (*big.Int, error) {
	return _Contract.Contract.GetMinUnstake(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) GetMinUnstake() (*big.Int, error) {
	return _Contract.Contract.GetMinUnstake(&_Contract.CallOpts)
}

type ContractClaimExpectedIterator struct {
	Event *ContractClaimExpected

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractClaimExpectedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractClaimExpected)
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
		it.Event = new(ContractClaimExpected)
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

func (it *ContractClaimExpectedIterator) Error() error {
	return it.fail
}

func (it *ContractClaimExpectedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractClaimExpected struct {
	Claimer common.Address
	Value   *big.Int
	Raw     types.Log
}

func (_Contract *ContractFilterer) FilterClaimExpected(opts *bind.FilterOpts, claimer []common.Address) (*ContractClaimExpectedIterator, error) {

	var claimerRule []interface{}
	for _, claimerItem := range claimer {
		claimerRule = append(claimerRule, claimerItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "ClaimExpected", claimerRule)
	if err != nil {
		return nil, err
	}
	return &ContractClaimExpectedIterator{contract: _Contract.contract, event: "ClaimExpected", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchClaimExpected(opts *bind.WatchOpts, sink chan<- *ContractClaimExpected, claimer []common.Address) (event.Subscription, error) {

	var claimerRule []interface{}
	for _, claimerItem := range claimer {
		claimerRule = append(claimerRule, claimerItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "ClaimExpected", claimerRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractClaimExpected)
				if err := _Contract.contract.UnpackLog(event, "ClaimExpected", log); err != nil {
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

func (_Contract *ContractFilterer) ParseClaimExpected(log types.Log) (*ContractClaimExpected, error) {
	event := new(ContractClaimExpected)
	if err := _Contract.contract.UnpackLog(event, "ClaimExpected", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractDepositedIterator struct {
	Event *ContractDeposited

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractDepositedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractDeposited)
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
		it.Event = new(ContractDeposited)
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

func (it *ContractDepositedIterator) Error() error {
	return it.fail
}

func (it *ContractDepositedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractDeposited struct {
	Provider common.Hash
	Pubkeys  [][]byte
	Raw      types.Log
}

func (_Contract *ContractFilterer) FilterDeposited(opts *bind.FilterOpts, provider []string) (*ContractDepositedIterator, error) {

	var providerRule []interface{}
	for _, providerItem := range provider {
		providerRule = append(providerRule, providerItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "Deposited", providerRule)
	if err != nil {
		return nil, err
	}
	return &ContractDepositedIterator{contract: _Contract.contract, event: "Deposited", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchDeposited(opts *bind.WatchOpts, sink chan<- *ContractDeposited, provider []string) (event.Subscription, error) {

	var providerRule []interface{}
	for _, providerItem := range provider {
		providerRule = append(providerRule, providerItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "Deposited", providerRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractDeposited)
				if err := _Contract.contract.UnpackLog(event, "Deposited", log); err != nil {
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

func (_Contract *ContractFilterer) ParseDeposited(log types.Log) (*ContractDeposited, error) {
	event := new(ContractDeposited)
	if err := _Contract.contract.UnpackLog(event, "Deposited", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractDistributeGasLimitChangedIterator struct {
	Event *ContractDistributeGasLimitChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractDistributeGasLimitChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractDistributeGasLimitChanged)
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
		it.Event = new(ContractDistributeGasLimitChanged)
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

func (it *ContractDistributeGasLimitChangedIterator) Error() error {
	return it.fail
}

func (it *ContractDistributeGasLimitChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractDistributeGasLimitChanged struct {
	PrevValue uint32
	NewValue  uint32
	Raw       types.Log
}

func (_Contract *ContractFilterer) FilterDistributeGasLimitChanged(opts *bind.FilterOpts) (*ContractDistributeGasLimitChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "DistributeGasLimitChanged")
	if err != nil {
		return nil, err
	}
	return &ContractDistributeGasLimitChangedIterator{contract: _Contract.contract, event: "DistributeGasLimitChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchDistributeGasLimitChanged(opts *bind.WatchOpts, sink chan<- *ContractDistributeGasLimitChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "DistributeGasLimitChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractDistributeGasLimitChanged)
				if err := _Contract.contract.UnpackLog(event, "DistributeGasLimitChanged", log); err != nil {
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

func (_Contract *ContractFilterer) ParseDistributeGasLimitChanged(log types.Log) (*ContractDistributeGasLimitChanged, error) {
	event := new(ContractDistributeGasLimitChanged)
	if err := _Contract.contract.UnpackLog(event, "DistributeGasLimitChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractFeeClaimedIterator struct {
	Event *ContractFeeClaimed

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractFeeClaimedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractFeeClaimed)
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
		it.Event = new(ContractFeeClaimed)
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

func (it *ContractFeeClaimedIterator) Error() error {
	return it.fail
}

func (it *ContractFeeClaimedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractFeeClaimed struct {
	Restaker     common.Address
	Treasury     common.Address
	Fee          *big.Int
	TotalClaimed *big.Int
	Raw          types.Log
}

func (_Contract *ContractFilterer) FilterFeeClaimed(opts *bind.FilterOpts, restaker []common.Address, treasury []common.Address) (*ContractFeeClaimedIterator, error) {

	var restakerRule []interface{}
	for _, restakerItem := range restaker {
		restakerRule = append(restakerRule, restakerItem)
	}
	var treasuryRule []interface{}
	for _, treasuryItem := range treasury {
		treasuryRule = append(treasuryRule, treasuryItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "FeeClaimed", restakerRule, treasuryRule)
	if err != nil {
		return nil, err
	}
	return &ContractFeeClaimedIterator{contract: _Contract.contract, event: "FeeClaimed", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchFeeClaimed(opts *bind.WatchOpts, sink chan<- *ContractFeeClaimed, restaker []common.Address, treasury []common.Address) (event.Subscription, error) {

	var restakerRule []interface{}
	for _, restakerItem := range restaker {
		restakerRule = append(restakerRule, restakerItem)
	}
	var treasuryRule []interface{}
	for _, treasuryItem := range treasury {
		treasuryRule = append(treasuryRule, treasuryItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "FeeClaimed", restakerRule, treasuryRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractFeeClaimed)
				if err := _Contract.contract.UnpackLog(event, "FeeClaimed", log); err != nil {
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

func (_Contract *ContractFilterer) ParseFeeClaimed(log types.Log) (*ContractFeeClaimed, error) {
	event := new(ContractFeeClaimed)
	if err := _Contract.contract.UnpackLog(event, "FeeClaimed", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractFlashUnstakedIterator struct {
	Event *ContractFlashUnstaked

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractFlashUnstakedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractFlashUnstaked)
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
		it.Event = new(ContractFlashUnstaked)
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

func (it *ContractFlashUnstakedIterator) Error() error {
	return it.fail
}

func (it *ContractFlashUnstakedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractFlashUnstaked struct {
	Sender   common.Address
	Receiver common.Address
	Owner    common.Address
	Amount   *big.Int
	Shares   *big.Int
	Fee      *big.Int
	Raw      types.Log
}

func (_Contract *ContractFilterer) FilterFlashUnstaked(opts *bind.FilterOpts, sender []common.Address, receiver []common.Address, owner []common.Address) (*ContractFlashUnstakedIterator, error) {

	var senderRule []interface{}
	for _, senderItem := range sender {
		senderRule = append(senderRule, senderItem)
	}
	var receiverRule []interface{}
	for _, receiverItem := range receiver {
		receiverRule = append(receiverRule, receiverItem)
	}
	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "FlashUnstaked", senderRule, receiverRule, ownerRule)
	if err != nil {
		return nil, err
	}
	return &ContractFlashUnstakedIterator{contract: _Contract.contract, event: "FlashUnstaked", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchFlashUnstaked(opts *bind.WatchOpts, sink chan<- *ContractFlashUnstaked, sender []common.Address, receiver []common.Address, owner []common.Address) (event.Subscription, error) {

	var senderRule []interface{}
	for _, senderItem := range sender {
		senderRule = append(senderRule, senderItem)
	}
	var receiverRule []interface{}
	for _, receiverItem := range receiver {
		receiverRule = append(receiverRule, receiverItem)
	}
	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "FlashUnstaked", senderRule, receiverRule, ownerRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractFlashUnstaked)
				if err := _Contract.contract.UnpackLog(event, "FlashUnstaked", log); err != nil {
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

func (_Contract *ContractFilterer) ParseFlashUnstaked(log types.Log) (*ContractFlashUnstaked, error) {
	event := new(ContractFlashUnstaked)
	if err := _Contract.contract.UnpackLog(event, "FlashUnstaked", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractMaxTVLChangedIterator struct {
	Event *ContractMaxTVLChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractMaxTVLChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractMaxTVLChanged)
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
		it.Event = new(ContractMaxTVLChanged)
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

func (it *ContractMaxTVLChangedIterator) Error() error {
	return it.fail
}

func (it *ContractMaxTVLChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractMaxTVLChanged struct {
	PrevValue *big.Int
	NewValue  *big.Int
	Raw       types.Log
}

func (_Contract *ContractFilterer) FilterMaxTVLChanged(opts *bind.FilterOpts) (*ContractMaxTVLChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "MaxTVLChanged")
	if err != nil {
		return nil, err
	}
	return &ContractMaxTVLChangedIterator{contract: _Contract.contract, event: "MaxTVLChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchMaxTVLChanged(opts *bind.WatchOpts, sink chan<- *ContractMaxTVLChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "MaxTVLChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractMaxTVLChanged)
				if err := _Contract.contract.UnpackLog(event, "MaxTVLChanged", log); err != nil {
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

func (_Contract *ContractFilterer) ParseMaxTVLChanged(log types.Log) (*ContractMaxTVLChanged, error) {
	event := new(ContractMaxTVLChanged)
	if err := _Contract.contract.UnpackLog(event, "MaxTVLChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractMinStakeChangedIterator struct {
	Event *ContractMinStakeChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractMinStakeChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractMinStakeChanged)
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
		it.Event = new(ContractMinStakeChanged)
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

func (it *ContractMinStakeChangedIterator) Error() error {
	return it.fail
}

func (it *ContractMinStakeChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractMinStakeChanged struct {
	PrevValue *big.Int
	NewValue  *big.Int
	Raw       types.Log
}

func (_Contract *ContractFilterer) FilterMinStakeChanged(opts *bind.FilterOpts) (*ContractMinStakeChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "MinStakeChanged")
	if err != nil {
		return nil, err
	}
	return &ContractMinStakeChangedIterator{contract: _Contract.contract, event: "MinStakeChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchMinStakeChanged(opts *bind.WatchOpts, sink chan<- *ContractMinStakeChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "MinStakeChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractMinStakeChanged)
				if err := _Contract.contract.UnpackLog(event, "MinStakeChanged", log); err != nil {
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

func (_Contract *ContractFilterer) ParseMinStakeChanged(log types.Log) (*ContractMinStakeChanged, error) {
	event := new(ContractMinStakeChanged)
	if err := _Contract.contract.UnpackLog(event, "MinStakeChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractMinUntakeChangedIterator struct {
	Event *ContractMinUntakeChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractMinUntakeChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractMinUntakeChanged)
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
		it.Event = new(ContractMinUntakeChanged)
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

func (it *ContractMinUntakeChangedIterator) Error() error {
	return it.fail
}

func (it *ContractMinUntakeChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractMinUntakeChanged struct {
	PrevValue *big.Int
	NewValue  *big.Int
	Raw       types.Log
}

func (_Contract *ContractFilterer) FilterMinUntakeChanged(opts *bind.FilterOpts) (*ContractMinUntakeChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "MinUntakeChanged")
	if err != nil {
		return nil, err
	}
	return &ContractMinUntakeChangedIterator{contract: _Contract.contract, event: "MinUntakeChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchMinUntakeChanged(opts *bind.WatchOpts, sink chan<- *ContractMinUntakeChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "MinUntakeChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractMinUntakeChanged)
				if err := _Contract.contract.UnpackLog(event, "MinUntakeChanged", log); err != nil {
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

func (_Contract *ContractFilterer) ParseMinUntakeChanged(log types.Log) (*ContractMinUntakeChanged, error) {
	event := new(ContractMinUntakeChanged)
	if err := _Contract.contract.UnpackLog(event, "MinUntakeChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractPendingUnstakeIterator struct {
	Event *ContractPendingUnstake

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractPendingUnstakeIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractPendingUnstake)
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
		it.Event = new(ContractPendingUnstake)
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

func (it *ContractPendingUnstakeIterator) Error() error {
	return it.fail
}

func (it *ContractPendingUnstakeIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractPendingUnstake struct {
	OwnerAddress    common.Address
	ReceiverAddress common.Address
	Amount          *big.Int
	Shares          *big.Int
	Raw             types.Log
}

func (_Contract *ContractFilterer) FilterPendingUnstake(opts *bind.FilterOpts, ownerAddress []common.Address, receiverAddress []common.Address) (*ContractPendingUnstakeIterator, error) {

	var ownerAddressRule []interface{}
	for _, ownerAddressItem := range ownerAddress {
		ownerAddressRule = append(ownerAddressRule, ownerAddressItem)
	}
	var receiverAddressRule []interface{}
	for _, receiverAddressItem := range receiverAddress {
		receiverAddressRule = append(receiverAddressRule, receiverAddressItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "PendingUnstake", ownerAddressRule, receiverAddressRule)
	if err != nil {
		return nil, err
	}
	return &ContractPendingUnstakeIterator{contract: _Contract.contract, event: "PendingUnstake", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchPendingUnstake(opts *bind.WatchOpts, sink chan<- *ContractPendingUnstake, ownerAddress []common.Address, receiverAddress []common.Address) (event.Subscription, error) {

	var ownerAddressRule []interface{}
	for _, ownerAddressItem := range ownerAddress {
		ownerAddressRule = append(ownerAddressRule, ownerAddressItem)
	}
	var receiverAddressRule []interface{}
	for _, receiverAddressItem := range receiverAddress {
		receiverAddressRule = append(receiverAddressRule, receiverAddressItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "PendingUnstake", ownerAddressRule, receiverAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractPendingUnstake)
				if err := _Contract.contract.UnpackLog(event, "PendingUnstake", log); err != nil {
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

func (_Contract *ContractFilterer) ParsePendingUnstake(log types.Log) (*ContractPendingUnstake, error) {
	event := new(ContractPendingUnstake)
	if err := _Contract.contract.UnpackLog(event, "PendingUnstake", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractProtocolFeeChangedIterator struct {
	Event *ContractProtocolFeeChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractProtocolFeeChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractProtocolFeeChanged)
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
		it.Event = new(ContractProtocolFeeChanged)
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

func (it *ContractProtocolFeeChangedIterator) Error() error {
	return it.fail
}

func (it *ContractProtocolFeeChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractProtocolFeeChanged struct {
	PrevValue *big.Int
	NewValue  *big.Int
	Raw       types.Log
}

func (_Contract *ContractFilterer) FilterProtocolFeeChanged(opts *bind.FilterOpts) (*ContractProtocolFeeChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "ProtocolFeeChanged")
	if err != nil {
		return nil, err
	}
	return &ContractProtocolFeeChangedIterator{contract: _Contract.contract, event: "ProtocolFeeChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchProtocolFeeChanged(opts *bind.WatchOpts, sink chan<- *ContractProtocolFeeChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "ProtocolFeeChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractProtocolFeeChanged)
				if err := _Contract.contract.UnpackLog(event, "ProtocolFeeChanged", log); err != nil {
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

func (_Contract *ContractFilterer) ParseProtocolFeeChanged(log types.Log) (*ContractProtocolFeeChanged, error) {
	event := new(ContractProtocolFeeChanged)
	if err := _Contract.contract.UnpackLog(event, "ProtocolFeeChanged", log); err != nil {
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

type ContractReferralStakeIterator struct {
	Event *ContractReferralStake

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractReferralStakeIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractReferralStake)
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
		it.Event = new(ContractReferralStake)
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

func (it *ContractReferralStakeIterator) Error() error {
	return it.fail
}

func (it *ContractReferralStakeIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractReferralStake struct {
	Code [32]byte
	Raw  types.Log
}

func (_Contract *ContractFilterer) FilterReferralStake(opts *bind.FilterOpts, code [][32]byte) (*ContractReferralStakeIterator, error) {

	var codeRule []interface{}
	for _, codeItem := range code {
		codeRule = append(codeRule, codeItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "ReferralStake", codeRule)
	if err != nil {
		return nil, err
	}
	return &ContractReferralStakeIterator{contract: _Contract.contract, event: "ReferralStake", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchReferralStake(opts *bind.WatchOpts, sink chan<- *ContractReferralStake, code [][32]byte) (event.Subscription, error) {

	var codeRule []interface{}
	for _, codeItem := range code {
		codeRule = append(codeRule, codeItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "ReferralStake", codeRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractReferralStake)
				if err := _Contract.contract.UnpackLog(event, "ReferralStake", log); err != nil {
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

func (_Contract *ContractFilterer) ParseReferralStake(log types.Log) (*ContractReferralStake, error) {
	event := new(ContractReferralStake)
	if err := _Contract.contract.UnpackLog(event, "ReferralStake", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractRestakerAddedIterator struct {
	Event *ContractRestakerAdded

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractRestakerAddedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractRestakerAdded)
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
		it.Event = new(ContractRestakerAdded)
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

func (it *ContractRestakerAddedIterator) Error() error {
	return it.fail
}

func (it *ContractRestakerAddedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractRestakerAdded struct {
	Provider common.Hash
	Restaker common.Address
	Raw      types.Log
}

func (_Contract *ContractFilterer) FilterRestakerAdded(opts *bind.FilterOpts, provider []string) (*ContractRestakerAddedIterator, error) {

	var providerRule []interface{}
	for _, providerItem := range provider {
		providerRule = append(providerRule, providerItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "RestakerAdded", providerRule)
	if err != nil {
		return nil, err
	}
	return &ContractRestakerAddedIterator{contract: _Contract.contract, event: "RestakerAdded", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchRestakerAdded(opts *bind.WatchOpts, sink chan<- *ContractRestakerAdded, provider []string) (event.Subscription, error) {

	var providerRule []interface{}
	for _, providerItem := range provider {
		providerRule = append(providerRule, providerItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "RestakerAdded", providerRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractRestakerAdded)
				if err := _Contract.contract.UnpackLog(event, "RestakerAdded", log); err != nil {
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

func (_Contract *ContractFilterer) ParseRestakerAdded(log types.Log) (*ContractRestakerAdded, error) {
	event := new(ContractRestakerAdded)
	if err := _Contract.contract.UnpackLog(event, "RestakerAdded", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractStakeBonusIterator struct {
	Event *ContractStakeBonus

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractStakeBonusIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractStakeBonus)
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
		it.Event = new(ContractStakeBonus)
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

func (it *ContractStakeBonusIterator) Error() error {
	return it.fail
}

func (it *ContractStakeBonusIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractStakeBonus struct {
	Amount *big.Int
	Raw    types.Log
}

func (_Contract *ContractFilterer) FilterStakeBonus(opts *bind.FilterOpts) (*ContractStakeBonusIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "StakeBonus")
	if err != nil {
		return nil, err
	}
	return &ContractStakeBonusIterator{contract: _Contract.contract, event: "StakeBonus", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchStakeBonus(opts *bind.WatchOpts, sink chan<- *ContractStakeBonus) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "StakeBonus")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractStakeBonus)
				if err := _Contract.contract.UnpackLog(event, "StakeBonus", log); err != nil {
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

func (_Contract *ContractFilterer) ParseStakeBonus(log types.Log) (*ContractStakeBonus, error) {
	event := new(ContractStakeBonus)
	if err := _Contract.contract.UnpackLog(event, "StakeBonus", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractStakeBonusParamsChangedIterator struct {
	Event *ContractStakeBonusParamsChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractStakeBonusParamsChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractStakeBonusParamsChanged)
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
		it.Event = new(ContractStakeBonusParamsChanged)
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

func (it *ContractStakeBonusParamsChangedIterator) Error() error {
	return it.fail
}

func (it *ContractStakeBonusParamsChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractStakeBonusParamsChanged struct {
	NewMaxBonusRate           *big.Int
	NewOptimalBonusRate       *big.Int
	NewDepositUtilizationKink *big.Int
	Raw                       types.Log
}

func (_Contract *ContractFilterer) FilterStakeBonusParamsChanged(opts *bind.FilterOpts) (*ContractStakeBonusParamsChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "StakeBonusParamsChanged")
	if err != nil {
		return nil, err
	}
	return &ContractStakeBonusParamsChangedIterator{contract: _Contract.contract, event: "StakeBonusParamsChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchStakeBonusParamsChanged(opts *bind.WatchOpts, sink chan<- *ContractStakeBonusParamsChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "StakeBonusParamsChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractStakeBonusParamsChanged)
				if err := _Contract.contract.UnpackLog(event, "StakeBonusParamsChanged", log); err != nil {
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

func (_Contract *ContractFilterer) ParseStakeBonusParamsChanged(log types.Log) (*ContractStakeBonusParamsChanged, error) {
	event := new(ContractStakeBonusParamsChanged)
	if err := _Contract.contract.UnpackLog(event, "StakeBonusParamsChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractStakedIterator struct {
	Event *ContractStaked

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractStakedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractStaked)
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
		it.Event = new(ContractStaked)
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

func (it *ContractStakedIterator) Error() error {
	return it.fail
}

func (it *ContractStakedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractStaked struct {
	Staker common.Address
	Amount *big.Int
	Shares *big.Int
	Raw    types.Log
}

func (_Contract *ContractFilterer) FilterStaked(opts *bind.FilterOpts, staker []common.Address) (*ContractStakedIterator, error) {

	var stakerRule []interface{}
	for _, stakerItem := range staker {
		stakerRule = append(stakerRule, stakerItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "Staked", stakerRule)
	if err != nil {
		return nil, err
	}
	return &ContractStakedIterator{contract: _Contract.contract, event: "Staked", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchStaked(opts *bind.WatchOpts, sink chan<- *ContractStaked, staker []common.Address) (event.Subscription, error) {

	var stakerRule []interface{}
	for _, stakerItem := range staker {
		stakerRule = append(stakerRule, stakerItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "Staked", stakerRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractStaked)
				if err := _Contract.contract.UnpackLog(event, "Staked", log); err != nil {
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

func (_Contract *ContractFilterer) ParseStaked(log types.Log) (*ContractStaked, error) {
	event := new(ContractStaked)
	if err := _Contract.contract.UnpackLog(event, "Staked", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractTargetCapacityChangedIterator struct {
	Event *ContractTargetCapacityChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractTargetCapacityChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractTargetCapacityChanged)
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
		it.Event = new(ContractTargetCapacityChanged)
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

func (it *ContractTargetCapacityChangedIterator) Error() error {
	return it.fail
}

func (it *ContractTargetCapacityChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractTargetCapacityChanged struct {
	PrevValue *big.Int
	NewValue  *big.Int
	Raw       types.Log
}

func (_Contract *ContractFilterer) FilterTargetCapacityChanged(opts *bind.FilterOpts) (*ContractTargetCapacityChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "TargetCapacityChanged")
	if err != nil {
		return nil, err
	}
	return &ContractTargetCapacityChangedIterator{contract: _Contract.contract, event: "TargetCapacityChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchTargetCapacityChanged(opts *bind.WatchOpts, sink chan<- *ContractTargetCapacityChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "TargetCapacityChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractTargetCapacityChanged)
				if err := _Contract.contract.UnpackLog(event, "TargetCapacityChanged", log); err != nil {
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

func (_Contract *ContractFilterer) ParseTargetCapacityChanged(log types.Log) (*ContractTargetCapacityChanged, error) {
	event := new(ContractTargetCapacityChanged)
	if err := _Contract.contract.UnpackLog(event, "TargetCapacityChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractUnstakeClaimedIterator struct {
	Event *ContractUnstakeClaimed

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractUnstakeClaimedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractUnstakeClaimed)
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
		it.Event = new(ContractUnstakeClaimed)
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

func (it *ContractUnstakeClaimedIterator) Error() error {
	return it.fail
}

func (it *ContractUnstakeClaimedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractUnstakeClaimed struct {
	Claimer common.Address
	Caller  common.Address
	Value   *big.Int
	Raw     types.Log
}

func (_Contract *ContractFilterer) FilterUnstakeClaimed(opts *bind.FilterOpts, claimer []common.Address, caller []common.Address) (*ContractUnstakeClaimedIterator, error) {

	var claimerRule []interface{}
	for _, claimerItem := range claimer {
		claimerRule = append(claimerRule, claimerItem)
	}
	var callerRule []interface{}
	for _, callerItem := range caller {
		callerRule = append(callerRule, callerItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "UnstakeClaimed", claimerRule, callerRule)
	if err != nil {
		return nil, err
	}
	return &ContractUnstakeClaimedIterator{contract: _Contract.contract, event: "UnstakeClaimed", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchUnstakeClaimed(opts *bind.WatchOpts, sink chan<- *ContractUnstakeClaimed, claimer []common.Address, caller []common.Address) (event.Subscription, error) {

	var claimerRule []interface{}
	for _, claimerItem := range claimer {
		claimerRule = append(claimerRule, claimerItem)
	}
	var callerRule []interface{}
	for _, callerItem := range caller {
		callerRule = append(callerRule, callerItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "UnstakeClaimed", claimerRule, callerRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractUnstakeClaimed)
				if err := _Contract.contract.UnpackLog(event, "UnstakeClaimed", log); err != nil {
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

func (_Contract *ContractFilterer) ParseUnstakeClaimed(log types.Log) (*ContractUnstakeClaimed, error) {
	event := new(ContractUnstakeClaimed)
	if err := _Contract.contract.UnpackLog(event, "UnstakeClaimed", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractUnstakeFeeParamsChangedIterator struct {
	Event *ContractUnstakeFeeParamsChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractUnstakeFeeParamsChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractUnstakeFeeParamsChanged)
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
		it.Event = new(ContractUnstakeFeeParamsChanged)
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

func (it *ContractUnstakeFeeParamsChangedIterator) Error() error {
	return it.fail
}

func (it *ContractUnstakeFeeParamsChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractUnstakeFeeParamsChanged struct {
	NewMaxFlashFeeRate         *big.Int
	NewOptimalWithdrawalRate   *big.Int
	NewWithdrawUtilizationKink *big.Int
	Raw                        types.Log
}

func (_Contract *ContractFilterer) FilterUnstakeFeeParamsChanged(opts *bind.FilterOpts) (*ContractUnstakeFeeParamsChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "UnstakeFeeParamsChanged")
	if err != nil {
		return nil, err
	}
	return &ContractUnstakeFeeParamsChangedIterator{contract: _Contract.contract, event: "UnstakeFeeParamsChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchUnstakeFeeParamsChanged(opts *bind.WatchOpts, sink chan<- *ContractUnstakeFeeParamsChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "UnstakeFeeParamsChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractUnstakeFeeParamsChanged)
				if err := _Contract.contract.UnpackLog(event, "UnstakeFeeParamsChanged", log); err != nil {
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

func (_Contract *ContractFilterer) ParseUnstakeFeeParamsChanged(log types.Log) (*ContractUnstakeFeeParamsChanged, error) {
	event := new(ContractUnstakeFeeParamsChanged)
	if err := _Contract.contract.UnpackLog(event, "UnstakeFeeParamsChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractUnstakedIterator struct {
	Event *ContractUnstaked

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractUnstakedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractUnstaked)
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
		it.Event = new(ContractUnstaked)
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

func (it *ContractUnstakedIterator) Error() error {
	return it.fail
}

func (it *ContractUnstakedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractUnstaked struct {
	From   common.Address
	To     common.Address
	Amount *big.Int
	Shares *big.Int
	Raw    types.Log
}

func (_Contract *ContractFilterer) FilterUnstaked(opts *bind.FilterOpts, from []common.Address, to []common.Address) (*ContractUnstakedIterator, error) {

	var fromRule []interface{}
	for _, fromItem := range from {
		fromRule = append(fromRule, fromItem)
	}
	var toRule []interface{}
	for _, toItem := range to {
		toRule = append(toRule, toItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "Unstaked", fromRule, toRule)
	if err != nil {
		return nil, err
	}
	return &ContractUnstakedIterator{contract: _Contract.contract, event: "Unstaked", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchUnstaked(opts *bind.WatchOpts, sink chan<- *ContractUnstaked, from []common.Address, to []common.Address) (event.Subscription, error) {

	var fromRule []interface{}
	for _, fromItem := range from {
		fromRule = append(fromRule, fromItem)
	}
	var toRule []interface{}
	for _, toItem := range to {
		toRule = append(toRule, toItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "Unstaked", fromRule, toRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractUnstaked)
				if err := _Contract.contract.UnpackLog(event, "Unstaked", log); err != nil {
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

func (_Contract *ContractFilterer) ParseUnstaked(log types.Log) (*ContractUnstaked, error) {
	event := new(ContractUnstaked)
	if err := _Contract.contract.UnpackLog(event, "Unstaked", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractUnstakesDistributedIterator struct {
	Event *ContractUnstakesDistributed

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractUnstakesDistributedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractUnstakesDistributed)
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
		it.Event = new(ContractUnstakesDistributed)
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

func (it *ContractUnstakesDistributedIterator) Error() error {
	return it.fail
}

func (it *ContractUnstakesDistributedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractUnstakesDistributed struct {
	Unstakes []IRestakingPoolUnstake
	Raw      types.Log
}

func (_Contract *ContractFilterer) FilterUnstakesDistributed(opts *bind.FilterOpts) (*ContractUnstakesDistributedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "UnstakesDistributed")
	if err != nil {
		return nil, err
	}
	return &ContractUnstakesDistributedIterator{contract: _Contract.contract, event: "UnstakesDistributed", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchUnstakesDistributed(opts *bind.WatchOpts, sink chan<- *ContractUnstakesDistributed) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "UnstakesDistributed")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractUnstakesDistributed)
				if err := _Contract.contract.UnpackLog(event, "UnstakesDistributed", log); err != nil {
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

func (_Contract *ContractFilterer) ParseUnstakesDistributed(log types.Log) (*ContractUnstakesDistributed, error) {
	event := new(ContractUnstakesDistributed)
	if err := _Contract.contract.UnpackLog(event, "UnstakesDistributed", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

func (_Contract *Contract) ParseLog(log types.Log) (generated.AbigenLog, error) {
	switch log.Topics[0] {
	case _Contract.abi.Events["ClaimExpected"].ID:
		return _Contract.ParseClaimExpected(log)
	case _Contract.abi.Events["Deposited"].ID:
		return _Contract.ParseDeposited(log)
	case _Contract.abi.Events["DistributeGasLimitChanged"].ID:
		return _Contract.ParseDistributeGasLimitChanged(log)
	case _Contract.abi.Events["FeeClaimed"].ID:
		return _Contract.ParseFeeClaimed(log)
	case _Contract.abi.Events["FlashUnstaked"].ID:
		return _Contract.ParseFlashUnstaked(log)
	case _Contract.abi.Events["MaxTVLChanged"].ID:
		return _Contract.ParseMaxTVLChanged(log)
	case _Contract.abi.Events["MinStakeChanged"].ID:
		return _Contract.ParseMinStakeChanged(log)
	case _Contract.abi.Events["MinUntakeChanged"].ID:
		return _Contract.ParseMinUntakeChanged(log)
	case _Contract.abi.Events["PendingUnstake"].ID:
		return _Contract.ParsePendingUnstake(log)
	case _Contract.abi.Events["ProtocolFeeChanged"].ID:
		return _Contract.ParseProtocolFeeChanged(log)
	case _Contract.abi.Events["Received"].ID:
		return _Contract.ParseReceived(log)
	case _Contract.abi.Events["ReferralStake"].ID:
		return _Contract.ParseReferralStake(log)
	case _Contract.abi.Events["RestakerAdded"].ID:
		return _Contract.ParseRestakerAdded(log)
	case _Contract.abi.Events["StakeBonus"].ID:
		return _Contract.ParseStakeBonus(log)
	case _Contract.abi.Events["StakeBonusParamsChanged"].ID:
		return _Contract.ParseStakeBonusParamsChanged(log)
	case _Contract.abi.Events["Staked"].ID:
		return _Contract.ParseStaked(log)
	case _Contract.abi.Events["TargetCapacityChanged"].ID:
		return _Contract.ParseTargetCapacityChanged(log)
	case _Contract.abi.Events["UnstakeClaimed"].ID:
		return _Contract.ParseUnstakeClaimed(log)
	case _Contract.abi.Events["UnstakeFeeParamsChanged"].ID:
		return _Contract.ParseUnstakeFeeParamsChanged(log)
	case _Contract.abi.Events["Unstaked"].ID:
		return _Contract.ParseUnstaked(log)
	case _Contract.abi.Events["UnstakesDistributed"].ID:
		return _Contract.ParseUnstakesDistributed(log)

	default:
		return nil, fmt.Errorf("abigen wrapper received unknown log topic: %v", log.Topics[0])
	}
}

func (ContractClaimExpected) Topic() common.Hash {
	return common.HexToHash("0xf4426c1412b22225874f3898e67e34c12ba628bff6d89fd87ba593927a80b421")
}

func (ContractDeposited) Topic() common.Hash {
	return common.HexToHash("0x82893d4437db377df0abca554a4a9ef54de226c99efe74077b214d6d3390e7dd")
}

func (ContractDistributeGasLimitChanged) Topic() common.Hash {
	return common.HexToHash("0x55c1474264b8038534b3e34b09a3a99d1f3436634d4e34fa13cea4c33c9a832e")
}

func (ContractFeeClaimed) Topic() common.Hash {
	return common.HexToHash("0x2ee827557318e24ad8fdb9f616bbfd73b44656ea23439623780d719c369f0c1d")
}

func (ContractFlashUnstaked) Topic() common.Hash {
	return common.HexToHash("0x628a6f39215835333501afcce023c08e1e61c026768b46f5076804d344e023e3")
}

func (ContractMaxTVLChanged) Topic() common.Hash {
	return common.HexToHash("0x3e6e3950c3fc7a0bbe5c0ded9285010d1c1ef843817fed86973510375eb07418")
}

func (ContractMinStakeChanged) Topic() common.Hash {
	return common.HexToHash("0xca11c8a4c461b60c9f485404c272650c2aaae260b2067d72e9924abb68556593")
}

func (ContractMinUntakeChanged) Topic() common.Hash {
	return common.HexToHash("0x8bdf1717dd354dbbe463f6106e79cd3ab4553f582ea47512f268d9470fc93609")
}

func (ContractPendingUnstake) Topic() common.Hash {
	return common.HexToHash("0xe8f73d529f5ced08581a2c18456a6530dbd0dddf94d8c98e0ab8f9883e2f4482")
}

func (ContractProtocolFeeChanged) Topic() common.Hash {
	return common.HexToHash("0xb51bef650ff5ad43303dbe2e500a74d4fd1bdc9ae05f046bece330e82ae0ba87")
}

func (ContractReceived) Topic() common.Hash {
	return common.HexToHash("0x88a5966d370b9919b20f3e2c13ff65706f196a4e32cc2c12bf57088f88525874")
}

func (ContractReferralStake) Topic() common.Hash {
	return common.HexToHash("0x8c355e502e4eade8ac341bcb08dcfca0ae238efe6431e5a63b75be9026d9163b")
}

func (ContractRestakerAdded) Topic() common.Hash {
	return common.HexToHash("0x187f9ad308b4b25229d086a632166f351b45905117cc3162fb9ec6873b9a9ce8")
}

func (ContractStakeBonus) Topic() common.Hash {
	return common.HexToHash("0x98b37da5bc0dc3a6af25a940988aef0df1a74411148692d8d74aa06665817305")
}

func (ContractStakeBonusParamsChanged) Topic() common.Hash {
	return common.HexToHash("0xbdd363e1b2c509839731ca7a94e48c8835b6de783af60bbfaeb08b9ba3862bea")
}

func (ContractStaked) Topic() common.Hash {
	return common.HexToHash("0x1449c6dd7851abc30abf37f57715f492010519147cc2652fbc38202c18a6ee90")
}

func (ContractTargetCapacityChanged) Topic() common.Hash {
	return common.HexToHash("0xbf127022ae43ce46c7042f13c6e64c507f75f20314c2aee1b03b0cf208a10f39")
}

func (ContractUnstakeClaimed) Topic() common.Hash {
	return common.HexToHash("0xebc6a30f46090cafd1f043241dbc148c4310b7026aae29ff950ea25a5411879b")
}

func (ContractUnstakeFeeParamsChanged) Topic() common.Hash {
	return common.HexToHash("0xf3f49a7eaa29cb38bb074c44803e3ef1f47960b9529ee0c0a3aa47c0d4f93a9d")
}

func (ContractUnstaked) Topic() common.Hash {
	return common.HexToHash("0x06cc7e90b4f2b554a9614b0caa84f909f3498c820ae47c731f490c28c07f7d3b")
}

func (ContractUnstakesDistributed) Topic() common.Hash {
	return common.HexToHash("0xdb6e8b10a6c30551abbedf583209f3ba034b0fe65db6848390a5af4816a2eaa0")
}

func (_Contract *Contract) Address() common.Address {
	return _Contract.address
}

type ContractInterface interface {
	GetMinStake(opts *bind.CallOpts) (*big.Int, error)

	GetMinUnstake(opts *bind.CallOpts) (*big.Int, error)

	FilterClaimExpected(opts *bind.FilterOpts, claimer []common.Address) (*ContractClaimExpectedIterator, error)

	WatchClaimExpected(opts *bind.WatchOpts, sink chan<- *ContractClaimExpected, claimer []common.Address) (event.Subscription, error)

	ParseClaimExpected(log types.Log) (*ContractClaimExpected, error)

	FilterDeposited(opts *bind.FilterOpts, provider []string) (*ContractDepositedIterator, error)

	WatchDeposited(opts *bind.WatchOpts, sink chan<- *ContractDeposited, provider []string) (event.Subscription, error)

	ParseDeposited(log types.Log) (*ContractDeposited, error)

	FilterDistributeGasLimitChanged(opts *bind.FilterOpts) (*ContractDistributeGasLimitChangedIterator, error)

	WatchDistributeGasLimitChanged(opts *bind.WatchOpts, sink chan<- *ContractDistributeGasLimitChanged) (event.Subscription, error)

	ParseDistributeGasLimitChanged(log types.Log) (*ContractDistributeGasLimitChanged, error)

	FilterFeeClaimed(opts *bind.FilterOpts, restaker []common.Address, treasury []common.Address) (*ContractFeeClaimedIterator, error)

	WatchFeeClaimed(opts *bind.WatchOpts, sink chan<- *ContractFeeClaimed, restaker []common.Address, treasury []common.Address) (event.Subscription, error)

	ParseFeeClaimed(log types.Log) (*ContractFeeClaimed, error)

	FilterFlashUnstaked(opts *bind.FilterOpts, sender []common.Address, receiver []common.Address, owner []common.Address) (*ContractFlashUnstakedIterator, error)

	WatchFlashUnstaked(opts *bind.WatchOpts, sink chan<- *ContractFlashUnstaked, sender []common.Address, receiver []common.Address, owner []common.Address) (event.Subscription, error)

	ParseFlashUnstaked(log types.Log) (*ContractFlashUnstaked, error)

	FilterMaxTVLChanged(opts *bind.FilterOpts) (*ContractMaxTVLChangedIterator, error)

	WatchMaxTVLChanged(opts *bind.WatchOpts, sink chan<- *ContractMaxTVLChanged) (event.Subscription, error)

	ParseMaxTVLChanged(log types.Log) (*ContractMaxTVLChanged, error)

	FilterMinStakeChanged(opts *bind.FilterOpts) (*ContractMinStakeChangedIterator, error)

	WatchMinStakeChanged(opts *bind.WatchOpts, sink chan<- *ContractMinStakeChanged) (event.Subscription, error)

	ParseMinStakeChanged(log types.Log) (*ContractMinStakeChanged, error)

	FilterMinUntakeChanged(opts *bind.FilterOpts) (*ContractMinUntakeChangedIterator, error)

	WatchMinUntakeChanged(opts *bind.WatchOpts, sink chan<- *ContractMinUntakeChanged) (event.Subscription, error)

	ParseMinUntakeChanged(log types.Log) (*ContractMinUntakeChanged, error)

	FilterPendingUnstake(opts *bind.FilterOpts, ownerAddress []common.Address, receiverAddress []common.Address) (*ContractPendingUnstakeIterator, error)

	WatchPendingUnstake(opts *bind.WatchOpts, sink chan<- *ContractPendingUnstake, ownerAddress []common.Address, receiverAddress []common.Address) (event.Subscription, error)

	ParsePendingUnstake(log types.Log) (*ContractPendingUnstake, error)

	FilterProtocolFeeChanged(opts *bind.FilterOpts) (*ContractProtocolFeeChangedIterator, error)

	WatchProtocolFeeChanged(opts *bind.WatchOpts, sink chan<- *ContractProtocolFeeChanged) (event.Subscription, error)

	ParseProtocolFeeChanged(log types.Log) (*ContractProtocolFeeChanged, error)

	FilterReceived(opts *bind.FilterOpts, sender []common.Address) (*ContractReceivedIterator, error)

	WatchReceived(opts *bind.WatchOpts, sink chan<- *ContractReceived, sender []common.Address) (event.Subscription, error)

	ParseReceived(log types.Log) (*ContractReceived, error)

	FilterReferralStake(opts *bind.FilterOpts, code [][32]byte) (*ContractReferralStakeIterator, error)

	WatchReferralStake(opts *bind.WatchOpts, sink chan<- *ContractReferralStake, code [][32]byte) (event.Subscription, error)

	ParseReferralStake(log types.Log) (*ContractReferralStake, error)

	FilterRestakerAdded(opts *bind.FilterOpts, provider []string) (*ContractRestakerAddedIterator, error)

	WatchRestakerAdded(opts *bind.WatchOpts, sink chan<- *ContractRestakerAdded, provider []string) (event.Subscription, error)

	ParseRestakerAdded(log types.Log) (*ContractRestakerAdded, error)

	FilterStakeBonus(opts *bind.FilterOpts) (*ContractStakeBonusIterator, error)

	WatchStakeBonus(opts *bind.WatchOpts, sink chan<- *ContractStakeBonus) (event.Subscription, error)

	ParseStakeBonus(log types.Log) (*ContractStakeBonus, error)

	FilterStakeBonusParamsChanged(opts *bind.FilterOpts) (*ContractStakeBonusParamsChangedIterator, error)

	WatchStakeBonusParamsChanged(opts *bind.WatchOpts, sink chan<- *ContractStakeBonusParamsChanged) (event.Subscription, error)

	ParseStakeBonusParamsChanged(log types.Log) (*ContractStakeBonusParamsChanged, error)

	FilterStaked(opts *bind.FilterOpts, staker []common.Address) (*ContractStakedIterator, error)

	WatchStaked(opts *bind.WatchOpts, sink chan<- *ContractStaked, staker []common.Address) (event.Subscription, error)

	ParseStaked(log types.Log) (*ContractStaked, error)

	FilterTargetCapacityChanged(opts *bind.FilterOpts) (*ContractTargetCapacityChangedIterator, error)

	WatchTargetCapacityChanged(opts *bind.WatchOpts, sink chan<- *ContractTargetCapacityChanged) (event.Subscription, error)

	ParseTargetCapacityChanged(log types.Log) (*ContractTargetCapacityChanged, error)

	FilterUnstakeClaimed(opts *bind.FilterOpts, claimer []common.Address, caller []common.Address) (*ContractUnstakeClaimedIterator, error)

	WatchUnstakeClaimed(opts *bind.WatchOpts, sink chan<- *ContractUnstakeClaimed, claimer []common.Address, caller []common.Address) (event.Subscription, error)

	ParseUnstakeClaimed(log types.Log) (*ContractUnstakeClaimed, error)

	FilterUnstakeFeeParamsChanged(opts *bind.FilterOpts) (*ContractUnstakeFeeParamsChangedIterator, error)

	WatchUnstakeFeeParamsChanged(opts *bind.WatchOpts, sink chan<- *ContractUnstakeFeeParamsChanged) (event.Subscription, error)

	ParseUnstakeFeeParamsChanged(log types.Log) (*ContractUnstakeFeeParamsChanged, error)

	FilterUnstaked(opts *bind.FilterOpts, from []common.Address, to []common.Address) (*ContractUnstakedIterator, error)

	WatchUnstaked(opts *bind.WatchOpts, sink chan<- *ContractUnstaked, from []common.Address, to []common.Address) (event.Subscription, error)

	ParseUnstaked(log types.Log) (*ContractUnstaked, error)

	FilterUnstakesDistributed(opts *bind.FilterOpts) (*ContractUnstakesDistributedIterator, error)

	WatchUnstakesDistributed(opts *bind.WatchOpts, sink chan<- *ContractUnstakesDistributed) (event.Subscription, error)

	ParseUnstakesDistributed(log types.Log) (*ContractUnstakesDistributed, error)

	ParseLog(log types.Log) (generated.AbigenLog, error)

	Address() common.Address
}
