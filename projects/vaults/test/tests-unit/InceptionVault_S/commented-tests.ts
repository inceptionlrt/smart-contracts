// describe("Delegate auto according allocation", function () {
  //   describe("Set allocation", function () {
  //     before(async function () {
  //       await snapshot.restore();
  //       await mellowAdapter.addMellowVault(mellowVaults[1].vaultAddress, mellowVaults[1].wrapperAddress);
  //     });

  //     const args = [
  //       {
  //         name: "Set allocation for the 1st vault",
  //         vault: () => mellowVaults[0].vaultAddress,
  //         shares: randomBI(2),
  //       },
  //       {
  //         name: "Set allocation for another vault",
  //         vault: () => mellowVaults[1].vaultAddress,
  //         shares: randomBI(2),
  //       },
  //       {
  //         name: "Change allocation",
  //         vault: () => mellowVaults[1].vaultAddress,
  //         shares: randomBI(2),
  //       },
  //       {
  //         name: "Set allocation for address that is not in the list",
  //         vault: () => ethers.Wallet.createRandom().address,
  //         shares: randomBI(2),
  //       },
  //       {
  //         name: "Change allocation to 0",
  //         vault: () => mellowVaults[1].vaultAddress,
  //         shares: 0n,
  //       },
  //     ];

  //     args.forEach(function (arg) {
  //       it(`${arg.name}`, async function () {
  //         const vaultAddress = arg.vault();
  //         const totalAllocationBefore = await mellowAdapter.totalAllocations();
  //         const sharesBefore = await mellowAdapter.allocations(vaultAddress);
  //         console.log(`sharesBefore: ${sharesBefore.toString()}`);

  //         await expect(mellowAdapter.changeAllocation(vaultAddress, arg.shares))
  //           .to.be.emit(mellowAdapter, "AllocationChanged")
  //           .withArgs(vaultAddress, sharesBefore, arg.shares);

  //         const totalAllocationAfter = await mellowAdapter.totalAllocations();
  //         const sharesAfter = await mellowAdapter.allocations(vaultAddress);
  //         console.log("Total allocation after:", totalAllocationAfter.format());
  //         console.log("Adapter allocation after:", sharesAfter.format());

  //         expect(sharesAfter).to.be.eq(arg.shares);
  //         expect(totalAllocationAfter - totalAllocationBefore).to.be.eq(sharesAfter - sharesBefore);
  //       });
  //     });

  //     it("changeAllocation reverts when vault is 0 address", async function () {
  //       const shares = randomBI(2);
  //       const vaultAddress = ethers.ZeroAddress;
  //       await expect(mellowAdapter.changeAllocation(vaultAddress, shares)).to.be.revertedWithCustomError(
  //         mellowAdapter,
  //         "ZeroAddress",
  //       );
  //     });

  //     it("changeAllocation reverts when called by not an owner", async function () {
  //       const shares = randomBI(2);
  //       const vaultAddress = mellowVaults[1].vaultAddress;
  //       await expect(mellowAdapter.connect(staker).changeAllocation(vaultAddress, shares)).to.be.revertedWith(
  //         "Ownable: caller is not the owner",
  //       );
  //     });
  //   });

  //   describe("Delegate auto", function () {
  //     let totalDeposited;

  //     beforeEach(async function () {
  //       await snapshot.restore();
  //       await iVault.setTargetFlashCapacity(1n);
  //       totalDeposited = randomBI(19);
  //       await iVault.connect(staker).deposit(totalDeposited, staker.address);
  //     });

  //     //mellowVaults[0] added at deploy
  //     const args = [
  //       {
  //         name: "1 vault, no allocation",
  //         addVaults: [],
  //         allocations: [],
  //       },
  //       {
  //         name: "1 vault; allocation 100%",
  //         addVaults: [],
  //         allocations: [
  //           {
  //             vault: mellowVaults[0].vaultAddress,
  //             amount: 1n,
  //           },
  //         ],
  //       },
  //       {
  //         name: "1 vault; allocation 100% and 0% to unregistered",
  //         addVaults: [],
  //         allocations: [
  //           {
  //             vault: mellowVaults[0].vaultAddress,
  //             amount: 1n,
  //           },
  //           {
  //             vault: mellowVaults[1].vaultAddress,
  //             amount: 0n,
  //           },
  //         ],
  //       },
  //       {
  //         name: "1 vault; allocation 50% and 50% to unregistered",
  //         addVaults: [],
  //         allocations: [
  //           {
  //             vault: mellowVaults[0].vaultAddress,
  //             amount: 1n,
  //           },
  //           {
  //             vault: mellowVaults[1].vaultAddress,
  //             amount: 1n,
  //           },
  //         ],
  //       },
  //       {
  //         name: "2 vaults; allocations: 100%, 0%",
  //         addVaults: [mellowVaults[1]],
  //         allocations: [
  //           {
  //             vault: mellowVaults[0].vaultAddress,
  //             amount: 1n,
  //           },
  //           {
  //             vault: mellowVaults[1].vaultAddress,
  //             amount: 0n,
  //           },
  //         ],
  //       },
  //       {
  //         name: "2 vaults; allocations: 50%, 50%",
  //         addVaults: [mellowVaults[1]],
  //         allocations: [
  //           {
  //             vault: mellowVaults[0].vaultAddress,
  //             amount: 1n,
  //           },
  //           {
  //             vault: mellowVaults[1].vaultAddress,
  //             amount: 1n,
  //           },
  //         ],
  //       },
  //       {
  //         name: "3 vaults; allocations: 33%, 33%, 33%",
  //         addVaults: [mellowVaults[1], mellowVaults[2]],
  //         allocations: [
  //           {
  //             vault: mellowVaults[0].vaultAddress,
  //             amount: 1n,
  //           },
  //           {
  //             vault: mellowVaults[1].vaultAddress,
  //             amount: 1n,
  //           },
  //           {
  //             vault: mellowVaults[2].vaultAddress,
  //             amount: 1n,
  //           },
  //         ],
  //       },
  //     ];

  //     args.forEach(function (arg) {
  //       it(`Delegate auto when ${arg.name}`, async function () {
  //         //Add adapters
  //         const addedVaults = [mellowVaults[0].vaultAddress];
  //         for (const vault of arg.addVaults) {
  //           await mellowAdapter.addMellowVault(vault.vaultAddress, vault.wrapperAddress);
  //           addedVaults.push(vault.vaultAddress);
  //         }
  //         //Set allocations
  //         let totalAllocations = 0n;
  //         for (const allocation of arg.allocations) {
  //           await mellowAdapter.changeAllocation(allocation.vault, allocation.amount);
  //           totalAllocations += allocation.amount;
  //         }
  //         //Calculate expected delegated amounts
  //         const freeBalance = await iVault.getFreeBalance();
  //         expect(freeBalance).to.be.closeTo(totalDeposited, 1n);
  //         let expectedDelegated = 0n;
  //         const expectedDelegations = new Map();
  //         for (const allocation of arg.allocations) {
  //           let amount = 0n;
  //           if (addedVaults.includes(allocation.vault)) {
  //             amount += (freeBalance * allocation.amount) / totalAllocations;
  //           }
  //           expectedDelegations.set(allocation.vault, amount);
  //           expectedDelegated += amount;
  //         }

  //         await iVault.connect(iVaultOperator).delegateAuto(1296000);

  //         const totalDepositedAfter = await iVault.getTotalDeposited();
  //         const totalDelegatedAfter = await iVault.getTotalDelegated();
  //         const totalAssetsAfter = await iVault.totalAssets();
  //         console.log(`Total deposited after: ${totalDepositedAfter.format()}`);
  //         console.log(`Total delegated after: ${totalDelegatedAfter.format()}`);
  //         console.log(`Total assets after: ${totalAssetsAfter.format()}`);

  //         expect(totalDepositedAfter).to.be.closeTo(totalDeposited, transactErr * BigInt(addedVaults.length));
  //         expect(totalDelegatedAfter).to.be.closeTo(expectedDelegated, transactErr * BigInt(addedVaults.length));
  //         expect(totalAssetsAfter).to.be.closeTo(totalDeposited - expectedDelegated, transactErr);

  //         for (const allocation of arg.allocations) {
  //           expect(expectedDelegations.get(allocation.vault)).to.be.closeTo(
  //             await iVault.getDelegatedTo(allocation.vault),
  //             transactErr,
  //           );
  //         }
  //       });
  //     });

  //     it("delegateAuto reverts when called by not an owner", async function () {
  //       await mellowAdapter.changeAllocation(mellowVaults[0].vaultAddress, 1n);
  //       await expect(iVault.connect(staker).delegateAuto(1296000)).to.revertedWithCustomError(
  //         iVault,
  //         "OnlyOperatorAllowed",
  //       );
  //     });

  //     it("delegateAuto reverts when iVault is paused", async function () {
  //       await mellowAdapter.changeAllocation(mellowVaults[0].vaultAddress, 1n);
  //       await iVault.pause();
  //       await expect(iVault.connect(iVaultOperator).delegateAuto(1296000)).to.be.revertedWith("Pausable: paused");
  //     });

  //     it("delegateAuto reverts when mellowAdapter is paused", async function () {
  //       if (await iVault.paused()) {
  //         await iVault.unpause();
  //       }
  //       await mellowAdapter.changeAllocation(mellowVaults[0].vaultAddress, 1n);
  //       await mellowAdapter.pause();
  //       await expect(iVault.connect(iVaultOperator).delegateAuto(1296000)).to.be.revertedWith("Pausable: paused");
  //     });
  //   });
  // });


    /**
     * Forces execution of pending withdrawal,
     * if configurator.emergencyWithdrawalDelay() has passed since its creation
     * but not later than fulfill deadline.
     */
    // describe("undelegateForceFrom", function () {
    //   let delegated;
    //   let emergencyWithdrawalDelay;
    //   let mVault, configurator;
  
    //   before(async function () {
    //     await snapshot.restore();
    //     await iVault.setTargetFlashCapacity(1n);
    //     await iVault.connect(staker).deposit(10n * e18, staker.address);
    //     delegated = await iVault.getFreeBalance();
    //     await mellowAdapter.addMellowVault(mellowVaults[2].vaultAddress, mellowVaults[2].wrapperAddress);
    //     await iVault.connect(iVaultOperator).delegateToMellowVault(mellowVaults[2].vaultAddress, delegated, 1296000);
    //     console.log(`Delegated amount: \t${delegated.format()}`);
  
    //     mVault = await ethers.getContractAt("IMellowVault", mellowVaults[2].vaultAddress);
    //     configurator = await ethers.getContractAt("IMellowVaultConfigurator", mellowVaults[2].configuratorAddress);
    //     emergencyWithdrawalDelay = (await configurator.emergencyWithdrawalDelay()) / day;
    //   });
  
    //   it("undelegateForceFrom reverts when there is no pending withdraw request", async function () {
    //     await expect(
    //       iVault.connect(iVaultOperator).undelegateForceFrom(mellowVaults[2].vaultAddress, 1296000),
    //     ).to.be.revertedWithCustomError(mVault, "InvalidState");
    //   });
  
    //   it("set request deadline > emergencyWithdrawalDelay", async function () {
    //     const newDeadline = emergencyWithdrawalDelay + 10n; //~ 100d
    //     await mellowAdapter.setRequestDeadline(newDeadline);
    //     console.log("New request deadline in days:", (await mellowAdapter.requestDeadline()) / day);
    //     expect(await mellowAdapter.requestDeadline()).to.be.eq(newDeadline * day);
    //   });
  
    //   it("undelegateForceFrom reverts when it is less than emergencyWithdrawalDelay has passed since submission", async function () {
    //     await iVault.connect(iVaultOperator).undelegateFromMellow(mellowVaults[2].vaultAddress, delegated / 2n, 1296000);
    //     await helpers.time.increase((emergencyWithdrawalDelay - 1n) * day);
  
    //     await expect(
    //       iVault.connect(iVaultOperator).undelegateForceFrom(mellowVaults[2].vaultAddress, 1296000),
    //     ).to.be.revertedWithCustomError(mVault, "InvalidState");
    //   });
  
    //   it("undelegateForceFrom cancels expired request", async function () {
    //     await helpers.time.increase(12n * day); //Wait until request expired
  
    //     const tx = await iVault.connect(iVaultOperator).undelegateForceFrom(mellowVaults[2].vaultAddress, 1296000);
  
    //     await expect(tx).to.emit(mVault, "WithdrawalRequestCanceled").withArgs(mellowAdapter.address, anyValue);
    //     await expect(await mellowAdapter.getDeposited(mellowVaults[2].vaultAddress)).to.be.closeTo(
    //       delegated,
    //       transactErr,
    //     );
    //     await expect(await mellowAdapter.pendingWithdrawalAmount()).to.be.eq(0n);
    //   });
  
    //   it("undelegateForceFrom reverts if it can not provide min amount", async function () {
    //     await iVault.connect(iVaultOperator).undelegateFromMellow(mellowVaults[2].vaultAddress, e18, 1296000);
    //     await helpers.time.increase(emergencyWithdrawalDelay * day + 1n);
  
    //     await expect(
    //       iVault.connect(iVaultOperator).undelegateForceFrom(mellowVaults[2].vaultAddress, 1296000),
    //     ).to.be.revertedWithCustomError(mVault, "InsufficientAmount");
    //   });
  
    //   it("undelegateForceFrom reverts when called by not an operator", async function () {
    //     await expect(
    //       iVault.connect(staker).undelegateForceFrom(mellowVaults[2].vaultAddress, 1296000),
    //     ).to.be.revertedWithCustomError(iVault, "OnlyOperatorAllowed");
    //   });
  
    //   it("withdrawEmergencyMellow reverts when called by not a trustee", async function () {
    //     await expect(
    //       mellowAdapter.connect(staker).withdrawEmergencyMellow(mellowVaults[0].vaultAddress, 1296000),
    //     ).to.revertedWithCustomError(mellowAdapter, "NotVaultOrTrusteeManager");
    //   });
  
    //   it("undelegateForceFrom reverts when iVault is paused", async function () {
    //     await iVault.pause();
    //     await expect(
    //       iVault.connect(iVaultOperator).undelegateForceFrom(mellowVaults[2].vaultAddress, 1296000),
    //     ).to.be.revertedWith("Pausable: paused");
    //   });
  
    //   it("undelegateForceFrom reverts when mellowAdapter is paused", async function () {
    //     if (await iVault.paused()) {
    //       await iVault.unpause();
    //     }
  
    //     await mellowAdapter.pause();
    //     await expect(
    //       iVault.connect(iVaultOperator).undelegateForceFrom(mellowVaults[2].vaultAddress, 1296000),
    //     ).to.be.revertedWith("Pausable: paused");
    //   });
  
    //   it("undelegateForceFrom withdraws all from mellow vault when there is suitable request", async function () {
    //     if (await mellowAdapter.paused()) {
    //       await mellowAdapter.unpause();
    //     }
  
    //     const newSlippage = 3_000; //30%
    //     await mellowAdapter.setSlippages(newSlippage, newSlippage);
  
    //     //!!!_Test fails because slippage is too high
    //     await iVault.connect(iVaultOperator).undelegateForceFrom(mellowVaults[2].vaultAddress, 1296000);
  
    //     expect(await asset.balanceOf(mellowAdapter.address)).to.be.gte(0n);
    //     expect(await mellowAdapter.pendingWithdrawalAmount()).to.be.eq(0n);
    //   });
    // });

    