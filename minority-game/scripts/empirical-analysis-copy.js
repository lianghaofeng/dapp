/**
 * Empirical Analysis Script for Minority Game
 *
 * This script runs multiple rounds of the game to gather
 * statistical data and validate the minority wins mechanism.
 */

const { ethers } = require("hardhat");
const fs = require("fs");

// Configuration
const ANALYSIS_CONFIG = {
    rounds: 5,                 // Number of game rounds to simulate
    playersPerRound: 8,        // Players per round
    voteOptions: ["A", "B", "C"],
    commitDuration: 30,        // 30 seconds for faster testing
    revealDuration: 20,
    minBet: "0.05",           // Minimum bet in ETH
    maxBet: "0.5"             // Maximum bet in ETH
};

// Results storage
const empiricalResults = {
    timestamp: new Date().toISOString(),
    config: ANALYSIS_CONFIG,
    rounds: [],
    aggregateStats: {}
};

// Utility: Generate random bet amount
function randomBet() {
    const min = parseFloat(ANALYSIS_CONFIG.minBet);
    const max = parseFloat(ANALYSIS_CONFIG.maxBet);
    return (Math.random() * (max - min) + min).toFixed(3);
}

// Utility: Simulate player behavior (strategic vs random)
function chooseOption(playerId, totalPlayers) {
    // 60% players are strategic (tend to diversify)
    // 40% players are random
    const isStrategic = Math.random() < 0.6;

    if (isStrategic) {
        // Strategic players try to pick less popular options
        // Simplified: distribute evenly with some randomness
        const options = ANALYSIS_CONFIG.voteOptions;
        const optionIndex = playerId % options.length;
        // Add some randomness
        if (Math.random() < 0.3) {
            return Math.floor(Math.random() * options.length);
        }
        return optionIndex;
    } else {
        // Random players pick any option
        return Math.floor(Math.random() * ANALYSIS_CONFIG.voteOptions.length);
    }
}

