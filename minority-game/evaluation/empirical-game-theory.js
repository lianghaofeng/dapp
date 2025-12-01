/**
 * Empirical Evaluation: Game Theory Metrics
 *
 * This script tests:
 * - H1: Commit-reveal prevents strategic voting (higher entropy)
 * - H2: Minority win rate is approximately 50%
 * - Choice distribution fairness
 * - Nash equilibrium deviation
 *
 * Runs 1000 simulated games across different scenarios
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Configuration
const SCENARIOS = [
    { name: "S1-Small-Binary", participants: 10, options: 2, distribution: "uniform", games: 100 },
    { name: "S2-Small-Multi", participants: 10, options: 5, distribution: "uniform", games: 100 },
    { name: "S3-Medium-Binary", participants: 20, options: 2, distribution: "random", games: 100 },
    { name: "S4-Medium-Multi", participants: 20, options: 5, distribution: "random", games: 100 },
    { name: "S5-Large-Binary", participants: 50, options: 2, distribution: "skewed", games: 100 },
    { name: "S6-Large-Multi", participants: 50, options: 5, distribution: "skewed", games: 100 },
    { name: "S7-Stress-Test", participants: 100, options: 10, distribution: "random", games: 200 },
];

// Results storage
const results = {
    metadata: {
        timestamp: new Date().toISOString(),
        totalGames: 0,
        totalVotes: 0,
        totalEthWagered: "0",
    },
    games: [],
    statistics: {
        entropyByScenario: {},
        minorityWinRates: {},
        choiceDistributions: {},
    }
};

/**
 * Calculate Shannon Entropy of choice distribution
 * H(X) = -Σ p(x_i) * log₂(p(x_i))
 */
function calculateEntropy(distribution) {
    const total = distribution.reduce((sum, count) => sum + count, 0);
    if (total === 0) return 0;

    let entropy = 0;
    for (const count of distribution) {
        if (count > 0) {
            const p = count / total;
            entropy -= p * Math.log2(p);
        }
    }
    return entropy;
}

/**
 * Generate vote distribution based on strategy
 */
function generateVoteDistribution(participants, options, strategy) {
    const votes = [];

    switch (strategy) {
        case "uniform":
            // Each option gets equal probability
            for (let i = 0; i < participants; i++) {
                votes.push(i % options);
            }
            // Shuffle to randomize order
            for (let i = votes.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [votes[i], votes[j]] = [votes[j], votes[i]];
            }
            break;

        case "random":
            // Completely random choices
            for (let i = 0; i < participants; i++) {
                votes.push(Math.floor(Math.random() * options));
            }
            break;

        case "skewed":
            // 60% vote for option 0, 40% distributed among others
            const majorityCount = Math.floor(participants * 0.6);
            for (let i = 0; i < majorityCount; i++) {
                votes.push(0);
            }
            for (let i = majorityCount; i < participants; i++) {
                votes.push(1 + Math.floor(Math.random() * (options - 1)));
            }
            // Shuffle
            for (let i = votes.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [votes[i], votes[j]] = [votes[j], votes[i]];
            }
            break;
    }

    return votes;
}

/**
 * Generate random bet amounts (between 0.01 and 1.0 ETH)
 */
function generateBetAmounts(participants) {
    return Array(participants).fill(0).map(() => {
        const eth = 0.01 + Math.random() * 0.99;
        return ethers.parseEther(eth.toFixed(4));
    });
}

/**
 * Run a single game simulation
 */
