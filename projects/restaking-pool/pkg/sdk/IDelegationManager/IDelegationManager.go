// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package IDelegationManager

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

type IDelegationManagerOperatorDetails struct {
	EarningsReceiver         common.Address
	DelegationApprover       common.Address
	StakerOptOutWindowBlocks uint32
}

type IDelegationManagerQueuedWithdrawalParams struct {
	Strategies []common.Address
	Shares     []*big.Int
	Withdrawer common.Address
}

type IDelegationManagerWithdrawal struct {
	Staker      common.Address
	DelegatedTo common.Address
	Withdrawer  common.Address
	Nonce       *big.Int
	StartBlock  uint32
	Strategies  []common.Address
	Shares      []*big.Int
}

type ISignatureUtilsSignatureWithExpiry struct {
	Signature []byte
	Expiry    *big.Int
}

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
	ABI: "[{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"previousValue\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newValue\",\"type\":\"uint256\"}],\"name\":\"MinWithdrawalDelayBlocksSet\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"components\":[{\"internalType\":\"address\",\"name\":\"earningsReceiver\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"delegationApprover\",\"type\":\"address\"},{\"internalType\":\"uint32\",\"name\":\"stakerOptOutWindowBlocks\",\"type\":\"uint32\"}],\"indexed\":false,\"internalType\":\"structIDelegationManager.OperatorDetails\",\"name\":\"newOperatorDetails\",\"type\":\"tuple\"}],\"name\":\"OperatorDetailsModified\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"metadataURI\",\"type\":\"string\"}],\"name\":\"OperatorMetadataURIUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"components\":[{\"internalType\":\"address\",\"name\":\"earningsReceiver\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"delegationApprover\",\"type\":\"address\"},{\"internalType\":\"uint32\",\"name\":\"stakerOptOutWindowBlocks\",\"type\":\"uint32\"}],\"indexed\":false,\"internalType\":\"structIDelegationManager.OperatorDetails\",\"name\":\"operatorDetails\",\"type\":\"tuple\"}],\"name\":\"OperatorRegistered\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"contractIStrategy\",\"name\":\"strategy\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"}],\"name\":\"OperatorSharesDecreased\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"contractIStrategy\",\"name\":\"strategy\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"}],\"name\":\"OperatorSharesIncreased\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"}],\"name\":\"StakerDelegated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"}],\"name\":\"StakerForceUndelegated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"}],\"name\":\"StakerUndelegated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"contractIStrategy\",\"name\":\"strategy\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"previousValue\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newValue\",\"type\":\"uint256\"}],\"name\":\"StrategyWithdrawalDelayBlocksSet\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"bytes32\",\"name\":\"withdrawalRoot\",\"type\":\"bytes32\"}],\"name\":\"WithdrawalCompleted\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"bytes32\",\"name\":\"oldWithdrawalRoot\",\"type\":\"bytes32\"},{\"indexed\":false,\"internalType\":\"bytes32\",\"name\":\"newWithdrawalRoot\",\"type\":\"bytes32\"}],\"name\":\"WithdrawalMigrated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"bytes32\",\"name\":\"withdrawalRoot\",\"type\":\"bytes32\"},{\"components\":[{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"delegatedTo\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"withdrawer\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"nonce\",\"type\":\"uint256\"},{\"internalType\":\"uint32\",\"name\":\"startBlock\",\"type\":\"uint32\"},{\"internalType\":\"contractIStrategy[]\",\"name\":\"strategies\",\"type\":\"address[]\"},{\"internalType\":\"uint256[]\",\"name\":\"shares\",\"type\":\"uint256[]\"}],\"indexed\":false,\"internalType\":\"structIDelegationManager.Withdrawal\",\"name\":\"withdrawal\",\"type\":\"tuple\"}],\"name\":\"WithdrawalQueued\",\"type\":\"event\"},{\"inputs\":[],\"name\":\"DELEGATION_APPROVAL_TYPEHASH\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"DOMAIN_TYPEHASH\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"STAKER_DELEGATION_TYPEHASH\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"expiry\",\"type\":\"uint256\"}],\"name\":\"calculateCurrentStakerDelegationDigestHash\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_delegationApprover\",\"type\":\"address\"},{\"internalType\":\"bytes32\",\"name\":\"approverSalt\",\"type\":\"bytes32\"},{\"internalType\":\"uint256\",\"name\":\"expiry\",\"type\":\"uint256\"}],\"name\":\"calculateDelegationApprovalDigestHash\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_stakerNonce\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"expiry\",\"type\":\"uint256\"}],\"name\":\"calculateStakerDelegationDigestHash\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"components\":[{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"delegatedTo\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"withdrawer\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"nonce\",\"type\":\"uint256\"},{\"internalType\":\"uint32\",\"name\":\"startBlock\",\"type\":\"uint32\"},{\"internalType\":\"contractIStrategy[]\",\"name\":\"strategies\",\"type\":\"address[]\"},{\"internalType\":\"uint256[]\",\"name\":\"shares\",\"type\":\"uint256[]\"}],\"internalType\":\"structIDelegationManager.Withdrawal\",\"name\":\"withdrawal\",\"type\":\"tuple\"}],\"name\":\"calculateWithdrawalRoot\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"pure\",\"type\":\"function\"},{\"inputs\":[{\"components\":[{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"delegatedTo\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"withdrawer\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"nonce\",\"type\":\"uint256\"},{\"internalType\":\"uint32\",\"name\":\"startBlock\",\"type\":\"uint32\"},{\"internalType\":\"contractIStrategy[]\",\"name\":\"strategies\",\"type\":\"address[]\"},{\"internalType\":\"uint256[]\",\"name\":\"shares\",\"type\":\"uint256[]\"}],\"internalType\":\"structIDelegationManager.Withdrawal\",\"name\":\"withdrawal\",\"type\":\"tuple\"},{\"internalType\":\"contractIERC20[]\",\"name\":\"tokens\",\"type\":\"address[]\"},{\"internalType\":\"uint256\",\"name\":\"middlewareTimesIndex\",\"type\":\"uint256\"},{\"internalType\":\"bool\",\"name\":\"receiveAsTokens\",\"type\":\"bool\"}],\"name\":\"completeQueuedWithdrawal\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"components\":[{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"delegatedTo\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"withdrawer\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"nonce\",\"type\":\"uint256\"},{\"internalType\":\"uint32\",\"name\":\"startBlock\",\"type\":\"uint32\"},{\"internalType\":\"contractIStrategy[]\",\"name\":\"strategies\",\"type\":\"address[]\"},{\"internalType\":\"uint256[]\",\"name\":\"shares\",\"type\":\"uint256[]\"}],\"internalType\":\"structIDelegationManager.Withdrawal[]\",\"name\":\"withdrawals\",\"type\":\"tuple[]\"},{\"internalType\":\"contractIERC20[][]\",\"name\":\"tokens\",\"type\":\"address[][]\"},{\"internalType\":\"uint256[]\",\"name\":\"middlewareTimesIndexes\",\"type\":\"uint256[]\"},{\"internalType\":\"bool[]\",\"name\":\"receiveAsTokens\",\"type\":\"bool[]\"}],\"name\":\"completeQueuedWithdrawals\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"}],\"name\":\"cumulativeWithdrawalsQueued\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"internalType\":\"contractIStrategy\",\"name\":\"strategy\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"}],\"name\":\"decreaseDelegatedShares\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"components\":[{\"internalType\":\"bytes\",\"name\":\"signature\",\"type\":\"bytes\"},{\"internalType\":\"uint256\",\"name\":\"expiry\",\"type\":\"uint256\"}],\"internalType\":\"structISignatureUtils.SignatureWithExpiry\",\"name\":\"approverSignatureAndExpiry\",\"type\":\"tuple\"},{\"internalType\":\"bytes32\",\"name\":\"approverSalt\",\"type\":\"bytes32\"}],\"name\":\"delegateTo\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"components\":[{\"internalType\":\"bytes\",\"name\":\"signature\",\"type\":\"bytes\"},{\"internalType\":\"uint256\",\"name\":\"expiry\",\"type\":\"uint256\"}],\"internalType\":\"structISignatureUtils.SignatureWithExpiry\",\"name\":\"stakerSignatureAndExpiry\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"bytes\",\"name\":\"signature\",\"type\":\"bytes\"},{\"internalType\":\"uint256\",\"name\":\"expiry\",\"type\":\"uint256\"}],\"internalType\":\"structISignatureUtils.SignatureWithExpiry\",\"name\":\"approverSignatureAndExpiry\",\"type\":\"tuple\"},{\"internalType\":\"bytes32\",\"name\":\"approverSalt\",\"type\":\"bytes32\"}],\"name\":\"delegateToBySignature\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"}],\"name\":\"delegatedTo\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"}],\"name\":\"delegationApprover\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"_delegationApprover\",\"type\":\"address\"},{\"internalType\":\"bytes32\",\"name\":\"salt\",\"type\":\"bytes32\"}],\"name\":\"delegationApproverSaltIsSpent\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"domainSeparator\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"}],\"name\":\"earningsReceiver\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"internalType\":\"contractIStrategy[]\",\"name\":\"strategies\",\"type\":\"address[]\"}],\"name\":\"getOperatorShares\",\"outputs\":[{\"internalType\":\"uint256[]\",\"name\":\"\",\"type\":\"uint256[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"contractIStrategy[]\",\"name\":\"strategies\",\"type\":\"address[]\"}],\"name\":\"getWithdrawalDelay\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"internalType\":\"contractIStrategy\",\"name\":\"strategy\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"}],\"name\":\"increaseDelegatedShares\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"}],\"name\":\"isDelegated\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"}],\"name\":\"isOperator\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"components\":[{\"internalType\":\"contractIStrategy[]\",\"name\":\"strategies\",\"type\":\"address[]\"},{\"internalType\":\"uint256[]\",\"name\":\"shares\",\"type\":\"uint256[]\"},{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"},{\"components\":[{\"internalType\":\"address\",\"name\":\"withdrawer\",\"type\":\"address\"},{\"internalType\":\"uint96\",\"name\":\"nonce\",\"type\":\"uint96\"}],\"internalType\":\"structIStrategyManager.DeprecatedStruct_WithdrawerAndNonce\",\"name\":\"withdrawerAndNonce\",\"type\":\"tuple\"},{\"internalType\":\"uint32\",\"name\":\"withdrawalStartBlock\",\"type\":\"uint32\"},{\"internalType\":\"address\",\"name\":\"delegatedAddress\",\"type\":\"address\"}],\"internalType\":\"structIStrategyManager.DeprecatedStruct_QueuedWithdrawal[]\",\"name\":\"withdrawalsToQueue\",\"type\":\"tuple[]\"}],\"name\":\"migrateQueuedWithdrawals\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"minWithdrawalDelayBlocks\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"components\":[{\"internalType\":\"address\",\"name\":\"earningsReceiver\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"delegationApprover\",\"type\":\"address\"},{\"internalType\":\"uint32\",\"name\":\"stakerOptOutWindowBlocks\",\"type\":\"uint32\"}],\"internalType\":\"structIDelegationManager.OperatorDetails\",\"name\":\"newOperatorDetails\",\"type\":\"tuple\"}],\"name\":\"modifyOperatorDetails\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"}],\"name\":\"operatorDetails\",\"outputs\":[{\"components\":[{\"internalType\":\"address\",\"name\":\"earningsReceiver\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"delegationApprover\",\"type\":\"address\"},{\"internalType\":\"uint32\",\"name\":\"stakerOptOutWindowBlocks\",\"type\":\"uint32\"}],\"internalType\":\"structIDelegationManager.OperatorDetails\",\"name\":\"\",\"type\":\"tuple\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"internalType\":\"contractIStrategy\",\"name\":\"strategy\",\"type\":\"address\"}],\"name\":\"operatorShares\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"components\":[{\"internalType\":\"contractIStrategy[]\",\"name\":\"strategies\",\"type\":\"address[]\"},{\"internalType\":\"uint256[]\",\"name\":\"shares\",\"type\":\"uint256[]\"},{\"internalType\":\"address\",\"name\":\"withdrawer\",\"type\":\"address\"}],\"internalType\":\"structIDelegationManager.QueuedWithdrawalParams[]\",\"name\":\"queuedWithdrawalParams\",\"type\":\"tuple[]\"}],\"name\":\"queueWithdrawals\",\"outputs\":[{\"internalType\":\"bytes32[]\",\"name\":\"\",\"type\":\"bytes32[]\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"components\":[{\"internalType\":\"address\",\"name\":\"earningsReceiver\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"delegationApprover\",\"type\":\"address\"},{\"internalType\":\"uint32\",\"name\":\"stakerOptOutWindowBlocks\",\"type\":\"uint32\"}],\"internalType\":\"structIDelegationManager.OperatorDetails\",\"name\":\"registeringOperatorDetails\",\"type\":\"tuple\"},{\"internalType\":\"string\",\"name\":\"metadataURI\",\"type\":\"string\"}],\"name\":\"registerAsOperator\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"}],\"name\":\"stakerNonce\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"}],\"name\":\"stakerOptOutWindowBlocks\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"contractIStrategy\",\"name\":\"strategy\",\"type\":\"address\"}],\"name\":\"strategyWithdrawalDelayBlocks\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"staker\",\"type\":\"address\"}],\"name\":\"undelegate\",\"outputs\":[{\"internalType\":\"bytes32[]\",\"name\":\"withdrawalRoot\",\"type\":\"bytes32[]\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"string\",\"name\":\"metadataURI\",\"type\":\"string\"}],\"name\":\"updateOperatorMetadataURI\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]",
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

