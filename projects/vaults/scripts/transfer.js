const { utils, providers, Wallet } = require('ethers')
const {
  EthBridger,
  getL2Network,
  EthDepositStatus,
  addDefaultLocalNetwork,
} = require('@arbitrum/sdk')
const { parseEther } = utils
const { arbLog, requireEnvVariables } = require('arb-shared-dependencies')
require('dotenv').config()
requireEnvVariables(['INCEPTION_PRIVKEY', 'L1RPC', 'L2RPC'])

/**
 * Set up: instantiate L1 / L2 wallets connected to providers
 */
const walletPrivateKey = process.env.INCEPTION_PRIVKEY

const l1Provider = new providers.JsonRpcProvider(process.env.L1RPC)
const l2Provider = new providers.JsonRpcProvider(process.env.L2RPC)

const l1Wallet = new Wallet(walletPrivateKey, l1Provider)
const l2Wallet = new Wallet(walletPrivateKey, l2Provider)

/**
 * Get the deposit amount from command-line arguments
 */

const valueToSend = process.argv[2];
if (valueToSend === null || valueToSend === NaN) {
  throw new Error('Value parameter is not provided or not a number!');
}
const ethToL2DepositAmount = parseEther(valueToSend)

const main = async () => {
  await arbLog('Deposit Eth via Arbitrum SDK')

  /**
   * Add the default local network configuration to the SDK
   * to allow this script to run on a local node
   */
  // addDefaultLocalNetwork()

  /**
   * Use l2Network to create an Arbitrum SDK EthBridger instance
   * We'll use EthBridger for its convenience methods around transferring ETH to L2
   */

  const l2Network = await getL2Network(l2Provider)
  const ethBridger = new EthBridger(l2Network)

  /**
   * Checks the l2Wallet initial ETH balance
   */
  const l2WalletInitialEthBalance = await l2Wallet.getBalance()

  const depositTx = await ethBridger.deposit({
    amount: ethToL2DepositAmount,
    l1Signer: l1Wallet,
    l2Provider: l2Provider,
  })

  const depositRec = await depositTx.wait()
  console.warn('deposit L1 receipt is:', depositRec.transactionHash)

  /**
   * With the transaction confirmed on L1, we now wait for the L2 side (i.e., balance credited to L2) to be confirmed as well.
   * Here we're waiting for the Sequencer to include the L2 message in its off-chain queue. The Sequencer should include it in under 10 minutes.
   */
  console.warn('Waiting for L2 side of the transaction to be executed ⏳')
  const l2Result = await depositRec.waitForL2(l2Provider)
  /**
   * The `complete` boolean tells us if the l1 to l2 message was successful
   */
  l2Result.complete
    ? console.log(
      `L2 message successful: status: ${EthDepositStatus[await l2Result.message.status()]
      }`
    )
    : console.log(
      `L2 message failed: status ${EthDepositStatus[await l2Result.message.status()]
      }`
    )

  /**
   * Our l2Wallet ETH balance should be updated now
   */
  const l2WalletUpdatedEthBalance = await l2Wallet.getBalance()
  console.log(
    `your L2 ETH balance is updated from ${l2WalletInitialEthBalance.toString()} to ${l2WalletUpdatedEthBalance.toString()}`
  )
}
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
