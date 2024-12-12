import { ethers } from "ethers";

async function calculateGasCostForNetworks() {
    // Gas units to convert
    const gasUnits = 303812n;

    // Gas prices for different networks (in gwei)
    // https://tokentool.bitbond.com/gas-price/optimism
    const gasPricesGwei = {
        base: 0.015455310,
        blast: 0.0062,
        arbitrum: 0.0840,
        optimism: 0.0010,
    };

    const ethToUsd = 3900; // current


    console.log(`Gas Units: ${gasUnits} units\n`);

    for (const [network, gasPriceGwei] of Object.entries(gasPricesGwei)) {
        const gasPriceWei = BigInt(Math.round(gasPriceGwei * 1e9)); // Convert gwei to wei
        const totalCostWei = gasUnits * gasPriceWei; // Total cost in wei
        const totalCostEth = ethers.formatEther(totalCostWei); // Convert wei to ETH

        // Convert ETH cost to USD
        const totalCostUsd = parseFloat(totalCostEth) * ethToUsd;

        console.log(`Network: ${network.toUpperCase()}`);
        console.log(`  Gas Price: ${gasPriceGwei} gwei`);
        console.log(`  Total Cost: ${totalCostEth} ETH`);
        console.log(`  Total Cost: $${totalCostUsd.toFixed(2)} USD\n`);
    }
}

calculateGasCostForNetworks().catch((error) => {
    console.error("Script failed:", (error as Error).message || "Unknown error");
    process.exit(1);
});