func (_Contract *ContractCaller) DELEGATIONAPPROVALTYPEHASH(opts *bind.CallOpts) ([32]byte, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "DELEGATION_APPROVAL_TYPEHASH")

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

func (_Contract *ContractSession) DELEGATIONAPPROVALTYPEHASH() ([32]byte, error) {
	return _Contract.Contract.DELEGATIONAPPROVALTYPEHASH(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) DELEGATIONAPPROVALTYPEHASH() ([32]byte, error) {
	return _Contract.Contract.DELEGATIONAPPROVALTYPEHASH(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) DOMAINTYPEHASH(opts *bind.CallOpts) ([32]byte, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "DOMAIN_TYPEHASH")

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

func (_Contract *ContractSession) DOMAINTYPEHASH() ([32]byte, error) {
	return _Contract.Contract.DOMAINTYPEHASH(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) DOMAINTYPEHASH() ([32]byte, error) {
	return _Contract.Contract.DOMAINTYPEHASH(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) STAKERDELEGATIONTYPEHASH(opts *bind.CallOpts) ([32]byte, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "STAKER_DELEGATION_TYPEHASH")

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

func (_Contract *ContractSession) STAKERDELEGATIONTYPEHASH() ([32]byte, error) {
	return _Contract.Contract.STAKERDELEGATIONTYPEHASH(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) STAKERDELEGATIONTYPEHASH() ([32]byte, error) {
	return _Contract.Contract.STAKERDELEGATIONTYPEHASH(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) CalculateCurrentStakerDelegationDigestHash(opts *bind.CallOpts, staker common.Address, operator common.Address, expiry *big.Int) ([32]byte, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "calculateCurrentStakerDelegationDigestHash", staker, operator, expiry)

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

func (_Contract *ContractSession) CalculateCurrentStakerDelegationDigestHash(staker common.Address, operator common.Address, expiry *big.Int) ([32]byte, error) {
	return _Contract.Contract.CalculateCurrentStakerDelegationDigestHash(&_Contract.CallOpts, staker, operator, expiry)
}

func (_Contract *ContractCallerSession) CalculateCurrentStakerDelegationDigestHash(staker common.Address, operator common.Address, expiry *big.Int) ([32]byte, error) {
	return _Contract.Contract.CalculateCurrentStakerDelegationDigestHash(&_Contract.CallOpts, staker, operator, expiry)
}

func (_Contract *ContractCaller) CalculateDelegationApprovalDigestHash(opts *bind.CallOpts, staker common.Address, operator common.Address, _delegationApprover common.Address, approverSalt [32]byte, expiry *big.Int) ([32]byte, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "calculateDelegationApprovalDigestHash", staker, operator, _delegationApprover, approverSalt, expiry)

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

func (_Contract *ContractSession) CalculateDelegationApprovalDigestHash(staker common.Address, operator common.Address, _delegationApprover common.Address, approverSalt [32]byte, expiry *big.Int) ([32]byte, error) {
	return _Contract.Contract.CalculateDelegationApprovalDigestHash(&_Contract.CallOpts, staker, operator, _delegationApprover, approverSalt, expiry)
}

func (_Contract *ContractCallerSession) CalculateDelegationApprovalDigestHash(staker common.Address, operator common.Address, _delegationApprover common.Address, approverSalt [32]byte, expiry *big.Int) ([32]byte, error) {
	return _Contract.Contract.CalculateDelegationApprovalDigestHash(&_Contract.CallOpts, staker, operator, _delegationApprover, approverSalt, expiry)
}

func (_Contract *ContractCaller) CalculateStakerDelegationDigestHash(opts *bind.CallOpts, staker common.Address, _stakerNonce *big.Int, operator common.Address, expiry *big.Int) ([32]byte, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "calculateStakerDelegationDigestHash", staker, _stakerNonce, operator, expiry)

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

func (_Contract *ContractSession) CalculateStakerDelegationDigestHash(staker common.Address, _stakerNonce *big.Int, operator common.Address, expiry *big.Int) ([32]byte, error) {
	return _Contract.Contract.CalculateStakerDelegationDigestHash(&_Contract.CallOpts, staker, _stakerNonce, operator, expiry)
}

func (_Contract *ContractCallerSession) CalculateStakerDelegationDigestHash(staker common.Address, _stakerNonce *big.Int, operator common.Address, expiry *big.Int) ([32]byte, error) {
	return _Contract.Contract.CalculateStakerDelegationDigestHash(&_Contract.CallOpts, staker, _stakerNonce, operator, expiry)
}

func (_Contract *ContractCaller) CalculateWithdrawalRoot(opts *bind.CallOpts, withdrawal IDelegationManagerWithdrawal) ([32]byte, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "calculateWithdrawalRoot", withdrawal)

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

func (_Contract *ContractSession) CalculateWithdrawalRoot(withdrawal IDelegationManagerWithdrawal) ([32]byte, error) {
	return _Contract.Contract.CalculateWithdrawalRoot(&_Contract.CallOpts, withdrawal)
}

func (_Contract *ContractCallerSession) CalculateWithdrawalRoot(withdrawal IDelegationManagerWithdrawal) ([32]byte, error) {
	return _Contract.Contract.CalculateWithdrawalRoot(&_Contract.CallOpts, withdrawal)
}

func (_Contract *ContractCaller) CumulativeWithdrawalsQueued(opts *bind.CallOpts, staker common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "cumulativeWithdrawalsQueued", staker)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) CumulativeWithdrawalsQueued(staker common.Address) (*big.Int, error) {
	return _Contract.Contract.CumulativeWithdrawalsQueued(&_Contract.CallOpts, staker)
}

func (_Contract *ContractCallerSession) CumulativeWithdrawalsQueued(staker common.Address) (*big.Int, error) {
	return _Contract.Contract.CumulativeWithdrawalsQueued(&_Contract.CallOpts, staker)
}

func (_Contract *ContractCaller) DelegatedTo(opts *bind.CallOpts, staker common.Address) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "delegatedTo", staker)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) DelegatedTo(staker common.Address) (common.Address, error) {
	return _Contract.Contract.DelegatedTo(&_Contract.CallOpts, staker)
}

func (_Contract *ContractCallerSession) DelegatedTo(staker common.Address) (common.Address, error) {
	return _Contract.Contract.DelegatedTo(&_Contract.CallOpts, staker)
}

func (_Contract *ContractCaller) DelegationApprover(opts *bind.CallOpts, operator common.Address) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "delegationApprover", operator)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) DelegationApprover(operator common.Address) (common.Address, error) {
	return _Contract.Contract.DelegationApprover(&_Contract.CallOpts, operator)
}

func (_Contract *ContractCallerSession) DelegationApprover(operator common.Address) (common.Address, error) {
	return _Contract.Contract.DelegationApprover(&_Contract.CallOpts, operator)
}

func (_Contract *ContractCaller) DelegationApproverSaltIsSpent(opts *bind.CallOpts, _delegationApprover common.Address, salt [32]byte) (bool, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "delegationApproverSaltIsSpent", _delegationApprover, salt)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

func (_Contract *ContractSession) DelegationApproverSaltIsSpent(_delegationApprover common.Address, salt [32]byte) (bool, error) {
	return _Contract.Contract.DelegationApproverSaltIsSpent(&_Contract.CallOpts, _delegationApprover, salt)
}

func (_Contract *ContractCallerSession) DelegationApproverSaltIsSpent(_delegationApprover common.Address, salt [32]byte) (bool, error) {
	return _Contract.Contract.DelegationApproverSaltIsSpent(&_Contract.CallOpts, _delegationApprover, salt)
}

func (_Contract *ContractCaller) DomainSeparator(opts *bind.CallOpts) ([32]byte, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "domainSeparator")

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

func (_Contract *ContractSession) DomainSeparator() ([32]byte, error) {
	return _Contract.Contract.DomainSeparator(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) DomainSeparator() ([32]byte, error) {
	return _Contract.Contract.DomainSeparator(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) EarningsReceiver(opts *bind.CallOpts, operator common.Address) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "earningsReceiver", operator)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) EarningsReceiver(operator common.Address) (common.Address, error) {
	return _Contract.Contract.EarningsReceiver(&_Contract.CallOpts, operator)
}

func (_Contract *ContractCallerSession) EarningsReceiver(operator common.Address) (common.Address, error) {
	return _Contract.Contract.EarningsReceiver(&_Contract.CallOpts, operator)
}

func (_Contract *ContractCaller) GetOperatorShares(opts *bind.CallOpts, operator common.Address, strategies []common.Address) ([]*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getOperatorShares", operator, strategies)

	if err != nil {
		return *new([]*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new([]*big.Int)).(*[]*big.Int)

	return out0, err

}

func (_Contract *ContractSession) GetOperatorShares(operator common.Address, strategies []common.Address) ([]*big.Int, error) {
	return _Contract.Contract.GetOperatorShares(&_Contract.CallOpts, operator, strategies)
}

func (_Contract *ContractCallerSession) GetOperatorShares(operator common.Address, strategies []common.Address) ([]*big.Int, error) {
	return _Contract.Contract.GetOperatorShares(&_Contract.CallOpts, operator, strategies)
}

func (_Contract *ContractCaller) GetWithdrawalDelay(opts *bind.CallOpts, strategies []common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getWithdrawalDelay", strategies)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) GetWithdrawalDelay(strategies []common.Address) (*big.Int, error) {
	return _Contract.Contract.GetWithdrawalDelay(&_Contract.CallOpts, strategies)
}

func (_Contract *ContractCallerSession) GetWithdrawalDelay(strategies []common.Address) (*big.Int, error) {
	return _Contract.Contract.GetWithdrawalDelay(&_Contract.CallOpts, strategies)
}

func (_Contract *ContractCaller) IsDelegated(opts *bind.CallOpts, staker common.Address) (bool, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "isDelegated", staker)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

func (_Contract *ContractSession) IsDelegated(staker common.Address) (bool, error) {
	return _Contract.Contract.IsDelegated(&_Contract.CallOpts, staker)
}

func (_Contract *ContractCallerSession) IsDelegated(staker common.Address) (bool, error) {
	return _Contract.Contract.IsDelegated(&_Contract.CallOpts, staker)
}

func (_Contract *ContractCaller) IsOperator(opts *bind.CallOpts, operator common.Address) (bool, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "isOperator", operator)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

func (_Contract *ContractSession) IsOperator(operator common.Address) (bool, error) {
	return _Contract.Contract.IsOperator(&_Contract.CallOpts, operator)
}

func (_Contract *ContractCallerSession) IsOperator(operator common.Address) (bool, error) {
	return _Contract.Contract.IsOperator(&_Contract.CallOpts, operator)
}

func (_Contract *ContractCaller) MinWithdrawalDelayBlocks(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "minWithdrawalDelayBlocks")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) MinWithdrawalDelayBlocks() (*big.Int, error) {
	return _Contract.Contract.MinWithdrawalDelayBlocks(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) MinWithdrawalDelayBlocks() (*big.Int, error) {
	return _Contract.Contract.MinWithdrawalDelayBlocks(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) OperatorDetails(opts *bind.CallOpts, operator common.Address) (IDelegationManagerOperatorDetails, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "operatorDetails", operator)

	if err != nil {
		return *new(IDelegationManagerOperatorDetails), err
	}

	out0 := *abi.ConvertType(out[0], new(IDelegationManagerOperatorDetails)).(*IDelegationManagerOperatorDetails)

	return out0, err

}

func (_Contract *ContractSession) OperatorDetails(operator common.Address) (IDelegationManagerOperatorDetails, error) {
	return _Contract.Contract.OperatorDetails(&_Contract.CallOpts, operator)
}

func (_Contract *ContractCallerSession) OperatorDetails(operator common.Address) (IDelegationManagerOperatorDetails, error) {
	return _Contract.Contract.OperatorDetails(&_Contract.CallOpts, operator)
}

func (_Contract *ContractCaller) OperatorShares(opts *bind.CallOpts, operator common.Address, strategy common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "operatorShares", operator, strategy)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) OperatorShares(operator common.Address, strategy common.Address) (*big.Int, error) {
	return _Contract.Contract.OperatorShares(&_Contract.CallOpts, operator, strategy)
}

func (_Contract *ContractCallerSession) OperatorShares(operator common.Address, strategy common.Address) (*big.Int, error) {
	return _Contract.Contract.OperatorShares(&_Contract.CallOpts, operator, strategy)
}

func (_Contract *ContractCaller) StakerNonce(opts *bind.CallOpts, staker common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "stakerNonce", staker)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) StakerNonce(staker common.Address) (*big.Int, error) {
	return _Contract.Contract.StakerNonce(&_Contract.CallOpts, staker)
}

