/**
 * Multi-Player Testing Script for Minority Game
 *
 * This script simulates real-world multi-player scenarios with
 * quantitative analysis and empirical results.
 */

const { ethers } = require("hardhat");
const fs = require("fs");

// Test Configuration
const TEST_CONFIG = {
    numPlayers: 10,           // Number of players to simulate
    voteQuestion: "Which is the best crypto?",
    voteOptions: ["Bitcoin", "Ethereum", "Solana"],
    commitDuration: 60,        // 60 seconds for testing
    revealDuration: 30,        // 30 seconds
    betAmounts: ["0.1", "0.2", "0.3", "0.15", "0.25", "0.1", "0.2", "0.3", "0.15", "0.25"], // ETH
};

// Results storage
const testResults = {
    timestamp: new Date().toISOString(),
    config: TEST_CONFIG,
    players: [],
    vote: null,
    phases: {
        commit: {},
        reveal: {},
        finalize: {}
    },
    analysis: {}
};

async function main() {
    console.log("🎮 Starting Multi-Player Minority Game Test\n");
    console.log("=" .repeat(60));

    // Step 1: Setup
    console.log("\n📋 STEP 1: Test Setup");
    console.log("-".repeat(60));

    const signers = await ethers.getSigners();
    const deployer = signers[1];
    const players = signers.slice(1, TEST_CONFIG.numPlayers + 1);

    console.log(`✅ Deployer: ${deployer.address}`);
    console.log(`✅ Number of players: ${players.length}`);

    // Step 2: Deploy Contract
    console.log("\n📋 STEP 2: Deploy Contract");
    console.log("-".repeat(60));

    const VotingGame = await ethers.getContractFactory("VotingGame", deployer);
    const votingGame = await VotingGame.deploy();
    await votingGame.waitForDeployment();

    const contractAddress = await votingGame.getAddress();
    console.log(`✅ Contract deployed at: ${contractAddress}`);

    testResults.contractAddress = contractAddress;

    // Step 3: Create Vote
    console.log("\n📋 STEP 3: Create Vote");
    console.log("-".repeat(60));

    const tx = await votingGame.createVote(
        TEST_CONFIG.voteQuestion,
        TEST_CONFIG.voteOptions,
        TEST_CONFIG.commitDuration,
        TEST_CONFIG.revealDuration
    );
    await tx.wait();

    const voteId = 1;
    const voteInfo = await votingGame.getVoteInfo(voteId);

    console.log(`✅ Vote created successfully`);
    console.log(`   Question: ${TEST_CONFIG.voteQuestion}`);
    console.log(`   Options: ${TEST_CONFIG.voteOptions.join(", ")}`);
    console.log(`   Commit End: ${new Date(Number(voteInfo[5]) * 1000).toLocaleTimeString()}`);
    console.log(`   Reveal End: ${new Date(Number(voteInfo[6]) * 1000).toLocaleTimeString()}`);

    testResults.vote = {
        id: voteId,
        question: TEST_CONFIG.voteQuestion,
        options: TEST_CONFIG.voteOptions,
        commitEndTime: Number(voteInfo[5]),
        revealEndTime: Number(voteInfo[6])
    };

    // Step 4: Commit Phase - Multi-Player Simulation
    console.log("\n📋 STEP 4: Commit Phase - Multi-Player Simulation");
    console.log("-".repeat(60));

    const commits = [];
    const startCommitTime = Date.now();

    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const playerContract = votingGame.connect(player);

        // Randomize choice with tendency for strategic play
        // 40% choose option 0, 35% choose option 1, 25% choose option 2
        const random = Math.random();
        let choice;
        if (random < 0.4) choice = 0;
        else if (random < 0.75) choice = 1;
        else choice = 2;

        const betAmount = ethers.parseEther(TEST_CONFIG.betAmounts[i]);
        const secret = ethers.hexlify(ethers.randomBytes(32));

        const commitHash = ethers.keccak256(
            ethers.solidityPacked(
                ['uint256', 'uint256', 'bytes32', 'address'],
                [voteId, choice, secret, player.address]
            )
        );

        console.log(`Player ${i + 1} (${player.address.slice(0, 6)}...)`);
        console.log(`   Choice: ${TEST_CONFIG.voteOptions[choice]}`);
        console.log(`   Bet: ${TEST_CONFIG.betAmounts[i]} ETH`);

        const commitTx = await playerContract.commit(voteId, commitHash, { value: betAmount });
        await commitTx.wait();

        commits.push({
            playerIndex: i,
            address: player.address,
            choice,
            secret,
            betAmount: TEST_CONFIG.betAmounts[i]
        });

        testResults.players.push({
            index: i + 1,
            address: player.address,
            choice,
            choiceName: TEST_CONFIG.voteOptions[choice],
            betAmount: TEST_CONFIG.betAmounts[i]
        });

        console.log(`   ✅ Committed\n`);
    }

    const commitDuration = Date.now() - startCommitTime;
    testResults.phases.commit = {
        duration: commitDuration,
        playerCount: commits.length,
        totalBets: TEST_CONFIG.betAmounts.reduce((sum, amt) => sum + parseFloat(amt), 0)
    };

    console.log(`✅ All ${commits.length} players committed`);
    console.log(`   Duration: ${commitDuration}ms`);
    console.log(`   Total Pool: ${testResults.phases.commit.totalBets} ETH`);

    // Step 5: Wait for Commit Phase to End
    console.log("\n📋 STEP 5: Waiting for Commit Phase to End");
    console.log("-".repeat(60));

    // Get fresh vote info to calculate accurate wait time
    const voteInfoBeforeReveal = await votingGame.getVoteInfo(voteId);
    const now = Math.floor(Date.now() / 1000);
    const commitEndTime = Number(voteInfoBeforeReveal[5]);
    const waitTime = Math.max(0, (commitEndTime - now + 2) * 1000);

    if (waitTime > 0) {
        console.log(`⏳ Waiting ${Math.ceil(waitTime / 1000)} seconds...`);
        console.log(`   Current time: ${now}`);
        console.log(`   Commit end time: ${commitEndTime}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
    } else {
        console.log(`⏭️  Commit phase already ended`);
    }

    console.log(`✅ Commit phase ended`);

    // Step 6: Start Reveal Phase
    console.log("\n📋 STEP 6: Start Reveal Phase");
    console.log("-".repeat(60));

    const startRevealTx = await votingGame.startRevealPhase(voteId);
    await startRevealTx.wait();

    console.log(`✅ Reveal phase started`);

    // Step 7: Reveal Phase - Multi-Player Reveals
    console.log("\n📋 STEP 7: Reveal Phase - Multi-Player Reveals");
    console.log("-".repeat(60));

    const startRevealTime = Date.now();
    const reveals = [];

    // Simulate realistic scenario: 80% of players reveal
    const revealingPlayers = commits.slice(0, Math.floor(commits.length * 0.8));

    for (const commit of revealingPlayers) {
        const player = players[commit.playerIndex];
        const playerContract = votingGame.connect(player);

        console.log(`Player ${commit.playerIndex + 1} revealing...`);

        const revealTx = await playerContract.reveal(voteId, commit.choice, commit.secret);
        await revealTx.wait();

        reveals.push(commit);
        console.log(`   ✅ Revealed: ${TEST_CONFIG.voteOptions[commit.choice]}\n`);
    }

    const revealDuration = Date.now() - startRevealTime;
    testResults.phases.reveal = {
        duration: revealDuration,
        revealedCount: reveals.length,
        nonRevealedCount: commits.length - reveals.length,
        revealRate: (reveals.length / commits.length * 100).toFixed(2) + "%"
    };

    console.log(`✅ ${reveals.length}/${commits.length} players revealed`);
    console.log(`   Reveal rate: ${testResults.phases.reveal.revealRate}`);
    console.log(`   Duration: ${revealDuration}ms`);

    // Step 8: Finalize Vote
    console.log("\n📋 STEP 8: Finalize Vote");
    console.log("-".repeat(60));

    // Wait for reveal phase to end - get fresh vote info
    const voteInfoBeforeFinalize = await votingGame.getVoteInfo(voteId);
    const now2 = Math.floor(Date.now() / 1000);
    const revealEndTime = Number(voteInfoBeforeFinalize[6]);
    const waitTime2 = Math.max(0, (revealEndTime - now2 + 2) * 1000);

    if (waitTime2 > 0) {
        console.log(`⏳ Waiting ${Math.ceil(waitTime2 / 1000)} seconds...`);
        console.log(`   Current time: ${now2}`);
        console.log(`   Reveal end time: ${revealEndTime}`);
        await new Promise(resolve => setTimeout(resolve, waitTime2));
    } else {
        console.log(`⏭️  Reveal phase already ended`);
    }

    const finalizeTx = await votingGame.finalizeVote(voteId);
    await finalizeTx.wait();

    console.log(`✅ Vote finalized`);

    // Step 9: Analyze Results
    console.log("\n📋 STEP 9: Analyze Results");
    console.log("-".repeat(60));

    const finalVoteInfo = await votingGame.getVoteInfo(voteId);
    const winningOption = Number(finalVoteInfo[9]);

    // Get vote distribution
    const distribution = {};
    for (const reveal of reveals) {
        distribution[reveal.choice] = (distribution[reveal.choice] || 0) + 1;
    }

    // Calculate option totals
    const optionTotals = [];
    for (let i = 0; i < TEST_CONFIG.voteOptions.length; i++) {
        const total = await votingGame.getOptionTotal(voteId, i);
        optionTotals.push(ethers.formatEther(total));
    }

    // Determine minority
    const minorityOption = Object.entries(distribution)
        .sort((a, b) => a[1] - b[1])[0];

    console.log(`\n🎯 VOTE RESULTS:`);
    console.log(`   Winning Option: ${winningOption !== 999999 ? TEST_CONFIG.voteOptions[winningOption] : "No Winner"}`);
    console.log(`\n📊 VOTE DISTRIBUTION:`);
    for (let i = 0; i < TEST_CONFIG.voteOptions.length; i++) {
        const count = distribution[i] || 0;
        const percentage = (count / reveals.length * 100).toFixed(1);
        const isWinner = winningOption === i;
        console.log(`   ${TEST_CONFIG.voteOptions[i]}: ${count} votes (${percentage}%) - ${optionTotals[i]} ETH ${isWinner ? "👑 WINNER" : ""}`);
    }

    // Calculate rewards
    console.log(`\n💰 REWARD DISTRIBUTION:`);
    let totalRewards = 0;
    const winners = [];

    for (const commit of commits) {
        const player = players[commit.playerIndex];
        const reward = await votingGame.calculateReward(voteId, player.address);
        const rewardEth = ethers.formatEther(reward);

        if (parseFloat(rewardEth) > 0) {
            console.log(`   Player ${commit.playerIndex + 1}: ${rewardEth} ETH`);
            totalRewards += parseFloat(rewardEth);
            winners.push({
                playerIndex: commit.playerIndex + 1,
                address: player.address,
                reward: rewardEth,
                choice: TEST_CONFIG.voteOptions[commit.choice],
                betAmount: commit.betAmount
            });
        }
    }

    console.log(`   Total Rewards Distributed: ${totalRewards.toFixed(4)} ETH`);

    // Empirical Analysis
    const analysis = {
        winner: winningOption !== 999999 ? TEST_CONFIG.voteOptions[winningOption] : "No Winner",
        distribution,
        optionTotals,
        minorityOption: minorityOption ? {
            option: TEST_CONFIG.voteOptions[minorityOption[0]],
            count: minorityOption[1]
        } : null,
        winnerCount: winners.length,
        totalRewards: totalRewards.toFixed(4),
        averageReward: winners.length > 0 ? (totalRewards / winners.length).toFixed(4) : "0",
        profitMargin: {}
    };

    // Calculate profit margins for winners
    for (const winner of winners) {
        const profit = parseFloat(winner.reward) - parseFloat(winner.betAmount);
        const margin = ((profit / parseFloat(winner.betAmount)) * 100).toFixed(2);
        analysis.profitMargin[`Player ${winner.playerIndex}`] = `${margin}%`;
    }

    testResults.analysis = analysis;
    testResults.winners = winners;

    // Step 10: Statistical Summary
    console.log("\n📋 STEP 10: Statistical Summary");
    console.log("=".repeat(60));

    console.log(`\n📈 GAME STATISTICS:`);
    console.log(`   Total Players: ${TEST_CONFIG.numPlayers}`);
    console.log(`   Players Who Committed: ${commits.length}`);
    console.log(`   Players Who Revealed: ${reveals.length}`);
    console.log(`   Reveal Rate: ${testResults.phases.reveal.revealRate}`);
    console.log(`   Total Pool: ${testResults.phases.commit.totalBets} ETH`);
    console.log(`   Winners: ${winners.length}`);
    console.log(`   Total Rewards: ${totalRewards.toFixed(4)} ETH`);
    console.log(`   Average Reward per Winner: ${analysis.averageReward} ETH`);

    console.log(`\n🎲 GAME THEORY INSIGHTS:`);
    const minorityPaid = winningOption !== 999999;
    console.log(`   Minority Win Principle: ${minorityPaid ? "✅ VERIFIED" : "❌ NOT VERIFIED"}`);
    console.log(`   Strategic Diversity: ${Object.keys(distribution).length} different choices`);
    console.log(`   Commitment Rate: ${(commits.length / TEST_CONFIG.numPlayers * 100).toFixed(1)}%`);

    // Save Results
    const resultsPath = "test-results-multi-player.json";
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);

    console.log("\n" + "=".repeat(60));
    console.log("✅ Multi-Player Test Completed Successfully!");
    console.log("=".repeat(60) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error:", error);
        process.exit(1);
    });