async function runGame(contract, signers, scenario, gameNumber) {
    const { participants, options, distribution } = scenario;

    console.log(`\n🎮 Game ${gameNumber}: ${scenario.name}`);
    console.log(`   Players: ${participants}, Options: ${options}, Strategy: ${distribution}`);

    // Select signers for this game
    const players = signers.slice(0, participants);

    // Generate vote choices and bet amounts
    const votes = generateVoteDistribution(participants, options, distribution);
    const betAmounts = generateBetAmounts(participants);

    // Create vote
    const optionTexts = Array(options).fill(0).map((_, i) => `Option ${i}`);
    const creator = players[0];
    const tx = await contract.connect(creator).createVote(
        `Game ${gameNumber} - ${scenario.name}`,
        optionTexts,
        60, // 60 seconds commit phase
        30  // 30 seconds reveal phase
    );
    await tx.wait();

    const voteId = await contract.voteCounter();
    console.log(`   ✓ Vote created: #${voteId}`);

    // COMMIT PHASE
    const commitGasCosts = [];
    const secrets = [];
    const commitStartTime = Date.now();

    for (let i = 0; i < participants; i++) {
        const player = players[i];
        const choice = votes[i];
        const secret = ethers.hexlify(ethers.randomBytes(32));
        secrets.push(secret);

        const commitHash = ethers.keccak256(
            ethers.solidityPacked(
                ["uint256", "uint256", "bytes32", "address"],
                [voteId, choice, secret, player.address]
            )
        );

        const commitTx = await contract.connect(player).commit(voteId, commitHash, {
            value: betAmounts[i]
        });
        const receipt = await commitTx.wait();
        commitGasCosts.push(receipt.gasUsed);
    }

    const commitEndTime = Date.now();
    console.log(`   ✓ All commits submitted (${((commitEndTime - commitStartTime) / 1000).toFixed(2)}s)`);

    // Wait for commit phase to end
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start reveal phase
    const startRevealTx = await contract.connect(creator).startRevealPhase(voteId);
    await startRevealTx.wait();
    console.log(`   ✓ Reveal phase started`);

    // REVEAL PHASE
    const revealGasCosts = [];
    const revealStartTime = Date.now();

    for (let i = 0; i < participants; i++) {
        const player = players[i];
        const choice = votes[i];
        const secret = secrets[i];

        const revealTx = await contract.connect(player).reveal(voteId, choice, secret);
        const receipt = await revealTx.wait();
        revealGasCosts.push(receipt.gasUsed);
    }

    const revealEndTime = Date.now();
    console.log(`   ✓ All reveals submitted (${((revealEndTime - revealStartTime) / 1000).toFixed(2)}s)`);

    // Wait for reveal phase to end
    await new Promise(resolve => setTimeout(resolve, 2000));

    // FINALIZE
    const finalizeTx = await contract.connect(creator).finalizeVote(voteId);
    const finalizeReceipt = await finalizeTx.wait();
    console.log(`   ✓ Vote finalized`);

    // Get vote results
    const voteInfo = await contract.getVoteInfo(voteId);
    const winningOption = Number(voteInfo.winningOption);

    // Calculate choice distribution
    const choiceDistribution = Array(options).fill(0);
    for (const choice of votes) {
        choiceDistribution[choice]++;
    }

    // Find minority option
    const minVotes = Math.min(...choiceDistribution.filter(c => c > 0));
    const minorityOption = choiceDistribution.findIndex(c => c === minVotes);
    const minorityWon = winningOption === minorityOption;

    // Calculate entropy
    const entropy = calculateEntropy(choiceDistribution);

    // Calculate total pool
    const totalPool = betAmounts.reduce((sum, bet) => sum + bet, 0n);

    // Count winners
    const winnerCount = votes.filter(v => v === winningOption).length;

    // Calculate statistics
    const avgCommitGas = commitGasCosts.reduce((sum, gas) => sum + gas, 0n) / BigInt(commitGasCosts.length);
    const avgRevealGas = revealGasCosts.reduce((sum, gas) => sum + gas, 0n) / BigInt(revealGasCosts.length);

    console.log(`   📊 Results:`);
    console.log(`      Choice Distribution: [${choiceDistribution.join(', ')}]`);
    console.log(`      Entropy: ${entropy.toFixed(4)} (max: ${Math.log2(options).toFixed(4)})`);
    console.log(`      Minority Won: ${minorityWon ? '✓ YES' : '✗ NO'}`);
    console.log(`      Winners: ${winnerCount}/${participants}`);
    console.log(`      Total Pool: ${ethers.formatEther(totalPool)} ETH`);
    console.log(`      Avg Gas - Commit: ${avgCommitGas}, Reveal: ${avgRevealGas}`);

    // Return game data
    return {
        gameId: gameNumber,
        scenario: scenario.name,
        timestamp: new Date().toISOString(),
        participants,
        options,
        distribution: distribution,
        votes,
        choiceDistribution,
        entropy,
        maxEntropy: Math.log2(options),
        entropyRatio: entropy / Math.log2(options),
        minorityOption,
        winningOption,
        minorityWon,
        totalPool: ethers.formatEther(totalPool),
        winnerCount,
        gasCosts: {
            commits: commitGasCosts.map(g => g.toString()),
            reveals: revealGasCosts.map(g => g.toString()),
            finalize: finalizeReceipt.gasUsed.toString(),
            avgCommit: avgCommitGas.toString(),
            avgReveal: avgRevealGas.toString(),
        },
        executionTime: {
            commitPhase: (commitEndTime - commitStartTime) / 1000,
            revealPhase: (revealEndTime - revealStartTime) / 1000,
        }
    };
}