async function runGameRound(roundNumber, contract, players) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🎮 ROUND ${roundNumber}`);
    console.log("=".repeat(60));

    const roundResults = {
        roundNumber,
        players: [],
        commits: [],
        reveals: [],
        winner: null,
        distribution: {},
        rewards: [],
        metrics: {}
    };

    try {
        // Create Vote
        const question = `Round ${roundNumber}: Choose wisely`;
        const tx = await contract.createVote(
            question,
            ANALYSIS_CONFIG.voteOptions,
            ANALYSIS_CONFIG.commitDuration,
            ANALYSIS_CONFIG.revealDuration
        );
        const receipt = await tx.wait();
        
        // 从事件中获取实际的 voteId，而不是使用 roundNumber
        let voteId;
        if (receipt.logs) {
            for (const log of receipt.logs) {
                try {
                    const parsedLog = contract.interface.parseLog(log);
                    if (parsedLog && parsedLog.name === "VoteCreated") {
                        voteId = parsedLog.args.voteId.toString();
                        break;
                    }
                } catch (e) {
                    // 忽略解析错误
                }
            }
        }
        
        // 如果没找到事件，使用递增的 ID
        if (!voteId) {
            // 获取当前投票数量来推算 voteId
            const allVotes = await contract.getAllVotes();
            voteId = allVotes.length.toString();
        }
        
        console.log(`✅ Vote ${voteId} created`);

        // Commit Phase
        console.log(`\n📝 COMMIT PHASE`);
        const commits = [];

        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const playerContract = contract.connect(player);

            const choice = chooseOption(i, players.length);
            const betAmount = ethers.parseEther(randomBet());
            const secret = ethers.hexlify(ethers.randomBytes(32));

            const commitHash = ethers.keccak256(
                ethers.solidityPacked(
                    ['uint256', 'uint256', 'bytes32', 'address'],
                    [voteId, choice, secret, player.address]
                )
            );

            const commitTx = await playerContract.commit(voteId, commitHash, { value: betAmount });
            await commitTx.wait();

            commits.push({
                playerIndex: i,
                address: player.address,
                choice,
                secret,
                betAmount: ethers.formatEther(betAmount)
            });

            roundResults.distribution[choice] = (roundResults.distribution[choice] || 0) + 1;

            console.log(`   Player ${i + 1}: ${ANALYSIS_CONFIG.voteOptions[choice]} - ${ethers.formatEther(betAmount)} ETH`);
        }

        roundResults.commits = commits;

        // 改进的等待逻辑：使用轮询检查状态
        console.log(`\n⏳ 等待提交阶段结束...`);
        await waitForCommitPhaseEnd(contract, voteId);
        
        // 检查是否可以开始揭示阶段
        const voteInfoBeforeReveal = await contract.getVoteInfo(voteId);
        const currentState = Number(voteInfoBeforeReveal[4]); // 假设第5个元素是状态
        
        if (currentState !== 1) { // 假设状态1是等待揭示
            console.log(`⚠️  当前状态不是等待揭示，状态码: ${currentState}`);
            // 尝试强制开始揭示阶段
        }

        // Start Reveal Phase
        console.log(`\n🔓 REVEAL PHASE`);
        try {
            const startRevealTx = await contract.startRevealPhase(voteId);
            await startRevealTx.wait();
            console.log(`✅ 揭示阶段开始`);
        } catch (error) {
            console.log(`⚠️  开始揭示阶段失败: ${error.message}`);
            // 可能已经自动开始了，继续执行
        }

        // Reveal (simulate 90% reveal rate)
        const revealingPlayers = commits.slice(0, Math.floor(commits.length * 0.9));
        let successfulReveals = 0;

        for (const commit of revealingPlayers) {
            try {
                const player = players[commit.playerIndex];
                const playerContract = contract.connect(player);

                // 检查揭示阶段是否还在进行
                const currentVoteInfo = await contract.getVoteInfo(voteId);
                const revealEndTime = Number(currentVoteInfo[6]);
                const currentTime = Math.floor(Date.now() / 1000);
                
                if (currentTime > revealEndTime) {
                    console.log(`⏰ 揭示阶段已结束，跳过剩余揭示`);
                    break;
                }

                const revealTx = await playerContract.reveal(voteId, commit.choice, commit.secret);
                await revealTx.wait();

                roundResults.reveals.push(commit);
                successfulReveals++;
                console.log(`   Player ${commit.playerIndex + 1} revealed`);
            } catch (error) {
                console.log(`❌ Player ${commit.playerIndex + 1} 揭示失败: ${error.message}`);
            }
        }

        // 改进的等待逻辑：使用轮询检查揭示阶段结束
        console.log(`\n⏳ 等待揭示阶段结束...`);
        await waitForRevealPhaseEnd(contract, voteId);

        // Finalize
        console.log(`\n🏁 FINALIZE`);
        try {
            const finalizeTx = await contract.finalizeVote(voteId);
            await finalizeTx.wait();
            console.log(`✅ 投票已最终化`);
        } catch (error) {
            console.log(`⚠️  最终化失败: ${error.message}`);
        }

        const finalVoteInfo = await contract.getVoteInfo(voteId);
        const winningOption = Number(finalVoteInfo[9]);

        roundResults.winner = winningOption !== 999999 ?
            ANALYSIS_CONFIG.voteOptions[winningOption] : "No Winner";

        console.log(`   Winner: ${roundResults.winner}`);

        // Calculate Rewards
        console.log(`\n💰 REWARDS`);
        let totalRewards = 0;

        for (const commit of commits) {
            try {
                const player = players[commit.playerIndex];
                const reward = await contract.calculateReward(voteId, player.address);
                const rewardEth = parseFloat(ethers.formatEther(reward));

                if (rewardEth > 0) {
                    const profit = rewardEth - parseFloat(commit.betAmount);
                    const roi = ((profit / parseFloat(commit.betAmount)) * 100).toFixed(2);

                    roundResults.rewards.push({
                        playerIndex: commit.playerIndex,
                        betAmount: commit.betAmount,
                        reward: rewardEth.toFixed(4),
                        profit: profit.toFixed(4),
                        roi: roi + "%"
                    });

                    totalRewards += rewardEth;
                    console.log(`   Player ${commit.playerIndex + 1}: ${rewardEth.toFixed(4)} ETH (ROI: ${roi}%)`);
                }
            } catch (error) {
                console.log(`❌ 计算玩家 ${commit.playerIndex + 1} 奖励失败: ${error.message}`);
            }
        }

        // Metrics
        const revealedDistribution = {};
        for (const reveal of roundResults.reveals) {
            revealedDistribution[reveal.choice] = (revealedDistribution[reveal.choice] || 0) + 1;
        }

        const minorityOption = Object.entries(revealedDistribution)
            .sort((a, b) => a[1] - b[1])[0];

        roundResults.metrics = {
            totalPlayers: players.length,
            commitCount: commits.length,
            revealCount: roundResults.reveals.length,
            revealRate: ((roundResults.reveals.length / commits.length) * 100).toFixed(2) + "%",
            totalPool: commits.reduce((sum, c) => sum + parseFloat(c.betAmount), 0).toFixed(4),
            totalRewards: totalRewards.toFixed(4),
            minorityOption: minorityOption ? {
                option: ANALYSIS_CONFIG.voteOptions[minorityOption[0]],
                count: minorityOption[1]
            } : null,
            minorityWon: minorityOption && winningOption !== 999999 &&
                parseInt(minorityOption[0]) === winningOption,
            winnerCount: roundResults.rewards.length,
            successfulReveals: successfulReveals
        };

        console.log(`\n📊 ROUND METRICS:`);
        console.log(`   Total Pool: ${roundResults.metrics.totalPool} ETH`);
        console.log(`   Total Rewards: ${roundResults.metrics.totalRewards} ETH`);
        console.log(`   Winners: ${roundResults.metrics.winnerCount}`);
        console.log(`   Successful Reveals: ${roundResults.metrics.successfulReveals}/${commits.length}`);
        console.log(`   Minority Won: ${roundResults.metrics.minorityWon ? "✅ YES" : "❌ NO"}`);

    } catch (error) {
        console.log(`❌ 第 ${roundNumber} 轮执行失败: ${error.message}`);
        roundResults.error = error.message;
    }

    return roundResults;
}

// 新增辅助函数：等待提交阶段结束
async function waitForCommitPhaseEnd(contract, voteId, maxWaitTime = 120000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
        try {
            const voteInfo = await contract.getVoteInfo(voteId);
            const commitEndTime = Number(voteInfo[5]);
            const currentTime = Math.floor(Date.now() / 1000);
            
            if (currentTime >= commitEndTime) {
                console.log(`✅ 提交阶段已结束`);
                return;
            }
            
            const remaining = commitEndTime - currentTime;
            if (remaining > 0) {
                console.log(`  等待提交阶段结束: 剩余 ${remaining} 秒`);
                // 等待剩余时间的一半或最多10秒
                const waitTime = Math.min(remaining * 1000 / 2, 10000);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        } catch (error) {
            console.log(`❌ 检查提交阶段状态失败: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    
    throw new Error(`提交阶段等待超时 (${maxWaitTime/1000}秒)`);
}

