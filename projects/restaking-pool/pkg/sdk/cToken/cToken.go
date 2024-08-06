// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package cToken

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
	ABI: "[{\"inputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"spender\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"allowance\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"needed\",\"type\":\"uint256\"}],\"name\":\"ERC20InsufficientAllowance\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"sender\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"balance\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"needed\",\"type\":\"uint256\"}],\"name\":\"ERC20InsufficientBalance\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"approver\",\"type\":\"address\"}],\"name\":\"ERC20InvalidApprover\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"receiver\",\"type\":\"address\"}],\"name\":\"ERC20InvalidReceiver\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"sender\",\"type\":\"address\"}],\"name\":\"ERC20InvalidSender\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"spender\",\"type\":\"address\"}],\"name\":\"ERC20InvalidSpender\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"EnforcedPause\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"ExpectedPause\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"InvalidInitialization\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"MathOverflowedMulDiv\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"NotInitializing\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"OnlyGovernanceAllowed\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"OnlyOperatorAllowed\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"OnlyRestakingPoolAllowed\",\"type\":\"error\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"spender\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"Approval\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint64\",\"name\":\"version\",\"type\":\"uint64\"}],\"name\":\"Initialized\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"string\",\"name\":\"newName\",\"type\":\"string\"}],\"name\":\"NameChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"account\",\"type\":\"address\"}],\"name\":\"Paused\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"string\",\"name\":\"newSymbol\",\"type\":\"string\"}],\"name\":\"SymbolChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"Transfer\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"account\",\"type\":\"address\"}],\"name\":\"Unpaused\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"spender\",\"type\":\"address\"}],\"name\":\"allowance\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"spender\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"approve\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"account\",\"type\":\"address\"}],\"name\":\"balanceOf\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"account\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"}],\"name\":\"burn\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"string\",\"name\":\"newName\",\"type\":\"string\"}],\"name\":\"changeName\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"string\",\"name\":\"newSymbol\",\"type\":\"string\"}],\"name\":\"changeSymbol\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"config\",\"outputs\":[{\"internalType\":\"contractIProtocolConfig\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"}],\"name\":\"convertToAmount\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"convertToShares\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"decimals\",\"outputs\":[{\"internalType\":\"uint8\",\"name\":\"\",\"type\":\"uint8\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"contractIProtocolConfig\",\"name\":\"config\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"name\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"symbol\",\"type\":\"string\"}],\"name\":\"initialize\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"account\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"}],\"name\":\"mint\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"name\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"pause\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"paused\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"ratio\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"symbol\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"totalAssets\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"totalManagedEth\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"totalSupply\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"transfer\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"transferFrom\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"unpause\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]",
	Bin: "0x608060405234801561000f575f80fd5b5061001861001d565b6100cf565b7ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a00805468010000000000000000900460ff161561006d5760405163f92ee8a960e01b815260040160405180910390fd5b80546001600160401b03908116146100cc5780546001600160401b0319166001600160401b0390811782556040519081527fc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d29060200160405180910390a15b50565b6116ea806100dc5f395ff3fe608060405234801561000f575f80fd5b506004361061013d575f3560e01c806371ca337d116100b45780639dc29fac116100795780639dc29fac1461029d578063a3895fff146102b0578063a9059cbb146102c3578063c6e6f592146102d6578063dd62ed3e146102e9578063ff1bdd43146102fc575f80fd5b806371ca337d1461025857806379502c55146102605780638456cb591461027a578063906571471461028257806395d89b4114610295575f80fd5b8063313ce56711610105578063313ce567146101ce5780633f4ba83a146101dd57806340c10f19146101e75780635353a2d8146101fa5780635c975abb1461020d57806370a0823114610224575f80fd5b806301e1d1141461014157806306fdde031461015c578063095ea7b31461017157806318160ddd1461019457806323b872dd146101bb575b5f80fd5b61014961030f565b6040519081526020015b60405180910390f35b610164610340565b6040516101539190611215565b61018461017f366004611274565b6103d0565b6040519015158152602001610153565b7f52c63247e1f47db19d5ce0460030c497f067ca4cebf71ba98eeadabe20bace0254610149565b6101846101c936600461129e565b6103e9565b60405160128152602001610153565b6101e561040e565b005b6101e56101f5366004611274565b6104bb565b6101e5610208366004611379565b610574565b5f805160206116958339815191525460ff16610184565b6101496102323660046113b3565b6001600160a01b03165f9081525f80516020611675833981519152602052604090205490565b610149610623565b5f546040516001600160a01b039091168152602001610153565b6101e56106f6565b6101e56102903660046113ce565b6107a1565b6101646108d5565b6101e56102ab366004611274565b6108e4565b6101e56102be366004611379565b610999565b6101846102d1366004611274565b610a45565b6101496102e436600461143f565b610a52565b6101496102f7366004611456565b610a6f565b61014961030a36600461143f565b610ab8565b5f61033b61030a7f52c63247e1f47db19d5ce0460030c497f067ca4cebf71ba98eeadabe20bace025490565b905090565b60606032805461034f9061148d565b80601f016020809104026020016040519081016040528092919081815260200182805461037b9061148d565b80156103c65780601f1061039d576101008083540402835291602001916103c6565b820191905f5260205f20905b8154815290600101906020018083116103a957829003601f168201915b5050505050905090565b5f336103dd818585610ad7565b60019150505b92915050565b5f336103f6858285610ae9565b610401858585610b51565b60019150505b9392505050565b5f8054906101000a90046001600160a01b03166001600160a01b031663289b3c0d6040518163ffffffff1660e01b8152600401602060405180830381865afa15801561045c573d5f803e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061048091906114c5565b6001600160a01b0316336001600160a01b0316146104b15760405163e2d4f15f60e01b815260040160405180910390fd5b6104b9610bae565b565b6104c3610c0e565b5f8054906101000a90046001600160a01b03166001600160a01b0316637745165b6040518163ffffffff1660e01b8152600401602060405180830381865afa158015610511573d5f803e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061053591906114c5565b6001600160a01b0316336001600160a01b031614610566576040516301beb2d760e51b815260040160405180910390fd5b6105708282610c3e565b5050565b5f8054906101000a90046001600160a01b03166001600160a01b031663289b3c0d6040518163ffffffff1660e01b8152600401602060405180830381865afa1580156105c2573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906105e691906114c5565b6001600160a01b0316336001600160a01b0316146106175760405163e2d4f15f60e01b815260040160405180910390fd5b61062081610c72565b50565b5f80546001600160a01b03166001600160a01b031663c5db8a7a6040518163ffffffff1660e01b8152600401602060405180830381865afa15801561066a573d5f803e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061068e91906114c5565b60405163754b270760e01b81523060048201526001600160a01b03919091169063754b270790602401602060405180830381865afa1580156106d2573d5f803e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061033b91906114e0565b5f8054906101000a90046001600160a01b03166001600160a01b031663289b3c0d6040518163ffffffff1660e01b8152600401602060405180830381865afa158015610744573d5f803e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061076891906114c5565b6001600160a01b0316336001600160a01b0316146107995760405163e2d4f15f60e01b815260040160405180910390fd5b6104b9610cae565b7ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a008054600160401b810460ff16159067ffffffffffffffff165f811580156107e65750825b90505f8267ffffffffffffffff1660011480156108025750303b155b905081158015610810575080155b1561082e5760405163f92ee8a960e01b815260040160405180910390fd5b845467ffffffffffffffff19166001178555831561085857845460ff60401b1916600160401b1785555b61086188610cf6565b61086b8787610d1f565b610873610d31565b61087b610d31565b6108858787610d41565b83156108cb57845460ff60401b19168555604051600181527fc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d29060200160405180910390a15b5050505050505050565b60606033805461034f9061148d565b6108ec610c0e565b5f8054906101000a90046001600160a01b03166001600160a01b0316637745165b6040518163ffffffff1660e01b8152600401602060405180830381865afa15801561093a573d5f803e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061095e91906114c5565b6001600160a01b0316336001600160a01b03161461098f576040516301beb2d760e51b815260040160405180910390fd5b6105708282610d53565b5f8054906101000a90046001600160a01b03166001600160a01b031663289b3c0d6040518163ffffffff1660e01b8152600401602060405180830381865afa1580156109e7573d5f803e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610a0b91906114c5565b6001600160a01b0316336001600160a01b031614610a3c5760405163e2d4f15f60e01b815260040160405180910390fd5b61062081610d87565b5f336103dd818585610b51565b5f6103e3610a5e610623565b8390670de0b6b3a76400005f610dc3565b6001600160a01b039182165f9081527f52c63247e1f47db19d5ce0460030c497f067ca4cebf71ba98eeadabe20bace016020908152604080832093909416825291909152205490565b5f6103e3670de0b6b3a7640000610acd610623565b8491906001610dc3565b610ae48383836001610e12565b505050565b5f610af48484610a6f565b90505f198114610b4b5781811015610b3d57604051637dc7a0d960e11b81526001600160a01b038416600482015260248101829052604481018390526064015b60405180910390fd5b610b4b84848484035f610e12565b50505050565b6001600160a01b038316610b7a57604051634b637e8f60e11b81525f6004820152602401610b34565b6001600160a01b038216610ba35760405163ec442f0560e01b81525f6004820152602401610b34565b610ae4838383610ef6565b610bb6610f09565b5f80516020611695833981519152805460ff191681557f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa335b6040516001600160a01b0390911681526020015b60405180910390a150565b5f805160206116958339815191525460ff16156104b95760405163d93c066560e01b815260040160405180910390fd5b6001600160a01b038216610c675760405163ec442f0560e01b81525f6004820152602401610b34565b6105705f8383610ef6565b6032610c7e8282611544565b507f4737457377f528cc8afd815f73ecb8b05df80d047dbffc41c17750a4033592bc81604051610c039190611215565b610cb6610c0e565b5f80516020611695833981519152805460ff191660011781557f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a25833610bef565b610cfe610f38565b5f80546001600160a01b0319166001600160a01b0392909216919091179055565b610d27610f38565b6105708282610f81565b610d39610f38565b6104b9610fd1565b610d4a82610c72565b61057081610d87565b6001600160a01b038216610d7c57604051634b637e8f60e11b81525f6004820152602401610b34565b610570825f83610ef6565b6033610d938282611544565b507f57c940aa14b51ea5f96b7a2bea757ce355d996e2c5d7a3c68aff1c75a326269b81604051610c039190611215565b5f80610dd0868686610ff1565b9050610ddb836110b0565b8015610df657505f8480610df157610df1611600565b868809115b15610e0957610e06600182611614565b90505b95945050505050565b5f805160206116758339815191526001600160a01b038516610e495760405163e602df0560e01b81525f6004820152602401610b34565b6001600160a01b038416610e7257604051634a1406b160e11b81525f6004820152602401610b34565b6001600160a01b038086165f90815260018301602090815260408083209388168352929052208390558115610eef57836001600160a01b0316856001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92585604051610ee691815260200190565b60405180910390a35b5050505050565b610efe610c0e565b610ae48383836110dc565b5f805160206116958339815191525460ff166104b957604051638dfc202b60e01b815260040160405180910390fd5b7ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a0054600160401b900460ff166104b957604051631afcd79f60e31b815260040160405180910390fd5b610f89610f38565b5f805160206116758339815191527f52c63247e1f47db19d5ce0460030c497f067ca4cebf71ba98eeadabe20bace03610fc28482611544565b5060048101610b4b8382611544565b610fd9610f38565b5f80516020611695833981519152805460ff19169055565b5f838302815f1985870982811083820303915050805f036110255783828161101b5761101b611600565b0492505050610407565b8084116110455760405163227bc15360e01b815260040160405180910390fd5b5f848688095f868103871696879004966002600389028118808a02820302808a02820302808a02820302808a02820302808a02820302808a02909103029181900381900460010186841190950394909402919094039290920491909117919091029150509392505050565b5f60028260038111156110c5576110c5611633565b6110cf9190611647565b60ff166001149050919050565b5f805160206116758339815191526001600160a01b0384166111165781816002015f82825461110b9190611614565b909155506111869050565b6001600160a01b0384165f90815260208290526040902054828110156111685760405163391434e360e21b81526001600160a01b03861660048201526024810182905260448101849052606401610b34565b6001600160a01b0385165f9081526020839052604090209083900390555b6001600160a01b0383166111a45760028101805483900390556111c2565b6001600160a01b0383165f9081526020829052604090208054830190555b826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405161120791815260200190565b60405180910390a350505050565b5f6020808352835180828501525f5b8181101561124057858101830151858201604001528201611224565b505f604082860101526040601f19601f8301168501019250505092915050565b6001600160a01b0381168114610620575f80fd5b5f8060408385031215611285575f80fd5b823561129081611260565b946020939093013593505050565b5f805f606084860312156112b0575f80fd5b83356112bb81611260565b925060208401356112cb81611260565b929592945050506040919091013590565b634e487b7160e01b5f52604160045260245ffd5b5f82601f8301126112ff575f80fd5b813567ffffffffffffffff8082111561131a5761131a6112dc565b604051601f8301601f19908116603f01168101908282118183101715611342576113426112dc565b8160405283815286602085880101111561135a575f80fd5b836020870160208301375f602085830101528094505050505092915050565b5f60208284031215611389575f80fd5b813567ffffffffffffffff81111561139f575f80fd5b6113ab848285016112f0565b949350505050565b5f602082840312156113c3575f80fd5b813561040781611260565b5f805f606084860312156113e0575f80fd5b83356113eb81611260565b9250602084013567ffffffffffffffff80821115611407575f80fd5b611413878388016112f0565b93506040860135915080821115611428575f80fd5b50611435868287016112f0565b9150509250925092565b5f6020828403121561144f575f80fd5b5035919050565b5f8060408385031215611467575f80fd5b823561147281611260565b9150602083013561148281611260565b809150509250929050565b600181811c908216806114a157607f821691505b6020821081036114bf57634e487b7160e01b5f52602260045260245ffd5b50919050565b5f602082840312156114d5575f80fd5b815161040781611260565b5f602082840312156114f0575f80fd5b5051919050565b601f821115610ae4575f81815260208120601f850160051c8101602086101561151d5750805b601f850160051c820191505b8181101561153c57828155600101611529565b505050505050565b815167ffffffffffffffff81111561155e5761155e6112dc565b6115728161156c845461148d565b846114f7565b602080601f8311600181146115a5575f841561158e5750858301515b5f19600386901b1c1916600185901b17855561153c565b5f85815260208120601f198616915b828110156115d3578886015182559484019460019091019084016115b4565b50858210156115f057878501515f19600388901b60f8161c191681555b5050505050600190811b01905550565b634e487b7160e01b5f52601260045260245ffd5b808201808211156103e357634e487b7160e01b5f52601160045260245ffd5b634e487b7160e01b5f52602160045260245ffd5b5f60ff83168061166557634e487b7160e01b5f52601260045260245ffd5b8060ff8416069150509291505056fe52c63247e1f47db19d5ce0460030c497f067ca4cebf71ba98eeadabe20bace00cd5ed15c6e187e77e9aee88184c21f4f2182ab5827cb3b7e07fbedcd63f03300a26469706673582212209218f28c276a794542d1bccf0781126cdc89d521c7db17968138003210fb93e664736f6c63430008150033",
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

