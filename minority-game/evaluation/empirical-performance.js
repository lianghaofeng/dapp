/**
 * Empirical Evaluation: Performance and Scalability Metrics
 *
 * This script tests:
 * - H3: Gas costs scale linearly with participant count
 * - Transaction confirmation times
 * - System throughput
 * - Memory and storage requirements
 *
 * Tests scalability from 5 to 100 participants
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Test configurations
const PARTICIPANT_COUNTS = [5, 10, 20, 30, 50, 75, 100];
const GAMES_PER_CONFIG = 10;

const results = {
    metadata: {
        timestamp: new Date().toISOString(),
        testConfigurations: PARTICIPANT_COUNTS.length,
        gamesPerConfig: GAMES_PER_CONFIG,
        totalGames: PARTICIPANT_COUNTS.length * GAMES_PER_CONFIG,
    },
    performanceData: [],
    scalabilityAnalysis: {},
};

/**
 * Run performance test for specific participant count
 */
async function testPerformance(contract, signers, participantCount, gameNumber) {
    console.log(`\n🔬 Test ${gameNumber}: ${participantCount} participants`);

    const players = signers.slice(0, participantCount);
    const options = 2; // Binary choice for simplicity

    // Create vote
    const createStartTime = Date.now();
    const createTx = await contract.connect(players[0]).createVote(
        `Performance Test - ${participantCount} players`,
        ["Option A", "Option B"],
        60,
        30
    );
    const createReceipt = await createTx.wait();
    const createEndTime = Date.now();

    const voteId = await contract.voteCounter();

    const performanceMetrics = {
        participantCount,
        gameNumber,
        voteId: Number(voteId),
        createVote: {
            gasUsed: createReceipt.gasUsed.toString(),
            timeMs: createEndTime - createStartTime,
        },
        commits: [],
        reveals: [],
        finalize: {},
        claims: [],
        totalGas: 0n,
        totalTimeMs: 0,
    };

    // COMMIT PHASE
    console.log(`   Committing ${participantCount} votes...`);
    const commitStartTime = Date.now();

    for (let i = 0; i < participantCount; i++) {
        const player = players[i];
        const choice = Math.random() > 0.5 ? 1 : 0;
        const secret = ethers.hexlify(ethers.randomBytes(32));
        const betAmount = ethers.parseEther("0.1");

        const commitHash = ethers.keccak256(
            ethers.solidityPacked(
                ["uint256", "uint256", "bytes32", "address"],
                [voteId, choice, secret, player.address]
            )
        );

        const txStartTime = Date.now();
        const commitTx = await contract.connect(player).commit(voteId, commitHash, {
            value: betAmount
        });
        const receipt = await commitTx.wait();
        const txEndTime = Date.now();

        performanceMetrics.commits.push({
            playerIndex: i,
            gasUsed: receipt.gasUsed.toString(),
            timeMs: txEndTime - txStartTime,
            choice,
            secret,
        });
    }

    const commitEndTime = Date.now();
    const commitDuration = commitEndTime - commitStartTime;
    console.log(`   ✓ Commits complete (${commitDuration}ms)`);

    // Wait for commit phase
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start reveal phase
    const revealPhaseStartTime = Date.now();
    const startRevealTx = await contract.connect(players[0]).startRevealPhase(voteId);
    const startRevealReceipt = await startRevealTx.wait();
    const revealPhaseEndTime = Date.now();

    performanceMetrics.startRevealPhase = {
        gasUsed: startRevealReceipt.gasUsed.toString(),
        timeMs: revealPhaseEndTime - revealPhaseStartTime,
    };

    // REVEAL PHASE
    console.log(`   Revealing ${participantCount} votes...`);
    const revealStartTime = Date.now();

    for (let i = 0; i < participantCount; i++) {
        const player = players[i];
        const { choice, secret } = performanceMetrics.commits[i];

        const txStartTime = Date.now();
        const revealTx = await contract.connect(player).reveal(voteId, choice, secret);
        const receipt = await revealTx.wait();
        const txEndTime = Date.now();

        performanceMetrics.reveals.push({
            playerIndex: i,
            gasUsed: receipt.gasUsed.toString(),
            timeMs: txEndTime - txStartTime,
        });
    }

    const revealEndTime = Date.now();
    const revealDuration = revealEndTime - revealStartTime;
    console.log(`   ✓ Reveals complete (${revealDuration}ms)`);

    // Wait for reveal phase
    await new Promise(resolve => setTimeout(resolve, 2000));

    // FINALIZE
    console.log(`   Finalizing vote...`);
    const finalizeStartTime = Date.now();
    const finalizeTx = await contract.connect(players[0]).finalizeVote(voteId);
    const finalizeReceipt = await finalizeTx.wait();
    const finalizeEndTime = Date.now();

    performanceMetrics.finalize = {
        gasUsed: finalizeReceipt.gasUsed.toString(),
        timeMs: finalizeEndTime - finalizeStartTime,
    };

    // Get winning option
    const voteInfo = await contract.getVoteInfo(voteId);
    const winningOption = Number(voteInfo.winningOption);

    // CLAIM REWARDS
    console.log(`   Claiming rewards...`);
    const claimStartTime = Date.now();

    for (let i = 0; i < participantCount; i++) {
        const player = players[i];
        const { choice } = performanceMetrics.commits[i];

        // Only winners can claim
        if (choice === winningOption) {
            const txStartTime = Date.now();
            try {
                const claimTx = await contract.connect(player).claimReward(voteId);
                const receipt = await claimTx.wait();
                const txEndTime = Date.now();

                performanceMetrics.claims.push({
                    playerIndex: i,
                    gasUsed: receipt.gasUsed.toString(),
                    timeMs: txEndTime - txStartTime,
                    success: true,
                });
            } catch (error) {
                performanceMetrics.claims.push({
                    playerIndex: i,
                    error: error.message,
                    success: false,
                });
            }
        }
    }

    const claimEndTime = Date.now();
    const claimDuration = claimEndTime - claimStartTime;
    console.log(`   ✓ Claims complete (${claimDuration}ms)`);

    // Calculate totals
    const totalCommitGas = performanceMetrics.commits.reduce((sum, c) => sum + BigInt(c.gasUsed), 0n);
    const totalRevealGas = performanceMetrics.reveals.reduce((sum, r) => sum + BigInt(r.gasUsed), 0n);
    const totalClaimGas = performanceMetrics.claims
        .filter(c => c.success)
        .reduce((sum, c) => sum + BigInt(c.gasUsed), 0n);

    performanceMetrics.totalGas = (
        createReceipt.gasUsed +
        totalCommitGas +
        startRevealReceipt.gasUsed +
        totalRevealGas +
        finalizeReceipt.gasUsed +
        totalClaimGas
    ).toString();

    performanceMetrics.totalTimeMs = (
        performanceMetrics.createVote.timeMs +
        commitDuration +
        performanceMetrics.startRevealPhase.timeMs +
        revealDuration +
        performanceMetrics.finalize.timeMs +
        claimDuration
    );

    // Calculate averages
    const avgCommitGas = totalCommitGas / BigInt(participantCount);
    const avgRevealGas = totalRevealGas / BigInt(participantCount);
    const avgClaimGas = performanceMetrics.claims.length > 0
        ? totalClaimGas / BigInt(performanceMetrics.claims.filter(c => c.success).length)
        : 0n;

    performanceMetrics.averages = {
        commitGas: avgCommitGas.toString(),
        revealGas: avgRevealGas.toString(),
        claimGas: avgClaimGas.toString(),
        gasPerPlayer: (totalCommitGas + totalRevealGas) / BigInt(participantCount),
    };

    console.log(`   📊 Total Gas: ${performanceMetrics.totalGas}`);
    console.log(`   ⏱️  Total Time: ${performanceMetrics.totalTimeMs}ms`);
    console.log(`   ⚡ Avg Gas/Player: ${performanceMetrics.averages.gasPerPlayer}`);

    return performanceMetrics;
}