func (_Contract *ContractCallerSession) StakerNonce(staker common.Address) (*big.Int, error) {
	return _Contract.Contract.StakerNonce(&_Contract.CallOpts, staker)
}

func (_Contract *ContractCaller) StakerOptOutWindowBlocks(opts *bind.CallOpts, operator common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "stakerOptOutWindowBlocks", operator)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) StakerOptOutWindowBlocks(operator common.Address) (*big.Int, error) {
	return _Contract.Contract.StakerOptOutWindowBlocks(&_Contract.CallOpts, operator)
}

func (_Contract *ContractCallerSession) StakerOptOutWindowBlocks(operator common.Address) (*big.Int, error) {
	return _Contract.Contract.StakerOptOutWindowBlocks(&_Contract.CallOpts, operator)
}

func (_Contract *ContractCaller) StrategyWithdrawalDelayBlocks(opts *bind.CallOpts, strategy common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "strategyWithdrawalDelayBlocks", strategy)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) StrategyWithdrawalDelayBlocks(strategy common.Address) (*big.Int, error) {
	return _Contract.Contract.StrategyWithdrawalDelayBlocks(&_Contract.CallOpts, strategy)
}

func (_Contract *ContractCallerSession) StrategyWithdrawalDelayBlocks(strategy common.Address) (*big.Int, error) {
	return _Contract.Contract.StrategyWithdrawalDelayBlocks(&_Contract.CallOpts, strategy)
}

func (_Contract *ContractTransactor) CompleteQueuedWithdrawal(opts *bind.TransactOpts, withdrawal IDelegationManagerWithdrawal, tokens []common.Address, middlewareTimesIndex *big.Int, receiveAsTokens bool) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "completeQueuedWithdrawal", withdrawal, tokens, middlewareTimesIndex, receiveAsTokens)
}