func (_Contract *ContractCaller) Allowance(opts *bind.CallOpts, owner common.Address, spender common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "allowance", owner, spender)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) Allowance(owner common.Address, spender common.Address) (*big.Int, error) {
	return _Contract.Contract.Allowance(&_Contract.CallOpts, owner, spender)
}

func (_Contract *ContractCallerSession) Allowance(owner common.Address, spender common.Address) (*big.Int, error) {
	return _Contract.Contract.Allowance(&_Contract.CallOpts, owner, spender)
}

func (_Contract *ContractCaller) BalanceOf(opts *bind.CallOpts, account common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "balanceOf", account)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) BalanceOf(account common.Address) (*big.Int, error) {
	return _Contract.Contract.BalanceOf(&_Contract.CallOpts, account)
}

func (_Contract *ContractCallerSession) BalanceOf(account common.Address) (*big.Int, error) {
	return _Contract.Contract.BalanceOf(&_Contract.CallOpts, account)
}

func (_Contract *ContractCaller) Config(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "config")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) Config() (common.Address, error) {
	return _Contract.Contract.Config(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) Config() (common.Address, error) {
	return _Contract.Contract.Config(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) ConvertToAmount(opts *bind.CallOpts, shares *big.Int) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "convertToAmount", shares)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) ConvertToAmount(shares *big.Int) (*big.Int, error) {
	return _Contract.Contract.ConvertToAmount(&_Contract.CallOpts, shares)
}

