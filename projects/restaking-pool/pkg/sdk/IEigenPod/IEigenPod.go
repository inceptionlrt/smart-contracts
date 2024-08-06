// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package IEigenPod

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

type BeaconChainProofsBalanceContainerProof struct {
	BalanceContainerRoot [32]byte
	Proof                []byte
}

type BeaconChainProofsBalanceProof struct {
	PubkeyHash  [32]byte
	BalanceRoot [32]byte
	Proof       []byte
}

type BeaconChainProofsStateRootProof struct {
	BeaconStateRoot [32]byte
	Proof           []byte
}

type BeaconChainProofsValidatorProof struct {
	ValidatorFields [][32]byte
	Proof           []byte
}

type IEigenPodCheckpoint struct {
	BeaconBlockRoot   [32]byte
	ProofsRemaining   *big.Int
	PodBalanceGwei    uint64
	BalanceDeltasGwei *big.Int
}

type IEigenPodValidatorInfo struct {
	ValidatorIndex      uint64
	RestakedBalanceGwei uint64
	LastCheckpointedAt  uint64
	Status              uint8
}

var ContractMetaData = &bind.MetaData{
	ABI: "[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint64\",\"name\":\"checkpointTimestamp\",\"type\":\"uint64\"},{\"indexed\":true,\"internalType\":\"bytes32\",\"name\":\"beaconBlockRoot\",\"type\":\"bytes32\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"validatorCount\",\"type\":\"uint256\"}],\"name\":\"CheckpointCreated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint64\",\"name\":\"checkpointTimestamp\",\"type\":\"uint64\"},{\"indexed\":false,\"internalType\":\"int256\",\"name\":\"totalShareDeltaWei\",\"type\":\"int256\"}],\"name\":\"CheckpointFinalized\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"bytes\",\"name\":\"pubkey\",\"type\":\"bytes\"}],\"name\":\"EigenPodStaked\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amountReceived\",\"type\":\"uint256\"}],\"name\":\"NonBeaconChainETHReceived\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"prevProofSubmitter\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"newProofSubmitter\",\"type\":\"address\"}],\"name\":\"ProofSubmitterUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"recipient\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"RestakedBeaconChainETHWithdrawn\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint40\",\"name\":\"validatorIndex\",\"type\":\"uint40\"},{\"indexed\":false,\"internalType\":\"uint64\",\"name\":\"balanceTimestamp\",\"type\":\"uint64\"},{\"indexed\":false,\"internalType\":\"uint64\",\"name\":\"newValidatorBalanceGwei\",\"type\":\"uint64\"}],\"name\":\"ValidatorBalanceUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint64\",\"name\":\"checkpointTimestamp\",\"type\":\"uint64\"},{\"indexed\":true,\"internalType\":\"uint40\",\"name\":\"validatorIndex\",\"type\":\"uint40\"}],\"name\":\"ValidatorCheckpointed\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint40\",\"name\":\"validatorIndex\",\"type\":\"uint40\"}],\"name\":\"ValidatorRestaked\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint64\",\"name\":\"checkpointTimestamp\",\"type\":\"uint64\"},{\"indexed\":true,\"internalType\":\"uint40\",\"name\":\"validatorIndex\",\"type\":\"uint40\"}],\"name\":\"ValidatorWithdrawn\",\"type\":\"event\"},{\"inputs\":[],\"name\":\"activeValidatorCount\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint64\",\"name\":\"\",\"type\":\"uint64\"}],\"name\":\"checkpointBalanceExitedGwei\",\"outputs\":[{\"internalType\":\"uint64\",\"name\":\"\",\"type\":\"uint64\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"currentCheckpoint\",\"outputs\":[{\"components\":[{\"internalType\":\"bytes32\",\"name\":\"beaconBlockRoot\",\"type\":\"bytes32\"},{\"internalType\":\"uint24\",\"name\":\"proofsRemaining\",\"type\":\"uint24\"},{\"internalType\":\"uint64\",\"name\":\"podBalanceGwei\",\"type\":\"uint64\"},{\"internalType\":\"int128\",\"name\":\"balanceDeltasGwei\",\"type\":\"int128\"}],\"internalType\":\"structIEigenPod.Checkpoint\",\"name\":\"\",\"type\":\"tuple\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"currentCheckpointTimestamp\",\"outputs\":[{\"internalType\":\"uint64\",\"name\":\"\",\"type\":\"uint64\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"eigenPodManager\",\"outputs\":[{\"internalType\":\"contractIEigenPodManager\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint64\",\"name\":\"timestamp\",\"type\":\"uint64\"}],\"name\":\"getParentBlockRoot\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"}],\"name\":\"initialize\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"lastCheckpointTimestamp\",\"outputs\":[{\"internalType\":\"uint64\",\"name\":\"\",\"type\":\"uint64\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"podOwner\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"proofSubmitter\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"contractIERC20[]\",\"name\":\"tokenList\",\"type\":\"address[]\"},{\"internalType\":\"uint256[]\",\"name\":\"amountsToWithdraw\",\"type\":\"uint256[]\"},{\"internalType\":\"address\",\"name\":\"recipient\",\"type\":\"address\"}],\"name\":\"recoverTokens\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"newProofSubmitter\",\"type\":\"address\"}],\"name\":\"setProofSubmitter\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes\",\"name\":\"pubkey\",\"type\":\"bytes\"},{\"internalType\":\"bytes\",\"name\":\"signature\",\"type\":\"bytes\"},{\"internalType\":\"bytes32\",\"name\":\"depositDataRoot\",\"type\":\"bytes32\"}],\"name\":\"stake\",\"outputs\":[],\"stateMutability\":\"payable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bool\",\"name\":\"revertIfNoBalance\",\"type\":\"bool\"}],\"name\":\"startCheckpoint\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"validatorPubkeyHash\",\"type\":\"bytes32\"}],\"name\":\"validatorPubkeyHashToInfo\",\"outputs\":[{\"components\":[{\"internalType\":\"uint64\",\"name\":\"validatorIndex\",\"type\":\"uint64\"},{\"internalType\":\"uint64\",\"name\":\"restakedBalanceGwei\",\"type\":\"uint64\"},{\"internalType\":\"uint64\",\"name\":\"lastCheckpointedAt\",\"type\":\"uint64\"},{\"internalType\":\"enumIEigenPod.VALIDATOR_STATUS\",\"name\":\"status\",\"type\":\"uint8\"}],\"internalType\":\"structIEigenPod.ValidatorInfo\",\"name\":\"\",\"type\":\"tuple\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes\",\"name\":\"validatorPubkey\",\"type\":\"bytes\"}],\"name\":\"validatorPubkeyToInfo\",\"outputs\":[{\"components\":[{\"internalType\":\"uint64\",\"name\":\"validatorIndex\",\"type\":\"uint64\"},{\"internalType\":\"uint64\",\"name\":\"restakedBalanceGwei\",\"type\":\"uint64\"},{\"internalType\":\"uint64\",\"name\":\"lastCheckpointedAt\",\"type\":\"uint64\"},{\"internalType\":\"enumIEigenPod.VALIDATOR_STATUS\",\"name\":\"status\",\"type\":\"uint8\"}],\"internalType\":\"structIEigenPod.ValidatorInfo\",\"name\":\"\",\"type\":\"tuple\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes\",\"name\":\"validatorPubkey\",\"type\":\"bytes\"}],\"name\":\"validatorStatus\",\"outputs\":[{\"internalType\":\"enumIEigenPod.VALIDATOR_STATUS\",\"name\":\"\",\"type\":\"uint8\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"pubkeyHash\",\"type\":\"bytes32\"}],\"name\":\"validatorStatus\",\"outputs\":[{\"internalType\":\"enumIEigenPod.VALIDATOR_STATUS\",\"name\":\"\",\"type\":\"uint8\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"components\":[{\"internalType\":\"bytes32\",\"name\":\"balanceContainerRoot\",\"type\":\"bytes32\"},{\"internalType\":\"bytes\",\"name\":\"proof\",\"type\":\"bytes\"}],\"internalType\":\"structBeaconChainProofs.BalanceContainerProof\",\"name\":\"balanceContainerProof\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"bytes32\",\"name\":\"pubkeyHash\",\"type\":\"bytes32\"},{\"internalType\":\"bytes32\",\"name\":\"balanceRoot\",\"type\":\"bytes32\"},{\"internalType\":\"bytes\",\"name\":\"proof\",\"type\":\"bytes\"}],\"internalType\":\"structBeaconChainProofs.BalanceProof[]\",\"name\":\"proofs\",\"type\":\"tuple[]\"}],\"name\":\"verifyCheckpointProofs\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint64\",\"name\":\"beaconTimestamp\",\"type\":\"uint64\"},{\"components\":[{\"internalType\":\"bytes32\",\"name\":\"beaconStateRoot\",\"type\":\"bytes32\"},{\"internalType\":\"bytes\",\"name\":\"proof\",\"type\":\"bytes\"}],\"internalType\":\"structBeaconChainProofs.StateRootProof\",\"name\":\"stateRootProof\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"bytes32[]\",\"name\":\"validatorFields\",\"type\":\"bytes32[]\"},{\"internalType\":\"bytes\",\"name\":\"proof\",\"type\":\"bytes\"}],\"internalType\":\"structBeaconChainProofs.ValidatorProof\",\"name\":\"proof\",\"type\":\"tuple\"}],\"name\":\"verifyStaleBalance\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint64\",\"name\":\"beaconTimestamp\",\"type\":\"uint64\"},{\"components\":[{\"internalType\":\"bytes32\",\"name\":\"beaconStateRoot\",\"type\":\"bytes32\"},{\"internalType\":\"bytes\",\"name\":\"proof\",\"type\":\"bytes\"}],\"internalType\":\"structBeaconChainProofs.StateRootProof\",\"name\":\"stateRootProof\",\"type\":\"tuple\"},{\"internalType\":\"uint40[]\",\"name\":\"validatorIndices\",\"type\":\"uint40[]\"},{\"internalType\":\"bytes[]\",\"name\":\"validatorFieldsProofs\",\"type\":\"bytes[]\"},{\"internalType\":\"bytes32[][]\",\"name\":\"validatorFields\",\"type\":\"bytes32[][]\"}],\"name\":\"verifyWithdrawalCredentials\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"recipient\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"withdrawRestakedBeaconChainETH\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"withdrawableRestakedExecutionLayerGwei\",\"outputs\":[{\"internalType\":\"uint64\",\"name\":\"\",\"type\":\"uint64\"}],\"stateMutability\":\"view\",\"type\":\"function\"}]",
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

