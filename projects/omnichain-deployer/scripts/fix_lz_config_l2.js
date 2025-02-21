const { ethers } = require('hardhat');


// Send the transaction
async function sendTransaction() {
    try {
        // Addresses
        const oappAddress = '0x7EEd6897D9F032AbccffD2f6AAFCfb59b24BD58E'; // Replace with your OApp address
        const sendLibAddress = '0x377530cdA84DFb2673bF4d145DCF0C4D7fdcB5b6'; // Replace with your send message library address

        // Configuration
        const remoteEid = 30101; // Example EID, replace with the actual value
        const ulnConfig = {
            confirmations: 20, // Example value, replace with actual
            requiredDVNCount: 2, // Example value, replace with actual
            optionalDVNCount: 0, // Example value, replace with actual
            optionalDVNThreshold: 0, // Example value, replace with actual
            requiredDVNs: ['0xa7b5189bca84cd304d8553977c7c614329750d99', '0xcce466a522984415bc91338c232d98869193d46e'], // Replace with actual addresses, must be in alphabetical order
            optionalDVNs: [], // Replace with actual addresses, must be in alphabetical order
        };
        /*
        const executorConfig = {
          maxMessageSize: 10000, // Example value, replace with actual
          executorAddress: '0xExecutorAddress', // Replace with the actual executor address
        };
        */
        // Provider and Signer
        //const provider = new ethers.providers.JsonRpcProvider(YOUR_RPC_URL);
        const [signer] = await ethers.getSigners();

        // ABI and Contract
        const endpointAbi = [
            'function setConfig(address oappAddress, address sendLibAddress, tuple(uint32 eid, uint32 configType, bytes config)[] setConfigParams) external',
        ];
        const endpointContract = new ethers.Contract("0x1a44076050125825900e736c501f859c50fE728c", endpointAbi, signer);

        // Encode UlnConfig using defaultAbiCoder
        const configTypeUlnStruct =
            'tuple(uint64 confirmations, uint8 requiredDVNCount, uint8 optionalDVNCount, uint8 optionalDVNThreshold, address[] requiredDVNs, address[] optionalDVNs)';
        const encodedUlnConfig = ethers.AbiCoder.defaultAbiCoder().encode([configTypeUlnStruct], [ulnConfig]);

        // Encode ExecutorConfig using defaultAbiCoder
        /*
        const configTypeExecutorStruct = 'tuple(uint32 maxMessageSize, address executorAddress)';
        const encodedExecutorConfig = ethers.utils.defaultAbiCoder.encode(
          [configTypeExecutorStruct],
          [executorConfig],
        );
        */
        // Define the SetConfigParam structs
        const setConfigParamUln = {
            eid: remoteEid,
            configType: 2, // ULN_CONFIG_TYPE
            config: encodedUlnConfig,
        };
        /*
        const setConfigParamExecutor = {
          eid: remoteEid,
          configType: 1, // EXECUTOR_CONFIG_TYPE
          config: encodedExecutorConfig,
        };
        */







        const tx = await endpointContract.setConfig(
            oappAddress,
            sendLibAddress,
            [setConfigParamUln] //, setConfigParamExecutor], // Array of SetConfigParam structs
        );

        console.log('Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt.status);
    } catch (error) {
        console.error('Transaction failed:', error);
    }
}

sendTransaction();