func (_Contract *ContractCallerSession) ConvertToAmount(shares *big.Int) (*big.Int, error) {
	return _Contract.Contract.ConvertToAmount(&_Contract.CallOpts, shares)
}

func (_Contract *ContractCaller) ConvertToShares(opts *bind.CallOpts, amount *big.Int) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "convertToShares", amount)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) ConvertToShares(amount *big.Int) (*big.Int, error) {
	return _Contract.Contract.ConvertToShares(&_Contract.CallOpts, amount)
}

func (_Contract *ContractCallerSession) ConvertToShares(amount *big.Int) (*big.Int, error) {
	return _Contract.Contract.ConvertToShares(&_Contract.CallOpts, amount)
}

func (_Contract *ContractCaller) Decimals(opts *bind.CallOpts) (uint8, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "decimals")

	if err != nil {
		return *new(uint8), err
	}

	out0 := *abi.ConvertType(out[0], new(uint8)).(*uint8)

	return out0, err

}

func (_Contract *ContractSession) Decimals() (uint8, error) {
	return _Contract.Contract.Decimals(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) Decimals() (uint8, error) {
	return _Contract.Contract.Decimals(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) Name(opts *bind.CallOpts) (string, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "name")

	if err != nil {
		return *new(string), err
	}

	out0 := *abi.ConvertType(out[0], new(string)).(*string)

	return out0, err

}

func (_Contract *ContractSession) Name() (string, error) {
	return _Contract.Contract.Name(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) Name() (string, error) {
	return _Contract.Contract.Name(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) Paused(opts *bind.CallOpts) (bool, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "paused")

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

func (_Contract *ContractSession) Paused() (bool, error) {
	return _Contract.Contract.Paused(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) Paused() (bool, error) {
	return _Contract.Contract.Paused(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) Ratio(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "ratio")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) Ratio() (*big.Int, error) {
	return _Contract.Contract.Ratio(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) Ratio() (*big.Int, error) {
	return _Contract.Contract.Ratio(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) Symbol(opts *bind.CallOpts) (string, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "symbol")

	if err != nil {
		return *new(string), err
	}

	out0 := *abi.ConvertType(out[0], new(string)).(*string)

	return out0, err

}

func (_Contract *ContractSession) Symbol() (string, error) {
	return _Contract.Contract.Symbol(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) Symbol() (string, error) {
	return _Contract.Contract.Symbol(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) TotalAssets(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "totalAssets")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) TotalAssets() (*big.Int, error) {
	return _Contract.Contract.TotalAssets(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) TotalAssets() (*big.Int, error) {
	return _Contract.Contract.TotalAssets(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) TotalSupply(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "totalSupply")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) TotalSupply() (*big.Int, error) {
	return _Contract.Contract.TotalSupply(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) TotalSupply() (*big.Int, error) {
	return _Contract.Contract.TotalSupply(&_Contract.CallOpts)
}

func (_Contract *ContractTransactor) Approve(opts *bind.TransactOpts, spender common.Address, value *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "approve", spender, value)
}

func (_Contract *ContractSession) Approve(spender common.Address, value *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.Approve(&_Contract.TransactOpts, spender, value)
}

func (_Contract *ContractTransactorSession) Approve(spender common.Address, value *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.Approve(&_Contract.TransactOpts, spender, value)
}

func (_Contract *ContractTransactor) Burn(opts *bind.TransactOpts, account common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "burn", account, shares)
}

func (_Contract *ContractSession) Burn(account common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.Burn(&_Contract.TransactOpts, account, shares)
}

func (_Contract *ContractTransactorSession) Burn(account common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.Burn(&_Contract.TransactOpts, account, shares)
}

func (_Contract *ContractTransactor) ChangeName(opts *bind.TransactOpts, newName string) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "changeName", newName)
}

func (_Contract *ContractSession) ChangeName(newName string) (*types.Transaction, error) {
	return _Contract.Contract.ChangeName(&_Contract.TransactOpts, newName)
}

func (_Contract *ContractTransactorSession) ChangeName(newName string) (*types.Transaction, error) {
	return _Contract.Contract.ChangeName(&_Contract.TransactOpts, newName)
}

func (_Contract *ContractTransactor) ChangeSymbol(opts *bind.TransactOpts, newSymbol string) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "changeSymbol", newSymbol)
}

func (_Contract *ContractSession) ChangeSymbol(newSymbol string) (*types.Transaction, error) {
	return _Contract.Contract.ChangeSymbol(&_Contract.TransactOpts, newSymbol)
}

func (_Contract *ContractTransactorSession) ChangeSymbol(newSymbol string) (*types.Transaction, error) {
	return _Contract.Contract.ChangeSymbol(&_Contract.TransactOpts, newSymbol)
}

func (_Contract *ContractTransactor) Initialize(opts *bind.TransactOpts, config common.Address, name string, symbol string) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "initialize", config, name, symbol)
}