func (_Contract *ContractCaller) ActiveValidatorCount(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "activeValidatorCount")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) ActiveValidatorCount() (*big.Int, error) {
	return _Contract.Contract.ActiveValidatorCount(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) ActiveValidatorCount() (*big.Int, error) {
	return _Contract.Contract.ActiveValidatorCount(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) CheckpointBalanceExitedGwei(opts *bind.CallOpts, arg0 uint64) (uint64, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "checkpointBalanceExitedGwei", arg0)

	if err != nil {
		return *new(uint64), err
	}

	out0 := *abi.ConvertType(out[0], new(uint64)).(*uint64)

	return out0, err

}

func (_Contract *ContractSession) CheckpointBalanceExitedGwei(arg0 uint64) (uint64, error) {
	return _Contract.Contract.CheckpointBalanceExitedGwei(&_Contract.CallOpts, arg0)
}

func (_Contract *ContractCallerSession) CheckpointBalanceExitedGwei(arg0 uint64) (uint64, error) {
	return _Contract.Contract.CheckpointBalanceExitedGwei(&_Contract.CallOpts, arg0)
}

func (_Contract *ContractCaller) CurrentCheckpoint(opts *bind.CallOpts) (IEigenPodCheckpoint, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "currentCheckpoint")

	if err != nil {
		return *new(IEigenPodCheckpoint), err
	}

	out0 := *abi.ConvertType(out[0], new(IEigenPodCheckpoint)).(*IEigenPodCheckpoint)

	return out0, err

}