func (_Contract *ContractSession) CompleteQueuedWithdrawal(withdrawal IDelegationManagerWithdrawal, tokens []common.Address, middlewareTimesIndex *big.Int, receiveAsTokens bool) (*types.Transaction, error) {
	return _Contract.Contract.CompleteQueuedWithdrawal(&_Contract.TransactOpts, withdrawal, tokens, middlewareTimesIndex, receiveAsTokens)
}

func (_Contract *ContractTransactorSession) CompleteQueuedWithdrawal(withdrawal IDelegationManagerWithdrawal, tokens []common.Address, middlewareTimesIndex *big.Int, receiveAsTokens bool) (*types.Transaction, error) {
	return _Contract.Contract.CompleteQueuedWithdrawal(&_Contract.TransactOpts, withdrawal, tokens, middlewareTimesIndex, receiveAsTokens)
}

func (_Contract *ContractTransactor) CompleteQueuedWithdrawals(opts *bind.TransactOpts, withdrawals []IDelegationManagerWithdrawal, tokens [][]common.Address, middlewareTimesIndexes []*big.Int, receiveAsTokens []bool) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "completeQueuedWithdrawals", withdrawals, tokens, middlewareTimesIndexes, receiveAsTokens)
}

func (_Contract *ContractSession) CompleteQueuedWithdrawals(withdrawals []IDelegationManagerWithdrawal, tokens [][]common.Address, middlewareTimesIndexes []*big.Int, receiveAsTokens []bool) (*types.Transaction, error) {
	return _Contract.Contract.CompleteQueuedWithdrawals(&_Contract.TransactOpts, withdrawals, tokens, middlewareTimesIndexes, receiveAsTokens)
}

func (_Contract *ContractTransactorSession) CompleteQueuedWithdrawals(withdrawals []IDelegationManagerWithdrawal, tokens [][]common.Address, middlewareTimesIndexes []*big.Int, receiveAsTokens []bool) (*types.Transaction, error) {
	return _Contract.Contract.CompleteQueuedWithdrawals(&_Contract.TransactOpts, withdrawals, tokens, middlewareTimesIndexes, receiveAsTokens)
}

func (_Contract *ContractTransactor) DecreaseDelegatedShares(opts *bind.TransactOpts, staker common.Address, strategy common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "decreaseDelegatedShares", staker, strategy, shares)
}

func (_Contract *ContractSession) DecreaseDelegatedShares(staker common.Address, strategy common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.DecreaseDelegatedShares(&_Contract.TransactOpts, staker, strategy, shares)
}

func (_Contract *ContractTransactorSession) DecreaseDelegatedShares(staker common.Address, strategy common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.DecreaseDelegatedShares(&_Contract.TransactOpts, staker, strategy, shares)
}

func (_Contract *ContractTransactor) DelegateTo(opts *bind.TransactOpts, operator common.Address, approverSignatureAndExpiry ISignatureUtilsSignatureWithExpiry, approverSalt [32]byte) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "delegateTo", operator, approverSignatureAndExpiry, approverSalt)
}

func (_Contract *ContractSession) DelegateTo(operator common.Address, approverSignatureAndExpiry ISignatureUtilsSignatureWithExpiry, approverSalt [32]byte) (*types.Transaction, error) {
	return _Contract.Contract.DelegateTo(&_Contract.TransactOpts, operator, approverSignatureAndExpiry, approverSalt)
}

func (_Contract *ContractTransactorSession) DelegateTo(operator common.Address, approverSignatureAndExpiry ISignatureUtilsSignatureWithExpiry, approverSalt [32]byte) (*types.Transaction, error) {
	return _Contract.Contract.DelegateTo(&_Contract.TransactOpts, operator, approverSignatureAndExpiry, approverSalt)
}

func (_Contract *ContractTransactor) DelegateToBySignature(opts *bind.TransactOpts, staker common.Address, operator common.Address, stakerSignatureAndExpiry ISignatureUtilsSignatureWithExpiry, approverSignatureAndExpiry ISignatureUtilsSignatureWithExpiry, approverSalt [32]byte) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "delegateToBySignature", staker, operator, stakerSignatureAndExpiry, approverSignatureAndExpiry, approverSalt)
}

func (_Contract *ContractSession) DelegateToBySignature(staker common.Address, operator common.Address, stakerSignatureAndExpiry ISignatureUtilsSignatureWithExpiry, approverSignatureAndExpiry ISignatureUtilsSignatureWithExpiry, approverSalt [32]byte) (*types.Transaction, error) {
	return _Contract.Contract.DelegateToBySignature(&_Contract.TransactOpts, staker, operator, stakerSignatureAndExpiry, approverSignatureAndExpiry, approverSalt)
}

func (_Contract *ContractTransactorSession) DelegateToBySignature(staker common.Address, operator common.Address, stakerSignatureAndExpiry ISignatureUtilsSignatureWithExpiry, approverSignatureAndExpiry ISignatureUtilsSignatureWithExpiry, approverSalt [32]byte) (*types.Transaction, error) {
	return _Contract.Contract.DelegateToBySignature(&_Contract.TransactOpts, staker, operator, stakerSignatureAndExpiry, approverSignatureAndExpiry, approverSalt)
}

func (_Contract *ContractTransactor) IncreaseDelegatedShares(opts *bind.TransactOpts, staker common.Address, strategy common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "increaseDelegatedShares", staker, strategy, shares)
}

func (_Contract *ContractSession) IncreaseDelegatedShares(staker common.Address, strategy common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.IncreaseDelegatedShares(&_Contract.TransactOpts, staker, strategy, shares)
}

func (_Contract *ContractTransactorSession) IncreaseDelegatedShares(staker common.Address, strategy common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.IncreaseDelegatedShares(&_Contract.TransactOpts, staker, strategy, shares)
}

func (_Contract *ContractTransactor) MigrateQueuedWithdrawals(opts *bind.TransactOpts, withdrawalsToQueue []IStrategyManagerDeprecatedStructQueuedWithdrawal) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "migrateQueuedWithdrawals", withdrawalsToQueue)
}

func (_Contract *ContractSession) MigrateQueuedWithdrawals(withdrawalsToQueue []IStrategyManagerDeprecatedStructQueuedWithdrawal) (*types.Transaction, error) {
	return _Contract.Contract.MigrateQueuedWithdrawals(&_Contract.TransactOpts, withdrawalsToQueue)
}

func (_Contract *ContractTransactorSession) MigrateQueuedWithdrawals(withdrawalsToQueue []IStrategyManagerDeprecatedStructQueuedWithdrawal) (*types.Transaction, error) {
	return _Contract.Contract.MigrateQueuedWithdrawals(&_Contract.TransactOpts, withdrawalsToQueue)
}

func (_Contract *ContractTransactor) ModifyOperatorDetails(opts *bind.TransactOpts, newOperatorDetails IDelegationManagerOperatorDetails) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "modifyOperatorDetails", newOperatorDetails)
}

func (_Contract *ContractSession) ModifyOperatorDetails(newOperatorDetails IDelegationManagerOperatorDetails) (*types.Transaction, error) {
	return _Contract.Contract.ModifyOperatorDetails(&_Contract.TransactOpts, newOperatorDetails)
}

func (_Contract *ContractTransactorSession) ModifyOperatorDetails(newOperatorDetails IDelegationManagerOperatorDetails) (*types.Transaction, error) {
	return _Contract.Contract.ModifyOperatorDetails(&_Contract.TransactOpts, newOperatorDetails)
}

func (_Contract *ContractTransactor) QueueWithdrawals(opts *bind.TransactOpts, queuedWithdrawalParams []IDelegationManagerQueuedWithdrawalParams) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "queueWithdrawals", queuedWithdrawalParams)
}

func (_Contract *ContractSession) QueueWithdrawals(queuedWithdrawalParams []IDelegationManagerQueuedWithdrawalParams) (*types.Transaction, error) {
	return _Contract.Contract.QueueWithdrawals(&_Contract.TransactOpts, queuedWithdrawalParams)
}

func (_Contract *ContractTransactorSession) QueueWithdrawals(queuedWithdrawalParams []IDelegationManagerQueuedWithdrawalParams) (*types.Transaction, error) {
	return _Contract.Contract.QueueWithdrawals(&_Contract.TransactOpts, queuedWithdrawalParams)
}

func (_Contract *ContractTransactor) RegisterAsOperator(opts *bind.TransactOpts, registeringOperatorDetails IDelegationManagerOperatorDetails, metadataURI string) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "registerAsOperator", registeringOperatorDetails, metadataURI)
}

func (_Contract *ContractSession) RegisterAsOperator(registeringOperatorDetails IDelegationManagerOperatorDetails, metadataURI string) (*types.Transaction, error) {
	return _Contract.Contract.RegisterAsOperator(&_Contract.TransactOpts, registeringOperatorDetails, metadataURI)
}

func (_Contract *ContractTransactorSession) RegisterAsOperator(registeringOperatorDetails IDelegationManagerOperatorDetails, metadataURI string) (*types.Transaction, error) {
	return _Contract.Contract.RegisterAsOperator(&_Contract.TransactOpts, registeringOperatorDetails, metadataURI)
}

func (_Contract *ContractTransactor) Undelegate(opts *bind.TransactOpts, staker common.Address) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "undelegate", staker)
}

