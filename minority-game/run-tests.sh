#!/bin/bash

# Minority Game - Complete Test Runner
# This script runs all testing scenarios

echo "🧪 MINORITY GAME - COMPLETE TEST SUITE"
echo "======================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Hardhat node is running
if ! lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}❌ Error: Hardhat node not running${NC}"
    echo ""
    echo "Please start the Hardhat node first:"
    echo "  npx hardhat node"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Hardhat node detected${NC}"
echo ""

# Menu
echo "Select test to run:"
echo ""
echo "  1) Unit Tests (Fast)"
echo "  2) Multi-Player Test (10 players, ~2 min)"
echo "  3) Empirical Analysis (5 rounds, ~5 min)"
echo "  4) All Tests (Complete suite, ~7 min)"
echo "  5) Quick Demo (1 round, ~30 sec)"
echo ""
read -p "Enter choice [1-5]: " choice

echo ""
echo "======================================"
echo ""

case $choice in
    1)
        echo -e "${BLUE}Running Unit Tests...${NC}"
        echo ""
        npx hardhat test test/VotingGame.test.js --network localhost
        ;;

    2)
        echo -e "${BLUE}Running Multi-Player Test...${NC}"
        echo ""
        npx hardhat run scripts/multi-player-test.js --network localhost
        echo ""
        echo -e "${GREEN}✅ Results saved to: test-results-multi-player.json${NC}"
        ;;

    3)
        echo -e "${BLUE}Running Empirical Analysis...${NC}"
        echo ""
        npx hardhat run scripts/empirical-analysis.js --network localhost
        echo ""
        echo -e "${GREEN}✅ Results saved to:${NC}"
        echo "   - empirical-analysis-results.json"
        echo "   - empirical-analysis-summary.txt"
        ;;

    4)
        echo -e "${BLUE}Running Complete Test Suite...${NC}"
        echo ""

        echo -e "${YELLOW}[1/3] Unit Tests${NC}"
        npx hardhat test test/VotingGame.test.js --network localhost
        echo ""

        echo -e "${YELLOW}[2/3] Multi-Player Test${NC}"
        npx hardhat run scripts/multi-player-test.js --network localhost
        echo ""

        echo -e "${YELLOW}[3/3] Empirical Analysis${NC}"
        npx hardhat run scripts/empirical-analysis.js --network localhost
        echo ""

        echo -e "${GREEN}✅ All tests completed!${NC}"
        echo ""
        echo "Results saved to:"
        echo "   - test-results-multi-player.json"
        echo "   - empirical-analysis-results.json"
        echo "   - empirical-analysis-summary.txt"
        ;;

    5)
        echo -e "${BLUE}Running Quick Demo...${NC}"
        echo ""
        # Create quick demo script
        cat > /tmp/quick-demo.js << 'EOF'
const { ethers } = require("hardhat");

async function main() {
    console.log("🎮 Quick Demo - Minority Game\n");

    const signers = await ethers.getSigners();
    const deployer = signers[0];
    const players = signers.slice(1, 4); // 3 players

    console.log("📦 Deploying contract...");
    const VotingGame = await ethers.getContractFactory("VotingGame");
    const game = await VotingGame.deploy();
    await game.waitForDeployment();
    console.log("✅ Deployed\n");

    console.log("🗳️  Creating vote...");
    const tx = await game.createVote("Demo: A or B?", ["A", "B"], 10, 10);
    await tx.wait();
    console.log("✅ Vote created\n");

    console.log("📝 Players committing...");
    const choices = [0, 0, 1]; // 2 choose A, 1 chooses B (B is minority)
    const commits = [];

    for (let i = 0; i < players.length; i++) {
        const secret = ethers.hexlify(ethers.randomBytes(32));
        const hash = ethers.keccak256(
            ethers.solidityPacked(
                ['uint256', 'uint256', 'bytes32', 'address'],
                [1, choices[i], secret, players[i].address]
            )
        );

        const playerGame = game.connect(players[i]);
        await playerGame.commit(1, hash, { value: ethers.parseEther("0.1") });

        commits.push({ choice: choices[i], secret });
        console.log(`   Player ${i+1}: ${choices[i] === 0 ? "A" : "B"} ✅`);
    }

    console.log("\n⏳ Waiting...");
    await new Promise(r => setTimeout(r, 11000));

    console.log("🔓 Starting reveal phase...");
    await game.startRevealPhase(1);
    console.log("✅ Reveal phase started\n");

    console.log("📖 Players revealing...");
    for (let i = 0; i < players.length; i++) {
        const playerGame = game.connect(players[i]);
        await playerGame.reveal(1, commits[i].choice, commits[i].secret);
        console.log(`   Player ${i+1} revealed ✅`);
    }

    console.log("\n⏳ Waiting...");
    await new Promise(r => setTimeout(r, 11000));

    console.log("🏁 Finalizing...");
    await game.finalizeVote(1);
    const voteInfo = await game.getVoteInfo(1);
    const winner = Number(voteInfo[9]);

    console.log("\n🎯 RESULTS:");
    console.log(`   Winner: ${winner === 0 ? "A" : "B"}`);
    console.log(`   Expected: B (minority)`);
    console.log(`   ${winner === 1 ? "✅ Minority won!" : "❌ Unexpected result"}`);

    console.log("\n💰 Rewards:");
    for (let i = 0; i < players.length; i++) {
        const reward = await game.calculateReward(1, players[i].address);
        console.log(`   Player ${i+1}: ${ethers.formatEther(reward)} ETH`);
    }

    console.log("\n✅ Demo completed!\n");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
EOF

        npx hardhat run /tmp/quick-demo.js --network localhost
        rm /tmp/quick-demo.js
        ;;

    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "======================================"
echo -e "${GREEN}✅ Test execution completed${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "  - Review results in JSON files"
echo "  - Check empirical-analysis-summary.txt for summary"
echo "  - Run with different parameters by editing scripts"
echo ""
