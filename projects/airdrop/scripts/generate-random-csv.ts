import * as fs from "fs";

const HOW_MANY = 2500;
const FILENAME = "airdrop_config.csv";

//SUPER cool script to generate fake CSV test data for my update-balances.ts

function generateEthereumAddress(): string {
    return `0x${[...Array(40)]
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("")}`;
}

function generateTokenAmount(): number {
    return Math.floor(Math.random() * 10000) + 1;
}

function generateCSV() {
    const file = fs.createWriteStream(FILENAME);

    file.write("address,token_amount\n");

    for (let i = 0; i < HOW_MANY; i++) {
        const address = generateEthereumAddress();
        const amount = generateTokenAmount();
        file.write(`${address},${amount}\n`);
    }

    file.end();
}


generateCSV();
console.log(`CSV file with ${HOW_MANY} pairs generated as ${FILENAME}`);
