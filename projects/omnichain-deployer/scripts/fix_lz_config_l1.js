const { ethers } = require('hardhat');


// Send the transaction
async function sendTransaction() {
    try {
        // Addresses
        const oappAddress = '0x53207e057E8cc72312F6981a889FC286fAFa59Dc'; // Replace with your OApp address
        const recvLibAddress = '0xc02Ab410f0734EFa3F14628780e6e695156024C2'; // Replace with your send message library address

        // Configuration
        const remoteEid = 30255; // Example EID, replace with the actual value
        const ulnConfig = {
            confirmations: 20, // Example value, replace with actual
            requiredDVNCount: 2, // Example value, replace with actual
            optionalDVNCount: 0, // Example value, replace with actual
            optionalDVNThreshold: 0, // Example value, replace with actual
            requiredDVNs: ['0x589dedbd617e0cbcb916a9223f4d1300c294236b', '0xa59ba433ac34d2927232918ef5b2eaafcf130ba5'], // Replace with actual addresses, must be in alphabetical order
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
            recvLibAddress,
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