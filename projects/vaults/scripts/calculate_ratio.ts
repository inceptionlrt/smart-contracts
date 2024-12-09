async function main2() {
    /* 
    As provided by Danil:
    total supply = shares supply + l2_supply (last deposit)
    total locked = pending balance + total staked + iov balance + nativeRebalancer balance
    ratio = total supply / total locked
    */

    const sharesSupply = 989996773856684800485n - 9699999996n; // value extracted from genesis-staking-service logs

    const cTokenTotalSupply = 989996773846984800489n;

    const l2Supply = 0n; // currently L2 is synced with L1, means there is no "last deposit" unaccounted
    const pendingBalance = 985215216742071116729n; // value extracted from RestakingPool.getPending() - 0xEAA6d9f33c7095218Ed9cD4f0D7FB6551A14005f
    const totalStaked = 32000000000000000000n; // value extracted from genesis-staking-service logs
    const iovBalance = 33313378n; // value extracted from InceptionOmniVault.FLASHCAPACITY() (NB!) at address 0x55ec970B8629E01d26BAA7b5d092DD26784136bb
    const nativeRebalancerBalance = 0n; // value extracted from NativeRebalancer at address 0xd13469584C26c329D56176b243f0507f84Fb778A

    const totalSupply = sharesSupply + l2Supply;
    console.log(`totalSupply: ${totalSupply}`);

    const totalLocked = pendingBalance + totalStaked + iovBalance + nativeRebalancerBalance;
    console.log(`totalLocked: ${totalLocked}`);

    const precision = 10n ** 18n;
    const ratio = (totalSupply * precision) / totalLocked;

    console.log(`ratio (uint256 format): ${ratio.toString()}`);
}

main2().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