func (_Contract *ContractSession) Initialize(config common.Address, name string, symbol string) (*types.Transaction, error) {
	return _Contract.Contract.Initialize(&_Contract.TransactOpts, config, name, symbol)
}

func (_Contract *ContractTransactorSession) Initialize(config common.Address, name string, symbol string) (*types.Transaction, error) {
	return _Contract.Contract.Initialize(&_Contract.TransactOpts, config, name, symbol)
}

func (_Contract *ContractTransactor) Mint(opts *bind.TransactOpts, account common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "mint", account, shares)
}

func (_Contract *ContractSession) Mint(account common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.Mint(&_Contract.TransactOpts, account, shares)
}

func (_Contract *ContractTransactorSession) Mint(account common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.Mint(&_Contract.TransactOpts, account, shares)
}

func (_Contract *ContractTransactor) Pause(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "pause")
}

func (_Contract *ContractSession) Pause() (*types.Transaction, error) {
	return _Contract.Contract.Pause(&_Contract.TransactOpts)
}

func (_Contract *ContractTransactorSession) Pause() (*types.Transaction, error) {
	return _Contract.Contract.Pause(&_Contract.TransactOpts)
}

func (_Contract *ContractTransactor) Transfer(opts *bind.TransactOpts, to common.Address, value *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "transfer", to, value)
}

