// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

// WARNING: Add/exec waiting period is disabled for testing

// ====================================================================
// |     ______                   _______                             |
// |    / _____________ __  __   / ____(_____  ____ _____  ________   |
// |   / /_  / ___/ __ `| |/_/  / /_  / / __ \/ __ `/ __ \/ ___/ _ \  |
// |  / __/ / /  / /_/ _>  <   / __/ / / / / / /_/ / / / / /__/  __/  |
// | /_/   /_/   \__,_/_/|_|  /_/   /_/_/ /_/\__,_/_/ /_/\___/\___/   |
// |                                                                  |
// ====================================================================
// ============================ Fraxferry =============================
// ====================================================================
// Ferry that can be used to ship tokens between chains

// Frax Finance: https://github.com/FraxFinance

// Primary Author(s)
// Dennis: https://github.com/denett

/*
** Modus operandi:
** - User sends tokens to the contract. This transaction is stored in the contract.
** - Captain queries the source chain for transactions to ship.
** - Captain sends batch (start, end, hash) to start the trip,
** - Crewmembers check the batch and can dispute it if it is invalid.
** - Non disputed batches can be executed by the first officer by providing the transactions as calldata. 
** - Hash of the transactions must be equal to the hash in the batch. User receives their tokens on the other chain.
** - In case there was a fraudulent transaction (a hacker for example), the owner can cancel a single transaction, such that it will not be executed.
** - The owner can manually manage the tokens in the contract and must make sure it has enough funds.
**
** What must happen for a false batch to be executed:
** - Captain is tricked into proposing a batch with a false hash
** - All crewmembers bots are offline/censured/compromised and no one disputes the proposal
**
** Other risks:
** - Reorgs on the source chain. Avoided, by only returning the transactions on the source chain that are at least one hour old.
** - Rollbacks of optimistic rollups. Avoided by running a node.
** - Operators do not have enough time to pause the chain after a fake proposal. Avoided by requiring a minimal amount of time between sending the proposal and executing it.
*/
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "hardhat/console.sol";

contract MockFraxferry {
   IERC20 immutable public token;
   IERC20 immutable public targetToken;
   uint immutable public chainid;
   uint immutable public targetChain;   
   
   address public owner;
   address public nominatedOwner;
   address public captain;
   address public firstOfficer;
   mapping(address => bool) public crewmembers;
   mapping(address => bool) public fee_exempt_addrs;

   bool public paused;
   
   uint public MIN_WAIT_PERIOD_ADD=1;
   uint public MIN_WAIT_PERIOD_EXECUTE=1;
   uint public FEE_RATE=10;      // 0.1% fee
   uint public FEE_MIN=1e16;   // set fees to 0.01 eth
   uint public FEE_MAX=1e16; // (just like the real thing)
   
   uint constant MAX_FEE_RATE=100; // Max fee rate is 1%
   uint constant MAX_FEE_MIN=100e18; // Max minimum fee is 100 tokens
   uint constant MAX_FEE_MAX=1000e18; // Max fee is 1000 tokens
   
   uint constant public REDUCED_DECIMALS=1e10;
   
   Transaction[] public transactions;
   mapping(uint => bool) public cancelled;
   uint public executeIndex;
   Batch[] public batches;
   uint256 public batchCtr;
   
   struct Transaction {
      address user;
      uint64 amount;
      uint32 timestamp;
   }
   
   struct Batch {
      uint64 start;
      uint64 end;
      uint64 departureTime;
      uint64 status;
      bytes32 hash;
   }
   
   struct BatchData {
      uint startTransactionNo;
      Transaction[] transactions;
   }

   constructor(address _token) {
      //require (block.chainid==_chainid,"Wrong chain");
      token = IERC20(_token);
      targetToken = IERC20(_token);
   }
   
   
   // ############## Events ##############
   
   event Embark(address indexed sender, uint index, uint amount, uint amountAfterFee, uint timestamp);
   event Disembark(uint start, uint end, bytes32 hash); 

   // ############## Ferry actions ##############

   function embarkWithRecipient(uint amount, address recipient) public  {
      amount = (amount/REDUCED_DECIMALS)*REDUCED_DECIMALS; // Round amount to fit in data structure
      uint fee;
      if(fee_exempt_addrs[msg.sender]) fee = 0;
      else {
         fee = Math.min(Math.max(FEE_MIN,amount*FEE_RATE/10000),FEE_MAX);
      }
      require (amount>fee,"Amount too low");
      require (amount/REDUCED_DECIMALS<=type(uint64).max,"Amount too high");
      TransferHelper.safeTransferFrom(address(token),msg.sender,address(this),amount); 
      uint64 amountAfterFee = uint64((amount-fee)/REDUCED_DECIMALS);
      emit Embark(recipient,transactions.length,amount,amountAfterFee*REDUCED_DECIMALS,block.timestamp);
    //  transactions.push(Transaction(recipient,amountAfterFee,uint32(block.timestamp)));   
   }
   
   function embark(uint amount) public {
      embarkWithRecipient(amount, msg.sender) ;
   }

    function mockDisembark(address _to, uint256 _amount) external {
        TransferHelper.safeTransfer(address(token), _to, _amount);
        emit Disembark(batchCtr,batchCtr,bytes32(0));
        batchCtr++;
    }

}
