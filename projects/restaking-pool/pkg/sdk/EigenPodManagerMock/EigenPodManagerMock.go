// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package EigenPodManagerMock

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
	ABI: "[{\"inputs\":[{\"internalType\":\"contractIETHPOSDeposit\",\"name\":\"_ethPOS\",\"type\":\"address\"},{\"internalType\":\"contractIBeacon\",\"name\":\"_eigenPodBeacon\",\"type\":\"address\"},{\"internalType\":\"contractIStrategyManager\",\"name\":\"_strategyManager\",\"type\":\"address\"},{\"internalType\":\"contractISlasher\",\"name\":\"_slasher\",\"type\":\"address\"}],\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"inputs\":[],\"name\":\"Create2EmptyBytecode\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"Create2FailedDeployment\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"balance\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"needed\",\"type\":\"uint256\"}],\"name\":\"Create2InsufficientBalance\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"InvalidInitialization\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"NotInitializing\",\"type\":\"error\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"podOwner\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"BeaconChainETHDeposited\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"podOwner\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint96\",\"name\":\"nonce\",\"type\":\"uint96\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"delegatedAddress\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"withdrawer\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"bytes32\",\"name\":\"withdrawalRoot\",\"type\":\"bytes32\"}],\"name\":\"BeaconChainETHWithdrawalCompleted\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"newOracleAddress\",\"type\":\"address\"}],\"name\":\"BeaconOracleUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint64\",\"name\":\"newValue\",\"type\":\"uint64\"}],\"name\":\"DenebForkTimestampUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint64\",\"name\":\"version\",\"type\":\"uint64\"}],\"name\":\"Initialized\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"eigenPod\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"podOwner\",\"type\":\"address\"}],\"name\":\"PodDeployed\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"podOwner\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"int256\",\"name\":\"sharesDelta\",\"type\":\"int256\"}],\"name\":\"PodSharesUpdated\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"podOwner\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"}],\"name\":\"addShares\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"beaconChainETHStrategy\",\"outputs\":[{\"internalType\":\"contractIStrategy\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"beaconChainOracle\",\"outputs\":[{\"internalType\":\"contractIBeaconChainOracle\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"createPod\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"denebForkTimestamp\",\"outputs\":[{\"internalType\":\"uint64\",\"name\":\"\",\"type\":\"uint64\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"eigenPodBeacon\",\"outputs\":[{\"internalType\":\"contractIBeacon\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"ethPOS\",\"outputs\":[{\"internalType\":\"contractIETHPOSDeposit\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint64\",\"name\":\"timestamp\",\"type\":\"uint64\"}],\"name\":\"getBlockRootAtTimestamp\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"podOwner\",\"type\":\"address\"}],\"name\":\"getPod\",\"outputs\":[{\"internalType\":\"contractIEigenPod\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"podOwner\",\"type\":\"address\"}],\"name\":\"hasPod\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"maxPods\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"numPods\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"name\":\"ownerToPod\",\"outputs\":[{\"internalType\":\"contractIEigenPod\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"podOwner\",\"type\":\"address\"}],\"name\":\"podOwnerShares\",\"outputs\":[{\"internalType\":\"int256\",\"name\":\"\",\"type\":\"int256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"podOwner\",\"type\":\"address\"},{\"internalType\":\"int256\",\"name\":\"sharesDelta\",\"type\":\"int256\"}],\"name\":\"recordBeaconChainETHBalanceUpdate\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"podOwner\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"}],\"name\":\"removeShares\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint64\",\"name\":\"newDenebForkTimestamp\",\"type\":\"uint64\"}],\"name\":\"setDenebForkTimestamp\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"slasher\",\"outputs\":[{\"internalType\":\"contractISlasher\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes\",\"name\":\"pubkey\",\"type\":\"bytes\"},{\"internalType\":\"bytes\",\"name\":\"signature\",\"type\":\"bytes\"},{\"internalType\":\"bytes32\",\"name\":\"depositDataRoot\",\"type\":\"bytes32\"}],\"name\":\"stake\",\"outputs\":[],\"stateMutability\":\"payable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"strategyManager\",\"outputs\":[{\"internalType\":\"contractIStrategyManager\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"internalType\":\"contractIEigenPod\",\"name\":\"pod\",\"type\":\"address\"}],\"name\":\"test_addPod\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"contractIBeaconChainOracle\",\"name\":\"newBeaconChainOracle\",\"type\":\"address\"}],\"name\":\"updateBeaconChainOracle\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"podOwner\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"destination\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"shares\",\"type\":\"uint256\"}],\"name\":\"withdrawSharesAsTokens\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]",
	Bin: "0x60806040526103e8600155348015610015575f80fd5b5060405161143038038061143083398101604081905261003491610155565b600380546001600160a01b038087166001600160a01b0319928316179092556002805486841690831617905560048054858416908316179055600580549284169290911691909117905561008661008f565b505050506101b1565b7ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a00805468010000000000000000900460ff16156100df5760405163f92ee8a960e01b815260040160405180910390fd5b80546001600160401b039081161461013e5780546001600160401b0319166001600160401b0390811782556040519081527fc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d29060200160405180910390a15b50565b6001600160a01b038116811461013e575f80fd5b5f805f8060808587031215610168575f80fd5b845161017381610141565b602086015190945061018481610141565b604086015190935061019581610141565b60608601519092506101a681610141565b939692955090935050565b611272806101be5f395ff3fe60806040526004361061013c575f3560e01c80639b4e4634116100b3578063c052bd611161006d578063c052bd61146102bb578063c0ccbf101461039e578063c1de3aef146103b3578063c2c51c4014610380578063d1c64cc9146103cd578063f6848d24146103e7575f80fd5b80639b4e4634146102cd5780639ba06275146102e2578063a38406a314610316578063a6a509be1461034d578063b134427114610361578063beffbb8914610380575f80fd5b806344e71c801161010457806344e71c8014610232578063463db0381461024c57806360f4062b1461026957806374cdd7981461028857806384d81062146102a75780639104c319146102bb575f80fd5b80630e81073c1461014057806318653db214610174578063292b7b2b146101bd578063387b1300146101f457806339b70e3814610213575b5f80fd5b34801561014b575f80fd5b5061016161015a36600461070c565b5f92915050565b6040519081526020015b60405180910390f35b34801561017f575f80fd5b506101bb61018e366004610736565b6001600160a01b039182165f90815260066020526040902080546001600160a01b03191691909216179055565b005b3480156101c8575f80fd5b506002546101dc906001600160a01b031681565b6040516001600160a01b03909116815260200161016b565b3480156101ff575f80fd5b506101bb61020e36600461076d565b505050565b34801561021e575f80fd5b506004546101dc906001600160a01b031681565b34801561023d575f80fd5b506040515f815260200161016b565b348015610257575f80fd5b506101bb6102663660046107ab565b50565b348015610274575f80fd5b506101616102833660046107d2565b505f90565b348015610293575f80fd5b506003546101dc906001600160a01b031681565b3480156102b2575f80fd5b506101dc610430565b3480156102c6575f80fd5b505f6101dc565b6101bb6102db366004610832565b5050505050565b3480156102ed575f80fd5b506101dc6102fc3660046107d2565b60066020525f90815260409020546001600160a01b031681565b348015610321575f80fd5b506101dc6103303660046107d2565b6001600160a01b039081165f908152600660205260409020541690565b348015610358575f80fd5b506101615f5481565b34801561036c575f80fd5b506005546101dc906001600160a01b031681565b34801561038b575f80fd5b506101bb61039a36600461070c565b5050565b3480156103a9575f80fd5b5061016160015481565b3480156103be575f80fd5b506101bb6102663660046107d2565b3480156103d8575f80fd5b506101616102833660046107ab565b3480156103f2575f80fd5b506104206104013660046107d2565b6001600160a01b039081165f9081526006602052604090205416151590565b604051901515815260200161016b565b335f908152600660205260408120546001600160a01b0316156104b65760405162461bcd60e51b815260206004820152603360248201527f456967656e506f644d616e616765722e637265617465506f643a2053656e64656044820152721c88185b1c9958591e481a185cc818481c1bd9606a1b60648201526084015b60405180910390fd5b6104be6104c3565b905090565b5f6001545f5460016104d591906108b4565b11156105395760405162461bcd60e51b815260206004820152602d60248201527f456967656e506f644d616e616765722e5f6465706c6f79506f643a20706f642060448201526c1b1a5b5a5d081c995858da1959609a1b60648201526084016104ad565b5f808154610546906108cd565b9091555060408051610940810190915261090e8082525f916105c4918391339161092f6020830139600254604080516001600160a01b039092166020830152818101525f606082015260800160408051601f19818403018152908290526105b09291602001610912565b604051602081830303815290604052610673565b60405163189acdbd60e31b81523360048201529091506001600160a01b0382169063c4d66de8906024015f604051808303815f87803b158015610605575f80fd5b505af1158015610617573d5f803e3d5ffd5b5050335f8181526006602052604080822080546001600160a01b0319166001600160a01b038816908117909155905192945092507f21c99d0db02213c32fff5b05cf0a718ab5f858802b91498f80d82270289d856a91a3919050565b5f8347101561069e5760405163392efb2b60e21b8152476004820152602481018590526044016104ad565b81515f036106bf57604051631328927760e21b815260040160405180910390fd5b8282516020840186f590506001600160a01b0381166106f157604051633a0ba96160e11b815260040160405180910390fd5b9392505050565b6001600160a01b0381168114610266575f80fd5b5f806040838503121561071d575f80fd5b8235610728816106f8565b946020939093013593505050565b5f8060408385031215610747575f80fd5b8235610752816106f8565b91506020830135610762816106f8565b809150509250929050565b5f805f6060848603121561077f575f80fd5b833561078a816106f8565b9250602084013561079a816106f8565b929592945050506040919091013590565b5f602082840312156107bb575f80fd5b813567ffffffffffffffff811681146106f1575f80fd5b5f602082840312156107e2575f80fd5b81356106f1816106f8565b5f8083601f8401126107fd575f80fd5b50813567ffffffffffffffff811115610814575f80fd5b60208301915083602082850101111561082b575f80fd5b9250929050565b5f805f805f60608688031215610846575f80fd5b853567ffffffffffffffff8082111561085d575f80fd5b61086989838a016107ed565b90975095506020880135915080821115610881575f80fd5b5061088e888289016107ed565b96999598509660400135949350505050565b634e487b7160e01b5f52601160045260245ffd5b808201808211156108c7576108c76108a0565b92915050565b5f600182016108de576108de6108a0565b5060010190565b5f81515f5b8181101561090457602081850181015186830152016108ea565b505f93019283525090919050565b5f61092661092083866108e5565b846108e5565b94935050505056fe608060405260405161090e38038061090e83398101604081905261002291610460565b61002e82826000610035565b505061058a565b61003e83610100565b6040516001600160a01b038416907f1cf3b03a6cf19fa2baba4df148e9dcabedea7f8a5c07840e207e5c089be95d3e90600090a260008251118061007f5750805b156100fb576100f9836001600160a01b0316635c60da1b6040518163ffffffff1660e01b8152600401602060405180830381865afa1580156100c5573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906100e99190610520565b836102a360201b6100291760201c565b505b505050565b610113816102cf60201b6100551760201c565b6101725760405162461bcd60e51b815260206004820152602560248201527f455243313936373a206e657720626561636f6e206973206e6f74206120636f6e6044820152641d1c9858dd60da1b60648201526084015b60405180910390fd5b6101e6816001600160a01b0316635c60da1b6040518163ffffffff1660e01b8152600401602060405180830381865afa1580156101b3573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101d79190610520565b6102cf60201b6100551760201c565b61024b5760405162461bcd60e51b815260206004820152603060248201527f455243313936373a20626561636f6e20696d706c656d656e746174696f6e206960448201526f1cc81b9bdd08184818dbdb9d1c9858dd60821b6064820152608401610169565b806102827fa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d5060001b6102de60201b6100641760201c565b80546001600160a01b0319166001600160a01b039290921691909117905550565b60606102c883836040518060600160405280602781526020016108e7602791396102e1565b9392505050565b6001600160a01b03163b151590565b90565b6060600080856001600160a01b0316856040516102fe919061053b565b600060405180830381855af49150503d8060008114610339576040519150601f19603f3d011682016040523d82523d6000602084013e61033e565b606091505b5090925090506103508683838761035a565b9695505050505050565b606083156103c65782516103bf576001600160a01b0385163b6103bf5760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e74726163740000006044820152606401610169565b50816103d0565b6103d083836103d8565b949350505050565b8151156103e85781518083602001fd5b8060405162461bcd60e51b81526004016101699190610557565b80516001600160a01b038116811461041957600080fd5b919050565b634e487b7160e01b600052604160045260246000fd5b60005b8381101561044f578181015183820152602001610437565b838111156100f95750506000910152565b6000806040838503121561047357600080fd5b61047c83610402565b60208401519092506001600160401b038082111561049957600080fd5b818501915085601f8301126104ad57600080fd5b8151818111156104bf576104bf61041e565b604051601f8201601f19908116603f011681019083821181831017156104e7576104e761041e565b8160405282815288602084870101111561050057600080fd5b610511836020830160208801610434565b80955050505050509250929050565b60006020828403121561053257600080fd5b6102c882610402565b6000825161054d818460208701610434565b9190910192915050565b6020815260008251806020840152610576816040850160208701610434565b601f01601f19169190910160400192915050565b61034e806105996000396000f3fe60806040523661001357610011610017565b005b6100115b610027610022610067565b610100565b565b606061004e83836040518060600160405280602781526020016102f260279139610124565b9392505050565b6001600160a01b03163b151590565b90565b600061009a7fa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50546001600160a01b031690565b6001600160a01b0316635c60da1b6040518163ffffffff1660e01b8152600401602060405180830381865afa1580156100d7573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906100fb9190610249565b905090565b3660008037600080366000845af43d6000803e80801561011f573d6000f35b3d6000fd5b6060600080856001600160a01b03168560405161014191906102a2565b600060405180830381855af49150503d806000811461017c576040519150601f19603f3d011682016040523d82523d6000602084013e610181565b606091505b50915091506101928683838761019c565b9695505050505050565b6060831561020d578251610206576001600160a01b0385163b6102065760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e747261637400000060448201526064015b60405180910390fd5b5081610217565b610217838361021f565b949350505050565b81511561022f5781518083602001fd5b8060405162461bcd60e51b81526004016101fd91906102be565b60006020828403121561025b57600080fd5b81516001600160a01b038116811461004e57600080fd5b60005b8381101561028d578181015183820152602001610275565b8381111561029c576000848401525b50505050565b600082516102b4818460208701610272565b9190910192915050565b60208152600082518060208401526102dd816040850160208701610272565b601f01601f1916919091016040019291505056fe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a2646970667358221220d51e81d3bc5ed20a26aeb05dce7e825c503b2061aa78628027300c8d65b9d89a64736f6c634300080c0033416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a26469706673582212202d8e066fda7ff3dbcd36aad358987a956eaea8a80ec0ab3f519d211d41924e6264736f6c63430008150033",
}