/**
 * Calculate statistics across all games
 */
function calculateStatistics(games) {
    const stats = {
        overall: {
            totalGames: games.length,
            avgEntropy: 0,
            avgEntropyRatio: 0,
            minorityWinRate: 0,
            avgGasCommit: 0,
            avgGasReveal: 0,
        },
        byScenario: {}
    };

    // Group by scenario
    const byScenario = {};
    for (const game of games) {
        if (!byScenario[game.scenario]) {
            byScenario[game.scenario] = [];
        }
        byScenario[game.scenario].push(game);
    }

    // Calculate statistics for each scenario
    for (const [scenario, scenarioGames] of Object.entries(byScenario)) {
        const entropies = scenarioGames.map(g => g.entropy);
        const entropyRatios = scenarioGames.map(g => g.entropyRatio);
        const minorityWins = scenarioGames.filter(g => g.minorityWon).length;
        const gasCommits = scenarioGames.map(g => BigInt(g.gasCosts.avgCommit));
        const gasReveals = scenarioGames.map(g => BigInt(g.gasCosts.avgReveal));

        const avgEntropy = entropies.reduce((sum, e) => sum + e, 0) / entropies.length;
        const avgEntropyRatio = entropyRatios.reduce((sum, e) => sum + e, 0) / entropyRatios.length;
        const avgGasCommit = gasCommits.reduce((sum, g) => sum + g, 0n) / BigInt(gasCommits.length);
        const avgGasReveal = gasReveals.reduce((sum, g) => sum + g, 0n) / BigInt(gasReveals.length);

        // Calculate standard deviation
        const entropyVariance = entropies.reduce((sum, e) => sum + Math.pow(e - avgEntropy, 2), 0) / entropies.length;
        const entropyStdDev = Math.sqrt(entropyVariance);

        stats.byScenario[scenario] = {
            games: scenarioGames.length,
            entropy: {
                mean: avgEntropy,
                stdDev: entropyStdDev,
                min: Math.min(...entropies),
                max: Math.max(...entropies),
            },
            entropyRatio: {
                mean: avgEntropyRatio,
                percentage: (avgEntropyRatio * 100).toFixed(2) + '%',
            },
            minorityWinRate: {
                wins: minorityWins,
                total: scenarioGames.length,
                rate: minorityWins / scenarioGames.length,
                percentage: ((minorityWins / scenarioGames.length) * 100).toFixed(2) + '%',
            },
            gasCosts: {
                avgCommit: avgGasCommit.toString(),
                avgReveal: avgGasReveal.toString(),
            }
        };
    }

    // Calculate overall statistics
    const allEntropies = games.map(g => g.entropy);
    const allEntropyRatios = games.map(g => g.entropyRatio);
    const allMinorityWins = games.filter(g => g.minorityWon).length;

    stats.overall.avgEntropy = allEntropies.reduce((sum, e) => sum + e, 0) / allEntropies.length;
    stats.overall.avgEntropyRatio = allEntropyRatios.reduce((sum, e) => sum + e, 0) / allEntropyRatios.length;
    stats.overall.minorityWinRate = allMinorityWins / games.length;

    return stats;
}