func (_Contract *ContractSession) Undelegate(staker common.Address) (*types.Transaction, error) {
	return _Contract.Contract.Undelegate(&_Contract.TransactOpts, staker)
}

func (_Contract *ContractTransactorSession) Undelegate(staker common.Address) (*types.Transaction, error) {
	return _Contract.Contract.Undelegate(&_Contract.TransactOpts, staker)
}

func (_Contract *ContractTransactor) UpdateOperatorMetadataURI(opts *bind.TransactOpts, metadataURI string) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "updateOperatorMetadataURI", metadataURI)
}

func (_Contract *ContractSession) UpdateOperatorMetadataURI(metadataURI string) (*types.Transaction, error) {
	return _Contract.Contract.UpdateOperatorMetadataURI(&_Contract.TransactOpts, metadataURI)
}

func (_Contract *ContractTransactorSession) UpdateOperatorMetadataURI(metadataURI string) (*types.Transaction, error) {
	return _Contract.Contract.UpdateOperatorMetadataURI(&_Contract.TransactOpts, metadataURI)
}

type ContractMinWithdrawalDelayBlocksSetIterator struct {
	Event *ContractMinWithdrawalDelayBlocksSet

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractMinWithdrawalDelayBlocksSetIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractMinWithdrawalDelayBlocksSet)
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
		it.Event = new(ContractMinWithdrawalDelayBlocksSet)
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

func (it *ContractMinWithdrawalDelayBlocksSetIterator) Error() error {
	return it.fail
}