func (_Contract *ContractSession) CurrentCheckpoint() (IEigenPodCheckpoint, error) {
	return _Contract.Contract.CurrentCheckpoint(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) CurrentCheckpoint() (IEigenPodCheckpoint, error) {
	return _Contract.Contract.CurrentCheckpoint(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) CurrentCheckpointTimestamp(opts *bind.CallOpts) (uint64, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "currentCheckpointTimestamp")

	if err != nil {
		return *new(uint64), err
	}

	out0 := *abi.ConvertType(out[0], new(uint64)).(*uint64)

	return out0, err

}

func (_Contract *ContractSession) CurrentCheckpointTimestamp() (uint64, error) {
	return _Contract.Contract.CurrentCheckpointTimestamp(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) CurrentCheckpointTimestamp() (uint64, error) {
	return _Contract.Contract.CurrentCheckpointTimestamp(&_Contract.CallOpts)
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

func (_Contract *ContractCaller) GetParentBlockRoot(opts *bind.CallOpts, timestamp uint64) ([32]byte, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getParentBlockRoot", timestamp)

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

func (_Contract *ContractSession) GetParentBlockRoot(timestamp uint64) ([32]byte, error) {
	return _Contract.Contract.GetParentBlockRoot(&_Contract.CallOpts, timestamp)
}

func (_Contract *ContractCallerSession) GetParentBlockRoot(timestamp uint64) ([32]byte, error) {
	return _Contract.Contract.GetParentBlockRoot(&_Contract.CallOpts, timestamp)
}

func (_Contract *ContractCaller) LastCheckpointTimestamp(opts *bind.CallOpts) (uint64, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "lastCheckpointTimestamp")

	if err != nil {
		return *new(uint64), err
	}

	out0 := *abi.ConvertType(out[0], new(uint64)).(*uint64)

	return out0, err

}

func (_Contract *ContractSession) LastCheckpointTimestamp() (uint64, error) {
	return _Contract.Contract.LastCheckpointTimestamp(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) LastCheckpointTimestamp() (uint64, error) {
	return _Contract.Contract.LastCheckpointTimestamp(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) PodOwner(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "podOwner")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) PodOwner() (common.Address, error) {
	return _Contract.Contract.PodOwner(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) PodOwner() (common.Address, error) {
	return _Contract.Contract.PodOwner(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) ProofSubmitter(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "proofSubmitter")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) ProofSubmitter() (common.Address, error) {
	return _Contract.Contract.ProofSubmitter(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) ProofSubmitter() (common.Address, error) {
	return _Contract.Contract.ProofSubmitter(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) ValidatorPubkeyHashToInfo(opts *bind.CallOpts, validatorPubkeyHash [32]byte) (IEigenPodValidatorInfo, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "validatorPubkeyHashToInfo", validatorPubkeyHash)

	if err != nil {
		return *new(IEigenPodValidatorInfo), err
	}

	out0 := *abi.ConvertType(out[0], new(IEigenPodValidatorInfo)).(*IEigenPodValidatorInfo)

	return out0, err

}

func (_Contract *ContractSession) ValidatorPubkeyHashToInfo(validatorPubkeyHash [32]byte) (IEigenPodValidatorInfo, error) {
	return _Contract.Contract.ValidatorPubkeyHashToInfo(&_Contract.CallOpts, validatorPubkeyHash)
}

func (_Contract *ContractCallerSession) ValidatorPubkeyHashToInfo(validatorPubkeyHash [32]byte) (IEigenPodValidatorInfo, error) {
	return _Contract.Contract.ValidatorPubkeyHashToInfo(&_Contract.CallOpts, validatorPubkeyHash)
}

func (_Contract *ContractCaller) ValidatorPubkeyToInfo(opts *bind.CallOpts, validatorPubkey []byte) (IEigenPodValidatorInfo, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "validatorPubkeyToInfo", validatorPubkey)

	if err != nil {
		return *new(IEigenPodValidatorInfo), err
	}

	out0 := *abi.ConvertType(out[0], new(IEigenPodValidatorInfo)).(*IEigenPodValidatorInfo)

	return out0, err

}

func (_Contract *ContractSession) ValidatorPubkeyToInfo(validatorPubkey []byte) (IEigenPodValidatorInfo, error) {
	return _Contract.Contract.ValidatorPubkeyToInfo(&_Contract.CallOpts, validatorPubkey)
}

func (_Contract *ContractCallerSession) ValidatorPubkeyToInfo(validatorPubkey []byte) (IEigenPodValidatorInfo, error) {
	return _Contract.Contract.ValidatorPubkeyToInfo(&_Contract.CallOpts, validatorPubkey)
}

func (_Contract *ContractCaller) ValidatorStatus(opts *bind.CallOpts, validatorPubkey []byte) (uint8, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "validatorStatus", validatorPubkey)

	if err != nil {
		return *new(uint8), err
	}

	out0 := *abi.ConvertType(out[0], new(uint8)).(*uint8)

	return out0, err

}

func (_Contract *ContractSession) ValidatorStatus(validatorPubkey []byte) (uint8, error) {
	return _Contract.Contract.ValidatorStatus(&_Contract.CallOpts, validatorPubkey)
}

func (_Contract *ContractCallerSession) ValidatorStatus(validatorPubkey []byte) (uint8, error) {
	return _Contract.Contract.ValidatorStatus(&_Contract.CallOpts, validatorPubkey)
}

func (_Contract *ContractCaller) ValidatorStatus0(opts *bind.CallOpts, pubkeyHash [32]byte) (uint8, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "validatorStatus0", pubkeyHash)

	if err != nil {
		return *new(uint8), err
	}

	out0 := *abi.ConvertType(out[0], new(uint8)).(*uint8)

	return out0, err

}

func (_Contract *ContractSession) ValidatorStatus0(pubkeyHash [32]byte) (uint8, error) {
	return _Contract.Contract.ValidatorStatus0(&_Contract.CallOpts, pubkeyHash)
}

func (_Contract *ContractCallerSession) ValidatorStatus0(pubkeyHash [32]byte) (uint8, error) {
	return _Contract.Contract.ValidatorStatus0(&_Contract.CallOpts, pubkeyHash)
}

func (_Contract *ContractCaller) WithdrawableRestakedExecutionLayerGwei(opts *bind.CallOpts) (uint64, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "withdrawableRestakedExecutionLayerGwei")

	if err != nil {
		return *new(uint64), err
	}

	out0 := *abi.ConvertType(out[0], new(uint64)).(*uint64)

	return out0, err

}

func (_Contract *ContractSession) WithdrawableRestakedExecutionLayerGwei() (uint64, error) {
	return _Contract.Contract.WithdrawableRestakedExecutionLayerGwei(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) WithdrawableRestakedExecutionLayerGwei() (uint64, error) {
	return _Contract.Contract.WithdrawableRestakedExecutionLayerGwei(&_Contract.CallOpts)
}

func (_Contract *ContractTransactor) Initialize(opts *bind.TransactOpts, owner common.Address) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "initialize", owner)
}

func (_Contract *ContractSession) Initialize(owner common.Address) (*types.Transaction, error) {
	return _Contract.Contract.Initialize(&_Contract.TransactOpts, owner)
}

func (_Contract *ContractTransactorSession) Initialize(owner common.Address) (*types.Transaction, error) {
	return _Contract.Contract.Initialize(&_Contract.TransactOpts, owner)
}

func (_Contract *ContractTransactor) RecoverTokens(opts *bind.TransactOpts, tokenList []common.Address, amountsToWithdraw []*big.Int, recipient common.Address) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "recoverTokens", tokenList, amountsToWithdraw, recipient)
}

func (_Contract *ContractSession) RecoverTokens(tokenList []common.Address, amountsToWithdraw []*big.Int, recipient common.Address) (*types.Transaction, error) {
	return _Contract.Contract.RecoverTokens(&_Contract.TransactOpts, tokenList, amountsToWithdraw, recipient)
}

func (_Contract *ContractTransactorSession) RecoverTokens(tokenList []common.Address, amountsToWithdraw []*big.Int, recipient common.Address) (*types.Transaction, error) {
	return _Contract.Contract.RecoverTokens(&_Contract.TransactOpts, tokenList, amountsToWithdraw, recipient)
}

func (_Contract *ContractTransactor) SetProofSubmitter(opts *bind.TransactOpts, newProofSubmitter common.Address) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "setProofSubmitter", newProofSubmitter)
}

func (_Contract *ContractSession) SetProofSubmitter(newProofSubmitter common.Address) (*types.Transaction, error) {
	return _Contract.Contract.SetProofSubmitter(&_Contract.TransactOpts, newProofSubmitter)
}

func (_Contract *ContractTransactorSession) SetProofSubmitter(newProofSubmitter common.Address) (*types.Transaction, error) {
	return _Contract.Contract.SetProofSubmitter(&_Contract.TransactOpts, newProofSubmitter)
}