var ContractABI = ContractMetaData.ABI

var ContractBin = ContractMetaData.Bin

func DeployContract(auth *bind.TransactOpts, backend bind.ContractBackend, _ethPOS common.Address, _eigenPodBeacon common.Address, _strategyManager common.Address, _slasher common.Address) (common.Address, *types.Transaction, *Contract, error) {
	parsed, err := ContractMetaData.GetAbi()
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	if parsed == nil {
		return common.Address{}, nil, nil, errors.New("GetABI returned nil")
	}

	address, tx, contract, err := bind.DeployContract(auth, *parsed, common.FromHex(ContractBin), backend, _ethPOS, _eigenPodBeacon, _strategyManager, _slasher)
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

func (_Contract *ContractCaller) BeaconChainETHStrategy(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "beaconChainETHStrategy")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) BeaconChainETHStrategy() (common.Address, error) {
	return _Contract.Contract.BeaconChainETHStrategy(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) BeaconChainETHStrategy() (common.Address, error) {
	return _Contract.Contract.BeaconChainETHStrategy(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) BeaconChainOracle(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "beaconChainOracle")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) BeaconChainOracle() (common.Address, error) {
	return _Contract.Contract.BeaconChainOracle(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) BeaconChainOracle() (common.Address, error) {
	return _Contract.Contract.BeaconChainOracle(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) DenebForkTimestamp(opts *bind.CallOpts) (uint64, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "denebForkTimestamp")

	if err != nil {
		return *new(uint64), err
	}

	out0 := *abi.ConvertType(out[0], new(uint64)).(*uint64)

	return out0, err

}

func (_Contract *ContractSession) DenebForkTimestamp() (uint64, error) {
	return _Contract.Contract.DenebForkTimestamp(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) DenebForkTimestamp() (uint64, error) {
	return _Contract.Contract.DenebForkTimestamp(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) EigenPodBeacon(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "eigenPodBeacon")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) EigenPodBeacon() (common.Address, error) {
	return _Contract.Contract.EigenPodBeacon(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) EigenPodBeacon() (common.Address, error) {
	return _Contract.Contract.EigenPodBeacon(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) EthPOS(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "ethPOS")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) EthPOS() (common.Address, error) {
	return _Contract.Contract.EthPOS(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) EthPOS() (common.Address, error) {
	return _Contract.Contract.EthPOS(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) GetBlockRootAtTimestamp(opts *bind.CallOpts, timestamp uint64) ([32]byte, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getBlockRootAtTimestamp", timestamp)

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

func (_Contract *ContractSession) GetBlockRootAtTimestamp(timestamp uint64) ([32]byte, error) {
	return _Contract.Contract.GetBlockRootAtTimestamp(&_Contract.CallOpts, timestamp)
}

func (_Contract *ContractCallerSession) GetBlockRootAtTimestamp(timestamp uint64) ([32]byte, error) {
	return _Contract.Contract.GetBlockRootAtTimestamp(&_Contract.CallOpts, timestamp)
}

func (_Contract *ContractCaller) GetPod(opts *bind.CallOpts, podOwner common.Address) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "getPod", podOwner)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) GetPod(podOwner common.Address) (common.Address, error) {
	return _Contract.Contract.GetPod(&_Contract.CallOpts, podOwner)
}

func (_Contract *ContractCallerSession) GetPod(podOwner common.Address) (common.Address, error) {
	return _Contract.Contract.GetPod(&_Contract.CallOpts, podOwner)
}

func (_Contract *ContractCaller) HasPod(opts *bind.CallOpts, podOwner common.Address) (bool, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "hasPod", podOwner)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

func (_Contract *ContractSession) HasPod(podOwner common.Address) (bool, error) {
	return _Contract.Contract.HasPod(&_Contract.CallOpts, podOwner)
}

func (_Contract *ContractCallerSession) HasPod(podOwner common.Address) (bool, error) {
	return _Contract.Contract.HasPod(&_Contract.CallOpts, podOwner)
}

func (_Contract *ContractCaller) MaxPods(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "maxPods")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) MaxPods() (*big.Int, error) {
	return _Contract.Contract.MaxPods(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) MaxPods() (*big.Int, error) {
	return _Contract.Contract.MaxPods(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) NumPods(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "numPods")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) NumPods() (*big.Int, error) {
	return _Contract.Contract.NumPods(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) NumPods() (*big.Int, error) {
	return _Contract.Contract.NumPods(&_Contract.CallOpts)
}

func (_Contract *ContractCaller) OwnerToPod(opts *bind.CallOpts, arg0 common.Address) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "ownerToPod", arg0)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) OwnerToPod(arg0 common.Address) (common.Address, error) {
	return _Contract.Contract.OwnerToPod(&_Contract.CallOpts, arg0)
}

func (_Contract *ContractCallerSession) OwnerToPod(arg0 common.Address) (common.Address, error) {
	return _Contract.Contract.OwnerToPod(&_Contract.CallOpts, arg0)
}

func (_Contract *ContractCaller) PodOwnerShares(opts *bind.CallOpts, podOwner common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "podOwnerShares", podOwner)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

func (_Contract *ContractSession) PodOwnerShares(podOwner common.Address) (*big.Int, error) {
	return _Contract.Contract.PodOwnerShares(&_Contract.CallOpts, podOwner)
}

func (_Contract *ContractCallerSession) PodOwnerShares(podOwner common.Address) (*big.Int, error) {
	return _Contract.Contract.PodOwnerShares(&_Contract.CallOpts, podOwner)
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

func (_Contract *ContractCaller) StrategyManager(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Contract.contract.Call(opts, &out, "strategyManager")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

func (_Contract *ContractSession) StrategyManager() (common.Address, error) {
	return _Contract.Contract.StrategyManager(&_Contract.CallOpts)
}

func (_Contract *ContractCallerSession) StrategyManager() (common.Address, error) {
	return _Contract.Contract.StrategyManager(&_Contract.CallOpts)
}

func (_Contract *ContractTransactor) AddShares(opts *bind.TransactOpts, podOwner common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "addShares", podOwner, shares)
}

func (_Contract *ContractSession) AddShares(podOwner common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.AddShares(&_Contract.TransactOpts, podOwner, shares)
}

func (_Contract *ContractTransactorSession) AddShares(podOwner common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.AddShares(&_Contract.TransactOpts, podOwner, shares)
}

func (_Contract *ContractTransactor) CreatePod(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "createPod")
}

func (_Contract *ContractSession) CreatePod() (*types.Transaction, error) {
	return _Contract.Contract.CreatePod(&_Contract.TransactOpts)
}

func (_Contract *ContractTransactorSession) CreatePod() (*types.Transaction, error) {
	return _Contract.Contract.CreatePod(&_Contract.TransactOpts)
}

func (_Contract *ContractTransactor) RecordBeaconChainETHBalanceUpdate(opts *bind.TransactOpts, podOwner common.Address, sharesDelta *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "recordBeaconChainETHBalanceUpdate", podOwner, sharesDelta)
}

func (_Contract *ContractSession) RecordBeaconChainETHBalanceUpdate(podOwner common.Address, sharesDelta *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.RecordBeaconChainETHBalanceUpdate(&_Contract.TransactOpts, podOwner, sharesDelta)
}

func (_Contract *ContractTransactorSession) RecordBeaconChainETHBalanceUpdate(podOwner common.Address, sharesDelta *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.RecordBeaconChainETHBalanceUpdate(&_Contract.TransactOpts, podOwner, sharesDelta)
}

func (_Contract *ContractTransactor) RemoveShares(opts *bind.TransactOpts, podOwner common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "removeShares", podOwner, shares)
}

func (_Contract *ContractSession) RemoveShares(podOwner common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.RemoveShares(&_Contract.TransactOpts, podOwner, shares)
}

func (_Contract *ContractTransactorSession) RemoveShares(podOwner common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.RemoveShares(&_Contract.TransactOpts, podOwner, shares)
}

func (_Contract *ContractTransactor) SetDenebForkTimestamp(opts *bind.TransactOpts, newDenebForkTimestamp uint64) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "setDenebForkTimestamp", newDenebForkTimestamp)
}