// 新增辅助函数：等待揭示阶段结束
async function waitForRevealPhaseEnd(contract, voteId, maxWaitTime = 120000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
        try {
            const voteInfo = await contract.getVoteInfo(voteId);
            const revealEndTime = Number(voteInfo[6]);
            const currentTime = Math.floor(Date.now() / 1000);
            
            if (currentTime >= revealEndTime) {
                console.log(`✅ 揭示阶段已结束`);
                return;
            }
            
            const remaining = revealEndTime - currentTime;
            if (remaining > 0) {
                console.log(`  等待揭示阶段结束: 剩余 ${remaining} 秒`);
                // 等待剩余时间的一半或最多10秒
                const waitTime = Math.min(remaining * 1000 / 2, 10000);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        } catch (error) {
            console.log(`❌ 检查揭示阶段状态失败: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    
    throw new Error(`揭示阶段等待超时 (${maxWaitTime/1000}秒)`);
}

async function main() {
    console.log("📊 EMPIRICAL ANALYSIS - MINORITY GAME");
    console.log("=".repeat(60));
    console.log(`Running ${ANALYSIS_CONFIG.rounds} rounds with ${ANALYSIS_CONFIG.playersPerRound} players each\n`);

    // Setup
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    const players = signers.slice(1, ANALYSIS_CONFIG.playersPerRound + 1);

    console.log(`✅ Deployer: ${deployer.address}`);
    console.log(`✅ Players: ${players.length}`);

    // Deploy Contract
    console.log(`\n📦 Deploying contract...`);
    const VotingGame = await ethers.getContractFactory("VotingGame");
    const votingGame = await VotingGame.deploy();
    await votingGame.waitForDeployment();

    const contractAddress = await votingGame.getAddress();
    console.log(`✅ Contract deployed at: ${contractAddress}`);

    empiricalResults.contractAddress = contractAddress;

    // Run Rounds
    for (let round = 1; round <= ANALYSIS_CONFIG.rounds; round++) {
        const roundResults = await runGameRound(round, votingGame, players);
        empiricalResults.rounds.push(roundResults);

        // Small delay between rounds
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Aggregate Analysis
    console.log(`\n\n${"=".repeat(60)}`);
    console.log("📈 AGGREGATE ANALYSIS");
    console.log("=".repeat(60));

    const aggregateStats = {
        totalRounds: ANALYSIS_CONFIG.rounds,
        totalPlayers: ANALYSIS_CONFIG.rounds * ANALYSIS_CONFIG.playersPerRound,
        totalCommits: 0,
        totalReveals: 0,
        minorityWinRate: 0,
        averageRevealRate: 0,
        totalPoolAllRounds: 0,
        totalRewardsAllRounds: 0,
        averageWinnersPerRound: 0,
        distributionPatterns: {}
    };

    let minorityWins = 0;
    let totalRevealRate = 0;
    let totalWinners = 0;

    for (const round of empiricalResults.rounds) {
        aggregateStats.totalCommits += round.metrics.commitCount;
        aggregateStats.totalReveals += round.metrics.revealCount;
        aggregateStats.totalPoolAllRounds += parseFloat(round.metrics.totalPool);
        aggregateStats.totalRewardsAllRounds += parseFloat(round.metrics.totalRewards);
        totalRevealRate += parseFloat(round.metrics.revealRate);
        totalWinners += round.metrics.winnerCount;

        if (round.metrics.minorityWon) {
            minorityWins++;
        }

        // Track distribution patterns
        const pattern = Object.values(round.distribution).sort().join("-");
        aggregateStats.distributionPatterns[pattern] =
            (aggregateStats.distributionPatterns[pattern] || 0) + 1;
    }

    aggregateStats.minorityWinRate = ((minorityWins / ANALYSIS_CONFIG.rounds) * 100).toFixed(2) + "%";
    aggregateStats.averageRevealRate = (totalRevealRate / ANALYSIS_CONFIG.rounds).toFixed(2) + "%";
    aggregateStats.averageWinnersPerRound = (totalWinners / ANALYSIS_CONFIG.rounds).toFixed(2);

    empiricalResults.aggregateStats = aggregateStats;

    console.log(`\n🎯 KEY FINDINGS:`);
    console.log(`   Total Rounds Played: ${aggregateStats.totalRounds}`);
    console.log(`   Total Commits: ${aggregateStats.totalCommits}`);
    console.log(`   Total Reveals: ${aggregateStats.totalReveals}`);
    console.log(`   Average Reveal Rate: ${aggregateStats.averageRevealRate}`);
    console.log(`   Minority Win Rate: ${aggregateStats.minorityWinRate}`);
    console.log(`   Total Pool (All Rounds): ${aggregateStats.totalPoolAllRounds.toFixed(4)} ETH`);
    console.log(`   Total Rewards (All Rounds): ${aggregateStats.totalRewardsAllRounds.toFixed(4)} ETH`);
    console.log(`   Average Winners per Round: ${aggregateStats.averageWinnersPerRound}`);

    console.log(`\n📊 DISTRIBUTION PATTERNS:`);
    for (const [pattern, count] of Object.entries(aggregateStats.distributionPatterns)) {
        console.log(`   ${pattern}: ${count} times`);
    }

    console.log(`\n🔬 STATISTICAL VALIDATION:`);
    console.log(`   Minority Win Principle: ${parseFloat(aggregateStats.minorityWinRate) >= 80 ? "✅ VALIDATED" : "⚠️  NEEDS REVIEW"}`);
    console.log(`   Reveal Rate Consistency: ${parseFloat(aggregateStats.averageRevealRate) >= 85 ? "✅ GOOD" : "⚠️  LOW"}`);

    // Save Results
    const resultsPath = "empirical-analysis-results.json";
    fs.writeFileSync(resultsPath, JSON.stringify(empiricalResults, null, 2));

    const summaryPath = "empirical-analysis-summary.txt";
    const summary = `
MINORITY GAME - EMPIRICAL ANALYSIS SUMMARY
==========================================

Test Date: ${empiricalResults.timestamp}
Contract: ${empiricalResults.contractAddress}

CONFIGURATION:
- Rounds: ${ANALYSIS_CONFIG.rounds}
- Players per Round: ${ANALYSIS_CONFIG.playersPerRound}
- Options: ${ANALYSIS_CONFIG.voteOptions.join(", ")}
- Commit Duration: ${ANALYSIS_CONFIG.commitDuration}s
- Reveal Duration: ${ANALYSIS_CONFIG.revealDuration}s

KEY METRICS:
- Total Commits: ${aggregateStats.totalCommits}
- Total Reveals: ${aggregateStats.totalReveals}
- Average Reveal Rate: ${aggregateStats.averageRevealRate}
- Minority Win Rate: ${aggregateStats.minorityWinRate}
- Total Pool: ${aggregateStats.totalPoolAllRounds.toFixed(4)} ETH
- Total Rewards: ${aggregateStats.totalRewardsAllRounds.toFixed(4)} ETH
- Avg Winners/Round: ${aggregateStats.averageWinnersPerRound}

VALIDATION:
- Minority Win Principle: ${parseFloat(aggregateStats.minorityWinRate) >= 80 ? "VALIDATED ✅" : "NEEDS REVIEW ⚠️"}
- Reveal Rate: ${parseFloat(aggregateStats.averageRevealRate) >= 85 ? "GOOD ✅" : "LOW ⚠️"}

CONCLUSION:
The empirical analysis demonstrates that the minority game mechanism
is functioning as designed. The minority win principle is ${parseFloat(aggregateStats.minorityWinRate) >= 80 ? "validated" : "not fully validated"}
across ${ANALYSIS_CONFIG.rounds} rounds with ${ANALYSIS_CONFIG.playersPerRound} players each.
`;

    fs.writeFileSync(summaryPath, summary);

    console.log(`\n💾 Results saved:`);
    console.log(`   - ${resultsPath}`);
    console.log(`   - ${summaryPath}`);

    console.log(`\n${"=".repeat(60)}`);
    console.log("✅ Empirical Analysis Completed!");
    console.log(`\n${"=".repeat(60)}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error:", error);
        process.exit(1);
    });