func (_Contract *ContractTransactor) Stake(opts *bind.TransactOpts, pubkey []byte, signature []byte, depositDataRoot [32]byte) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "stake", pubkey, signature, depositDataRoot)
}

func (_Contract *ContractSession) Stake(pubkey []byte, signature []byte, depositDataRoot [32]byte) (*types.Transaction, error) {
	return _Contract.Contract.Stake(&_Contract.TransactOpts, pubkey, signature, depositDataRoot)
}

func (_Contract *ContractTransactorSession) Stake(pubkey []byte, signature []byte, depositDataRoot [32]byte) (*types.Transaction, error) {
	return _Contract.Contract.Stake(&_Contract.TransactOpts, pubkey, signature, depositDataRoot)
}

func (_Contract *ContractTransactor) StartCheckpoint(opts *bind.TransactOpts, revertIfNoBalance bool) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "startCheckpoint", revertIfNoBalance)
}

func (_Contract *ContractSession) StartCheckpoint(revertIfNoBalance bool) (*types.Transaction, error) {
	return _Contract.Contract.StartCheckpoint(&_Contract.TransactOpts, revertIfNoBalance)
}

func (_Contract *ContractTransactorSession) StartCheckpoint(revertIfNoBalance bool) (*types.Transaction, error) {
	return _Contract.Contract.StartCheckpoint(&_Contract.TransactOpts, revertIfNoBalance)
}

func (_Contract *ContractTransactor) VerifyCheckpointProofs(opts *bind.TransactOpts, balanceContainerProof BeaconChainProofsBalanceContainerProof, proofs []BeaconChainProofsBalanceProof) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "verifyCheckpointProofs", balanceContainerProof, proofs)
}

func (_Contract *ContractSession) VerifyCheckpointProofs(balanceContainerProof BeaconChainProofsBalanceContainerProof, proofs []BeaconChainProofsBalanceProof) (*types.Transaction, error) {
	return _Contract.Contract.VerifyCheckpointProofs(&_Contract.TransactOpts, balanceContainerProof, proofs)
}

func (_Contract *ContractTransactorSession) VerifyCheckpointProofs(balanceContainerProof BeaconChainProofsBalanceContainerProof, proofs []BeaconChainProofsBalanceProof) (*types.Transaction, error) {
	return _Contract.Contract.VerifyCheckpointProofs(&_Contract.TransactOpts, balanceContainerProof, proofs)
}

func (_Contract *ContractTransactor) VerifyStaleBalance(opts *bind.TransactOpts, beaconTimestamp uint64, stateRootProof BeaconChainProofsStateRootProof, proof BeaconChainProofsValidatorProof) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "verifyStaleBalance", beaconTimestamp, stateRootProof, proof)
}

func (_Contract *ContractSession) VerifyStaleBalance(beaconTimestamp uint64, stateRootProof BeaconChainProofsStateRootProof, proof BeaconChainProofsValidatorProof) (*types.Transaction, error) {
	return _Contract.Contract.VerifyStaleBalance(&_Contract.TransactOpts, beaconTimestamp, stateRootProof, proof)
}

func (_Contract *ContractTransactorSession) VerifyStaleBalance(beaconTimestamp uint64, stateRootProof BeaconChainProofsStateRootProof, proof BeaconChainProofsValidatorProof) (*types.Transaction, error) {
	return _Contract.Contract.VerifyStaleBalance(&_Contract.TransactOpts, beaconTimestamp, stateRootProof, proof)
}

func (_Contract *ContractTransactor) VerifyWithdrawalCredentials(opts *bind.TransactOpts, beaconTimestamp uint64, stateRootProof BeaconChainProofsStateRootProof, validatorIndices []*big.Int, validatorFieldsProofs [][]byte, validatorFields [][][32]byte) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "verifyWithdrawalCredentials", beaconTimestamp, stateRootProof, validatorIndices, validatorFieldsProofs, validatorFields)
}

func (_Contract *ContractSession) VerifyWithdrawalCredentials(beaconTimestamp uint64, stateRootProof BeaconChainProofsStateRootProof, validatorIndices []*big.Int, validatorFieldsProofs [][]byte, validatorFields [][][32]byte) (*types.Transaction, error) {
	return _Contract.Contract.VerifyWithdrawalCredentials(&_Contract.TransactOpts, beaconTimestamp, stateRootProof, validatorIndices, validatorFieldsProofs, validatorFields)
}

func (_Contract *ContractTransactorSession) VerifyWithdrawalCredentials(beaconTimestamp uint64, stateRootProof BeaconChainProofsStateRootProof, validatorIndices []*big.Int, validatorFieldsProofs [][]byte, validatorFields [][][32]byte) (*types.Transaction, error) {
	return _Contract.Contract.VerifyWithdrawalCredentials(&_Contract.TransactOpts, beaconTimestamp, stateRootProof, validatorIndices, validatorFieldsProofs, validatorFields)
}

func (_Contract *ContractTransactor) WithdrawRestakedBeaconChainETH(opts *bind.TransactOpts, recipient common.Address, amount *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "withdrawRestakedBeaconChainETH", recipient, amount)
}

func (_Contract *ContractSession) WithdrawRestakedBeaconChainETH(recipient common.Address, amount *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.WithdrawRestakedBeaconChainETH(&_Contract.TransactOpts, recipient, amount)
}

func (_Contract *ContractTransactorSession) WithdrawRestakedBeaconChainETH(recipient common.Address, amount *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.WithdrawRestakedBeaconChainETH(&_Contract.TransactOpts, recipient, amount)
}

type ContractCheckpointCreatedIterator struct {
	Event *ContractCheckpointCreated

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractCheckpointCreatedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractCheckpointCreated)
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
		it.Event = new(ContractCheckpointCreated)
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

func (it *ContractCheckpointCreatedIterator) Error() error {
	return it.fail
}