func (_Contract *ContractSession) Transfer(to common.Address, value *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.Transfer(&_Contract.TransactOpts, to, value)
}

func (_Contract *ContractTransactorSession) Transfer(to common.Address, value *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.Transfer(&_Contract.TransactOpts, to, value)
}

func (_Contract *ContractTransactor) TransferFrom(opts *bind.TransactOpts, from common.Address, to common.Address, value *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "transferFrom", from, to, value)
}

func (_Contract *ContractSession) TransferFrom(from common.Address, to common.Address, value *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.TransferFrom(&_Contract.TransactOpts, from, to, value)
}

func (_Contract *ContractTransactorSession) TransferFrom(from common.Address, to common.Address, value *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.TransferFrom(&_Contract.TransactOpts, from, to, value)
}

func (_Contract *ContractTransactor) Unpause(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "unpause")
}

func (_Contract *ContractSession) Unpause() (*types.Transaction, error) {
	return _Contract.Contract.Unpause(&_Contract.TransactOpts)
}

func (_Contract *ContractTransactorSession) Unpause() (*types.Transaction, error) {
	return _Contract.Contract.Unpause(&_Contract.TransactOpts)
}

type ContractApprovalIterator struct {
	Event *ContractApproval

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractApprovalIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractApproval)
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
		it.Event = new(ContractApproval)
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