func (_Contract *ContractSession) SetDenebForkTimestamp(newDenebForkTimestamp uint64) (*types.Transaction, error) {
	return _Contract.Contract.SetDenebForkTimestamp(&_Contract.TransactOpts, newDenebForkTimestamp)
}

func (_Contract *ContractTransactorSession) SetDenebForkTimestamp(newDenebForkTimestamp uint64) (*types.Transaction, error) {
	return _Contract.Contract.SetDenebForkTimestamp(&_Contract.TransactOpts, newDenebForkTimestamp)
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

func (_Contract *ContractTransactor) TestAddPod(opts *bind.TransactOpts, owner common.Address, pod common.Address) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "test_addPod", owner, pod)
}

func (_Contract *ContractSession) TestAddPod(owner common.Address, pod common.Address) (*types.Transaction, error) {
	return _Contract.Contract.TestAddPod(&_Contract.TransactOpts, owner, pod)
}

func (_Contract *ContractTransactorSession) TestAddPod(owner common.Address, pod common.Address) (*types.Transaction, error) {
	return _Contract.Contract.TestAddPod(&_Contract.TransactOpts, owner, pod)
}

func (_Contract *ContractTransactor) UpdateBeaconChainOracle(opts *bind.TransactOpts, newBeaconChainOracle common.Address) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "updateBeaconChainOracle", newBeaconChainOracle)
}