func (it *ContractCheckpointCreatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractCheckpointCreated struct {
	CheckpointTimestamp uint64
	BeaconBlockRoot     [32]byte
	ValidatorCount      *big.Int
	Raw                 types.Log
}

func (_Contract *ContractFilterer) FilterCheckpointCreated(opts *bind.FilterOpts, checkpointTimestamp []uint64, beaconBlockRoot [][32]byte) (*ContractCheckpointCreatedIterator, error) {

	var checkpointTimestampRule []interface{}
	for _, checkpointTimestampItem := range checkpointTimestamp {
		checkpointTimestampRule = append(checkpointTimestampRule, checkpointTimestampItem)
	}
	var beaconBlockRootRule []interface{}
	for _, beaconBlockRootItem := range beaconBlockRoot {
		beaconBlockRootRule = append(beaconBlockRootRule, beaconBlockRootItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "CheckpointCreated", checkpointTimestampRule, beaconBlockRootRule)
	if err != nil {
		return nil, err
	}
	return &ContractCheckpointCreatedIterator{contract: _Contract.contract, event: "CheckpointCreated", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchCheckpointCreated(opts *bind.WatchOpts, sink chan<- *ContractCheckpointCreated, checkpointTimestamp []uint64, beaconBlockRoot [][32]byte) (event.Subscription, error) {

	var checkpointTimestampRule []interface{}
	for _, checkpointTimestampItem := range checkpointTimestamp {
		checkpointTimestampRule = append(checkpointTimestampRule, checkpointTimestampItem)
	}
	var beaconBlockRootRule []interface{}
	for _, beaconBlockRootItem := range beaconBlockRoot {
		beaconBlockRootRule = append(beaconBlockRootRule, beaconBlockRootItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "CheckpointCreated", checkpointTimestampRule, beaconBlockRootRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractCheckpointCreated)
				if err := _Contract.contract.UnpackLog(event, "CheckpointCreated", log); err != nil {
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

func (_Contract *ContractFilterer) ParseCheckpointCreated(log types.Log) (*ContractCheckpointCreated, error) {
	event := new(ContractCheckpointCreated)
	if err := _Contract.contract.UnpackLog(event, "CheckpointCreated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractCheckpointFinalizedIterator struct {
	Event *ContractCheckpointFinalized

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractCheckpointFinalizedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractCheckpointFinalized)
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
		it.Event = new(ContractCheckpointFinalized)
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

func (it *ContractCheckpointFinalizedIterator) Error() error {
	return it.fail
}

func (it *ContractCheckpointFinalizedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractCheckpointFinalized struct {
	CheckpointTimestamp uint64
	TotalShareDeltaWei  *big.Int
	Raw                 types.Log
}

func (_Contract *ContractFilterer) FilterCheckpointFinalized(opts *bind.FilterOpts, checkpointTimestamp []uint64) (*ContractCheckpointFinalizedIterator, error) {

	var checkpointTimestampRule []interface{}
	for _, checkpointTimestampItem := range checkpointTimestamp {
		checkpointTimestampRule = append(checkpointTimestampRule, checkpointTimestampItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "CheckpointFinalized", checkpointTimestampRule)
	if err != nil {
		return nil, err
	}
	return &ContractCheckpointFinalizedIterator{contract: _Contract.contract, event: "CheckpointFinalized", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchCheckpointFinalized(opts *bind.WatchOpts, sink chan<- *ContractCheckpointFinalized, checkpointTimestamp []uint64) (event.Subscription, error) {

	var checkpointTimestampRule []interface{}
	for _, checkpointTimestampItem := range checkpointTimestamp {
		checkpointTimestampRule = append(checkpointTimestampRule, checkpointTimestampItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "CheckpointFinalized", checkpointTimestampRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractCheckpointFinalized)
				if err := _Contract.contract.UnpackLog(event, "CheckpointFinalized", log); err != nil {
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

func (_Contract *ContractFilterer) ParseCheckpointFinalized(log types.Log) (*ContractCheckpointFinalized, error) {
	event := new(ContractCheckpointFinalized)
	if err := _Contract.contract.UnpackLog(event, "CheckpointFinalized", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractEigenPodStakedIterator struct {
	Event *ContractEigenPodStaked

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractEigenPodStakedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractEigenPodStaked)
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
		it.Event = new(ContractEigenPodStaked)
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

func (it *ContractEigenPodStakedIterator) Error() error {
	return it.fail
}

func (it *ContractEigenPodStakedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractEigenPodStaked struct {
	Pubkey []byte
	Raw    types.Log
}

func (_Contract *ContractFilterer) FilterEigenPodStaked(opts *bind.FilterOpts) (*ContractEigenPodStakedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "EigenPodStaked")
	if err != nil {
		return nil, err
	}
	return &ContractEigenPodStakedIterator{contract: _Contract.contract, event: "EigenPodStaked", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchEigenPodStaked(opts *bind.WatchOpts, sink chan<- *ContractEigenPodStaked) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "EigenPodStaked")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractEigenPodStaked)
				if err := _Contract.contract.UnpackLog(event, "EigenPodStaked", log); err != nil {
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

func (_Contract *ContractFilterer) ParseEigenPodStaked(log types.Log) (*ContractEigenPodStaked, error) {
	event := new(ContractEigenPodStaked)
	if err := _Contract.contract.UnpackLog(event, "EigenPodStaked", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractNonBeaconChainETHReceivedIterator struct {
	Event *ContractNonBeaconChainETHReceived

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractNonBeaconChainETHReceivedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractNonBeaconChainETHReceived)
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
		it.Event = new(ContractNonBeaconChainETHReceived)
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

func (it *ContractNonBeaconChainETHReceivedIterator) Error() error {
	return it.fail
}

func (it *ContractNonBeaconChainETHReceivedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractNonBeaconChainETHReceived struct {
	AmountReceived *big.Int
	Raw            types.Log
}

func (_Contract *ContractFilterer) FilterNonBeaconChainETHReceived(opts *bind.FilterOpts) (*ContractNonBeaconChainETHReceivedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "NonBeaconChainETHReceived")
	if err != nil {
		return nil, err
	}
	return &ContractNonBeaconChainETHReceivedIterator{contract: _Contract.contract, event: "NonBeaconChainETHReceived", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchNonBeaconChainETHReceived(opts *bind.WatchOpts, sink chan<- *ContractNonBeaconChainETHReceived) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "NonBeaconChainETHReceived")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractNonBeaconChainETHReceived)
				if err := _Contract.contract.UnpackLog(event, "NonBeaconChainETHReceived", log); err != nil {
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

func (_Contract *ContractFilterer) ParseNonBeaconChainETHReceived(log types.Log) (*ContractNonBeaconChainETHReceived, error) {
	event := new(ContractNonBeaconChainETHReceived)
	if err := _Contract.contract.UnpackLog(event, "NonBeaconChainETHReceived", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractProofSubmitterUpdatedIterator struct {
	Event *ContractProofSubmitterUpdated

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractProofSubmitterUpdatedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractProofSubmitterUpdated)
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
		it.Event = new(ContractProofSubmitterUpdated)
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

func (it *ContractProofSubmitterUpdatedIterator) Error() error {
	return it.fail
}

func (it *ContractProofSubmitterUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractProofSubmitterUpdated struct {
	PrevProofSubmitter common.Address
	NewProofSubmitter  common.Address
	Raw                types.Log
}

func (_Contract *ContractFilterer) FilterProofSubmitterUpdated(opts *bind.FilterOpts) (*ContractProofSubmitterUpdatedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "ProofSubmitterUpdated")
	if err != nil {
		return nil, err
	}
	return &ContractProofSubmitterUpdatedIterator{contract: _Contract.contract, event: "ProofSubmitterUpdated", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchProofSubmitterUpdated(opts *bind.WatchOpts, sink chan<- *ContractProofSubmitterUpdated) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "ProofSubmitterUpdated")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractProofSubmitterUpdated)
				if err := _Contract.contract.UnpackLog(event, "ProofSubmitterUpdated", log); err != nil {
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

func (_Contract *ContractFilterer) ParseProofSubmitterUpdated(log types.Log) (*ContractProofSubmitterUpdated, error) {
	event := new(ContractProofSubmitterUpdated)
	if err := _Contract.contract.UnpackLog(event, "ProofSubmitterUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractRestakedBeaconChainETHWithdrawnIterator struct {
	Event *ContractRestakedBeaconChainETHWithdrawn

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractRestakedBeaconChainETHWithdrawnIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractRestakedBeaconChainETHWithdrawn)
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
		it.Event = new(ContractRestakedBeaconChainETHWithdrawn)
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

func (it *ContractRestakedBeaconChainETHWithdrawnIterator) Error() error {
	return it.fail
}

func (it *ContractRestakedBeaconChainETHWithdrawnIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractRestakedBeaconChainETHWithdrawn struct {
	Recipient common.Address
	Amount    *big.Int
	Raw       types.Log
}

func (_Contract *ContractFilterer) FilterRestakedBeaconChainETHWithdrawn(opts *bind.FilterOpts, recipient []common.Address) (*ContractRestakedBeaconChainETHWithdrawnIterator, error) {

	var recipientRule []interface{}
	for _, recipientItem := range recipient {
		recipientRule = append(recipientRule, recipientItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "RestakedBeaconChainETHWithdrawn", recipientRule)
	if err != nil {
		return nil, err
	}
	return &ContractRestakedBeaconChainETHWithdrawnIterator{contract: _Contract.contract, event: "RestakedBeaconChainETHWithdrawn", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchRestakedBeaconChainETHWithdrawn(opts *bind.WatchOpts, sink chan<- *ContractRestakedBeaconChainETHWithdrawn, recipient []common.Address) (event.Subscription, error) {

	var recipientRule []interface{}
	for _, recipientItem := range recipient {
		recipientRule = append(recipientRule, recipientItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "RestakedBeaconChainETHWithdrawn", recipientRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractRestakedBeaconChainETHWithdrawn)
				if err := _Contract.contract.UnpackLog(event, "RestakedBeaconChainETHWithdrawn", log); err != nil {
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

func (_Contract *ContractFilterer) ParseRestakedBeaconChainETHWithdrawn(log types.Log) (*ContractRestakedBeaconChainETHWithdrawn, error) {
	event := new(ContractRestakedBeaconChainETHWithdrawn)
	if err := _Contract.contract.UnpackLog(event, "RestakedBeaconChainETHWithdrawn", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractValidatorBalanceUpdatedIterator struct {
	Event *ContractValidatorBalanceUpdated

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractValidatorBalanceUpdatedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractValidatorBalanceUpdated)
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
		it.Event = new(ContractValidatorBalanceUpdated)
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

func (it *ContractValidatorBalanceUpdatedIterator) Error() error {
	return it.fail
}

func (it *ContractValidatorBalanceUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractValidatorBalanceUpdated struct {
	ValidatorIndex          *big.Int
	BalanceTimestamp        uint64
	NewValidatorBalanceGwei uint64
	Raw                     types.Log
}

func (_Contract *ContractFilterer) FilterValidatorBalanceUpdated(opts *bind.FilterOpts) (*ContractValidatorBalanceUpdatedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "ValidatorBalanceUpdated")
	if err != nil {
		return nil, err
	}
	return &ContractValidatorBalanceUpdatedIterator{contract: _Contract.contract, event: "ValidatorBalanceUpdated", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchValidatorBalanceUpdated(opts *bind.WatchOpts, sink chan<- *ContractValidatorBalanceUpdated) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "ValidatorBalanceUpdated")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractValidatorBalanceUpdated)
				if err := _Contract.contract.UnpackLog(event, "ValidatorBalanceUpdated", log); err != nil {
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

func (_Contract *ContractFilterer) ParseValidatorBalanceUpdated(log types.Log) (*ContractValidatorBalanceUpdated, error) {
	event := new(ContractValidatorBalanceUpdated)
	if err := _Contract.contract.UnpackLog(event, "ValidatorBalanceUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractValidatorCheckpointedIterator struct {
	Event *ContractValidatorCheckpointed

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractValidatorCheckpointedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractValidatorCheckpointed)
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
		it.Event = new(ContractValidatorCheckpointed)
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

func (it *ContractValidatorCheckpointedIterator) Error() error {
	return it.fail
}

func (it *ContractValidatorCheckpointedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractValidatorCheckpointed struct {
	CheckpointTimestamp uint64
	ValidatorIndex      *big.Int
	Raw                 types.Log
}

func (_Contract *ContractFilterer) FilterValidatorCheckpointed(opts *bind.FilterOpts, checkpointTimestamp []uint64, validatorIndex []*big.Int) (*ContractValidatorCheckpointedIterator, error) {

	var checkpointTimestampRule []interface{}
	for _, checkpointTimestampItem := range checkpointTimestamp {
		checkpointTimestampRule = append(checkpointTimestampRule, checkpointTimestampItem)
	}
	var validatorIndexRule []interface{}
	for _, validatorIndexItem := range validatorIndex {
		validatorIndexRule = append(validatorIndexRule, validatorIndexItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "ValidatorCheckpointed", checkpointTimestampRule, validatorIndexRule)
	if err != nil {
		return nil, err
	}
	return &ContractValidatorCheckpointedIterator{contract: _Contract.contract, event: "ValidatorCheckpointed", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchValidatorCheckpointed(opts *bind.WatchOpts, sink chan<- *ContractValidatorCheckpointed, checkpointTimestamp []uint64, validatorIndex []*big.Int) (event.Subscription, error) {

	var checkpointTimestampRule []interface{}
	for _, checkpointTimestampItem := range checkpointTimestamp {
		checkpointTimestampRule = append(checkpointTimestampRule, checkpointTimestampItem)
	}
	var validatorIndexRule []interface{}
	for _, validatorIndexItem := range validatorIndex {
		validatorIndexRule = append(validatorIndexRule, validatorIndexItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "ValidatorCheckpointed", checkpointTimestampRule, validatorIndexRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractValidatorCheckpointed)
				if err := _Contract.contract.UnpackLog(event, "ValidatorCheckpointed", log); err != nil {
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

func (_Contract *ContractFilterer) ParseValidatorCheckpointed(log types.Log) (*ContractValidatorCheckpointed, error) {
	event := new(ContractValidatorCheckpointed)
	if err := _Contract.contract.UnpackLog(event, "ValidatorCheckpointed", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractValidatorRestakedIterator struct {
	Event *ContractValidatorRestaked

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractValidatorRestakedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractValidatorRestaked)
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
		it.Event = new(ContractValidatorRestaked)
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

func (it *ContractValidatorRestakedIterator) Error() error {
	return it.fail
}

func (it *ContractValidatorRestakedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractValidatorRestaked struct {
	ValidatorIndex *big.Int
	Raw            types.Log
}

func (_Contract *ContractFilterer) FilterValidatorRestaked(opts *bind.FilterOpts) (*ContractValidatorRestakedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "ValidatorRestaked")
	if err != nil {
		return nil, err
	}
	return &ContractValidatorRestakedIterator{contract: _Contract.contract, event: "ValidatorRestaked", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchValidatorRestaked(opts *bind.WatchOpts, sink chan<- *ContractValidatorRestaked) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "ValidatorRestaked")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractValidatorRestaked)
				if err := _Contract.contract.UnpackLog(event, "ValidatorRestaked", log); err != nil {
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

func (_Contract *ContractFilterer) ParseValidatorRestaked(log types.Log) (*ContractValidatorRestaked, error) {
	event := new(ContractValidatorRestaked)
	if err := _Contract.contract.UnpackLog(event, "ValidatorRestaked", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractValidatorWithdrawnIterator struct {
	Event *ContractValidatorWithdrawn

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractValidatorWithdrawnIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractValidatorWithdrawn)
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
		it.Event = new(ContractValidatorWithdrawn)
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

func (it *ContractValidatorWithdrawnIterator) Error() error {
	return it.fail
}

func (it *ContractValidatorWithdrawnIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractValidatorWithdrawn struct {
	CheckpointTimestamp uint64
	ValidatorIndex      *big.Int
	Raw                 types.Log
}

func (_Contract *ContractFilterer) FilterValidatorWithdrawn(opts *bind.FilterOpts, checkpointTimestamp []uint64, validatorIndex []*big.Int) (*ContractValidatorWithdrawnIterator, error) {

	var checkpointTimestampRule []interface{}
	for _, checkpointTimestampItem := range checkpointTimestamp {
		checkpointTimestampRule = append(checkpointTimestampRule, checkpointTimestampItem)
	}
	var validatorIndexRule []interface{}
	for _, validatorIndexItem := range validatorIndex {
		validatorIndexRule = append(validatorIndexRule, validatorIndexItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "ValidatorWithdrawn", checkpointTimestampRule, validatorIndexRule)
	if err != nil {
		return nil, err
	}
	return &ContractValidatorWithdrawnIterator{contract: _Contract.contract, event: "ValidatorWithdrawn", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchValidatorWithdrawn(opts *bind.WatchOpts, sink chan<- *ContractValidatorWithdrawn, checkpointTimestamp []uint64, validatorIndex []*big.Int) (event.Subscription, error) {

	var checkpointTimestampRule []interface{}
	for _, checkpointTimestampItem := range checkpointTimestamp {
		checkpointTimestampRule = append(checkpointTimestampRule, checkpointTimestampItem)
	}
	var validatorIndexRule []interface{}
	for _, validatorIndexItem := range validatorIndex {
		validatorIndexRule = append(validatorIndexRule, validatorIndexItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "ValidatorWithdrawn", checkpointTimestampRule, validatorIndexRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractValidatorWithdrawn)
				if err := _Contract.contract.UnpackLog(event, "ValidatorWithdrawn", log); err != nil {
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

func (_Contract *ContractFilterer) ParseValidatorWithdrawn(log types.Log) (*ContractValidatorWithdrawn, error) {
	event := new(ContractValidatorWithdrawn)
	if err := _Contract.contract.UnpackLog(event, "ValidatorWithdrawn", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

func (_Contract *Contract) ParseLog(log types.Log) (generated.AbigenLog, error) {
	switch log.Topics[0] {
	case _Contract.abi.Events["CheckpointCreated"].ID:
		return _Contract.ParseCheckpointCreated(log)
	case _Contract.abi.Events["CheckpointFinalized"].ID:
		return _Contract.ParseCheckpointFinalized(log)
	case _Contract.abi.Events["EigenPodStaked"].ID:
		return _Contract.ParseEigenPodStaked(log)
	case _Contract.abi.Events["NonBeaconChainETHReceived"].ID:
		return _Contract.ParseNonBeaconChainETHReceived(log)
	case _Contract.abi.Events["ProofSubmitterUpdated"].ID:
		return _Contract.ParseProofSubmitterUpdated(log)
	case _Contract.abi.Events["RestakedBeaconChainETHWithdrawn"].ID:
		return _Contract.ParseRestakedBeaconChainETHWithdrawn(log)
	case _Contract.abi.Events["ValidatorBalanceUpdated"].ID:
		return _Contract.ParseValidatorBalanceUpdated(log)
	case _Contract.abi.Events["ValidatorCheckpointed"].ID:
		return _Contract.ParseValidatorCheckpointed(log)
	case _Contract.abi.Events["ValidatorRestaked"].ID:
		return _Contract.ParseValidatorRestaked(log)
	case _Contract.abi.Events["ValidatorWithdrawn"].ID:
		return _Contract.ParseValidatorWithdrawn(log)

	default:
		return nil, fmt.Errorf("abigen wrapper received unknown log topic: %v", log.Topics[0])
	}
}

func (ContractCheckpointCreated) Topic() common.Hash {
	return common.HexToHash("0x575796133bbed337e5b39aa49a30dc2556a91e0c6c2af4b7b886ae77ebef1076")
}

func (ContractCheckpointFinalized) Topic() common.Hash {
	return common.HexToHash("0x525408c201bc1576eb44116f6478f1c2a54775b19a043bcfdc708364f74f8e44")
}

func (ContractEigenPodStaked) Topic() common.Hash {
	return common.HexToHash("0x606865b7934a25d4aed43f6cdb426403353fa4b3009c4d228407474581b01e23")
}

func (ContractNonBeaconChainETHReceived) Topic() common.Hash {
	return common.HexToHash("0x6fdd3dbdb173299608c0aa9f368735857c8842b581f8389238bf05bd04b3bf49")
}

func (ContractProofSubmitterUpdated) Topic() common.Hash {
	return common.HexToHash("0xfb8129080a19d34dceac04ba253fc50304dc86c729bd63cdca4a969ad19a5eac")
}

func (ContractRestakedBeaconChainETHWithdrawn) Topic() common.Hash {
	return common.HexToHash("0x8947fd2ce07ef9cc302c4e8f0461015615d91ce851564839e91cc804c2f49d8e")
}

func (ContractValidatorBalanceUpdated) Topic() common.Hash {
	return common.HexToHash("0x0e5fac175b83177cc047381e030d8fb3b42b37bd1c025e22c280facad62c32df")
}

func (ContractValidatorCheckpointed) Topic() common.Hash {
	return common.HexToHash("0xa91c59033c3423e18b54d0acecebb4972f9ea95aedf5f4cae3b677b02eaf3a3f")
}

func (ContractValidatorRestaked) Topic() common.Hash {
	return common.HexToHash("0x2d0800bbc377ea54a08c5db6a87aafff5e3e9c8fead0eda110e40e0c10441449")
}

func (ContractValidatorWithdrawn) Topic() common.Hash {
	return common.HexToHash("0x2a02361ffa66cf2c2da4682c2355a6adcaa9f6c227b6e6563e68480f9587626a")
}

func (_Contract *Contract) Address() common.Address {
	return _Contract.address
}

type ContractInterface interface {
	ActiveValidatorCount(opts *bind.CallOpts) (*big.Int, error)

	CheckpointBalanceExitedGwei(opts *bind.CallOpts, arg0 uint64) (uint64, error)

	CurrentCheckpoint(opts *bind.CallOpts) (IEigenPodCheckpoint, error)

	CurrentCheckpointTimestamp(opts *bind.CallOpts) (uint64, error)

	EigenPodManager(opts *bind.CallOpts) (common.Address, error)

	GetParentBlockRoot(opts *bind.CallOpts, timestamp uint64) ([32]byte, error)

	LastCheckpointTimestamp(opts *bind.CallOpts) (uint64, error)

	PodOwner(opts *bind.CallOpts) (common.Address, error)

	ProofSubmitter(opts *bind.CallOpts) (common.Address, error)

	ValidatorPubkeyHashToInfo(opts *bind.CallOpts, validatorPubkeyHash [32]byte) (IEigenPodValidatorInfo, error)

	ValidatorPubkeyToInfo(opts *bind.CallOpts, validatorPubkey []byte) (IEigenPodValidatorInfo, error)

	ValidatorStatus(opts *bind.CallOpts, validatorPubkey []byte) (uint8, error)

	ValidatorStatus0(opts *bind.CallOpts, pubkeyHash [32]byte) (uint8, error)

	WithdrawableRestakedExecutionLayerGwei(opts *bind.CallOpts) (uint64, error)

	Initialize(opts *bind.TransactOpts, owner common.Address) (*types.Transaction, error)

	RecoverTokens(opts *bind.TransactOpts, tokenList []common.Address, amountsToWithdraw []*big.Int, recipient common.Address) (*types.Transaction, error)

	SetProofSubmitter(opts *bind.TransactOpts, newProofSubmitter common.Address) (*types.Transaction, error)

	Stake(opts *bind.TransactOpts, pubkey []byte, signature []byte, depositDataRoot [32]byte) (*types.Transaction, error)

	StartCheckpoint(opts *bind.TransactOpts, revertIfNoBalance bool) (*types.Transaction, error)

	VerifyCheckpointProofs(opts *bind.TransactOpts, balanceContainerProof BeaconChainProofsBalanceContainerProof, proofs []BeaconChainProofsBalanceProof) (*types.Transaction, error)

	VerifyStaleBalance(opts *bind.TransactOpts, beaconTimestamp uint64, stateRootProof BeaconChainProofsStateRootProof, proof BeaconChainProofsValidatorProof) (*types.Transaction, error)

	VerifyWithdrawalCredentials(opts *bind.TransactOpts, beaconTimestamp uint64, stateRootProof BeaconChainProofsStateRootProof, validatorIndices []*big.Int, validatorFieldsProofs [][]byte, validatorFields [][][32]byte) (*types.Transaction, error)

	WithdrawRestakedBeaconChainETH(opts *bind.TransactOpts, recipient common.Address, amount *big.Int) (*types.Transaction, error)

	FilterCheckpointCreated(opts *bind.FilterOpts, checkpointTimestamp []uint64, beaconBlockRoot [][32]byte) (*ContractCheckpointCreatedIterator, error)

	WatchCheckpointCreated(opts *bind.WatchOpts, sink chan<- *ContractCheckpointCreated, checkpointTimestamp []uint64, beaconBlockRoot [][32]byte) (event.Subscription, error)

	ParseCheckpointCreated(log types.Log) (*ContractCheckpointCreated, error)

	FilterCheckpointFinalized(opts *bind.FilterOpts, checkpointTimestamp []uint64) (*ContractCheckpointFinalizedIterator, error)

	WatchCheckpointFinalized(opts *bind.WatchOpts, sink chan<- *ContractCheckpointFinalized, checkpointTimestamp []uint64) (event.Subscription, error)

	ParseCheckpointFinalized(log types.Log) (*ContractCheckpointFinalized, error)

	FilterEigenPodStaked(opts *bind.FilterOpts) (*ContractEigenPodStakedIterator, error)

	WatchEigenPodStaked(opts *bind.WatchOpts, sink chan<- *ContractEigenPodStaked) (event.Subscription, error)

	ParseEigenPodStaked(log types.Log) (*ContractEigenPodStaked, error)

	FilterNonBeaconChainETHReceived(opts *bind.FilterOpts) (*ContractNonBeaconChainETHReceivedIterator, error)

	WatchNonBeaconChainETHReceived(opts *bind.WatchOpts, sink chan<- *ContractNonBeaconChainETHReceived) (event.Subscription, error)

	ParseNonBeaconChainETHReceived(log types.Log) (*ContractNonBeaconChainETHReceived, error)

	FilterProofSubmitterUpdated(opts *bind.FilterOpts) (*ContractProofSubmitterUpdatedIterator, error)

	WatchProofSubmitterUpdated(opts *bind.WatchOpts, sink chan<- *ContractProofSubmitterUpdated) (event.Subscription, error)

	ParseProofSubmitterUpdated(log types.Log) (*ContractProofSubmitterUpdated, error)

	FilterRestakedBeaconChainETHWithdrawn(opts *bind.FilterOpts, recipient []common.Address) (*ContractRestakedBeaconChainETHWithdrawnIterator, error)

	WatchRestakedBeaconChainETHWithdrawn(opts *bind.WatchOpts, sink chan<- *ContractRestakedBeaconChainETHWithdrawn, recipient []common.Address) (event.Subscription, error)

	ParseRestakedBeaconChainETHWithdrawn(log types.Log) (*ContractRestakedBeaconChainETHWithdrawn, error)

	FilterValidatorBalanceUpdated(opts *bind.FilterOpts) (*ContractValidatorBalanceUpdatedIterator, error)

	WatchValidatorBalanceUpdated(opts *bind.WatchOpts, sink chan<- *ContractValidatorBalanceUpdated) (event.Subscription, error)

	ParseValidatorBalanceUpdated(log types.Log) (*ContractValidatorBalanceUpdated, error)

	FilterValidatorCheckpointed(opts *bind.FilterOpts, checkpointTimestamp []uint64, validatorIndex []*big.Int) (*ContractValidatorCheckpointedIterator, error)

	WatchValidatorCheckpointed(opts *bind.WatchOpts, sink chan<- *ContractValidatorCheckpointed, checkpointTimestamp []uint64, validatorIndex []*big.Int) (event.Subscription, error)

	ParseValidatorCheckpointed(log types.Log) (*ContractValidatorCheckpointed, error)

	FilterValidatorRestaked(opts *bind.FilterOpts) (*ContractValidatorRestakedIterator, error)

	WatchValidatorRestaked(opts *bind.WatchOpts, sink chan<- *ContractValidatorRestaked) (event.Subscription, error)

	ParseValidatorRestaked(log types.Log) (*ContractValidatorRestaked, error)

	FilterValidatorWithdrawn(opts *bind.FilterOpts, checkpointTimestamp []uint64, validatorIndex []*big.Int) (*ContractValidatorWithdrawnIterator, error)

	WatchValidatorWithdrawn(opts *bind.WatchOpts, sink chan<- *ContractValidatorWithdrawn, checkpointTimestamp []uint64, validatorIndex []*big.Int) (event.Subscription, error)

	ParseValidatorWithdrawn(log types.Log) (*ContractValidatorWithdrawn, error)

	ParseLog(log types.Log) (generated.AbigenLog, error)

	Address() common.Address
}