func (it *ContractMinWithdrawalDelayBlocksSetIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractMinWithdrawalDelayBlocksSet struct {
	PreviousValue *big.Int
	NewValue      *big.Int
	Raw           types.Log
}

func (_Contract *ContractFilterer) FilterMinWithdrawalDelayBlocksSet(opts *bind.FilterOpts) (*ContractMinWithdrawalDelayBlocksSetIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "MinWithdrawalDelayBlocksSet")
	if err != nil {
		return nil, err
	}
	return &ContractMinWithdrawalDelayBlocksSetIterator{contract: _Contract.contract, event: "MinWithdrawalDelayBlocksSet", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchMinWithdrawalDelayBlocksSet(opts *bind.WatchOpts, sink chan<- *ContractMinWithdrawalDelayBlocksSet) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "MinWithdrawalDelayBlocksSet")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractMinWithdrawalDelayBlocksSet)
				if err := _Contract.contract.UnpackLog(event, "MinWithdrawalDelayBlocksSet", log); err != nil {
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

func (_Contract *ContractFilterer) ParseMinWithdrawalDelayBlocksSet(log types.Log) (*ContractMinWithdrawalDelayBlocksSet, error) {
	event := new(ContractMinWithdrawalDelayBlocksSet)
	if err := _Contract.contract.UnpackLog(event, "MinWithdrawalDelayBlocksSet", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractOperatorDetailsModifiedIterator struct {
	Event *ContractOperatorDetailsModified

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractOperatorDetailsModifiedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractOperatorDetailsModified)
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
		it.Event = new(ContractOperatorDetailsModified)
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

func (it *ContractOperatorDetailsModifiedIterator) Error() error {
	return it.fail
}

func (it *ContractOperatorDetailsModifiedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractOperatorDetailsModified struct {
	Operator           common.Address
	NewOperatorDetails IDelegationManagerOperatorDetails
	Raw                types.Log
}

func (_Contract *ContractFilterer) FilterOperatorDetailsModified(opts *bind.FilterOpts, operator []common.Address) (*ContractOperatorDetailsModifiedIterator, error) {

	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "OperatorDetailsModified", operatorRule)
	if err != nil {
		return nil, err
	}
	return &ContractOperatorDetailsModifiedIterator{contract: _Contract.contract, event: "OperatorDetailsModified", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchOperatorDetailsModified(opts *bind.WatchOpts, sink chan<- *ContractOperatorDetailsModified, operator []common.Address) (event.Subscription, error) {

	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "OperatorDetailsModified", operatorRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractOperatorDetailsModified)
				if err := _Contract.contract.UnpackLog(event, "OperatorDetailsModified", log); err != nil {
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

func (_Contract *ContractFilterer) ParseOperatorDetailsModified(log types.Log) (*ContractOperatorDetailsModified, error) {
	event := new(ContractOperatorDetailsModified)
	if err := _Contract.contract.UnpackLog(event, "OperatorDetailsModified", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractOperatorMetadataURIUpdatedIterator struct {
	Event *ContractOperatorMetadataURIUpdated

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractOperatorMetadataURIUpdatedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractOperatorMetadataURIUpdated)
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
		it.Event = new(ContractOperatorMetadataURIUpdated)
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

func (it *ContractOperatorMetadataURIUpdatedIterator) Error() error {
	return it.fail
}

func (it *ContractOperatorMetadataURIUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractOperatorMetadataURIUpdated struct {
	Operator    common.Address
	MetadataURI string
	Raw         types.Log
}

func (_Contract *ContractFilterer) FilterOperatorMetadataURIUpdated(opts *bind.FilterOpts, operator []common.Address) (*ContractOperatorMetadataURIUpdatedIterator, error) {

	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "OperatorMetadataURIUpdated", operatorRule)
	if err != nil {
		return nil, err
	}
	return &ContractOperatorMetadataURIUpdatedIterator{contract: _Contract.contract, event: "OperatorMetadataURIUpdated", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchOperatorMetadataURIUpdated(opts *bind.WatchOpts, sink chan<- *ContractOperatorMetadataURIUpdated, operator []common.Address) (event.Subscription, error) {

	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "OperatorMetadataURIUpdated", operatorRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractOperatorMetadataURIUpdated)
				if err := _Contract.contract.UnpackLog(event, "OperatorMetadataURIUpdated", log); err != nil {
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

func (_Contract *ContractFilterer) ParseOperatorMetadataURIUpdated(log types.Log) (*ContractOperatorMetadataURIUpdated, error) {
	event := new(ContractOperatorMetadataURIUpdated)
	if err := _Contract.contract.UnpackLog(event, "OperatorMetadataURIUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractOperatorRegisteredIterator struct {
	Event *ContractOperatorRegistered

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractOperatorRegisteredIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractOperatorRegistered)
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
		it.Event = new(ContractOperatorRegistered)
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

func (it *ContractOperatorRegisteredIterator) Error() error {
	return it.fail
}

func (it *ContractOperatorRegisteredIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractOperatorRegistered struct {
	Operator        common.Address
	OperatorDetails IDelegationManagerOperatorDetails
	Raw             types.Log
}

func (_Contract *ContractFilterer) FilterOperatorRegistered(opts *bind.FilterOpts, operator []common.Address) (*ContractOperatorRegisteredIterator, error) {

	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "OperatorRegistered", operatorRule)
	if err != nil {
		return nil, err
	}
	return &ContractOperatorRegisteredIterator{contract: _Contract.contract, event: "OperatorRegistered", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchOperatorRegistered(opts *bind.WatchOpts, sink chan<- *ContractOperatorRegistered, operator []common.Address) (event.Subscription, error) {

	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "OperatorRegistered", operatorRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractOperatorRegistered)
				if err := _Contract.contract.UnpackLog(event, "OperatorRegistered", log); err != nil {
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

func (_Contract *ContractFilterer) ParseOperatorRegistered(log types.Log) (*ContractOperatorRegistered, error) {
	event := new(ContractOperatorRegistered)
	if err := _Contract.contract.UnpackLog(event, "OperatorRegistered", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractOperatorSharesDecreasedIterator struct {
	Event *ContractOperatorSharesDecreased

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractOperatorSharesDecreasedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractOperatorSharesDecreased)
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
		it.Event = new(ContractOperatorSharesDecreased)
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

func (it *ContractOperatorSharesDecreasedIterator) Error() error {
	return it.fail
}

func (it *ContractOperatorSharesDecreasedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractOperatorSharesDecreased struct {
	Operator common.Address
	Staker   common.Address
	Strategy common.Address
	Shares   *big.Int
	Raw      types.Log
}

func (_Contract *ContractFilterer) FilterOperatorSharesDecreased(opts *bind.FilterOpts, operator []common.Address) (*ContractOperatorSharesDecreasedIterator, error) {

	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "OperatorSharesDecreased", operatorRule)
	if err != nil {
		return nil, err
	}
	return &ContractOperatorSharesDecreasedIterator{contract: _Contract.contract, event: "OperatorSharesDecreased", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchOperatorSharesDecreased(opts *bind.WatchOpts, sink chan<- *ContractOperatorSharesDecreased, operator []common.Address) (event.Subscription, error) {

	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "OperatorSharesDecreased", operatorRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractOperatorSharesDecreased)
				if err := _Contract.contract.UnpackLog(event, "OperatorSharesDecreased", log); err != nil {
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

func (_Contract *ContractFilterer) ParseOperatorSharesDecreased(log types.Log) (*ContractOperatorSharesDecreased, error) {
	event := new(ContractOperatorSharesDecreased)
	if err := _Contract.contract.UnpackLog(event, "OperatorSharesDecreased", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractOperatorSharesIncreasedIterator struct {
	Event *ContractOperatorSharesIncreased

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractOperatorSharesIncreasedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractOperatorSharesIncreased)
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
		it.Event = new(ContractOperatorSharesIncreased)
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

func (it *ContractOperatorSharesIncreasedIterator) Error() error {
	return it.fail
}

func (it *ContractOperatorSharesIncreasedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractOperatorSharesIncreased struct {
	Operator common.Address
	Staker   common.Address
	Strategy common.Address
	Shares   *big.Int
	Raw      types.Log
}

func (_Contract *ContractFilterer) FilterOperatorSharesIncreased(opts *bind.FilterOpts, operator []common.Address) (*ContractOperatorSharesIncreasedIterator, error) {

	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "OperatorSharesIncreased", operatorRule)
	if err != nil {
		return nil, err
	}
	return &ContractOperatorSharesIncreasedIterator{contract: _Contract.contract, event: "OperatorSharesIncreased", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchOperatorSharesIncreased(opts *bind.WatchOpts, sink chan<- *ContractOperatorSharesIncreased, operator []common.Address) (event.Subscription, error) {

	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "OperatorSharesIncreased", operatorRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractOperatorSharesIncreased)
				if err := _Contract.contract.UnpackLog(event, "OperatorSharesIncreased", log); err != nil {
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

func (_Contract *ContractFilterer) ParseOperatorSharesIncreased(log types.Log) (*ContractOperatorSharesIncreased, error) {
	event := new(ContractOperatorSharesIncreased)
	if err := _Contract.contract.UnpackLog(event, "OperatorSharesIncreased", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractStakerDelegatedIterator struct {
	Event *ContractStakerDelegated

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractStakerDelegatedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractStakerDelegated)
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
		it.Event = new(ContractStakerDelegated)
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

func (it *ContractStakerDelegatedIterator) Error() error {
	return it.fail
}

func (it *ContractStakerDelegatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractStakerDelegated struct {
	Staker   common.Address
	Operator common.Address
	Raw      types.Log
}

func (_Contract *ContractFilterer) FilterStakerDelegated(opts *bind.FilterOpts, staker []common.Address, operator []common.Address) (*ContractStakerDelegatedIterator, error) {

	var stakerRule []interface{}
	for _, stakerItem := range staker {
		stakerRule = append(stakerRule, stakerItem)
	}
	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "StakerDelegated", stakerRule, operatorRule)
	if err != nil {
		return nil, err
	}
	return &ContractStakerDelegatedIterator{contract: _Contract.contract, event: "StakerDelegated", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchStakerDelegated(opts *bind.WatchOpts, sink chan<- *ContractStakerDelegated, staker []common.Address, operator []common.Address) (event.Subscription, error) {

	var stakerRule []interface{}
	for _, stakerItem := range staker {
		stakerRule = append(stakerRule, stakerItem)
	}
	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "StakerDelegated", stakerRule, operatorRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractStakerDelegated)
				if err := _Contract.contract.UnpackLog(event, "StakerDelegated", log); err != nil {
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

func (_Contract *ContractFilterer) ParseStakerDelegated(log types.Log) (*ContractStakerDelegated, error) {
	event := new(ContractStakerDelegated)
	if err := _Contract.contract.UnpackLog(event, "StakerDelegated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractStakerForceUndelegatedIterator struct {
	Event *ContractStakerForceUndelegated

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractStakerForceUndelegatedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractStakerForceUndelegated)
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
		it.Event = new(ContractStakerForceUndelegated)
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

func (it *ContractStakerForceUndelegatedIterator) Error() error {
	return it.fail
}

func (it *ContractStakerForceUndelegatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractStakerForceUndelegated struct {
	Staker   common.Address
	Operator common.Address
	Raw      types.Log
}

func (_Contract *ContractFilterer) FilterStakerForceUndelegated(opts *bind.FilterOpts, staker []common.Address, operator []common.Address) (*ContractStakerForceUndelegatedIterator, error) {

	var stakerRule []interface{}
	for _, stakerItem := range staker {
		stakerRule = append(stakerRule, stakerItem)
	}
	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "StakerForceUndelegated", stakerRule, operatorRule)
	if err != nil {
		return nil, err
	}
	return &ContractStakerForceUndelegatedIterator{contract: _Contract.contract, event: "StakerForceUndelegated", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchStakerForceUndelegated(opts *bind.WatchOpts, sink chan<- *ContractStakerForceUndelegated, staker []common.Address, operator []common.Address) (event.Subscription, error) {

	var stakerRule []interface{}
	for _, stakerItem := range staker {
		stakerRule = append(stakerRule, stakerItem)
	}
	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "StakerForceUndelegated", stakerRule, operatorRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractStakerForceUndelegated)
				if err := _Contract.contract.UnpackLog(event, "StakerForceUndelegated", log); err != nil {
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

func (_Contract *ContractFilterer) ParseStakerForceUndelegated(log types.Log) (*ContractStakerForceUndelegated, error) {
	event := new(ContractStakerForceUndelegated)
	if err := _Contract.contract.UnpackLog(event, "StakerForceUndelegated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractStakerUndelegatedIterator struct {
	Event *ContractStakerUndelegated

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractStakerUndelegatedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractStakerUndelegated)
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
		it.Event = new(ContractStakerUndelegated)
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

func (it *ContractStakerUndelegatedIterator) Error() error {
	return it.fail
}

func (it *ContractStakerUndelegatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractStakerUndelegated struct {
	Staker   common.Address
	Operator common.Address
	Raw      types.Log
}

func (_Contract *ContractFilterer) FilterStakerUndelegated(opts *bind.FilterOpts, staker []common.Address, operator []common.Address) (*ContractStakerUndelegatedIterator, error) {

	var stakerRule []interface{}
	for _, stakerItem := range staker {
		stakerRule = append(stakerRule, stakerItem)
	}
	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "StakerUndelegated", stakerRule, operatorRule)
	if err != nil {
		return nil, err
	}
	return &ContractStakerUndelegatedIterator{contract: _Contract.contract, event: "StakerUndelegated", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchStakerUndelegated(opts *bind.WatchOpts, sink chan<- *ContractStakerUndelegated, staker []common.Address, operator []common.Address) (event.Subscription, error) {

	var stakerRule []interface{}
	for _, stakerItem := range staker {
		stakerRule = append(stakerRule, stakerItem)
	}
	var operatorRule []interface{}
	for _, operatorItem := range operator {
		operatorRule = append(operatorRule, operatorItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "StakerUndelegated", stakerRule, operatorRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractStakerUndelegated)
				if err := _Contract.contract.UnpackLog(event, "StakerUndelegated", log); err != nil {
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

func (_Contract *ContractFilterer) ParseStakerUndelegated(log types.Log) (*ContractStakerUndelegated, error) {
	event := new(ContractStakerUndelegated)
	if err := _Contract.contract.UnpackLog(event, "StakerUndelegated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractStrategyWithdrawalDelayBlocksSetIterator struct {
	Event *ContractStrategyWithdrawalDelayBlocksSet

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractStrategyWithdrawalDelayBlocksSetIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractStrategyWithdrawalDelayBlocksSet)
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
		it.Event = new(ContractStrategyWithdrawalDelayBlocksSet)
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

func (it *ContractStrategyWithdrawalDelayBlocksSetIterator) Error() error {
	return it.fail
}

func (it *ContractStrategyWithdrawalDelayBlocksSetIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractStrategyWithdrawalDelayBlocksSet struct {
	Strategy      common.Address
	PreviousValue *big.Int
	NewValue      *big.Int
	Raw           types.Log
}

func (_Contract *ContractFilterer) FilterStrategyWithdrawalDelayBlocksSet(opts *bind.FilterOpts) (*ContractStrategyWithdrawalDelayBlocksSetIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "StrategyWithdrawalDelayBlocksSet")
	if err != nil {
		return nil, err
	}
	return &ContractStrategyWithdrawalDelayBlocksSetIterator{contract: _Contract.contract, event: "StrategyWithdrawalDelayBlocksSet", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchStrategyWithdrawalDelayBlocksSet(opts *bind.WatchOpts, sink chan<- *ContractStrategyWithdrawalDelayBlocksSet) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "StrategyWithdrawalDelayBlocksSet")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractStrategyWithdrawalDelayBlocksSet)
				if err := _Contract.contract.UnpackLog(event, "StrategyWithdrawalDelayBlocksSet", log); err != nil {
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

func (_Contract *ContractFilterer) ParseStrategyWithdrawalDelayBlocksSet(log types.Log) (*ContractStrategyWithdrawalDelayBlocksSet, error) {
	event := new(ContractStrategyWithdrawalDelayBlocksSet)
	if err := _Contract.contract.UnpackLog(event, "StrategyWithdrawalDelayBlocksSet", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractWithdrawalCompletedIterator struct {
	Event *ContractWithdrawalCompleted

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractWithdrawalCompletedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractWithdrawalCompleted)
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
		it.Event = new(ContractWithdrawalCompleted)
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

func (it *ContractWithdrawalCompletedIterator) Error() error {
	return it.fail
}

func (it *ContractWithdrawalCompletedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractWithdrawalCompleted struct {
	WithdrawalRoot [32]byte
	Raw            types.Log
}

func (_Contract *ContractFilterer) FilterWithdrawalCompleted(opts *bind.FilterOpts) (*ContractWithdrawalCompletedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "WithdrawalCompleted")
	if err != nil {
		return nil, err
	}
	return &ContractWithdrawalCompletedIterator{contract: _Contract.contract, event: "WithdrawalCompleted", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchWithdrawalCompleted(opts *bind.WatchOpts, sink chan<- *ContractWithdrawalCompleted) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "WithdrawalCompleted")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractWithdrawalCompleted)
				if err := _Contract.contract.UnpackLog(event, "WithdrawalCompleted", log); err != nil {
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

func (_Contract *ContractFilterer) ParseWithdrawalCompleted(log types.Log) (*ContractWithdrawalCompleted, error) {
	event := new(ContractWithdrawalCompleted)
	if err := _Contract.contract.UnpackLog(event, "WithdrawalCompleted", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractWithdrawalMigratedIterator struct {
	Event *ContractWithdrawalMigrated

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractWithdrawalMigratedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractWithdrawalMigrated)
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
		it.Event = new(ContractWithdrawalMigrated)
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

func (it *ContractWithdrawalMigratedIterator) Error() error {
	return it.fail
}

func (it *ContractWithdrawalMigratedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractWithdrawalMigrated struct {
	OldWithdrawalRoot [32]byte
	NewWithdrawalRoot [32]byte
	Raw               types.Log
}

func (_Contract *ContractFilterer) FilterWithdrawalMigrated(opts *bind.FilterOpts) (*ContractWithdrawalMigratedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "WithdrawalMigrated")
	if err != nil {
		return nil, err
	}
	return &ContractWithdrawalMigratedIterator{contract: _Contract.contract, event: "WithdrawalMigrated", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchWithdrawalMigrated(opts *bind.WatchOpts, sink chan<- *ContractWithdrawalMigrated) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "WithdrawalMigrated")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractWithdrawalMigrated)
				if err := _Contract.contract.UnpackLog(event, "WithdrawalMigrated", log); err != nil {
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

func (_Contract *ContractFilterer) ParseWithdrawalMigrated(log types.Log) (*ContractWithdrawalMigrated, error) {
	event := new(ContractWithdrawalMigrated)
	if err := _Contract.contract.UnpackLog(event, "WithdrawalMigrated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractWithdrawalQueuedIterator struct {
	Event *ContractWithdrawalQueued

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractWithdrawalQueuedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractWithdrawalQueued)
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
		it.Event = new(ContractWithdrawalQueued)
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

func (it *ContractWithdrawalQueuedIterator) Error() error {
	return it.fail
}

func (it *ContractWithdrawalQueuedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractWithdrawalQueued struct {
	WithdrawalRoot [32]byte
	Withdrawal     IDelegationManagerWithdrawal
	Raw            types.Log
}

func (_Contract *ContractFilterer) FilterWithdrawalQueued(opts *bind.FilterOpts) (*ContractWithdrawalQueuedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "WithdrawalQueued")
	if err != nil {
		return nil, err
	}
	return &ContractWithdrawalQueuedIterator{contract: _Contract.contract, event: "WithdrawalQueued", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchWithdrawalQueued(opts *bind.WatchOpts, sink chan<- *ContractWithdrawalQueued) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "WithdrawalQueued")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractWithdrawalQueued)
				if err := _Contract.contract.UnpackLog(event, "WithdrawalQueued", log); err != nil {
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

func (_Contract *ContractFilterer) ParseWithdrawalQueued(log types.Log) (*ContractWithdrawalQueued, error) {
	event := new(ContractWithdrawalQueued)
	if err := _Contract.contract.UnpackLog(event, "WithdrawalQueued", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

func (_Contract *Contract) ParseLog(log types.Log) (generated.AbigenLog, error) {
	switch log.Topics[0] {
	case _Contract.abi.Events["MinWithdrawalDelayBlocksSet"].ID:
		return _Contract.ParseMinWithdrawalDelayBlocksSet(log)
	case _Contract.abi.Events["OperatorDetailsModified"].ID:
		return _Contract.ParseOperatorDetailsModified(log)
	case _Contract.abi.Events["OperatorMetadataURIUpdated"].ID:
		return _Contract.ParseOperatorMetadataURIUpdated(log)
	case _Contract.abi.Events["OperatorRegistered"].ID:
		return _Contract.ParseOperatorRegistered(log)
	case _Contract.abi.Events["OperatorSharesDecreased"].ID:
		return _Contract.ParseOperatorSharesDecreased(log)
	case _Contract.abi.Events["OperatorSharesIncreased"].ID:
		return _Contract.ParseOperatorSharesIncreased(log)
	case _Contract.abi.Events["StakerDelegated"].ID:
		return _Contract.ParseStakerDelegated(log)
	case _Contract.abi.Events["StakerForceUndelegated"].ID:
		return _Contract.ParseStakerForceUndelegated(log)
	case _Contract.abi.Events["StakerUndelegated"].ID:
		return _Contract.ParseStakerUndelegated(log)
	case _Contract.abi.Events["StrategyWithdrawalDelayBlocksSet"].ID:
		return _Contract.ParseStrategyWithdrawalDelayBlocksSet(log)
	case _Contract.abi.Events["WithdrawalCompleted"].ID:
		return _Contract.ParseWithdrawalCompleted(log)
	case _Contract.abi.Events["WithdrawalMigrated"].ID:
		return _Contract.ParseWithdrawalMigrated(log)
	case _Contract.abi.Events["WithdrawalQueued"].ID:
		return _Contract.ParseWithdrawalQueued(log)

	default:
		return nil, fmt.Errorf("abigen wrapper received unknown log topic: %v", log.Topics[0])
	}
}

func (ContractMinWithdrawalDelayBlocksSet) Topic() common.Hash {
	return common.HexToHash("0xafa003cd76f87ff9d62b35beea889920f33c0c42b8d45b74954d61d50f4b6b69")
}

func (ContractOperatorDetailsModified) Topic() common.Hash {
	return common.HexToHash("0xfebe5cd24b2cbc7b065b9d0fdeb904461e4afcff57dd57acda1e7832031ba7ac")
}

func (ContractOperatorMetadataURIUpdated) Topic() common.Hash {
	return common.HexToHash("0x02a919ed0e2acad1dd90f17ef2fa4ae5462ee1339170034a8531cca4b6708090")
}

func (ContractOperatorRegistered) Topic() common.Hash {
	return common.HexToHash("0x8e8485583a2310d41f7c82b9427d0bd49bad74bb9cff9d3402a29d8f9b28a0e2")
}

func (ContractOperatorSharesDecreased) Topic() common.Hash {
	return common.HexToHash("0x6909600037b75d7b4733aedd815442b5ec018a827751c832aaff64eba5d6d2dd")
}

func (ContractOperatorSharesIncreased) Topic() common.Hash {
	return common.HexToHash("0x1ec042c965e2edd7107b51188ee0f383e22e76179041ab3a9d18ff151405166c")
}

func (ContractStakerDelegated) Topic() common.Hash {
	return common.HexToHash("0xc3ee9f2e5fda98e8066a1f745b2df9285f416fe98cf2559cd21484b3d8743304")
}

func (ContractStakerForceUndelegated) Topic() common.Hash {
	return common.HexToHash("0xf0eddf07e6ea14f388b47e1e94a0f464ecbd9eed4171130e0fc0e99fb4030a8a")
}

func (ContractStakerUndelegated) Topic() common.Hash {
	return common.HexToHash("0xfee30966a256b71e14bc0ebfc94315e28ef4a97a7131a9e2b7a310a73af44676")
}

func (ContractStrategyWithdrawalDelayBlocksSet) Topic() common.Hash {
	return common.HexToHash("0x0e7efa738e8b0ce6376a0c1af471655540d2e9a81647d7b09ed823018426576d")
}

func (ContractWithdrawalCompleted) Topic() common.Hash {
	return common.HexToHash("0xc97098c2f658800b4df29001527f7324bcdffcf6e8751a699ab920a1eced5b1d")
}

func (ContractWithdrawalMigrated) Topic() common.Hash {
	return common.HexToHash("0xdc00758b65eef71dc3780c04ebe36cab6bdb266c3a698187e29e0f0dca012630")
}

func (ContractWithdrawalQueued) Topic() common.Hash {
	return common.HexToHash("0x9009ab153e8014fbfb02f2217f5cde7aa7f9ad734ae85ca3ee3f4ca2fdd499f9")
}

func (_Contract *Contract) Address() common.Address {
	return _Contract.address
}

type ContractInterface interface {
	DELEGATIONAPPROVALTYPEHASH(opts *bind.CallOpts) ([32]byte, error)

	DOMAINTYPEHASH(opts *bind.CallOpts) ([32]byte, error)

	STAKERDELEGATIONTYPEHASH(opts *bind.CallOpts) ([32]byte, error)

	CalculateCurrentStakerDelegationDigestHash(opts *bind.CallOpts, staker common.Address, operator common.Address, expiry *big.Int) ([32]byte, error)

	CalculateDelegationApprovalDigestHash(opts *bind.CallOpts, staker common.Address, operator common.Address, _delegationApprover common.Address, approverSalt [32]byte, expiry *big.Int) ([32]byte, error)

	CalculateStakerDelegationDigestHash(opts *bind.CallOpts, staker common.Address, _stakerNonce *big.Int, operator common.Address, expiry *big.Int) ([32]byte, error)

	CalculateWithdrawalRoot(opts *bind.CallOpts, withdrawal IDelegationManagerWithdrawal) ([32]byte, error)

	CumulativeWithdrawalsQueued(opts *bind.CallOpts, staker common.Address) (*big.Int, error)

	DelegatedTo(opts *bind.CallOpts, staker common.Address) (common.Address, error)

	DelegationApprover(opts *bind.CallOpts, operator common.Address) (common.Address, error)

	DelegationApproverSaltIsSpent(opts *bind.CallOpts, _delegationApprover common.Address, salt [32]byte) (bool, error)

	DomainSeparator(opts *bind.CallOpts) ([32]byte, error)

	EarningsReceiver(opts *bind.CallOpts, operator common.Address) (common.Address, error)

	GetOperatorShares(opts *bind.CallOpts, operator common.Address, strategies []common.Address) ([]*big.Int, error)

	GetWithdrawalDelay(opts *bind.CallOpts, strategies []common.Address) (*big.Int, error)

	IsDelegated(opts *bind.CallOpts, staker common.Address) (bool, error)

	IsOperator(opts *bind.CallOpts, operator common.Address) (bool, error)

	MinWithdrawalDelayBlocks(opts *bind.CallOpts) (*big.Int, error)

	OperatorDetails(opts *bind.CallOpts, operator common.Address) (IDelegationManagerOperatorDetails, error)

	OperatorShares(opts *bind.CallOpts, operator common.Address, strategy common.Address) (*big.Int, error)

	StakerNonce(opts *bind.CallOpts, staker common.Address) (*big.Int, error)

	StakerOptOutWindowBlocks(opts *bind.CallOpts, operator common.Address) (*big.Int, error)

	StrategyWithdrawalDelayBlocks(opts *bind.CallOpts, strategy common.Address) (*big.Int, error)

	CompleteQueuedWithdrawal(opts *bind.TransactOpts, withdrawal IDelegationManagerWithdrawal, tokens []common.Address, middlewareTimesIndex *big.Int, receiveAsTokens bool) (*types.Transaction, error)

	CompleteQueuedWithdrawals(opts *bind.TransactOpts, withdrawals []IDelegationManagerWithdrawal, tokens [][]common.Address, middlewareTimesIndexes []*big.Int, receiveAsTokens []bool) (*types.Transaction, error)

	DecreaseDelegatedShares(opts *bind.TransactOpts, staker common.Address, strategy common.Address, shares *big.Int) (*types.Transaction, error)

	DelegateTo(opts *bind.TransactOpts, operator common.Address, approverSignatureAndExpiry ISignatureUtilsSignatureWithExpiry, approverSalt [32]byte) (*types.Transaction, error)

	DelegateToBySignature(opts *bind.TransactOpts, staker common.Address, operator common.Address, stakerSignatureAndExpiry ISignatureUtilsSignatureWithExpiry, approverSignatureAndExpiry ISignatureUtilsSignatureWithExpiry, approverSalt [32]byte) (*types.Transaction, error)

	IncreaseDelegatedShares(opts *bind.TransactOpts, staker common.Address, strategy common.Address, shares *big.Int) (*types.Transaction, error)

	MigrateQueuedWithdrawals(opts *bind.TransactOpts, withdrawalsToQueue []IStrategyManagerDeprecatedStructQueuedWithdrawal) (*types.Transaction, error)

	ModifyOperatorDetails(opts *bind.TransactOpts, newOperatorDetails IDelegationManagerOperatorDetails) (*types.Transaction, error)

	QueueWithdrawals(opts *bind.TransactOpts, queuedWithdrawalParams []IDelegationManagerQueuedWithdrawalParams) (*types.Transaction, error)

	RegisterAsOperator(opts *bind.TransactOpts, registeringOperatorDetails IDelegationManagerOperatorDetails, metadataURI string) (*types.Transaction, error)

	Undelegate(opts *bind.TransactOpts, staker common.Address) (*types.Transaction, error)

	UpdateOperatorMetadataURI(opts *bind.TransactOpts, metadataURI string) (*types.Transaction, error)

	FilterMinWithdrawalDelayBlocksSet(opts *bind.FilterOpts) (*ContractMinWithdrawalDelayBlocksSetIterator, error)

	WatchMinWithdrawalDelayBlocksSet(opts *bind.WatchOpts, sink chan<- *ContractMinWithdrawalDelayBlocksSet) (event.Subscription, error)

	ParseMinWithdrawalDelayBlocksSet(log types.Log) (*ContractMinWithdrawalDelayBlocksSet, error)

	FilterOperatorDetailsModified(opts *bind.FilterOpts, operator []common.Address) (*ContractOperatorDetailsModifiedIterator, error)

	WatchOperatorDetailsModified(opts *bind.WatchOpts, sink chan<- *ContractOperatorDetailsModified, operator []common.Address) (event.Subscription, error)

	ParseOperatorDetailsModified(log types.Log) (*ContractOperatorDetailsModified, error)

	FilterOperatorMetadataURIUpdated(opts *bind.FilterOpts, operator []common.Address) (*ContractOperatorMetadataURIUpdatedIterator, error)

	WatchOperatorMetadataURIUpdated(opts *bind.WatchOpts, sink chan<- *ContractOperatorMetadataURIUpdated, operator []common.Address) (event.Subscription, error)

	ParseOperatorMetadataURIUpdated(log types.Log) (*ContractOperatorMetadataURIUpdated, error)

	FilterOperatorRegistered(opts *bind.FilterOpts, operator []common.Address) (*ContractOperatorRegisteredIterator, error)

	WatchOperatorRegistered(opts *bind.WatchOpts, sink chan<- *ContractOperatorRegistered, operator []common.Address) (event.Subscription, error)

	ParseOperatorRegistered(log types.Log) (*ContractOperatorRegistered, error)

	FilterOperatorSharesDecreased(opts *bind.FilterOpts, operator []common.Address) (*ContractOperatorSharesDecreasedIterator, error)

	WatchOperatorSharesDecreased(opts *bind.WatchOpts, sink chan<- *ContractOperatorSharesDecreased, operator []common.Address) (event.Subscription, error)

	ParseOperatorSharesDecreased(log types.Log) (*ContractOperatorSharesDecreased, error)

	FilterOperatorSharesIncreased(opts *bind.FilterOpts, operator []common.Address) (*ContractOperatorSharesIncreasedIterator, error)

	WatchOperatorSharesIncreased(opts *bind.WatchOpts, sink chan<- *ContractOperatorSharesIncreased, operator []common.Address) (event.Subscription, error)

	ParseOperatorSharesIncreased(log types.Log) (*ContractOperatorSharesIncreased, error)

	FilterStakerDelegated(opts *bind.FilterOpts, staker []common.Address, operator []common.Address) (*ContractStakerDelegatedIterator, error)

	WatchStakerDelegated(opts *bind.WatchOpts, sink chan<- *ContractStakerDelegated, staker []common.Address, operator []common.Address) (event.Subscription, error)

	ParseStakerDelegated(log types.Log) (*ContractStakerDelegated, error)

	FilterStakerForceUndelegated(opts *bind.FilterOpts, staker []common.Address, operator []common.Address) (*ContractStakerForceUndelegatedIterator, error)

	WatchStakerForceUndelegated(opts *bind.WatchOpts, sink chan<- *ContractStakerForceUndelegated, staker []common.Address, operator []common.Address) (event.Subscription, error)

	ParseStakerForceUndelegated(log types.Log) (*ContractStakerForceUndelegated, error)

	FilterStakerUndelegated(opts *bind.FilterOpts, staker []common.Address, operator []common.Address) (*ContractStakerUndelegatedIterator, error)

	WatchStakerUndelegated(opts *bind.WatchOpts, sink chan<- *ContractStakerUndelegated, staker []common.Address, operator []common.Address) (event.Subscription, error)

	ParseStakerUndelegated(log types.Log) (*ContractStakerUndelegated, error)

	FilterStrategyWithdrawalDelayBlocksSet(opts *bind.FilterOpts) (*ContractStrategyWithdrawalDelayBlocksSetIterator, error)

	WatchStrategyWithdrawalDelayBlocksSet(opts *bind.WatchOpts, sink chan<- *ContractStrategyWithdrawalDelayBlocksSet) (event.Subscription, error)

	ParseStrategyWithdrawalDelayBlocksSet(log types.Log) (*ContractStrategyWithdrawalDelayBlocksSet, error)

	FilterWithdrawalCompleted(opts *bind.FilterOpts) (*ContractWithdrawalCompletedIterator, error)

	WatchWithdrawalCompleted(opts *bind.WatchOpts, sink chan<- *ContractWithdrawalCompleted) (event.Subscription, error)

	ParseWithdrawalCompleted(log types.Log) (*ContractWithdrawalCompleted, error)

	FilterWithdrawalMigrated(opts *bind.FilterOpts) (*ContractWithdrawalMigratedIterator, error)

	WatchWithdrawalMigrated(opts *bind.WatchOpts, sink chan<- *ContractWithdrawalMigrated) (event.Subscription, error)

	ParseWithdrawalMigrated(log types.Log) (*ContractWithdrawalMigrated, error)

	FilterWithdrawalQueued(opts *bind.FilterOpts) (*ContractWithdrawalQueuedIterator, error)

	WatchWithdrawalQueued(opts *bind.WatchOpts, sink chan<- *ContractWithdrawalQueued) (event.Subscription, error)

	ParseWithdrawalQueued(log types.Log) (*ContractWithdrawalQueued, error)

	ParseLog(log types.Log) (generated.AbigenLog, error)

	Address() common.Address
}