func (_Contract *ContractSession) UpdateBeaconChainOracle(newBeaconChainOracle common.Address) (*types.Transaction, error) {
	return _Contract.Contract.UpdateBeaconChainOracle(&_Contract.TransactOpts, newBeaconChainOracle)
}

func (_Contract *ContractTransactorSession) UpdateBeaconChainOracle(newBeaconChainOracle common.Address) (*types.Transaction, error) {
	return _Contract.Contract.UpdateBeaconChainOracle(&_Contract.TransactOpts, newBeaconChainOracle)
}

func (_Contract *ContractTransactor) WithdrawSharesAsTokens(opts *bind.TransactOpts, podOwner common.Address, destination common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.contract.Transact(opts, "withdrawSharesAsTokens", podOwner, destination, shares)
}

func (_Contract *ContractSession) WithdrawSharesAsTokens(podOwner common.Address, destination common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.WithdrawSharesAsTokens(&_Contract.TransactOpts, podOwner, destination, shares)
}

func (_Contract *ContractTransactorSession) WithdrawSharesAsTokens(podOwner common.Address, destination common.Address, shares *big.Int) (*types.Transaction, error) {
	return _Contract.Contract.WithdrawSharesAsTokens(&_Contract.TransactOpts, podOwner, destination, shares)
}