func (it *ContractApprovalIterator) Error() error {
	return it.fail
}

func (it *ContractApprovalIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractApproval struct {
	Owner   common.Address
	Spender common.Address
	Value   *big.Int
	Raw     types.Log
}

func (_Contract *ContractFilterer) FilterApproval(opts *bind.FilterOpts, owner []common.Address, spender []common.Address) (*ContractApprovalIterator, error) {

	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}
	var spenderRule []interface{}
	for _, spenderItem := range spender {
		spenderRule = append(spenderRule, spenderItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "Approval", ownerRule, spenderRule)
	if err != nil {
		return nil, err
	}
	return &ContractApprovalIterator{contract: _Contract.contract, event: "Approval", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchApproval(opts *bind.WatchOpts, sink chan<- *ContractApproval, owner []common.Address, spender []common.Address) (event.Subscription, error) {

	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}
	var spenderRule []interface{}
	for _, spenderItem := range spender {
		spenderRule = append(spenderRule, spenderItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "Approval", ownerRule, spenderRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractApproval)
				if err := _Contract.contract.UnpackLog(event, "Approval", log); err != nil {
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

func (_Contract *ContractFilterer) ParseApproval(log types.Log) (*ContractApproval, error) {
	event := new(ContractApproval)
	if err := _Contract.contract.UnpackLog(event, "Approval", log); err != nil {
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

type ContractNameChangedIterator struct {
	Event *ContractNameChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractNameChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractNameChanged)
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
		it.Event = new(ContractNameChanged)
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

func (it *ContractNameChangedIterator) Error() error {
	return it.fail
}

func (it *ContractNameChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractNameChanged struct {
	NewName string
	Raw     types.Log
}

func (_Contract *ContractFilterer) FilterNameChanged(opts *bind.FilterOpts) (*ContractNameChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "NameChanged")
	if err != nil {
		return nil, err
	}
	return &ContractNameChangedIterator{contract: _Contract.contract, event: "NameChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchNameChanged(opts *bind.WatchOpts, sink chan<- *ContractNameChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "NameChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractNameChanged)
				if err := _Contract.contract.UnpackLog(event, "NameChanged", log); err != nil {
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

func (_Contract *ContractFilterer) ParseNameChanged(log types.Log) (*ContractNameChanged, error) {
	event := new(ContractNameChanged)
	if err := _Contract.contract.UnpackLog(event, "NameChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractPausedIterator struct {
	Event *ContractPaused

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractPausedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractPaused)
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
		it.Event = new(ContractPaused)
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

func (it *ContractPausedIterator) Error() error {
	return it.fail
}

func (it *ContractPausedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractPaused struct {
	Account common.Address
	Raw     types.Log
}

func (_Contract *ContractFilterer) FilterPaused(opts *bind.FilterOpts) (*ContractPausedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "Paused")
	if err != nil {
		return nil, err
	}
	return &ContractPausedIterator{contract: _Contract.contract, event: "Paused", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchPaused(opts *bind.WatchOpts, sink chan<- *ContractPaused) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "Paused")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractPaused)
				if err := _Contract.contract.UnpackLog(event, "Paused", log); err != nil {
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

func (_Contract *ContractFilterer) ParsePaused(log types.Log) (*ContractPaused, error) {
	event := new(ContractPaused)
	if err := _Contract.contract.UnpackLog(event, "Paused", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractSymbolChangedIterator struct {
	Event *ContractSymbolChanged

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractSymbolChangedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractSymbolChanged)
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
		it.Event = new(ContractSymbolChanged)
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

func (it *ContractSymbolChangedIterator) Error() error {
	return it.fail
}

func (it *ContractSymbolChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractSymbolChanged struct {
	NewSymbol string
	Raw       types.Log
}

func (_Contract *ContractFilterer) FilterSymbolChanged(opts *bind.FilterOpts) (*ContractSymbolChangedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "SymbolChanged")
	if err != nil {
		return nil, err
	}
	return &ContractSymbolChangedIterator{contract: _Contract.contract, event: "SymbolChanged", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchSymbolChanged(opts *bind.WatchOpts, sink chan<- *ContractSymbolChanged) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "SymbolChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractSymbolChanged)
				if err := _Contract.contract.UnpackLog(event, "SymbolChanged", log); err != nil {
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

func (_Contract *ContractFilterer) ParseSymbolChanged(log types.Log) (*ContractSymbolChanged, error) {
	event := new(ContractSymbolChanged)
	if err := _Contract.contract.UnpackLog(event, "SymbolChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractTransferIterator struct {
	Event *ContractTransfer

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractTransferIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractTransfer)
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
		it.Event = new(ContractTransfer)
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

func (it *ContractTransferIterator) Error() error {
	return it.fail
}

func (it *ContractTransferIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractTransfer struct {
	From  common.Address
	To    common.Address
	Value *big.Int
	Raw   types.Log
}

func (_Contract *ContractFilterer) FilterTransfer(opts *bind.FilterOpts, from []common.Address, to []common.Address) (*ContractTransferIterator, error) {

	var fromRule []interface{}
	for _, fromItem := range from {
		fromRule = append(fromRule, fromItem)
	}
	var toRule []interface{}
	for _, toItem := range to {
		toRule = append(toRule, toItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "Transfer", fromRule, toRule)
	if err != nil {
		return nil, err
	}
	return &ContractTransferIterator{contract: _Contract.contract, event: "Transfer", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchTransfer(opts *bind.WatchOpts, sink chan<- *ContractTransfer, from []common.Address, to []common.Address) (event.Subscription, error) {

	var fromRule []interface{}
	for _, fromItem := range from {
		fromRule = append(fromRule, fromItem)
	}
	var toRule []interface{}
	for _, toItem := range to {
		toRule = append(toRule, toItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "Transfer", fromRule, toRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractTransfer)
				if err := _Contract.contract.UnpackLog(event, "Transfer", log); err != nil {
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

func (_Contract *ContractFilterer) ParseTransfer(log types.Log) (*ContractTransfer, error) {
	event := new(ContractTransfer)
	if err := _Contract.contract.UnpackLog(event, "Transfer", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractUnpausedIterator struct {
	Event *ContractUnpaused

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractUnpausedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractUnpaused)
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
		it.Event = new(ContractUnpaused)
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

func (it *ContractUnpausedIterator) Error() error {
	return it.fail
}

func (it *ContractUnpausedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractUnpaused struct {
	Account common.Address
	Raw     types.Log
}

func (_Contract *ContractFilterer) FilterUnpaused(opts *bind.FilterOpts) (*ContractUnpausedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "Unpaused")
	if err != nil {
		return nil, err
	}
	return &ContractUnpausedIterator{contract: _Contract.contract, event: "Unpaused", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchUnpaused(opts *bind.WatchOpts, sink chan<- *ContractUnpaused) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "Unpaused")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractUnpaused)
				if err := _Contract.contract.UnpackLog(event, "Unpaused", log); err != nil {
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

func (_Contract *ContractFilterer) ParseUnpaused(log types.Log) (*ContractUnpaused, error) {
	event := new(ContractUnpaused)
	if err := _Contract.contract.UnpackLog(event, "Unpaused", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

func (_Contract *Contract) ParseLog(log types.Log) (generated.AbigenLog, error) {
	switch log.Topics[0] {
	case _Contract.abi.Events["Approval"].ID:
		return _Contract.ParseApproval(log)
	case _Contract.abi.Events["Initialized"].ID:
		return _Contract.ParseInitialized(log)
	case _Contract.abi.Events["NameChanged"].ID:
		return _Contract.ParseNameChanged(log)
	case _Contract.abi.Events["Paused"].ID:
		return _Contract.ParsePaused(log)
	case _Contract.abi.Events["SymbolChanged"].ID:
		return _Contract.ParseSymbolChanged(log)
	case _Contract.abi.Events["Transfer"].ID:
		return _Contract.ParseTransfer(log)
	case _Contract.abi.Events["Unpaused"].ID:
		return _Contract.ParseUnpaused(log)

	default:
		return nil, fmt.Errorf("abigen wrapper received unknown log topic: %v", log.Topics[0])
	}
}

func (ContractApproval) Topic() common.Hash {
	return common.HexToHash("0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925")
}

func (ContractInitialized) Topic() common.Hash {
	return common.HexToHash("0xc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d2")
}

func (ContractNameChanged) Topic() common.Hash {
	return common.HexToHash("0x4737457377f528cc8afd815f73ecb8b05df80d047dbffc41c17750a4033592bc")
}

func (ContractPaused) Topic() common.Hash {
	return common.HexToHash("0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258")
}

func (ContractSymbolChanged) Topic() common.Hash {
	return common.HexToHash("0x57c940aa14b51ea5f96b7a2bea757ce355d996e2c5d7a3c68aff1c75a326269b")
}

func (ContractTransfer) Topic() common.Hash {
	return common.HexToHash("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef")
}

func (ContractUnpaused) Topic() common.Hash {
	return common.HexToHash("0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa")
}

func (_Contract *Contract) Address() common.Address {
	return _Contract.address
}

type ContractInterface interface {
	Allowance(opts *bind.CallOpts, owner common.Address, spender common.Address) (*big.Int, error)

	BalanceOf(opts *bind.CallOpts, account common.Address) (*big.Int, error)

	Config(opts *bind.CallOpts) (common.Address, error)

	ConvertToAmount(opts *bind.CallOpts, shares *big.Int) (*big.Int, error)

	ConvertToShares(opts *bind.CallOpts, amount *big.Int) (*big.Int, error)

	Decimals(opts *bind.CallOpts) (uint8, error)

	Name(opts *bind.CallOpts) (string, error)

	Paused(opts *bind.CallOpts) (bool, error)

	Ratio(opts *bind.CallOpts) (*big.Int, error)

	Symbol(opts *bind.CallOpts) (string, error)

	TotalAssets(opts *bind.CallOpts) (*big.Int, error)

	TotalSupply(opts *bind.CallOpts) (*big.Int, error)

	Approve(opts *bind.TransactOpts, spender common.Address, value *big.Int) (*types.Transaction, error)

	Burn(opts *bind.TransactOpts, account common.Address, shares *big.Int) (*types.Transaction, error)

	ChangeName(opts *bind.TransactOpts, newName string) (*types.Transaction, error)

	ChangeSymbol(opts *bind.TransactOpts, newSymbol string) (*types.Transaction, error)

	Initialize(opts *bind.TransactOpts, config common.Address, name string, symbol string) (*types.Transaction, error)

	Mint(opts *bind.TransactOpts, account common.Address, shares *big.Int) (*types.Transaction, error)

	Pause(opts *bind.TransactOpts) (*types.Transaction, error)

	Transfer(opts *bind.TransactOpts, to common.Address, value *big.Int) (*types.Transaction, error)

	TransferFrom(opts *bind.TransactOpts, from common.Address, to common.Address, value *big.Int) (*types.Transaction, error)

	Unpause(opts *bind.TransactOpts) (*types.Transaction, error)

	FilterApproval(opts *bind.FilterOpts, owner []common.Address, spender []common.Address) (*ContractApprovalIterator, error)

	WatchApproval(opts *bind.WatchOpts, sink chan<- *ContractApproval, owner []common.Address, spender []common.Address) (event.Subscription, error)

	ParseApproval(log types.Log) (*ContractApproval, error)

	FilterInitialized(opts *bind.FilterOpts) (*ContractInitializedIterator, error)

	WatchInitialized(opts *bind.WatchOpts, sink chan<- *ContractInitialized) (event.Subscription, error)

	ParseInitialized(log types.Log) (*ContractInitialized, error)

	FilterNameChanged(opts *bind.FilterOpts) (*ContractNameChangedIterator, error)

	WatchNameChanged(opts *bind.WatchOpts, sink chan<- *ContractNameChanged) (event.Subscription, error)

	ParseNameChanged(log types.Log) (*ContractNameChanged, error)

	FilterPaused(opts *bind.FilterOpts) (*ContractPausedIterator, error)

	WatchPaused(opts *bind.WatchOpts, sink chan<- *ContractPaused) (event.Subscription, error)

	ParsePaused(log types.Log) (*ContractPaused, error)

	FilterSymbolChanged(opts *bind.FilterOpts) (*ContractSymbolChangedIterator, error)

	WatchSymbolChanged(opts *bind.WatchOpts, sink chan<- *ContractSymbolChanged) (event.Subscription, error)

	ParseSymbolChanged(log types.Log) (*ContractSymbolChanged, error)

	FilterTransfer(opts *bind.FilterOpts, from []common.Address, to []common.Address) (*ContractTransferIterator, error)

	WatchTransfer(opts *bind.WatchOpts, sink chan<- *ContractTransfer, from []common.Address, to []common.Address) (event.Subscription, error)

	ParseTransfer(log types.Log) (*ContractTransfer, error)

	FilterUnpaused(opts *bind.FilterOpts) (*ContractUnpausedIterator, error)

	WatchUnpaused(opts *bind.WatchOpts, sink chan<- *ContractUnpaused) (event.Subscription, error)

	ParseUnpaused(log types.Log) (*ContractUnpaused, error)

	ParseLog(log types.Log) (generated.AbigenLog, error)

	Address() common.Address
}
