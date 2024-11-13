import assert from 'assert'
import { type DeployFunction } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'

const contractName = 'SampleApp'

const deploy: DeployFunction = async (hre) => {
    const { getNamedAccounts, deployments } = hre
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    assert(deployer, 'Missing named deployer account')

    console.log(`Network: ${hre.network.name}`)
    console.log(`Deployer: ${deployer}`)

    // Get the current gas price
    const gasPrice = await ethers.provider.getGasPrice()
    console.log(`Current gas price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`)

    const endpointV2Deployment = await hre.deployments.get('EndpointV2')
    const endpointAddress = endpointV2Deployment.address

    // Estimate the gas for the deployment
    const contractFactory = await ethers.getContractFactory(contractName)
    const deployTransaction = contractFactory.getDeployTransaction(endpointAddress, deployer)

    const estimatedGas = await ethers.provider.estimateGas(deployTransaction)
    const estimatedCostInEth = ethers.utils.formatEther(estimatedGas.mul(gasPrice))

    console.log(`Estimated gas for deployment: ${estimatedGas.toString()}`)
    console.log(`Estimated deployment cost at current gas price: ${estimatedCostInEth} ETH`)

    const { address } = await deploy(contractName, {
        from: deployer,
        args: [endpointAddress, deployer],
        log: true,
        skipIfAlreadyDeployed: false,
    })

    console.log(`Deployed contract: ${contractName}, network: ${hre.network.name}, address: ${address}`)
}

deploy.tags = ["sample"]

export default deploy