type ContractBeaconChainETHDepositedIterator struct {
	Event *ContractBeaconChainETHDeposited

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractBeaconChainETHDepositedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractBeaconChainETHDeposited)
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
		it.Event = new(ContractBeaconChainETHDeposited)
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

func (it *ContractBeaconChainETHDepositedIterator) Error() error {
	return it.fail
}

func (it *ContractBeaconChainETHDepositedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractBeaconChainETHDeposited struct {
	PodOwner common.Address
	Amount   *big.Int
	Raw      types.Log
}

func (_Contract *ContractFilterer) FilterBeaconChainETHDeposited(opts *bind.FilterOpts, podOwner []common.Address) (*ContractBeaconChainETHDepositedIterator, error) {

	var podOwnerRule []interface{}
	for _, podOwnerItem := range podOwner {
		podOwnerRule = append(podOwnerRule, podOwnerItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "BeaconChainETHDeposited", podOwnerRule)
	if err != nil {
		return nil, err
	}
	return &ContractBeaconChainETHDepositedIterator{contract: _Contract.contract, event: "BeaconChainETHDeposited", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchBeaconChainETHDeposited(opts *bind.WatchOpts, sink chan<- *ContractBeaconChainETHDeposited, podOwner []common.Address) (event.Subscription, error) {

	var podOwnerRule []interface{}
	for _, podOwnerItem := range podOwner {
		podOwnerRule = append(podOwnerRule, podOwnerItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "BeaconChainETHDeposited", podOwnerRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractBeaconChainETHDeposited)
				if err := _Contract.contract.UnpackLog(event, "BeaconChainETHDeposited", log); err != nil {
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

func (_Contract *ContractFilterer) ParseBeaconChainETHDeposited(log types.Log) (*ContractBeaconChainETHDeposited, error) {
	event := new(ContractBeaconChainETHDeposited)
	if err := _Contract.contract.UnpackLog(event, "BeaconChainETHDeposited", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractBeaconChainETHWithdrawalCompletedIterator struct {
	Event *ContractBeaconChainETHWithdrawalCompleted

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractBeaconChainETHWithdrawalCompletedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractBeaconChainETHWithdrawalCompleted)
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
		it.Event = new(ContractBeaconChainETHWithdrawalCompleted)
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

func (it *ContractBeaconChainETHWithdrawalCompletedIterator) Error() error {
	return it.fail
}

func (it *ContractBeaconChainETHWithdrawalCompletedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractBeaconChainETHWithdrawalCompleted struct {
	PodOwner         common.Address
	Shares           *big.Int
	Nonce            *big.Int
	DelegatedAddress common.Address
	Withdrawer       common.Address
	WithdrawalRoot   [32]byte
	Raw              types.Log
}

func (_Contract *ContractFilterer) FilterBeaconChainETHWithdrawalCompleted(opts *bind.FilterOpts, podOwner []common.Address) (*ContractBeaconChainETHWithdrawalCompletedIterator, error) {

	var podOwnerRule []interface{}
	for _, podOwnerItem := range podOwner {
		podOwnerRule = append(podOwnerRule, podOwnerItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "BeaconChainETHWithdrawalCompleted", podOwnerRule)
	if err != nil {
		return nil, err
	}
	return &ContractBeaconChainETHWithdrawalCompletedIterator{contract: _Contract.contract, event: "BeaconChainETHWithdrawalCompleted", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchBeaconChainETHWithdrawalCompleted(opts *bind.WatchOpts, sink chan<- *ContractBeaconChainETHWithdrawalCompleted, podOwner []common.Address) (event.Subscription, error) {

	var podOwnerRule []interface{}
	for _, podOwnerItem := range podOwner {
		podOwnerRule = append(podOwnerRule, podOwnerItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "BeaconChainETHWithdrawalCompleted", podOwnerRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractBeaconChainETHWithdrawalCompleted)
				if err := _Contract.contract.UnpackLog(event, "BeaconChainETHWithdrawalCompleted", log); err != nil {
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

func (_Contract *ContractFilterer) ParseBeaconChainETHWithdrawalCompleted(log types.Log) (*ContractBeaconChainETHWithdrawalCompleted, error) {
	event := new(ContractBeaconChainETHWithdrawalCompleted)
	if err := _Contract.contract.UnpackLog(event, "BeaconChainETHWithdrawalCompleted", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractBeaconOracleUpdatedIterator struct {
	Event *ContractBeaconOracleUpdated

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractBeaconOracleUpdatedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractBeaconOracleUpdated)
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
		it.Event = new(ContractBeaconOracleUpdated)
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

func (it *ContractBeaconOracleUpdatedIterator) Error() error {
	return it.fail
}

func (it *ContractBeaconOracleUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractBeaconOracleUpdated struct {
	NewOracleAddress common.Address
	Raw              types.Log
}

func (_Contract *ContractFilterer) FilterBeaconOracleUpdated(opts *bind.FilterOpts, newOracleAddress []common.Address) (*ContractBeaconOracleUpdatedIterator, error) {

	var newOracleAddressRule []interface{}
	for _, newOracleAddressItem := range newOracleAddress {
		newOracleAddressRule = append(newOracleAddressRule, newOracleAddressItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "BeaconOracleUpdated", newOracleAddressRule)
	if err != nil {
		return nil, err
	}
	return &ContractBeaconOracleUpdatedIterator{contract: _Contract.contract, event: "BeaconOracleUpdated", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchBeaconOracleUpdated(opts *bind.WatchOpts, sink chan<- *ContractBeaconOracleUpdated, newOracleAddress []common.Address) (event.Subscription, error) {

	var newOracleAddressRule []interface{}
	for _, newOracleAddressItem := range newOracleAddress {
		newOracleAddressRule = append(newOracleAddressRule, newOracleAddressItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "BeaconOracleUpdated", newOracleAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractBeaconOracleUpdated)
				if err := _Contract.contract.UnpackLog(event, "BeaconOracleUpdated", log); err != nil {
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

func (_Contract *ContractFilterer) ParseBeaconOracleUpdated(log types.Log) (*ContractBeaconOracleUpdated, error) {
	event := new(ContractBeaconOracleUpdated)
	if err := _Contract.contract.UnpackLog(event, "BeaconOracleUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractDenebForkTimestampUpdatedIterator struct {
	Event *ContractDenebForkTimestampUpdated

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractDenebForkTimestampUpdatedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractDenebForkTimestampUpdated)
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
		it.Event = new(ContractDenebForkTimestampUpdated)
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

func (it *ContractDenebForkTimestampUpdatedIterator) Error() error {
	return it.fail
}

func (it *ContractDenebForkTimestampUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractDenebForkTimestampUpdated struct {
	NewValue uint64
	Raw      types.Log
}

func (_Contract *ContractFilterer) FilterDenebForkTimestampUpdated(opts *bind.FilterOpts) (*ContractDenebForkTimestampUpdatedIterator, error) {

	logs, sub, err := _Contract.contract.FilterLogs(opts, "DenebForkTimestampUpdated")
	if err != nil {
		return nil, err
	}
	return &ContractDenebForkTimestampUpdatedIterator{contract: _Contract.contract, event: "DenebForkTimestampUpdated", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchDenebForkTimestampUpdated(opts *bind.WatchOpts, sink chan<- *ContractDenebForkTimestampUpdated) (event.Subscription, error) {

	logs, sub, err := _Contract.contract.WatchLogs(opts, "DenebForkTimestampUpdated")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractDenebForkTimestampUpdated)
				if err := _Contract.contract.UnpackLog(event, "DenebForkTimestampUpdated", log); err != nil {
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

func (_Contract *ContractFilterer) ParseDenebForkTimestampUpdated(log types.Log) (*ContractDenebForkTimestampUpdated, error) {
	event := new(ContractDenebForkTimestampUpdated)
	if err := _Contract.contract.UnpackLog(event, "DenebForkTimestampUpdated", log); err != nil {
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

type ContractPodDeployedIterator struct {
	Event *ContractPodDeployed

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractPodDeployedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractPodDeployed)
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
		it.Event = new(ContractPodDeployed)
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

func (it *ContractPodDeployedIterator) Error() error {
	return it.fail
}

func (it *ContractPodDeployedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractPodDeployed struct {
	EigenPod common.Address
	PodOwner common.Address
	Raw      types.Log
}

func (_Contract *ContractFilterer) FilterPodDeployed(opts *bind.FilterOpts, eigenPod []common.Address, podOwner []common.Address) (*ContractPodDeployedIterator, error) {

	var eigenPodRule []interface{}
	for _, eigenPodItem := range eigenPod {
		eigenPodRule = append(eigenPodRule, eigenPodItem)
	}
	var podOwnerRule []interface{}
	for _, podOwnerItem := range podOwner {
		podOwnerRule = append(podOwnerRule, podOwnerItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "PodDeployed", eigenPodRule, podOwnerRule)
	if err != nil {
		return nil, err
	}
	return &ContractPodDeployedIterator{contract: _Contract.contract, event: "PodDeployed", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchPodDeployed(opts *bind.WatchOpts, sink chan<- *ContractPodDeployed, eigenPod []common.Address, podOwner []common.Address) (event.Subscription, error) {

	var eigenPodRule []interface{}
	for _, eigenPodItem := range eigenPod {
		eigenPodRule = append(eigenPodRule, eigenPodItem)
	}
	var podOwnerRule []interface{}
	for _, podOwnerItem := range podOwner {
		podOwnerRule = append(podOwnerRule, podOwnerItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "PodDeployed", eigenPodRule, podOwnerRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractPodDeployed)
				if err := _Contract.contract.UnpackLog(event, "PodDeployed", log); err != nil {
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

func (_Contract *ContractFilterer) ParsePodDeployed(log types.Log) (*ContractPodDeployed, error) {
	event := new(ContractPodDeployed)
	if err := _Contract.contract.UnpackLog(event, "PodDeployed", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

type ContractPodSharesUpdatedIterator struct {
	Event *ContractPodSharesUpdated

	contract *bind.BoundContract
	event    string

	logs chan types.Log
	sub  ethereum.Subscription
	done bool
	fail error
}

func (it *ContractPodSharesUpdatedIterator) Next() bool {

	if it.fail != nil {
		return false
	}

	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractPodSharesUpdated)
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
		it.Event = new(ContractPodSharesUpdated)
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

func (it *ContractPodSharesUpdatedIterator) Error() error {
	return it.fail
}

func (it *ContractPodSharesUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

type ContractPodSharesUpdated struct {
	PodOwner    common.Address
	SharesDelta *big.Int
	Raw         types.Log
}

func (_Contract *ContractFilterer) FilterPodSharesUpdated(opts *bind.FilterOpts, podOwner []common.Address) (*ContractPodSharesUpdatedIterator, error) {

	var podOwnerRule []interface{}
	for _, podOwnerItem := range podOwner {
		podOwnerRule = append(podOwnerRule, podOwnerItem)
	}

	logs, sub, err := _Contract.contract.FilterLogs(opts, "PodSharesUpdated", podOwnerRule)
	if err != nil {
		return nil, err
	}
	return &ContractPodSharesUpdatedIterator{contract: _Contract.contract, event: "PodSharesUpdated", logs: logs, sub: sub}, nil
}

func (_Contract *ContractFilterer) WatchPodSharesUpdated(opts *bind.WatchOpts, sink chan<- *ContractPodSharesUpdated, podOwner []common.Address) (event.Subscription, error) {

	var podOwnerRule []interface{}
	for _, podOwnerItem := range podOwner {
		podOwnerRule = append(podOwnerRule, podOwnerItem)
	}

	logs, sub, err := _Contract.contract.WatchLogs(opts, "PodSharesUpdated", podOwnerRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:

				event := new(ContractPodSharesUpdated)
				if err := _Contract.contract.UnpackLog(event, "PodSharesUpdated", log); err != nil {
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

func (_Contract *ContractFilterer) ParsePodSharesUpdated(log types.Log) (*ContractPodSharesUpdated, error) {
	event := new(ContractPodSharesUpdated)
	if err := _Contract.contract.UnpackLog(event, "PodSharesUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

func (_Contract *Contract) ParseLog(log types.Log) (generated.AbigenLog, error) {
	switch log.Topics[0] {
	case _Contract.abi.Events["BeaconChainETHDeposited"].ID:
		return _Contract.ParseBeaconChainETHDeposited(log)
	case _Contract.abi.Events["BeaconChainETHWithdrawalCompleted"].ID:
		return _Contract.ParseBeaconChainETHWithdrawalCompleted(log)
	case _Contract.abi.Events["BeaconOracleUpdated"].ID:
		return _Contract.ParseBeaconOracleUpdated(log)
	case _Contract.abi.Events["DenebForkTimestampUpdated"].ID:
		return _Contract.ParseDenebForkTimestampUpdated(log)
	case _Contract.abi.Events["Initialized"].ID:
		return _Contract.ParseInitialized(log)
	case _Contract.abi.Events["PodDeployed"].ID:
		return _Contract.ParsePodDeployed(log)
	case _Contract.abi.Events["PodSharesUpdated"].ID:
		return _Contract.ParsePodSharesUpdated(log)

	default:
		return nil, fmt.Errorf("abigen wrapper received unknown log topic: %v", log.Topics[0])
	}
}

func (ContractBeaconChainETHDeposited) Topic() common.Hash {
	return common.HexToHash("0x35a85cabc603f48abb2b71d9fbd8adea7c449d7f0be900ae7a2986ea369c3d0d")
}

func (ContractBeaconChainETHWithdrawalCompleted) Topic() common.Hash {
	return common.HexToHash("0xa6bab1d55a361fcea2eee2bc9491e4f01e6cf333df03c9c4f2c144466429f7d6")
}

func (ContractBeaconOracleUpdated) Topic() common.Hash {
	return common.HexToHash("0x08f0470754946ccfbb446ff7fd2d6ae6af1bbdae19f85794c0cc5ed5e8ceb4f6")
}

func (ContractDenebForkTimestampUpdated) Topic() common.Hash {
	return common.HexToHash("0x19200b6fdad58f91b2f496b0c444fc4be3eff74a7e24b07770e04a7137bfd9db")
}

func (ContractInitialized) Topic() common.Hash {
	return common.HexToHash("0xc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d2")
}

func (ContractPodDeployed) Topic() common.Hash {
	return common.HexToHash("0x21c99d0db02213c32fff5b05cf0a718ab5f858802b91498f80d82270289d856a")
}

func (ContractPodSharesUpdated) Topic() common.Hash {
	return common.HexToHash("0x4e2b791dedccd9fb30141b088cabf5c14a8912b52f59375c95c010700b8c6193")
}

func (_Contract *Contract) Address() common.Address {
	return _Contract.address
}

type ContractInterface interface {
	BeaconChainETHStrategy(opts *bind.CallOpts) (common.Address, error)

	BeaconChainOracle(opts *bind.CallOpts) (common.Address, error)

	DenebForkTimestamp(opts *bind.CallOpts) (uint64, error)

	EigenPodBeacon(opts *bind.CallOpts) (common.Address, error)

	EthPOS(opts *bind.CallOpts) (common.Address, error)

	GetBlockRootAtTimestamp(opts *bind.CallOpts, timestamp uint64) ([32]byte, error)

	GetPod(opts *bind.CallOpts, podOwner common.Address) (common.Address, error)

	HasPod(opts *bind.CallOpts, podOwner common.Address) (bool, error)

	MaxPods(opts *bind.CallOpts) (*big.Int, error)

	NumPods(opts *bind.CallOpts) (*big.Int, error)

	OwnerToPod(opts *bind.CallOpts, arg0 common.Address) (common.Address, error)

	PodOwnerShares(opts *bind.CallOpts, podOwner common.Address) (*big.Int, error)

	Slasher(opts *bind.CallOpts) (common.Address, error)

	StrategyManager(opts *bind.CallOpts) (common.Address, error)

	AddShares(opts *bind.TransactOpts, podOwner common.Address, shares *big.Int) (*types.Transaction, error)

	CreatePod(opts *bind.TransactOpts) (*types.Transaction, error)

	RecordBeaconChainETHBalanceUpdate(opts *bind.TransactOpts, podOwner common.Address, sharesDelta *big.Int) (*types.Transaction, error)

	RemoveShares(opts *bind.TransactOpts, podOwner common.Address, shares *big.Int) (*types.Transaction, error)

	SetDenebForkTimestamp(opts *bind.TransactOpts, newDenebForkTimestamp uint64) (*types.Transaction, error)

	Stake(opts *bind.TransactOpts, pubkey []byte, signature []byte, depositDataRoot [32]byte) (*types.Transaction, error)

	TestAddPod(opts *bind.TransactOpts, owner common.Address, pod common.Address) (*types.Transaction, error)

	UpdateBeaconChainOracle(opts *bind.TransactOpts, newBeaconChainOracle common.Address) (*types.Transaction, error)

	WithdrawSharesAsTokens(opts *bind.TransactOpts, podOwner common.Address, destination common.Address, shares *big.Int) (*types.Transaction, error)

	FilterBeaconChainETHDeposited(opts *bind.FilterOpts, podOwner []common.Address) (*ContractBeaconChainETHDepositedIterator, error)

	WatchBeaconChainETHDeposited(opts *bind.WatchOpts, sink chan<- *ContractBeaconChainETHDeposited, podOwner []common.Address) (event.Subscription, error)

	ParseBeaconChainETHDeposited(log types.Log) (*ContractBeaconChainETHDeposited, error)

	FilterBeaconChainETHWithdrawalCompleted(opts *bind.FilterOpts, podOwner []common.Address) (*ContractBeaconChainETHWithdrawalCompletedIterator, error)

	WatchBeaconChainETHWithdrawalCompleted(opts *bind.WatchOpts, sink chan<- *ContractBeaconChainETHWithdrawalCompleted, podOwner []common.Address) (event.Subscription, error)

	ParseBeaconChainETHWithdrawalCompleted(log types.Log) (*ContractBeaconChainETHWithdrawalCompleted, error)

	FilterBeaconOracleUpdated(opts *bind.FilterOpts, newOracleAddress []common.Address) (*ContractBeaconOracleUpdatedIterator, error)

	WatchBeaconOracleUpdated(opts *bind.WatchOpts, sink chan<- *ContractBeaconOracleUpdated, newOracleAddress []common.Address) (event.Subscription, error)

	ParseBeaconOracleUpdated(log types.Log) (*ContractBeaconOracleUpdated, error)

	FilterDenebForkTimestampUpdated(opts *bind.FilterOpts) (*ContractDenebForkTimestampUpdatedIterator, error)

	WatchDenebForkTimestampUpdated(opts *bind.WatchOpts, sink chan<- *ContractDenebForkTimestampUpdated) (event.Subscription, error)

	ParseDenebForkTimestampUpdated(log types.Log) (*ContractDenebForkTimestampUpdated, error)

	FilterInitialized(opts *bind.FilterOpts) (*ContractInitializedIterator, error)

	WatchInitialized(opts *bind.WatchOpts, sink chan<- *ContractInitialized) (event.Subscription, error)

	ParseInitialized(log types.Log) (*ContractInitialized, error)

	FilterPodDeployed(opts *bind.FilterOpts, eigenPod []common.Address, podOwner []common.Address) (*ContractPodDeployedIterator, error)

	WatchPodDeployed(opts *bind.WatchOpts, sink chan<- *ContractPodDeployed, eigenPod []common.Address, podOwner []common.Address) (event.Subscription, error)

	ParsePodDeployed(log types.Log) (*ContractPodDeployed, error)

	FilterPodSharesUpdated(opts *bind.FilterOpts, podOwner []common.Address) (*ContractPodSharesUpdatedIterator, error)

	WatchPodSharesUpdated(opts *bind.WatchOpts, sink chan<- *ContractPodSharesUpdated, podOwner []common.Address) (event.Subscription, error)

	ParsePodSharesUpdated(log types.Log) (*ContractPodSharesUpdated, error)

	ParseLog(log types.Log) (generated.AbigenLog, error)

	Address() common.Address
}
