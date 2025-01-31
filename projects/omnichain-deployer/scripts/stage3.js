const { ethers, upgrades } = require("hardhat");
const fs = require('node:fs/promises');



const loadState = async () => {
    const data = await fs.readFile('state.json', { encoding: 'utf8' });
    const obj = JSON.parse(data);
    return obj;
}

const saveState = async (state) => {
    const data = JSON.stringify(state);
    await fs.writeFile('state.json', data, { encoding: 'utf8' });
}
const setLZpeer = async (adapterL1, adapterL2) => {
    let contract = await ethers.getContractAt("LZCrossChainAdapterL1", adapterL1);
    await contract.setPeer(eidL1,"0x000000000000000000000000" + adapterL2.substring(2));
}

const main = async () => {
  // Stage 3: this configures L1 contracts with now known L2 addresses
    let obj = await loadState();
    await setLZpeer(obj.crossChainL1, obj.crossChainL2);
    await saveState(obj);

}

main().then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});