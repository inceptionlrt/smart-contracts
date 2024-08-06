// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package DelegationManagerMock

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
	Bin: "0x608060405234801561000f575f80fd5b50610ee48061001d5f395ff3fe608060405234801561000f575f80fd5b5060043610610208575f3560e01c80635f966f141161011f578063bb45fef2116100a9578063c94b511111610079578063c94b5111146103ff578063da8be86414610416578063eea9064b1461042a578063f16172b014610438578063f698da2514610234575f80fd5b8063bb45fef21461038d578063c448feb814610234578063c488375a14610298578063c5e480db1461039b575f80fd5b8063778e55f3116100ef578063778e55f3146103515780637f5480711461035f578063900413471461036d57806399be81c81461037b578063a178848414610298575f80fd5b80635f966f14146102d957806360d7faed1461033c57806365da1264146102d95780636d70f7ae146102ff575f80fd5b806320606b70116101a05780633cdeb5e0116101705780633cdeb5e0146102d95780633e28391d146102ff5780634337738214610234578063597b36da1461031d5780635cfe8d2c1461032b575f80fd5b806320606b701461023457806328a573ae1461028a57806329c77d4f1461029857806333404396146102c1575f80fd5b80630f589e59116101db5780630f589e5914610275578063132d49671461028a57806316928365146102985780631bbce091146102ab575f80fd5b80630449ca391461020c57806304a4f979146102345780630b9f487a1461023a5780630dd8dd0214610252575b5f80fd5b61022161021a366004610492565b5f92915050565b6040519081526020015b60405180910390f35b5f610221565b6102216102483660046104ef565b5f95945050505050565b610268610260366004610492565b606092915050565b60405161022b9190610546565b6102886102833660046105dc565b505050565b005b61028861028336600461062b565b6102216102a6366004610669565b505f90565b6102216102b936600461062b565b5f9392505050565b6102886102cf36600461068b565b5050505050505050565b6102e76102a6366004610669565b6040516001600160a01b03909116815260200161022b565b61030d6102a6366004610669565b604051901515815260200161022b565b6102216102a63660046108f3565b610288610339366004610a1b565b50565b61028861034a366004610b64565b5050505050565b61022161021a366004610bf0565b61028861034a366004610cc9565b610268610260366004610d53565b610288610389366004610d9f565b5050565b61030d61021a366004610dd1565b6103c96103a9366004610669565b50604080516060810182525f808252602082018190529181019190915290565b6040805182516001600160a01b039081168252602080850151909116908201529181015163ffffffff169082015260600161022b565b61022161040d366004610dfb565b5f949350505050565b610268610424366004610669565b50606090565b610288610283366004610e40565b610288610339366004610e94565b919050565b5f8083601f84011261045b575f80fd5b5081356001600160401b03811115610471575f80fd5b6020830191508360208260051b850101111561048b575f80fd5b9250929050565b5f80602083850312156104a3575f80fd5b82356001600160401b038111156104b8575f80fd5b6104c48582860161044b565b90969095509350505050565b6001600160a01b0381168114610339575f80fd5b8035610446816104d0565b5f805f805f60a08688031215610503575f80fd5b853561050e816104d0565b9450602086013561051e816104d0565b9350604086013561052e816104d0565b94979396509394606081013594506080013592915050565b602080825282518282018190525f9190848201906040850190845b8181101561057d57835183529284019291840191600101610561565b50909695505050505050565b5f60608284031215610599575f80fd5b50919050565b5f8083601f8401126105af575f80fd5b5081356001600160401b038111156105c5575f80fd5b60208301915083602082850101111561048b575f80fd5b5f805f608084860312156105ee575f80fd5b6105f88585610589565b925060608401356001600160401b03811115610612575f80fd5b61061e8682870161059f565b9497909650939450505050565b5f805f6060848603121561063d575f80fd5b8335610648816104d0565b92506020840135610658816104d0565b929592945050506040919091013590565b5f60208284031215610679575f80fd5b8135610684816104d0565b9392505050565b5f805f805f805f806080898b0312156106a2575f80fd5b88356001600160401b03808211156106b8575f80fd5b6106c48c838d0161044b565b909a50985060208b01359150808211156106dc575f80fd5b6106e88c838d0161044b565b909850965060408b0135915080821115610700575f80fd5b61070c8c838d0161044b565b909650945060608b0135915080821115610724575f80fd5b506107318b828c0161044b565b999c989b5096995094979396929594505050565b634e487b7160e01b5f52604160045260245ffd5b60405160e081016001600160401b038111828210171561077b5761077b610745565b60405290565b604080519081016001600160401b038111828210171561077b5761077b610745565b60405160c081016001600160401b038111828210171561077b5761077b610745565b604051601f8201601f191681016001600160401b03811182821017156107ed576107ed610745565b604052919050565b803563ffffffff81168114610446575f80fd5b5f6001600160401b0382111561082057610820610745565b5060051b60200190565b5f82601f830112610839575f80fd5b8135602061084e61084983610808565b6107c5565b82815260059290921b8401810191818101908684111561086c575f80fd5b8286015b84811015610890578035610883816104d0565b8352918301918301610870565b509695505050505050565b5f82601f8301126108aa575f80fd5b813560206108ba61084983610808565b82815260059290921b840181019181810190868411156108d8575f80fd5b8286015b8481101561089057803583529183019183016108dc565b5f60208284031215610903575f80fd5b81356001600160401b0380821115610919575f80fd5b9083019060e0828603121561092c575f80fd5b610934610759565b61093d836104e4565b815261094b602084016104e4565b602082015261095c604084016104e4565b604082015260608301356060820152610977608084016107f5565b608082015260a08301358281111561098d575f80fd5b6109998782860161082a565b60a08301525060c0830135828111156109b0575f80fd5b6109bc8782860161089b565b60c08301525095945050505050565b5f604082840312156109db575f80fd5b6109e3610781565b905081356109f0816104d0565b815260208201356bffffffffffffffffffffffff81168114610a10575f80fd5b602082015292915050565b5f6020808385031215610a2c575f80fd5b82356001600160401b0380821115610a42575f80fd5b818501915085601f830112610a55575f80fd5b8135610a6361084982610808565b81815260059190911b83018401908481019088831115610a81575f80fd5b8585015b83811015610b5757803585811115610a9c575f8081fd5b860160e0818c03601f1901811315610ab3575f8081fd5b610abb6107a3565b8983013588811115610acc575f8081fd5b610ada8e8c8387010161082a565b82525060408084013589811115610af0575f8081fd5b610afe8f8d8388010161089b565b8c840152506060610b108186016104e4565b8284015260809150610b248f8387016109cb565b90830152610b3460c085016107f5565b90820152610b438383016104e4565b60a082015285525050918601918601610a85565b5098975050505050505050565b5f805f805f60808688031215610b78575f80fd5b85356001600160401b0380821115610b8e575f80fd5b9087019060e0828a031215610ba1575f80fd5b90955060208701359080821115610bb6575f80fd5b50610bc38882890161044b565b9095509350506040860135915060608601358015158114610be2575f80fd5b809150509295509295909350565b5f8060408385031215610c01575f80fd5b8235610c0c816104d0565b91506020830135610c1c816104d0565b809150509250929050565b5f60408284031215610c37575f80fd5b610c3f610781565b905081356001600160401b0380821115610c57575f80fd5b818401915084601f830112610c6a575f80fd5b8135602082821115610c7e57610c7e610745565b610c90601f8301601f191682016107c5565b92508183528681838601011115610ca5575f80fd5b81818501828501375f81838501015282855280860135818601525050505092915050565b5f805f805f60a08688031215610cdd575f80fd5b8535610ce8816104d0565b94506020860135610cf8816104d0565b935060408601356001600160401b0380821115610d13575f80fd5b610d1f89838a01610c27565b94506060880135915080821115610d34575f80fd5b50610d4188828901610c27565b95989497509295608001359392505050565b5f8060408385031215610d64575f80fd5b8235610d6f816104d0565b915060208301356001600160401b03811115610d89575f80fd5b610d958582860161082a565b9150509250929050565b5f8060208385031215610db0575f80fd5b82356001600160401b03811115610dc5575f80fd5b6104c48582860161059f565b5f8060408385031215610de2575f80fd5b8235610ded816104d0565b946020939093013593505050565b5f805f8060808587031215610e0e575f80fd5b8435610e19816104d0565b9350602085013592506040850135610e30816104d0565b9396929550929360600135925050565b5f805f60608486031215610e52575f80fd5b8335610e5d816104d0565b925060208401356001600160401b03811115610e77575f80fd5b610e8386828701610c27565b925050604084013590509250925092565b5f60608284031215610ea4575f80fd5b610684838361058956fea2646970667358221220bd9e8a531a858da4f4d0efdaa6e55e73563d57ef8b86d01908ff94edd0b9c70f64736f6c63430008150033",
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