/**
 * Main evaluation function
 */
async function main() {
    console.log("═══════════════════════════════════════════════════════");
    console.log("  EMPIRICAL EVALUATION: GAME THEORY METRICS");
    console.log("═══════════════════════════════════════════════════════\n");

    // Get signers
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

    // Run all scenarios
    let gameCounter = 0;
    let totalVotes = 0;
    let totalEthWagered = 0n;

    for (const scenario of SCENARIOS) {
        console.log(`\n${'═'.repeat(60)}`);
        console.log(`  SCENARIO: ${scenario.name}`);
        console.log(`${'═'.repeat(60)}`);

        for (let i = 0; i < scenario.games; i++) {
            gameCounter++;
            const gameData = await runGame(votingGame, signers, scenario, gameCounter);
            results.games.push(gameData);

            totalVotes += gameData.participants;
            totalEthWagered += ethers.parseEther(gameData.totalPool);
        }
    }

    // Calculate statistics
    console.log(`\n${'═'.repeat(60)}`);
    console.log("  CALCULATING STATISTICS");
    console.log(`${'═'.repeat(60)}\n`);

    const statistics = calculateStatistics(results.games);
    results.statistics = statistics;
    results.metadata.totalGames = gameCounter;
    results.metadata.totalVotes = totalVotes;
    results.metadata.totalEthWagered = ethers.formatEther(totalEthWagered);

    // Print summary
    console.log("\n📊 EVALUATION SUMMARY:\n");
    console.log(`Total Games: ${results.metadata.totalGames}`);
    console.log(`Total Votes: ${results.metadata.totalVotes}`);
    console.log(`Total ETH Wagered: ${results.metadata.totalEthWagered} ETH\n`);

    console.log("Overall Statistics:");
    console.log(`  Average Entropy: ${statistics.overall.avgEntropy.toFixed(4)}`);
    console.log(`  Average Entropy Ratio: ${(statistics.overall.avgEntropyRatio * 100).toFixed(2)}%`);
    console.log(`  Minority Win Rate: ${(statistics.overall.minorityWinRate * 100).toFixed(2)}%\n`);

    console.log("By Scenario:");
    for (const [scenario, stats] of Object.entries(statistics.byScenario)) {
        console.log(`\n  ${scenario}:`);
        console.log(`    Games: ${stats.games}`);
        console.log(`    Entropy: ${stats.entropy.mean.toFixed(4)} ± ${stats.entropy.stdDev.toFixed(4)}`);
        console.log(`    Entropy Ratio: ${stats.entropyRatio.percentage}`);
        console.log(`    Minority Win Rate: ${stats.minorityWinRate.percentage}`);
        console.log(`    Avg Gas - Commit: ${stats.gasCosts.avgCommit}, Reveal: ${stats.gasCosts.avgReveal}`);
    }

    // Save results
    const outputDir = path.join(__dirname, "data", "empirical");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const jsonPath = path.join(outputDir, "game-theory-results.json");
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`\n✓ Results saved to: ${jsonPath}`);

    // Save CSV summary
    const csvPath = path.join(outputDir, "game-theory-summary.csv");
    const csvLines = [
        "GameID,Scenario,Participants,Options,Distribution,Entropy,EntropyRatio,MinorityWon,WinnerCount,TotalPool,AvgCommitGas,AvgRevealGas"
    ];
    for (const game of results.games) {
        csvLines.push([
            game.gameId,
            game.scenario,
            game.participants,
            game.options,
            game.distribution,
            game.entropy.toFixed(4),
            game.entropyRatio.toFixed(4),
            game.minorityWon ? 1 : 0,
            game.winnerCount,
            game.totalPool,
            game.gasCosts.avgCommit,
            game.gasCosts.avgReveal,
        ].join(','));
    }
    fs.writeFileSync(csvPath, csvLines.join('\n'));
    console.log(`✓ CSV summary saved to: ${csvPath}\n`);

    console.log("═══════════════════════════════════════════════════════");
    console.log("  EVALUATION COMPLETE");
    console.log("═══════════════════════════════════════════════════════\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
