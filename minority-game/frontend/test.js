async function checkGameConditions() {
    try {
        const gameInfo = await gameInstance.getGameInfo(1);
        const userAddress = await gameInstance.signer.getAddress();
        const commitData = gameInstance.getStoredCommit(1, userAddress);
        
        console.log("🎮 游戏状态检查:");
        console.log("- 游戏阶段:", getStageName(gameInfo.stage));
        console.log("- 当前时间:", new Date().toLocaleString());
        console.log("- 揭示结束时间:", gameInfo.revealEndTime.toLocaleString());
        console.log("- 揭示阶段是否已结束:", Date.now() > gameInfo.revealEndTime.getTime());
        console.log("- 游戏是否已结束:", gameInfo.finalized);
        
        console.log("🔍 提交数据检查:");
        console.log("- choice 是否有效 (1或2):", commitData.choice === 1 || commitData.choice === 2);
        console.log("- depositAmount:", commitData.depositAmount);
        console.log("- betAmount:", commitData.betAmount);
        
        // 检查存款金额是否在允许范围内
        const MIN_DEPOSIT_RATE = await gameInstance.contract.MIN_DEPOSIT_RATE();
        const MAX_DEPOSIT_RATE = await gameInstance.contract.MAX_DEPOSIT_RATE();
        console.log("- MIN_DEPOSIT_RATE:", Number(MIN_DEPOSIT_RATE));
        console.log("- MAX_DEPOSIT_RATE:", Number(MAX_DEPOSIT_RATE));
        
        const minDeposit = BigInt(commitData.betAmount) * BigInt(MIN_DEPOSIT_RATE) / 100n;
        const maxDeposit = BigInt(commitData.betAmount) * BigInt(MAX_DEPOSIT_RATE) / 100n;
        const actualDeposit = BigInt(commitData.depositAmount);
        
        console.log("- 最小允许存款:", minDeposit.toString());
        console.log("- 最大允许存款:", maxDeposit.toString());
        console.log("- 实际存款:", actualDeposit.toString());
        console.log("- 存款是否在范围内:", actualDeposit >= minDeposit && actualDeposit <= maxDeposit);
        
    } catch (error) {
        console.error("❌ 检查游戏条件失败:", error);
    }
}

async function checkGameConditions() {
    try {
        const gameInfo = await gameInstance.getGameInfo(1);
        const userAddress = await gameInstance.signer.getAddress();
        const commitData = gameInstance.getStoredCommit(1, userAddress);
        
        console.log("🎮 游戏状态检查:");
        console.log("- 游戏阶段:", getStageName(gameInfo.stage));
        console.log("- 当前时间:", new Date().toLocaleString());
        console.log("- 揭示结束时间:", gameInfo.revealEndTime.toLocaleString());
        console.log("- 揭示阶段是否已结束:", Date.now() > gameInfo.revealEndTime.getTime());
        console.log("- 游戏是否已结束:", gameInfo.finalized);
        
        console.log("🔍 提交数据检查:");
        console.log("- choice 是否有效 (1或2):", commitData.choice === 1 || commitData.choice === 2);
        console.log("- depositAmount:", commitData.depositAmount);
        console.log("- betAmount:", commitData.betAmount);
        
        // 检查存款金额是否在允许范围内
        const MIN_DEPOSIT_RATE = await gameInstance.contract.MIN_DEPOSIT_RATE();
        const MAX_DEPOSIT_RATE = await gameInstance.contract.MAX_DEPOSIT_RATE();
        console.log("- MIN_DEPOSIT_RATE:", Number(MIN_DEPOSIT_RATE));
        console.log("- MAX_DEPOSIT_RATE:", Number(MAX_DEPOSIT_RATE));
        
        const minDeposit = BigInt(commitData.betAmount) * BigInt(MIN_DEPOSIT_RATE) / 100n;
        const maxDeposit = BigInt(commitData.betAmount) * BigInt(MAX_DEPOSIT_RATE) / 100n;
        const actualDeposit = BigInt(commitData.depositAmount);
        
        console.log("- 最小允许存款:", minDeposit.toString());
        console.log("- 最大允许存款:", maxDeposit.toString());
        console.log("- 实际存款:", actualDeposit.toString());
        console.log("- 存款是否在范围内:", actualDeposit >= minDeposit && actualDeposit <= maxDeposit);
        
    } catch (error) {
        console.error("❌ 检查游戏条件失败:", error);
    }
}

await checkGameConditions();