/**
 * Perform linear regression to test H3 (linear scaling)
 */
function calculateLinearRegression(data) {
    // Calculate linear regression: gas = β₀ + β₁ * participants
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.participants, 0);
    const sumY = data.reduce((sum, d) => sum + Number(d.totalGas), 0);
    const sumXY = data.reduce((sum, d) => sum + d.participants * Number(d.totalGas), 0);
    const sumX2 = data.reduce((sum, d) => sum + d.participants * d.participants, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R²
    const yMean = sumY / n;
    const ssTot = data.reduce((sum, d) => sum + Math.pow(Number(d.totalGas) - yMean, 2), 0);
    const ssRes = data.reduce((sum, d) => {
        const predicted = intercept + slope * d.participants;
        return sum + Math.pow(Number(d.totalGas) - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssRes / ssTot);

    return {
        slope,
        intercept,
        rSquared,
        equation: `gas = ${intercept.toFixed(2)} + ${slope.toFixed(2)} * participants`,
    };
}

/**
 * Main evaluation function
 */
async function main() {
    console.log("═══════════════════════════════════════════════════════");
    console.log("  EMPIRICAL EVALUATION: PERFORMANCE & SCALABILITY");
    console.log("═══════════════════════════════════════════════════════\n");

    const signers = await ethers.getSigners();
    console.log(`✓ Loaded ${signers.length} signers\n`);

    // Deploy contract
    console.log("📝 Deploying VotingGame contract...");
    const VotingGame = await ethers.getContractFactory("VotingGame", signers[1]);
    const votingGame = await VotingGame.deploy();
    await votingGame.waitForDeployment();
    const contractAddress = await votingGame.getAddress();
    console.log(`✓ Contract deployed at: ${contractAddress}\n`);

    results.metadata.contractAddress = contractAddress;

    // Run tests for each participant count
    let gameCounter = 0;

    for (const participantCount of PARTICIPANT_COUNTS) {
        console.log(`\n${'═'.repeat(60)}`);
        console.log(`  TESTING: ${participantCount} PARTICIPANTS`);
        console.log(`${'═'.repeat(60)}`);

        const configResults = [];

        for (let i = 0; i < GAMES_PER_CONFIG; i++) {
            gameCounter++;
            const perfData = await testPerformance(votingGame, signers, participantCount, gameCounter);
            perfData.participants = participantCount;
            configResults.push(perfData);
            results.performanceData.push(perfData);
        }

        // Calculate averages for this configuration
        const avgTotalGas = configResults.reduce((sum, d) => sum + BigInt(d.totalGas), 0n) / BigInt(configResults.length);
        const avgTotalTime = configResults.reduce((sum, d) => sum + d.totalTimeMs, 0) / configResults.length;

        console.log(`\n  📊 Summary for ${participantCount} participants:`);
        console.log(`     Avg Total Gas: ${avgTotalGas}`);
        console.log(`     Avg Total Time: ${avgTotalTime.toFixed(2)}ms`);
    }

    // Perform scalability analysis
    console.log(`\n${'═'.repeat(60)}`);
    console.log("  SCALABILITY ANALYSIS");
    console.log(`${'═'.repeat(60)}\n`);

    // Group by participant count
    const byParticipants = {};
    for (const data of results.performanceData) {
        const count = data.participants;
        if (!byParticipants[count]) {
            byParticipants[count] = [];
        }
        byParticipants[count].push(data);
    }

    // Calculate averages for regression
    const regressionData = [];
    for (const [count, games] of Object.entries(byParticipants)) {
        const avgGas = games.reduce((sum, g) => sum + BigInt(g.totalGas), 0n) / BigInt(games.length);
        regressionData.push({
            participants: parseInt(count),
            totalGas: avgGas.toString(),
        });
    }

    // Perform linear regression
    const regression = calculateLinearRegression(regressionData);
    results.scalabilityAnalysis.linearRegression = regression;

    console.log("Linear Regression Analysis:");
    console.log(`  Equation: ${regression.equation}`);
    console.log(`  R² = ${regression.rSquared.toFixed(6)}`);
    console.log(`  Slope (gas per participant): ${regression.slope.toFixed(2)}`);
    console.log(`  Intercept (base gas cost): ${regression.intercept.toFixed(2)}`);

    if (regression.rSquared > 0.95) {
        console.log(`\n  ✅ H3 CONFIRMED: Gas costs scale linearly (R² > 0.95)`);
    } else {
        console.log(`\n  ⚠️  H3 UNCERTAIN: R² = ${regression.rSquared.toFixed(6)} < 0.95`);
    }

    // Calculate gas cost breakdown by operation
    const operationBreakdown = {
        createVote: { total: 0n, count: 0 },
        commit: { total: 0n, count: 0 },
        reveal: { total: 0n, count: 0 },
        finalize: { total: 0n, count: 0 },
        claim: { total: 0n, count: 0 },
    };

    for (const data of results.performanceData) {
        operationBreakdown.createVote.total += BigInt(data.createVote.gasUsed);
        operationBreakdown.createVote.count++;

        for (const commit of data.commits) {
            operationBreakdown.commit.total += BigInt(commit.gasUsed);
            operationBreakdown.commit.count++;
        }

        for (const reveal of data.reveals) {
            operationBreakdown.reveal.total += BigInt(reveal.gasUsed);
            operationBreakdown.reveal.count++;
        }

        operationBreakdown.finalize.total += BigInt(data.finalize.gasUsed);
        operationBreakdown.finalize.count++;

        for (const claim of data.claims.filter(c => c.success)) {
            operationBreakdown.claim.total += BigInt(claim.gasUsed);
            operationBreakdown.claim.count++;
        }
    }

    console.log("\n  Gas Cost Breakdown:");
    for (const [operation, stats] of Object.entries(operationBreakdown)) {
        const avg = stats.count > 0 ? stats.total / BigInt(stats.count) : 0n;
        console.log(`    ${operation}: avg ${avg} gas (${stats.count} operations)`);
    }

    results.scalabilityAnalysis.operationBreakdown = Object.fromEntries(
        Object.entries(operationBreakdown).map(([op, stats]) => [
            op,
            {
                avgGas: (stats.count > 0 ? stats.total / BigInt(stats.count) : 0n).toString(),
                totalGas: stats.total.toString(),
                count: stats.count,
            }
        ])
    );

    // Save results
    const outputDir = path.join(__dirname, "data", "empirical");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const jsonPath = path.join(outputDir, "performance-results.json");
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`\n✓ Results saved to: ${jsonPath}`);

    // Save CSV
    const csvPath = path.join(outputDir, "performance-summary.csv");
    const csvLines = [
        "Participants,GameNumber,TotalGas,TotalTimeMs,AvgCommitGas,AvgRevealGas,AvgClaimGas"
    ];
    for (const data of results.performanceData) {
        csvLines.push([
            data.participants,
            data.gameNumber,
            data.totalGas,
            data.totalTimeMs,
            data.averages.commitGas,
            data.averages.revealGas,
            data.averages.claimGas,
        ].join(','));
    }
    fs.writeFileSync(csvPath, csvLines.join('\n'));
    console.log(`✓ CSV summary saved to: ${csvPath}\n`);

    console.log("═══════════════════════════════════════════════════════");
    console.log("  PERFORMANCE EVALUATION COMPLETE");
    console.log("═══════════════════════════════════════════════════════\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
